package com.pharmacie.dto.response;

public class StatutInscriptionResponse {

    private Long pharmacieId;
    private String statutValidation;
    private String motifRejet;

    public StatutInscriptionResponse() {
    }

    public StatutInscriptionResponse(Long pharmacieId, String statutValidation, String motifRejet) {
        this.pharmacieId = pharmacieId;
        this.statutValidation = statutValidation;
        this.motifRejet = motifRejet;
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

    public String getMotifRejet() {
        return motifRejet;
    }

    public void setMotifRejet(String motifRejet) {
        this.motifRejet = motifRejet;
    }
}