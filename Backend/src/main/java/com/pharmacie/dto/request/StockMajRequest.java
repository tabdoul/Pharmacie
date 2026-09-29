package com.pharmacie.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class StockMajRequest {

    @NotNull
    @Min(0)
    private Integer quantite;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal prix;

    public StockMajRequest() {
    }

    public Integer getQuantite() {
        return quantite;
    }

    public void setQuantite(Integer quantite) {
        this.quantite = quantite;
    }

    public BigDecimal getPrix() {
        return prix;
    }

    public void setPrix(BigDecimal prix) {
        this.prix = prix;
    }
}