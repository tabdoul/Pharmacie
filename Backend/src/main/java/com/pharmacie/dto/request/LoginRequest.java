package com.pharmacie.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank
    private String identifiantConnexion;

    @NotBlank
    private String motDePasse;

    public LoginRequest() {
    }

    public LoginRequest(String identifiantConnexion, String motDePasse) {
        this.identifiantConnexion = identifiantConnexion;
        this.motDePasse = motDePasse;
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
}