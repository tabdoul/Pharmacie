package com.pharmacie.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;


@Entity
@Table(name = "produits")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Forme forme;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    public Produit() {
    }

    public Produit(Long id, String nom, Forme forme, String imageUrl, String description) {
        this.id = id;
        this.nom = nom;
        this.forme = forme;
        this.imageUrl = imageUrl;
        this.description = description;
    }

    public enum Forme {
        COMPRIME,
        GELULE,
        SIROP,
        INJECTABLE,
        POMMADE,
        CREME,
        SUPPOSITOIRE,
        POUDRE,
        GOUTTES,
        PATCH,
        SPRAY,
        AUTRE
    }

    // --- Getters / Setters ---

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

    public Forme getForme() {
        return forme;
    }

    public void setForme(Forme forme) {
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