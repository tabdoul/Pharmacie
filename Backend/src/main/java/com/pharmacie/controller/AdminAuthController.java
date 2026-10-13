package com.pharmacie.controller;

import com.pharmacie.entity.Administrateur;
import com.pharmacie.repository.AdministrateurRepository;
import com.pharmacie.security.JwtUtil;
import com.pharmacie.service.AdminInstallationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Connexion et premiere installation de l'administrateur.
 * Les tentatives (connexion ou code d'installation) sont limitees : 5 echecs en
 * 15 minutes depuis une meme adresse IP bloquent les essais suivants.
 */
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private static final int MAX_ECHECS = 5;
    private static final Duration FENETRE = Duration.ofMinutes(15);

    private final AdministrateurRepository administrateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AdminInstallationService installationService;
    private final Map<String, Deque<Instant>> echecsParIp = new ConcurrentHashMap<>();

    public AdminAuthController(
        AdministrateurRepository administrateurRepository,
        PasswordEncoder passwordEncoder,
        JwtUtil jwtUtil,
        AdminInstallationService installationService
    ) {
        this.administrateurRepository = administrateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.installationService = installationService;
    }

    public record AdminLoginRequest(@NotBlank String identifiant, @NotBlank String motDePasse) {
    }

    public record AdminInstallationRequest(
        @NotBlank String codeInstallation,
        @NotBlank String identifiant,
        @NotBlank String motDePasse
    ) {
    }

    /** Dit au site s'il faut afficher la page de premiere installation. */
    @GetMapping("/etat")
    public ResponseEntity<Map<String, Boolean>> etat() {
        return ResponseEntity.ok(Map.of("installationNecessaire", installationService.installationNecessaire()));
    }

    @PostMapping("/installation")
    public ResponseEntity<Map<String, String>> installer(
        @Valid @RequestBody AdminInstallationRequest requete,
        HttpServletRequest http
    ) {
        String cle = "installation-" + http.getRemoteAddr();

        if (tropDEchecs(cle)) {
            return message(HttpStatus.TOO_MANY_REQUESTS, "Trop de tentatives. Reessayez dans quelques minutes.");
        }
        if (!installationService.installationNecessaire()) {
            return message(HttpStatus.CONFLICT, "L'installation est deja terminee.");
        }

        String identifiant = requete.identifiant().trim();
        if (identifiant.length() < 3 || identifiant.length() > 50) {
            return message(HttpStatus.BAD_REQUEST, "L'identifiant doit contenir entre 3 et 50 caracteres.");
        }
        if (requete.motDePasse().length() < AdminInstallationService.LONGUEUR_MIN_MOT_DE_PASSE) {
            return message(HttpStatus.BAD_REQUEST,
                "Le mot de passe doit contenir au moins " + AdminInstallationService.LONGUEUR_MIN_MOT_DE_PASSE + " caracteres.");
        }

        try {
            Administrateur admin = installationService.installer(
                requete.codeInstallation(), identifiant, requete.motDePasse()
            );
            echecsParIp.remove(cle);
            return ResponseEntity.ok(Map.of(
                "token", jwtUtil.genererTokenAdmin(admin.getIdentifiant()),
                "identifiant", admin.getIdentifiant()
            ));
        } catch (IllegalArgumentException e) {
            enregistrerEchec(cle);
            return message(HttpStatus.UNAUTHORIZED, "Code d'installation incorrect.");
        } catch (IllegalStateException e) {
            return message(HttpStatus.CONFLICT, "L'installation est deja terminee.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
        @Valid @RequestBody AdminLoginRequest requete,
        HttpServletRequest http
    ) {
        String cle = "login-" + http.getRemoteAddr();

        if (tropDEchecs(cle)) {
            return message(HttpStatus.TOO_MANY_REQUESTS, "Trop de tentatives. Reessayez dans quelques minutes.");
        }

        Optional<Administrateur> admin = administrateurRepository.findByIdentifiant(requete.identifiant().trim());

        if (admin.isEmpty() || !passwordEncoder.matches(requete.motDePasse(), admin.get().getMotDePasse())) {
            enregistrerEchec(cle);
            return message(HttpStatus.UNAUTHORIZED, "Identifiant ou mot de passe incorrect.");
        }

        echecsParIp.remove(cle);
        String token = jwtUtil.genererTokenAdmin(admin.get().getIdentifiant());
        return ResponseEntity.ok(Map.of("token", token, "identifiant", admin.get().getIdentifiant()));
    }

    private ResponseEntity<Map<String, String>> message(HttpStatus statut, String texte) {
        return ResponseEntity.status(statut).body(Map.of("message", texte));
    }

    private boolean tropDEchecs(String cle) {
        Deque<Instant> echecs = echecsParIp.get(cle);
        if (echecs == null) {
            return false;
        }
        synchronized (echecs) {
            purger(echecs);
            return echecs.size() >= MAX_ECHECS;
        }
    }

    private void enregistrerEchec(String cle) {
        Deque<Instant> echecs = echecsParIp.computeIfAbsent(cle, k -> new ArrayDeque<>());
        synchronized (echecs) {
            purger(echecs);
            echecs.addLast(Instant.now());
        }
    }

    private void purger(Deque<Instant> echecs) {
        Instant limite = Instant.now().minus(FENETRE);
        while (!echecs.isEmpty() && echecs.peekFirst().isBefore(limite)) {
            echecs.removeFirst();
        }
    }
}