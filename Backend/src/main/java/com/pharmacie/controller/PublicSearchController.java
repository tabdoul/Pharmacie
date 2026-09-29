package com.pharmacie.controller;

import com.pharmacie.dto.response.StockDetailDTO;
import com.pharmacie.dto.response.StockRechercheDTO;
import com.pharmacie.entity.Stock;
import com.pharmacie.service.PharmacieService;
import com.pharmacie.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints publics utilises par l'interface patient : aucune authentification
 * necessaire (section 5 du document de synthese).
 */
@RestController
@RequestMapping("/api/public")
public class PublicSearchController {

    private final StockService stockService;
    private final PharmacieService pharmacieService;

    public PublicSearchController(StockService stockService, PharmacieService pharmacieService) {
        this.stockService = stockService;
        this.pharmacieService = pharmacieService;
    }

    /**
     * Recherche par nom de produit. Ne renvoie que les pharmacies ou le produit
     * est disponible (quantite > 0).
     */
    @GetMapping("/recherche")
    public ResponseEntity<List<StockRechercheDTO>> rechercher(@RequestParam String nom) {
        List<StockRechercheDTO> resultats = stockService.rechercherDisponiblesParNomProduit(nom)
            .stream()
            .map(this::versRechercheDTO)
            .toList();
        return ResponseEntity.ok(resultats);
    }

    /**
     * Liste des quartiers utilises par les pharmacies validees, pour le
     * selecteur "Mon quartier" cote patient (comparaison de proximite simple).
     */
    @GetMapping("/quartiers")
    public ResponseEntity<List<String>> listerQuartiers() {
        return ResponseEntity.ok(pharmacieService.findQuartiersDisponibles());
    }

    /**
     * Ecran de detail : localisation, contact, description, derniere mise a jour.
     */
    @GetMapping("/stocks/{id}")
    public ResponseEntity<StockDetailDTO> detail(@PathVariable Long id) {
        Stock stock = stockService.findById(id);
        return ResponseEntity.ok(versDetailDTO(stock));
    }

    private StockRechercheDTO versRechercheDTO(Stock stock) {
        return new StockRechercheDTO(
            stock.getId(),
            stock.getProduit().getNom(),
            stock.getProduit().getForme() != null ? stock.getProduit().getForme().name() : null,
            stock.getProduit().getImageUrl(),
            stock.getPharmacie().getNom(),
            stock.getPharmacie().getVille(),
            stock.getPharmacie().getQuartier(),
            stock.getPrix()
        );
    }

    private StockDetailDTO versDetailDTO(Stock stock) {
        return new StockDetailDTO(
            stock.getId(),
            stock.getProduit().getNom(),
            stock.getProduit().getForme() != null ? stock.getProduit().getForme().name() : null,
            stock.getProduit().getImageUrl(),
            stock.getProduit().getDescription(),
            stock.getPrix(),
            stock.getDateDerniereMaj(),
            stock.getPharmacie().getNom(),
            stock.getPharmacie().getAdresse(),
            stock.getPharmacie().getVille(),
            stock.getPharmacie().getQuartier(),
            stock.getPharmacie().getTelephone()
        );
    }
}