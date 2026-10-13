package com.pharmacie.controller;

import com.pharmacie.dto.request.RejetRequest;
import com.pharmacie.dto.response.PharmacieAdminResponse;
import com.pharmacie.entity.Pharmacie;
import com.pharmacie.repository.PharmacieRepository;
import com.pharmacie.service.FileStorageService;
import com.pharmacie.service.PharmacieService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Administration des pharmacies. Toutes les routes /api/admin/** exigent un token
 * ADMIN (voir SecurityConfig) : plus de cle partagee X-Admin-Key.
 */
@RestController
@RequestMapping("/api/admin/pharmacies")
public class AdminPharmacieController {

    private final PharmacieService pharmacieService;
    private final PharmacieRepository pharmacieRepository;
    private final FileStorageService fileStorageService;

    public AdminPharmacieController(
        PharmacieService pharmacieService,
        PharmacieRepository pharmacieRepository,
        FileStorageService fileStorageService
    ) {
        this.pharmacieService = pharmacieService;
        this.pharmacieRepository = pharmacieRepository;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Liste des pharmacies, la plus recente en premier.
     * Filtre optionnel : ?statut=EN_ATTENTE | VALIDEE | REJETEE
     */
    @GetMapping
    public ResponseEntity<List<PharmacieAdminResponse>> lister(
        @RequestParam(required = false) Pharmacie.StatutValidation statut
    ) {
        List<PharmacieAdminResponse> resultats = pharmacieRepository.findAll()
            .stream()
            .filter(p -> statut == null || p.getStatutValidation() == statut)
            .sorted(Comparator.comparing(Pharmacie::getId).reversed())
            .map(this::versDTO)
            .toList();
        return ResponseEntity.ok(resultats);
    }

    @GetMapping("/en-attente")
    public ResponseEntity<List<PharmacieAdminResponse>> listerEnAttente() {
        List<PharmacieAdminResponse> resultats = pharmacieService.findEnAttenteDeValidation()
            .stream()
            .map(this::versDTO)
            .toList();
        return ResponseEntity.ok(resultats);
    }

    /** Document d'agrement, renvoye avec son vrai type pour s'afficher dans le navigateur. */
    @GetMapping("/{id}/document")
    public ResponseEntity<Resource> telechargerDocument(@PathVariable Long id) {
        Pharmacie pharmacie = pharmacieService.findById(id);
        Path chemin = fileStorageService.chargerDocumentAgrement(pharmacie.getDocumentAgrementPath());
        String nomFichier = chemin.getFileName().toString();

        try {
            Resource ressource = new UrlResource(chemin.toUri());
            return ResponseEntity.ok()
                .contentType(typeDuFichier(nomFichier))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.inline().filename(nomFichier).build().toString())
                .body(ressource);
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Chemin de document invalide.", e);
        }
    }

    @PostMapping("/{id}/valider")
    public ResponseEntity<PharmacieAdminResponse> valider(@PathVariable Long id) {
        return ResponseEntity.ok(versDTO(pharmacieService.valider(id)));
    }

    @PostMapping("/{id}/rejeter")
    public ResponseEntity<PharmacieAdminResponse> rejeter(
        @PathVariable Long id,
        @Valid @RequestBody RejetRequest requete
    ) {
        return ResponseEntity.ok(versDTO(pharmacieService.rejeter(id, requete.getMotif())));
    }

    private MediaType typeDuFichier(String nomFichier) {
        String nom = nomFichier.toLowerCase(Locale.ROOT);
        if (nom.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        }
        if (nom.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (nom.endsWith(".jpg") || nom.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    private PharmacieAdminResponse versDTO(Pharmacie pharmacie) {
        return new PharmacieAdminResponse(
            pharmacie.getId(),
            pharmacie.getIdentifiantConnexion(),
            pharmacie.getNom(),
            pharmacie.getAdresse(),
            pharmacie.getVille(),
            pharmacie.getQuartier(),
            pharmacie.getTelephone(),
            pharmacie.getStatutValidation().name(),
            pharmacie.getMotifRejet()
        );
    }
}