package com.pharmacie.controller;

import com.pharmacie.dto.request.ChangerMotDePasseRequest;
import com.pharmacie.dto.request.ProfilPharmacieRequest;
import com.pharmacie.dto.response.PharmacieResponse;
import com.pharmacie.entity.Pharmacie;
import com.pharmacie.security.SecurityUtils;
import com.pharmacie.service.PharmacieService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pharmacien/profil")
public class PharmacieController {

    private final PharmacieService pharmacieService;

    public PharmacieController(PharmacieService pharmacieService) {
        this.pharmacieService = pharmacieService;
    }

    @GetMapping
    public ResponseEntity<PharmacieResponse> consulter() {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        return ResponseEntity.ok(versDTO(pharmacieService.findById(pharmacieId)));
    }

    @PutMapping
    public ResponseEntity<PharmacieResponse> mettreAJour(@Valid @RequestBody ProfilPharmacieRequest requete) {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();

        Pharmacie donnees = new Pharmacie();
        donnees.setNom(requete.getNom());
        donnees.setAdresse(requete.getAdresse());
        donnees.setVille(requete.getVille());
        donnees.setQuartier(requete.getQuartier());
        donnees.setTelephone(requete.getTelephone());

        return ResponseEntity.ok(versDTO(pharmacieService.mettreAJourProfil(pharmacieId, donnees)));
    }

    @PutMapping("/mot-de-passe")
    public ResponseEntity<Void> changerMotDePasse(@Valid @RequestBody ChangerMotDePasseRequest requete) {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        pharmacieService.changerMotDePasse(pharmacieId, requete.getNouveauMotDePasse());
        return ResponseEntity.noContent().build();
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