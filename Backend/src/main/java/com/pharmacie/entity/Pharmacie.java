package com.pharmacie.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "pharmacies")
public class Pharmacie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "identifiant_connexion", nullable = false, unique = true, length = 100)
    private String identifiantConnexion;

    @NotBlank
    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String nom;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String adresse;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String ville;

    @Column(length = 100)
    private String quartier;

    @Column(length = 30)
    private String telephone;

    @Column(name = "document_agrement_path", nullable = false, length = 500)
    private String documentAgrementPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_validation", nullable = false, length = 20)
    private StatutValidation statutValidation;

    @Column(name = "motif_rejet", columnDefinition = "TEXT")
    private String motifRejet;

    public Pharmacie() {
    }

    public Pharmacie(Long id, String identifiantConnexion, String motDePasse, String nom,
                      String adresse, String ville, String quartier, String telephone,
                      String documentAgrementPath, StatutValidation statutValidation,
                      String motifRejet) {
        this.id = id;
        this.identifiantConnexion = identifiantConnexion;
        this.motDePasse = motDePasse;
        this.nom = nom;
        this.adresse = adresse;
        this.ville = ville;
        this.quartier = quartier;
        this.telephone = telephone;
        this.documentAgrementPath = documentAgrementPath;
        this.statutValidation = statutValidation;
        this.motifRejet = motifRejet;
    }

    @PrePersist
    protected void onCreate() {
        if (this.statutValidation == null) {
            this.statutValidation = StatutValidation.EN_ATTENTE;
        }
    }

    public enum StatutValidation {
        EN_ATTENTE,
        VALIDEE,
        REJETEE
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIdentifiantConnexion() {
        return identifiantConnexion;
    }

    public void setIdentifiantConnexion(String identifiantConnexion) {
        this.identifiantConnexion = identifiantConnexion;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public void setMotDePasse(String motDePasse) {
        this.motDePasse = motDePasse;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public String getVille() {
        return ville;
    }

    public void setVille(String ville) {
        this.ville = ville;
    }

    public String getQuartier() {
        return quartier;
    }

    public void setQuartier(String quartier) {
        this.quartier = quartier;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getDocumentAgrementPath() {
        return documentAgrementPath;
    }

    public void setDocumentAgrementPath(String documentAgrementPath) {
        this.documentAgrementPath = documentAgrementPath;
    }

    public StatutValidation getStatutValidation() {
        return statutValidation;
    }

    public void setStatutValidation(StatutValidation statutValidation) {
        this.statutValidation = statutValidation;
    }

    public String getMotifRejet() {
        return motifRejet;
    }

    public void setMotifRejet(String motifRejet) {
        this.motifRejet = motifRejet;
    }
}