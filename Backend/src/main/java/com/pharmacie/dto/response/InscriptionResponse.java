package com.pharmacie.dto.response;

public class InscriptionResponse {

    private Long pharmacieId;
    private String statutValidation;
    private String message;

    public InscriptionResponse() {
    }

    public InscriptionResponse(Long pharmacieId, String statutValidation, String message) {
        this.pharmacieId = pharmacieId;
        this.statutValidation = statutValidation;
        this.message = message;
    }

    public Long getPharmacieId() {
        return pharmacieId;
    }

    public void setPharmacieId(Long pharmacieId) {
        this.pharmacieId = pharmacieId;
    }

    public String getStatutValidation() {
        return statutValidation;
    }

    public void setStatutValidation(String statutValidation) {
        this.statutValidation = statutValidation;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}