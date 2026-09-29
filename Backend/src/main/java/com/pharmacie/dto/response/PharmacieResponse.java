package com.pharmacie.dto.response;

public class PharmacieResponse {

    private Long id;
    private String identifiantConnexion;
    private String nom;
    private String adresse;
    private String ville;
    private String quartier;
    private String telephone;
    private String statutValidation;

    public PharmacieResponse() {
    }

    public PharmacieResponse(Long id, String identifiantConnexion, String nom, String adresse,
                              String ville, String quartier, String telephone,
                              String statutValidation) {
        this.id = id;
        this.identifiantConnexion = identifiantConnexion;
        this.nom = nom;
        this.adresse = adresse;
        this.ville = ville;
        this.quartier = quartier;
        this.telephone = telephone;
        this.statutValidation = statutValidation;
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

    public String getStatutValidation() {
        return statutValidation;
    }

    public void setStatutValidation(String statutValidation) {
        this.statutValidation = statutValidation;
    }
}