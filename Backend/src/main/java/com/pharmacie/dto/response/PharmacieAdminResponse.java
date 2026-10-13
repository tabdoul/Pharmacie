package com.pharmacie.dto.response;


public record PharmacieAdminResponse(
    Long id,
    String identifiantConnexion,
    String nom,
    String adresse,
    String ville,
    String quartier,
    String telephone,
    String statutValidation,
    String motifRejet
) {
}