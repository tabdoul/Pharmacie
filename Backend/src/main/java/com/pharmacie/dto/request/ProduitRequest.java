package com.pharmacie.dto.request;

import com.pharmacie.entity.Produit;
import jakarta.validation.constraints.NotBlank;

public class ProduitRequest {

    @NotBlank
    private String nom;

    private Produit.Forme forme;

    private String imageUrl;

    private String description;

    public ProduitRequest() {
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public Produit.Forme getForme() {
        return forme;
    }

    public void setForme(Produit.Forme forme) {
        this.forme = forme;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}