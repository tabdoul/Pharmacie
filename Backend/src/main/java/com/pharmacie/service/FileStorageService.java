package com.pharmacie.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final List<String> EXTENSIONS_AUTORISEES = List.of("pdf", "jpg", "jpeg", "png");

    private final Path dossierDocumentsAgrement;
    private final long tailleMaxOctets;

    public FileStorageService(
        @Value("${app.storage.documents-agrement-dir}") String dossierDocumentsAgrement,
        @Value("${app.storage.max-taille-mo}") long maxTailleMo
    ) {
        this.dossierDocumentsAgrement = Paths.get(dossierDocumentsAgrement).toAbsolutePath().normalize();
        this.tailleMaxOctets = maxTailleMo * 1024 * 1024;

        try {
            Files.createDirectories(this.dossierDocumentsAgrement);
        } catch (IOException e) {
            throw new IllegalStateException(
                "Impossible de creer le dossier de stockage des documents d'agrement.", e
            );
        }
    }

    public String sauvegarderDocumentAgrement(MultipartFile fichier) {
        validerFichier(fichier);

        String extension = extraireExtension(fichier.getOriginalFilename());
        String nomFichier = UUID.randomUUID() + "." + extension;
        Path destination = dossierDocumentsAgrement.resolve(nomFichier);

        try (InputStream in = fichier.getInputStream()) {
            Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Echec de l'enregistrement du document d'agrement.", e);
        }

        return nomFichier;
    }

    public Path chargerDocumentAgrement(String nomFichier) {
        Path chemin = dossierDocumentsAgrement.resolve(nomFichier).normalize();
        if (!chemin.startsWith(dossierDocumentsAgrement) || !Files.exists(chemin)) {
            throw new IllegalArgumentException("Document introuvable : " + nomFichier);
        }
        return chemin;
    }

    private void validerFichier(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Le document d'agrement est obligatoire.");
        }
        if (fichier.getSize() > tailleMaxOctets) {
            throw new IllegalArgumentException(
                "Le document depasse la taille maximale autorisee (" + (tailleMaxOctets / (1024 * 1024)) + " Mo)."
            );
        }
        String extension = extraireExtension(fichier.getOriginalFilename());
        if (!EXTENSIONS_AUTORISEES.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException(
                "Format de document non autorise. Formats acceptes : " + EXTENSIONS_AUTORISEES
            );
        }
    }

    private String extraireExtension(String nomFichier) {
        if (nomFichier == null || !nomFichier.contains(".")) {
            throw new IllegalArgumentException("Le fichier doit avoir une extension valide.");
        }
        return nomFichier.substring(nomFichier.lastIndexOf('.') + 1);
    }
}