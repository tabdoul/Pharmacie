package com.pharmacie.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StockDetailDTO {

    private Long stockId;
    private String nomProduit;
    private String formeProduit;
    private String imageUrl;
    private String description;
    private BigDecimal prix;
    private LocalDateTime dateDerniereMaj;

    // Pharmacie
    private String nomPharmacie;
    private String adresse;
    private String ville;
    private String quartier;
    private String telephone;

    public StockDetailDTO() {
    }

    public StockDetailDTO(Long stockId, String nomProduit, String formeProduit, String imageUrl,
                           String description, BigDecimal prix, LocalDateTime dateDerniereMaj,
                           String nomPharmacie, String adresse, String ville, String quartier,
                           String telephone) {
        this.stockId = stockId;
        this.nomProduit = nomProduit;
        this.formeProduit = formeProduit;
        this.imageUrl = imageUrl;
        this.description = description;
        this.prix = prix;
        this.dateDerniereMaj = dateDerniereMaj;
        this.nomPharmacie = nomPharmacie;
        this.adresse = adresse;
        this.ville = ville;
        this.quartier = quartier;
        this.telephone = telephone;
    }

    public Long getStockId() {
        return stockId;
    }

    public void setStockId(Long stockId) {
        this.stockId = stockId;
    }

    public String getNomProduit() {
        return nomProduit;
    }

    public void setNomProduit(String nomProduit) {
        this.nomProduit = nomProduit;
    }

    public String getFormeProduit() {
        return formeProduit;
    }

    public void setFormeProduit(String formeProduit) {
        this.formeProduit = formeProduit;
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

    public BigDecimal getPrix() {
        return prix;
    }

    public void setPrix(BigDecimal prix) {
        this.prix = prix;
    }

    public LocalDateTime getDateDerniereMaj() {
        return dateDerniereMaj;
    }

    public void setDateDerniereMaj(LocalDateTime dateDerniereMaj) {
        this.dateDerniereMaj = dateDerniereMaj;
    }

    public String getNomPharmacie() {
        return nomPharmacie;
    }

    public void setNomPharmacie(String nomPharmacie) {
        this.nomPharmacie = nomPharmacie;
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