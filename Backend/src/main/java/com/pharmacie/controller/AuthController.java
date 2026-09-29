package com.pharmacie.controller;

import com.pharmacie.dto.request.InscriptionPharmacieRequest;
import com.pharmacie.dto.request.LoginRequest;
import com.pharmacie.dto.response.InscriptionResponse;
import com.pharmacie.dto.response.LoginResponse;
import com.pharmacie.dto.response.StatutInscriptionResponse;
import com.pharmacie.entity.Pharmacie;
import com.pharmacie.security.JwtUtil;
import com.pharmacie.service.FileStorageService;
import com.pharmacie.service.PharmacieService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final PharmacieService pharmacieService;
    private final FileStorageService fileStorageService;

    public AuthController(
        AuthenticationManager authenticationManager,
        JwtUtil jwtUtil,
        PharmacieService pharmacieService,
        FileStorageService fileStorageService
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.pharmacieService = pharmacieService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(value = "/inscription", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InscriptionResponse> inscrire(
        @Valid @ModelAttribute InscriptionPharmacieRequest requete,
        @RequestPart("document") MultipartFile document
    ) {
        String cheminDocument = fileStorageService.sauvegarderDocumentAgrement(document);

        Pharmacie pharmacie = new Pharmacie();
        pharmacie.setIdentifiantConnexion(requete.getIdentifiantConnexion());
        pharmacie.setMotDePasse(requete.getMotDePasse());
        pharmacie.setNom(requete.getNom());
        pharmacie.setAdresse(requete.getAdresse());
        pharmacie.setVille(requete.getVille());
        pharmacie.setQuartier(requete.getQuartier());
        pharmacie.setTelephone(requete.getTelephone());
        pharmacie.setDocumentAgrementPath(cheminDocument);

        Pharmacie creee = pharmacieService.creer(pharmacie);

        return ResponseEntity.ok(new InscriptionResponse(
            creee.getId(),
            creee.getStatutValidation().name(),
            "Inscription recue. Votre dossier sera examine par un administrateur avant activation du compte."
        ));
    }

    @GetMapping("/inscription/{id}/statut")
    public ResponseEntity<StatutInscriptionResponse> consulterStatutInscription(@PathVariable Long id) {
        Pharmacie pharmacie = pharmacieService.findById(id);
        return ResponseEntity.ok(new StatutInscriptionResponse(
            pharmacie.getId(),
            pharmacie.getStatutValidation().name(),
            pharmacie.getMotifRejet()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest requete) {
        UsernamePasswordAuthenticationToken authRequest =
            new UsernamePasswordAuthenticationToken(requete.getIdentifiantConnexion(), requete.getMotDePasse());

        authenticationManager.authenticate(authRequest);

        Pharmacie pharmacie = pharmacieService.findByIdentifiantConnexion(requete.getIdentifiantConnexion());
        String token = jwtUtil.genererToken(pharmacie.getIdentifiantConnexion(), pharmacie.getId());

        return ResponseEntity.ok(new LoginResponse(token, pharmacie.getId(), pharmacie.getNom()));
    }
}