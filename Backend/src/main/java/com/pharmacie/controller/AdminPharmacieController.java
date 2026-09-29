package com.pharmacie.controller;

import com.pharmacie.dto.request.RejetRequest;
import com.pharmacie.dto.response.PharmacieResponse;
import com.pharmacie.entity.Pharmacie;
import com.pharmacie.service.FileStorageService;
import com.pharmacie.service.PharmacieService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/admin/pharmacies")
public class AdminPharmacieController {

    private final PharmacieService pharmacieService;
    private final FileStorageService fileStorageService;
    private final String cleAdmin;

    public AdminPharmacieController(
        PharmacieService pharmacieService,
        FileStorageService fileStorageService,
        @Value("${app.admin.key}") String cleAdmin
    ) {
        this.pharmacieService = pharmacieService;
        this.fileStorageService = fileStorageService;
        this.cleAdmin = cleAdmin;
    }

    @GetMapping("/en-attente")
    public ResponseEntity<List<PharmacieResponse>> listerEnAttente(
        @RequestHeader("X-Admin-Key") String cleFournie
    ) {
        verifierCleAdmin(cleFournie);
        List<PharmacieResponse> resultats = pharmacieService.findEnAttenteDeValidation()
            .stream()
            .map(this::versDTO)
            .toList();
        return ResponseEntity.ok(resultats);
    }

    @GetMapping("/{id}/document")
    public ResponseEntity<Resource> telechargerDocument(
        @PathVariable Long id,
        @RequestHeader("X-Admin-Key") String cleFournie
    ) {
        verifierCleAdmin(cleFournie);
        Pharmacie pharmacie = pharmacieService.findById(id);
        Path chemin = fileStorageService.chargerDocumentAgrement(pharmacie.getDocumentAgrementPath());

        try {
            Resource ressource = new UrlResource(chemin.toUri());
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + chemin.getFileName() + "\"")
                .body(ressource);
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Chemin de document invalide.", e);
        }
    }

    @PostMapping("/{id}/valider")
    public ResponseEntity<PharmacieResponse> valider(
        @PathVariable Long id,
        @RequestHeader("X-Admin-Key") String cleFournie
    ) {
        verifierCleAdmin(cleFournie);
        return ResponseEntity.ok(versDTO(pharmacieService.valider(id)));
    }

    @PostMapping("/{id}/rejeter")
    public ResponseEntity<PharmacieResponse> rejeter(
        @PathVariable Long id,
        @RequestHeader("X-Admin-Key") String cleFournie,
        @Valid @RequestBody RejetRequest requete
    ) {
        verifierCleAdmin(cleFournie);
        return ResponseEntity.ok(versDTO(pharmacieService.rejeter(id, requete.getMotif())));
    }

    private void verifierCleAdmin(String cleFournie) {
        if (cleFournie == null || !cleFournie.equals(cleAdmin)) {
            throw new AccessDeniedException("Cle d'administration invalide.");
        }
    }

    private PharmacieResponse versDTO(Pharmacie pharmacie) {
        return new PharmacieResponse(
            pharmacie.getId(),
            pharmacie.getIdentifiantConnexion(),
            pharmacie.getNom(),
            pharmacie.getAdresse(),
            pharmacie.getVille(),
            pharmacie.getQuartier(),
            pharmacie.getTelephone(),
            pharmacie.getStatutValidation().name()
        );
    }
}