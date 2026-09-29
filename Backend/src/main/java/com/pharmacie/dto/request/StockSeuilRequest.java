package com.pharmacie.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class StockSeuilRequest {

    @NotNull
    @Min(0)
    private Integer seuilAlerte;

    public StockSeuilRequest() {
    }

    public Integer getSeuilAlerte() {
        return seuilAlerte;
    }

    public void setSeuilAlerte(Integer seuilAlerte) {
        this.seuilAlerte = seuilAlerte;
    }
}