package com.pharmacie.controller;

import com.pharmacie.dto.request.ProduitRequest;
import com.pharmacie.dto.response.ProduitResponse;
import com.pharmacie.entity.Produit;
import com.pharmacie.service.ProduitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacien/produits")
public class ProduitController {

    private final ProduitService produitService;

    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }

    @GetMapping
    public ResponseEntity<List<ProduitResponse>> lister(
        @RequestParam(required = false) String nom
    ) {
        List<Produit> produits = (nom == null || nom.isBlank())
            ? produitService.findAll()
            : produitService.rechercherParNom(nom);

        return ResponseEntity.ok(produits.stream().map(this::versDTO).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProduitResponse> recuperer(@PathVariable Long id) {
        return ResponseEntity.ok(versDTO(produitService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ProduitResponse> creer(@Valid @RequestBody ProduitRequest requete) {
        Produit produit = versEntite(requete, new Produit());
        return ResponseEntity.ok(versDTO(produitService.creer(produit)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProduitResponse> mettreAJour(
        @PathVariable Long id,
        @Valid @RequestBody ProduitRequest requete
    ) {
        Produit donnees = versEntite(requete, new Produit());
        return ResponseEntity.ok(versDTO(produitService.mettreAJour(id, donnees)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        produitService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    private Produit versEntite(ProduitRequest requete, Produit produit) {
        produit.setNom(requete.getNom());
        produit.setForme(requete.getForme());
        produit.setImageUrl(requete.getImageUrl());
        produit.setDescription(requete.getDescription());
        return produit;
    }

    private ProduitResponse versDTO(Produit produit) {
        return new ProduitResponse(
            produit.getId(),
            produit.getNom(),
            produit.getForme() != null ? produit.getForme().name() : null,
            produit.getImageUrl(),
            produit.getDescription()
        );
    }
}