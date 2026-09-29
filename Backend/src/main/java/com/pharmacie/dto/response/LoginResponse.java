package com.pharmacie.dto.response;

public class LoginResponse {

    private String token;
    private Long pharmacieId;
    private String nomPharmacie;

    public LoginResponse() {
    }

    public LoginResponse(String token, Long pharmacieId, String nomPharmacie) {
        this.token = token;
        this.pharmacieId = pharmacieId;
        this.nomPharmacie = nomPharmacie;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getPharmacieId() {
        return pharmacieId;
    }

    public void setPharmacieId(Long pharmacieId) {
        this.pharmacieId = pharmacieId;
    }

    public String getNomPharmacie() {
        return nomPharmacie;
    }

    public void setNomPharmacie(String nomPharmacie) {
        this.nomPharmacie = nomPharmacie;
    }
}