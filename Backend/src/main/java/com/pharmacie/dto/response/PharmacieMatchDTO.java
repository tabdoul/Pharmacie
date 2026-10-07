package com.pharmacie.dto.response;

import java.math.BigDecimal;
import java.util.List;

public class PharmacieMatchDTO {

    private Long pharmacieId;
    private String nomPharmacie;
    private String ville;
    private String quartier;
    private String telephone;
    private int nombreTrouves;
    private int nombreDemandes;
    private BigDecimal prixTotal;
    private List<ArticleMatchDTO> articles;

    public PharmacieMatchDTO() {
    }

    public PharmacieMatchDTO(Long pharmacieId, String nomPharmacie, String ville, String quartier,
                              String telephone, int nombreTrouves, int nombreDemandes,
                              BigDecimal prixTotal, List<ArticleMatchDTO> articles) {
        this.pharmacieId = pharmacieId;
        this.nomPharmacie = nomPharmacie;
        this.ville = ville;
        this.quartier = quartier;
        this.telephone = telephone;
        this.nombreTrouves = nombreTrouves;
        this.nombreDemandes = nombreDemandes;
        this.prixTotal = prixTotal;
        this.articles = articles;
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

    public int getNombreTrouves() {
        return nombreTrouves;
    }

    public void setNombreTrouves(int nombreTrouves) {
        this.nombreTrouves = nombreTrouves;
    }

    public int getNombreDemandes() {
        return nombreDemandes;
    }

    public void setNombreDemandes(int nombreDemandes) {
        this.nombreDemandes = nombreDemandes;
    }

    public BigDecimal getPrixTotal() {
        return prixTotal;
    }

    public void setPrixTotal(BigDecimal prixTotal) {
        this.prixTotal = prixTotal;
    }

    public List<ArticleMatchDTO> getArticles() {
        return articles;
    }

    public void setArticles(List<ArticleMatchDTO> articles) {
        this.articles = articles;
    }
}