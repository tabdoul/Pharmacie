package com.pharmacie.dto.request;

import jakarta.validation.constraints.NotBlank;

public class RejetRequest {

    @NotBlank
    private String motif;

    public RejetRequest() {
    }

    public String getMotif() {
        return motif;
    }

    public void setMotif(String motif) {
        this.motif = motif;
    }
}