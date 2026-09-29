package com.pharmacie.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StockPharmacienDTO {

    private Long stockId;
    private Long produitId;
    private String nomProduit;
    private String formeProduit;
    private String imageUrl;
    private Integer quantite;
    private Integer seuilAlerte;
    private BigDecimal prix;
    private String statut;
    private LocalDateTime dateDerniereMaj;

    public StockPharmacienDTO() {
    }

    public StockPharmacienDTO(Long stockId, Long produitId, String nomProduit, String formeProduit,
                               String imageUrl, Integer quantite, Integer seuilAlerte, BigDecimal prix,
                               String statut, LocalDateTime dateDerniereMaj) {
        this.stockId = stockId;
        this.produitId = produitId;
        this.nomProduit = nomProduit;
        this.formeProduit = formeProduit;
        this.imageUrl = imageUrl;
        this.quantite = quantite;
        this.seuilAlerte = seuilAlerte;
        this.prix = prix;
        this.statut = statut;
        this.dateDerniereMaj = dateDerniereMaj;
    }

    public Long getStockId() {
        return stockId;
    }

    public void setStockId(Long stockId) {
        this.stockId = stockId;
    }

    public Long getProduitId() {
        return produitId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
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

    public Integer getQuantite() {
        return quantite;
    }

    public void setQuantite(Integer quantite) {
        this.quantite = quantite;
    }

    public Integer getSeuilAlerte() {
        return seuilAlerte;
    }

    public void setSeuilAlerte(Integer seuilAlerte) {
        this.seuilAlerte = seuilAlerte;
    }

    public BigDecimal getPrix() {
        return prix;
    }

    public void setPrix(BigDecimal prix) {
        this.prix = prix;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateDerniereMaj() {
        return dateDerniereMaj;
    }

    public void setDateDerniereMaj(LocalDateTime dateDerniereMaj) {
        this.dateDerniereMaj = dateDerniereMaj;
    }
}