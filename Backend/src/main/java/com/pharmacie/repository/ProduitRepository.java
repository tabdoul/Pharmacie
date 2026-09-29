package com.pharmacie.repository;

import com.pharmacie.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    /**
     * Recherche par nom (insensible a la casse, correspondance partielle).
     * Utilise par la barre de recherche patient et par le pharmacien
     * pour retrouver un produit dans le formulaire d'ajout au stock.
     */
    List<Produit> findByNomContainingIgnoreCase(String nom);
}