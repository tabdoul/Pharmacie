package com.pharmacie.dto.response;

import java.math.BigDecimal;

public class ArticleMatchDTO {

    private String nomDemande;
    private boolean trouve;
    private String nomProduit;
    private String formeProduit;
    private BigDecimal prix;
    private Long stockId;

    public ArticleMatchDTO() {
    }

    public ArticleMatchDTO(String nomDemande, boolean trouve, String nomProduit,
                            String formeProduit, BigDecimal prix, Long stockId) {
        this.nomDemande = nomDemande;
        this.trouve = trouve;
        this.nomProduit = nomProduit;
        this.formeProduit = formeProduit;
        this.prix = prix;
        this.stockId = stockId;
    }

    public String getNomDemande() {
        return nomDemande;
    }

    public void setNomDemande(String nomDemande) {
        this.nomDemande = nomDemande;
    }

    public boolean isTrouve() {
        return trouve;
    }

    public void setTrouve(boolean trouve) {
        this.trouve = trouve;
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

    public BigDecimal getPrix() {
        return prix;
    }

    public void setPrix(BigDecimal prix) {
        this.prix = prix;
    }

    public Long getStockId() {
        return stockId;
    }

    public void setStockId(Long stockId) {
        this.stockId = stockId;
    }
}