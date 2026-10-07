package com.pharmacie.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class RechercheListeRequest {

    @NotEmpty(message = "La liste doit contenir au moins un medicament.")
    private List<String> noms;

    public RechercheListeRequest() {
    }

    public List<String> getNoms() {
        return noms;
    }

    public void setNoms(List<String> noms) {
        this.noms = noms;
    }
}