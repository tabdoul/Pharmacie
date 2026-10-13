package com.pharmacie.service;

import com.pharmacie.entity.Administrateur;
import com.pharmacie.repository.AdministrateurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Locale;


@Service
public class AdminInstallationService {

    private static final Logger log = LoggerFactory.getLogger(AdminInstallationService.class);

    // Sans 0/O/1/I pour eviter les confusions a la lecture
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int LONGUEUR_CODE = 8;
    public static final int LONGUEUR_MIN_MOT_DE_PASSE = 10;

    private final AdministrateurRepository administrateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom aleatoire = new SecureRandom();

    private String code;

    public AdminInstallationService(
        AdministrateurRepository administrateurRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.administrateurRepository = administrateurRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void auDemarrage() {
        installationNecessaire();
    }

    /** Vrai tant qu'aucun administrateur n'existe. Genere et affiche le code si besoin. */
    public synchronized boolean installationNecessaire() {
        if (administrateurRepository.count() > 0) {
            code = null;
            return false;
        }
        if (code == null) {
            code = genererCode();
            String affiche = code.substring(0, 4) + "-" + code.substring(4);
            log.warn("==============================================================");
            log.warn(" INSTALLATION : aucun compte administrateur n'existe.");
            log.warn(" Ouvrez le site d'administration et saisissez ce code :");
            log.warn("        {}", affiche);
            log.warn("==============================================================");
        }
        return true;
    }

    /**
     * Cree le compte administrateur.
     * @throws IllegalStateException    si un administrateur existe deja
     * @throws IllegalArgumentException si le code d'installation est incorrect
     */
    public synchronized Administrateur installer(String codeSaisi, String identifiant, String motDePasse) {
        if (!installationNecessaire()) {
            throw new IllegalStateException("L'installation est deja terminee.");
        }
        if (!codeCorrect(codeSaisi)) {
            throw new IllegalArgumentException("Code d'installation incorrect.");
        }
        Administrateur admin = administrateurRepository.save(
            new Administrateur(identifiant.trim(), passwordEncoder.encode(motDePasse))
        );
        code = null;
        log.info("Compte administrateur '{}' cree. L'installation est terminee.", admin.getIdentifiant());
        return admin;
    }

    private boolean codeCorrect(String codeSaisi) {
        if (codeSaisi == null || code == null) {
            return false;
        }
        String propre = codeSaisi.toUpperCase(Locale.ROOT).replace("-", "").replace(" ", "");
        // Comparaison a temps constant
        return MessageDigest.isEqual(
            propre.getBytes(StandardCharsets.UTF_8),
            code.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String genererCode() {
        StringBuilder sb = new StringBuilder(LONGUEUR_CODE);
        for (int i = 0; i < LONGUEUR_CODE; i++) {
            sb.append(ALPHABET.charAt(aleatoire.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}