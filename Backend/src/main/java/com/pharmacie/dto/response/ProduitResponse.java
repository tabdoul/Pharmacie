package com.pharmacie.dto.response;

public class ProduitResponse {

    private Long id;
    private String nom;
    private String forme;
    private String imageUrl;
    private String description;

    public ProduitResponse() {
    }

    public ProduitResponse(Long id, String nom, String forme, String imageUrl, String description) {
        this.id = id;
        this.nom = nom;
        this.forme = forme;
        this.imageUrl = imageUrl;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getForme() {
        return forme;
    }

    public void setForme(String forme) {
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