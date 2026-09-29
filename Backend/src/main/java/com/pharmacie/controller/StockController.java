package com.pharmacie.controller;

import com.pharmacie.dto.request.StockAjoutRequest;
import com.pharmacie.dto.request.StockMajRequest;
import com.pharmacie.dto.StockPharmacienDTO;
import com.pharmacie.dto.request.StockSeuilRequest;
import com.pharmacie.entity.Pharmacie;
import com.pharmacie.entity.Produit;
import com.pharmacie.entity.Stock;
import com.pharmacie.security.SecurityUtils;
import com.pharmacie.service.PharmacieService;
import com.pharmacie.service.ProduitService;
import com.pharmacie.service.StockService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacien/stocks")
public class StockController {

    private final StockService stockService;
    private final ProduitService produitService;
    private final PharmacieService pharmacieService;

    public StockController(StockService stockService, ProduitService produitService,
                            PharmacieService pharmacieService) {
        this.stockService = stockService;
        this.produitService = produitService;
        this.pharmacieService = pharmacieService;
    }

    @GetMapping
    public ResponseEntity<List<StockPharmacienDTO>> lister() {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        List<StockPharmacienDTO> stocks = stockService.findByPharmacie(pharmacieId)
            .stream()
            .map(this::versDTO)
            .toList();
        return ResponseEntity.ok(stocks);
    }

    @PostMapping
    public ResponseEntity<StockPharmacienDTO> ajouter(@Valid @RequestBody StockAjoutRequest requete) {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        Pharmacie pharmacie = pharmacieService.findById(pharmacieId);
        Produit produit = produitService.findById(requete.getProduitId());

        Stock stock = stockService.ajouterAuStock(
            pharmacie, produit, requete.getQuantite(), requete.getSeuilAlerte(), requete.getPrix()
        );
        return ResponseEntity.ok(versDTO(stock));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<StockPharmacienDTO> mettreAJour(
        @PathVariable Long id,
        @Valid @RequestBody StockMajRequest requete
    ) {
        verifierAppartientALaPharmacieConnectee(id);
        Stock stock = stockService.mettreAJourQuantiteEtPrix(id, requete.getQuantite(), requete.getPrix());
        return ResponseEntity.ok(versDTO(stock));
    }

    @PatchMapping("/{id}/seuil")
    public ResponseEntity<StockPharmacienDTO> mettreAJourSeuil(
        @PathVariable Long id,
        @Valid @RequestBody StockSeuilRequest requete
    ) {
        verifierAppartientALaPharmacieConnectee(id);
        Stock stock = stockService.mettreAJourSeuilAlerte(id, requete.getSeuilAlerte());
        return ResponseEntity.ok(versDTO(stock));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        verifierAppartientALaPharmacieConnectee(id);
        stockService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    private void verifierAppartientALaPharmacieConnectee(Long stockId) {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        Stock stock = stockService.findById(stockId);
        if (!stock.getPharmacie().getId().equals(pharmacieId)) {
            throw new AccessDeniedException("Ce stock n'appartient pas a votre pharmacie.");
        }
    }

    private StockPharmacienDTO versDTO(Stock stock) {
        return new StockPharmacienDTO(
            stock.getId(),
            stock.getProduit().getId(),
            stock.getProduit().getNom(),
            stock.getProduit().getForme() != null ? stock.getProduit().getForme().name() : null,
            stock.getProduit().getImageUrl(),
            stock.getQuantite(),
            stock.getSeuilAlerte(),
            stock.getPrix(),
            stock.getStatut().name(),
            stock.getDateDerniereMaj()
        );
    }
}