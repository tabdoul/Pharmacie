package com.pharmacie.dto.response;

import java.math.BigDecimal;

public class StockRechercheDTO {

    private Long stockId;
    private String nomProduit;
    private String formeProduit;
    private String imageUrl;
    private String nomPharmacie;
    private String ville;
    private String quartier;
    private BigDecimal prix;

    public StockRechercheDTO() {
    }

    public StockRechercheDTO(Long stockId, String nomProduit, String formeProduit, String imageUrl,
                              String nomPharmacie, String ville, String quartier, BigDecimal prix) {
        this.stockId = stockId;
        this.nomProduit = nomProduit;
        this.formeProduit = formeProduit;
        this.imageUrl = imageUrl;
        this.nomPharmacie = nomPharmacie;
        this.ville = ville;
        this.quartier = quartier;
        this.prix = prix;
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

    public String getNomPharmacie() {
        return nomPharmacie;
    }

    public void setNomPharmacie(String nomPharmacie) {
        this.nomPharmacie = nomPharmacie;
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

    public BigDecimal getPrix() {
        return prix;
    }

    public void setPrix(BigDecimal prix) {
        this.prix = prix;
    }
}