package com.pharmacie.repository;

import com.pharmacie.entity.Produit;
import com.pharmacie.util.TexteUtil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    /**
     * Recherche par nom (correspondance partielle), insensible a la casse, aux accents,
     * ET aux espaces/ponctuation : "paracetamol 500 mg" trouve "Paracétamol 500mg".
     * Utilise par la recherche de produits, la detection de doublons a l'ajout
     * et l'import CSV.
     */
    default List<Produit> findByNomContainingIgnoreCase(String nom) {
        String normalise = TexteUtil.normaliser(nom);
        String cle = TexteUtil.cleComparaison(nom);
        return rechercherParNomOuCle(normalise, cle.isEmpty() ? normalise : cle);
    }

    /**
     * Requete reelle : les parametres doivent deja etre normalises (voir TexteUtil).
     * - nomNormalise : texte sans accents/majuscules (correspondance partielle)
     * - cle          : texte sans accents/majuscules/espaces/ponctuation
     * Necessite l'extension PostgreSQL "unaccent" (creee dans data.sql).
     */
    @Query(value = """
        SELECT p.* FROM produits p
        WHERE LOWER(unaccent(p.nom)) LIKE '%' || :nomNormalise || '%'
           OR regexp_replace(regexp_replace(LOWER(unaccent(p.nom)), '([0-9])[.,]([0-9])', '\\1p\\2', 'g'), '[^a-z0-9%/]', '', 'g') LIKE '%' || :cle || '%'
        """, nativeQuery = true)
    List<Produit> rechercherParNomOuCle(@Param("nomNormalise") String nomNormalise,
                                        @Param("cle") String cle);
}