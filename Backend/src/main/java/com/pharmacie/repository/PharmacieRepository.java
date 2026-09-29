package com.pharmacie.repository;

import com.pharmacie.entity.Pharmacie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PharmacieRepository extends JpaRepository<Pharmacie, Long> {

    /**
     * Utilise pour l'authentification (login) au back-office pharmacien.
     */
    Optional<Pharmacie> findByIdentifiantConnexion(String identifiantConnexion);

    boolean existsByIdentifiantConnexion(String identifiantConnexion);

    /**
     * Utilise par l'administrateur pour retrouver les dossiers d'inscription
     * en attente de validation.
     */
    List<Pharmacie> findByStatutValidation(Pharmacie.StatutValidation statutValidation);

    /**
     * Liste des quartiers distincts utilises par les pharmacies validees,
     * pour permettre au patient de selectionner le sien (comparaison de
     * proximite simple, sans geolocalisation).
     */
    @Query("""
        SELECT DISTINCT p.quartier FROM Pharmacie p
        WHERE p.quartier IS NOT NULL AND p.statutValidation = 'VALIDEE'
        ORDER BY p.quartier
        """)
    List<String> findQuartiersDistincts();
}