package com.pharmacie.dto.request;

import jakarta.validation.constraints.NotBlank;

public class InscriptionPharmacieRequest {

    @NotBlank
    private String identifiantConnexion;

    @NotBlank
    private String motDePasse;

    @NotBlank
    private String nom;

    @NotBlank
    private String adresse;

    @NotBlank
    private String ville;

    private String quartier;

    private String telephone;

    public InscriptionPharmacieRequest() {
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
}