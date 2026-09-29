package com.pharmacie.repository;

import com.pharmacie.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    /**
     * Tableau des stocks d'une pharmacie (back-office pharmacien).
     * JOIN FETCH necessaire : open-in-view=false ferme la session avant que
     * le controller ne lise stock.getProduit()/getPharmacie() (relations LAZY).
     */
    @Query("""
        SELECT s FROM Stock s
        JOIN FETCH s.produit
        JOIN FETCH s.pharmacie
        WHERE s.pharmacie.id = :pharmacieId
        """)
    List<Stock> findByPharmacieId(@Param("pharmacieId") Long pharmacieId);

    /**
     * Verifie/recupere la ligne de stock unique pour un couple pharmacie/produit,
     * utile avant de creer un nouveau stock pour eviter les doublons.
     */
    Optional<Stock> findByPharmacieIdAndProduitId(Long pharmacieId, Long produitId);

    /**
     * Recuperation d'un stock avec produit et pharmacie deja charges, pour
     * eviter tout risque de LazyInitializationException une fois la session
     * fermee (open-in-view=false).
     */
    @Query("""
        SELECT s FROM Stock s
        JOIN FETCH s.produit
        JOIN FETCH s.pharmacie
        WHERE s.id = :id
        """)
    Optional<Stock> findByIdWithDetails(@Param("id") Long id);

    /**
     * Recherche patient : uniquement les pharmacies ou le produit est disponible
     * (quantite > 0), par nom de produit.
     */
    @Query("""
        SELECT s FROM Stock s
        JOIN FETCH s.produit p
        JOIN FETCH s.pharmacie ph
        WHERE LOWER(p.nom) LIKE LOWER(CONCAT('%', :nom, '%'))
        AND s.quantite > 0
        """)
    List<Stock> rechercherDisponiblesParNomProduit(@Param("nom") String nom);

    /**
     * Stocks d'une pharmacie dont la quantite est descendue au niveau ou en dessous
     * du seuil d'alerte, utilise pour generer les notifications de stock faible.
     */
    @Query("""
        SELECT s FROM Stock s
        WHERE s.pharmacie.id = :pharmacieId
        AND s.quantite <= s.seuilAlerte
        """)
    List<Stock> findStocksFaiblesByPharmacieId(@Param("pharmacieId") Long pharmacieId);
}