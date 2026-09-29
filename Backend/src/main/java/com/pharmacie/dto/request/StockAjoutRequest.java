package com.pharmacie.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class StockAjoutRequest {

    @NotNull
    private Long produitId;

    @NotNull
    @Min(0)
    private Integer quantite;

    @NotNull
    @Min(0)
    private Integer seuilAlerte;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal prix;

    public StockAjoutRequest() {
    }

    public Long getProduitId() {
        return produitId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
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
}