package com.pharmacie.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangerMotDePasseRequest {

    @NotBlank
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caracteres.")
    private String nouveauMotDePasse;

    public ChangerMotDePasseRequest() {
    }

    public String getNouveauMotDePasse() {
        return nouveauMotDePasse;
    }

    public void setNouveauMotDePasse(String nouveauMotDePasse) {
        this.nouveauMotDePasse = nouveauMotDePasse;
    }
}