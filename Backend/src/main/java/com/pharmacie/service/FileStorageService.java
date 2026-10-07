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

    private static final List<String> EXTENSIONS_DOCUMENT_AUTORISEES = List.of("pdf", "jpg", "jpeg", "png");
    private static final List<String> EXTENSIONS_IMAGE_AUTORISEES = List.of("jpg", "jpeg", "png", "webp");

    private final Path dossierDocumentsAgrement;
    private final long tailleMaxDocumentOctets;

    private final Path dossierImagesProduits;
    private final long tailleMaxImageOctets;

    public FileStorageService(
        @Value("${app.storage.documents-agrement-dir}") String dossierDocumentsAgrement,
        @Value("${app.storage.max-taille-mo}") long maxTailleDocumentMo,
        @Value("${app.storage.images-produits-dir}") String dossierImagesProduits,
        @Value("${app.storage.max-taille-image-mo}") long maxTailleImageMo
    ) {
        this.dossierDocumentsAgrement = Paths.get(dossierDocumentsAgrement).toAbsolutePath().normalize();
        this.tailleMaxDocumentOctets = maxTailleDocumentMo * 1024 * 1024;

        this.dossierImagesProduits = Paths.get(dossierImagesProduits).toAbsolutePath().normalize();
        this.tailleMaxImageOctets = maxTailleImageMo * 1024 * 1024;

        try {
            Files.createDirectories(this.dossierDocumentsAgrement);
            Files.createDirectories(this.dossierImagesProduits);
        } catch (IOException e) {
            throw new IllegalStateException(
                "Impossible de creer les dossiers de stockage (documents/images).", e
            );
        }
    }

    // ------------------------------------------------------------------
    // Documents d'agrement (inscription pharmacie)
    // ------------------------------------------------------------------

    /**
     * Sauvegarde le document legal d'agrement transmis a l'inscription et
     * retourne le chemin (relatif au dossier de stockage) sous lequel il est enregistre.
     */
    public String sauvegarderDocumentAgrement(MultipartFile fichier) {
        validerFichier(fichier, EXTENSIONS_DOCUMENT_AUTORISEES, tailleMaxDocumentOctets);
        return sauvegarderDans(fichier, dossierDocumentsAgrement);
    }

    /**
     * Charge le chemin absolu d'un document d'agrement precedemment stocke,
     * pour consultation par un administrateur.
     */
    public Path chargerDocumentAgrement(String nomFichier) {
        return chargerDepuis(nomFichier, dossierDocumentsAgrement);
    }

    // ------------------------------------------------------------------
    // Images de produits (catalogue)
    // ------------------------------------------------------------------

    /**
     * Sauvegarde une photo de produit et retourne le nom de fichier genere
     * (a combiner avec l'URL publique de consultation, voir ProduitImageController).
     */
    public String sauvegarderImageProduit(MultipartFile fichier) {
        validerFichier(fichier, EXTENSIONS_IMAGE_AUTORISEES, tailleMaxImageOctets);
        return sauvegarderDans(fichier, dossierImagesProduits);
    }

    /**
     * Charge le chemin absolu d'une image de produit precedemment stockee,
     * pour la servir publiquement (ecran patient et back-office pharmacien).
     */
    public Path chargerImageProduit(String nomFichier) {
        return chargerDepuis(nomFichier, dossierImagesProduits);
    }

    // ------------------------------------------------------------------
    // Utilitaires communs
    // ------------------------------------------------------------------

    private String sauvegarderDans(MultipartFile fichier, Path dossier) {
        String extension = extraireExtension(fichier.getOriginalFilename());
        String nomFichier = UUID.randomUUID() + "." + extension;
        Path destination = dossier.resolve(nomFichier);

        try (InputStream in = fichier.getInputStream()) {
            Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Echec de l'enregistrement du fichier.", e);
        }

        return nomFichier;
    }

    private Path chargerDepuis(String nomFichier, Path dossier) {
        Path chemin = dossier.resolve(nomFichier).normalize();
        if (!chemin.startsWith(dossier) || !Files.exists(chemin)) {
            throw new IllegalArgumentException("Fichier introuvable : " + nomFichier);
        }
        return chemin;
    }

    private void validerFichier(MultipartFile fichier, List<String> extensionsAutorisees, long tailleMaxOctets) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est obligatoire.");
        }
        if (fichier.getSize() > tailleMaxOctets) {
            throw new IllegalArgumentException(
                "Le fichier depasse la taille maximale autorisee (" + (tailleMaxOctets / (1024 * 1024)) + " Mo)."
            );
        }
        String extension = extraireExtension(fichier.getOriginalFilename());
        if (!extensionsAutorisees.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException(
                "Format non autorise. Formats acceptes : " + extensionsAutorisees
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