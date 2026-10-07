package com.pharmacie.controller;

import com.pharmacie.dto.request.StockAjoutRequest;
import com.pharmacie.dto.request.StockMajRequest;
import com.pharmacie.dto.StockPharmacienDTO;
import com.pharmacie.dto.request.StockSeuilRequest;
import com.pharmacie.dto.response.ImportStockResponse;
import com.pharmacie.entity.Pharmacie;
import com.pharmacie.entity.Produit;
import com.pharmacie.entity.Stock;
import com.pharmacie.exception.ConflictException;
import com.pharmacie.security.SecurityUtils;
import com.pharmacie.service.PharmacieService;
import com.pharmacie.service.ProduitService;
import com.pharmacie.service.StockService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacien/stocks")
public class StockController {

    private static final int SEUIL_ALERTE_PAR_DEFAUT = 5;

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

    /**
     * Export du stock de la pharmacie connectee au format CSV (separateur ";",
     * encodage UTF-8 avec BOM pour une ouverture correcte dans Excel).
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exporter() {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        List<Stock> stocks = stockService.findByPharmacie(pharmacieId);

        byte[] contenu = genererCsv(stocks).getBytes(StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "stock-pharmacie.csv");
        headers.setContentLength(contenu.length);

        return new ResponseEntity<>(contenu, headers, HttpStatus.OK);
    }

    /**
     * Import en masse : CSV avec les colonnes "Produit;Forme;Quantite;Seuil alerte;Prix".
     * Un produit deja present dans le stock de la pharmacie est ignore (jamais ecrase).
     * Un produit inconnu est cree au passage.
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportStockResponse> importer(@RequestParam("fichier") MultipartFile fichier) {
        Long pharmacieId = SecurityUtils.pharmacieConnecteeId();
        Pharmacie pharmacie = pharmacieService.findById(pharmacieId);

        int ajoutes = 0;
        int ignores = 0;
        List<String> erreurs = new ArrayList<>();

        try (BufferedReader lecteur = new BufferedReader(
                new InputStreamReader(fichier.getInputStream(), StandardCharsets.UTF_8))) {

            String ligne;
            int numeroLigne = 0;
            boolean premiereLigne = true;

            while ((ligne = lecteur.readLine()) != null) {
                numeroLigne++;

                if (premiereLigne) {
                    premiereLigne = false;
                    continue; // on saute l'en-tete
                }
                if (ligne.isBlank()) {
                    continue;
                }

                // Retire le BOM eventuel laisse par Excel sur la premiere ligne de donnees
                ligne = ligne.replace("﻿", "");

                String[] champs = ligne.split(";", -1);
                String nom = champs.length > 0 ? champs[0].trim() : "";
                String formeTexte = champs.length > 1 ? champs[1].trim() : "";
                String quantiteTexte = champs.length > 2 ? champs[2].trim() : "";
                String seuilTexte = champs.length > 3 ? champs[3].trim() : "";
                String prixTexte = champs.length > 4 ? champs[4].trim() : "";

                if (nom.isEmpty()) {
                    erreurs.add("Ligne " + numeroLigne + " : nom de produit manquant, ligne ignoree.");
                    continue;
                }

                Integer quantite = parseEntier(quantiteTexte);
                if (quantite == null || quantite < 0) {
                    erreurs.add("Ligne " + numeroLigne + " (" + nom + ") : quantite invalide, ligne ignoree.");
                    continue;
                }

                BigDecimal prix = parseDecimal(prixTexte);
                if (prix == null || prix.compareTo(BigDecimal.ZERO) < 0) {
                    erreurs.add("Ligne " + numeroLigne + " (" + nom + ") : prix invalide, ligne ignoree.");
                    continue;
                }

                Integer seuilAlerte = parseEntier(seuilTexte);
                if (seuilAlerte == null || seuilAlerte < 0) {
                    seuilAlerte = SEUIL_ALERTE_PAR_DEFAUT;
                }

                Produit.Forme forme = resoudreForme(formeTexte);
                Produit produit = trouverOuCreerProduit(nom, forme);

                try {
                    stockService.ajouterAuStock(pharmacie, produit, quantite, seuilAlerte, prix);
                    ajoutes++;
                } catch (ConflictException e) {
                    ignores++;
                }
            }
        } catch (IOException e) {
            erreurs.add("Le fichier n'a pas pu etre lu.");
        }

        return ResponseEntity.ok(new ImportStockResponse(ajoutes, ignores, erreurs));
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

    private Produit trouverOuCreerProduit(String nom, Produit.Forme forme) {
        return produitService.rechercherParNom(nom).stream()
            .filter(p -> p.getNom().equalsIgnoreCase(nom))
            .findFirst()
            .orElseGet(() -> {
                Produit nouveau = new Produit();
                nouveau.setNom(nom);
                nouveau.setForme(forme);
                return produitService.creer(nouveau);
            });
    }

    private Produit.Forme resoudreForme(String texte) {
        if (texte == null || texte.isBlank()) {
            return Produit.Forme.AUTRE;
        }
        String normalise = texte.trim().toUpperCase()
            .replace("É", "E").replace("È", "E").replace("Ê", "E");
        try {
            return Produit.Forme.valueOf(normalise);
        } catch (IllegalArgumentException e) {
            return Produit.Forme.AUTRE;
        }
    }

    private Integer parseEntier(String texte) {
        if (texte == null || texte.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(texte.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal parseDecimal(String texte) {
        if (texte == null || texte.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(texte.trim().replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
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

    private String genererCsv(List<Stock> stocks) {
        StringBuilder sb = new StringBuilder();
        sb.append('﻿'); // BOM : garantit l'ouverture correcte des accents dans Excel
        sb.append("Produit;Forme;Quantite;Seuil alerte;Prix (GNF);Statut;Derniere mise a jour\n");

        for (Stock stock : stocks) {
            Produit produit = stock.getProduit();
            sb.append(champCsv(produit.getNom())).append(';');
            sb.append(champCsv(produit.getForme() != null ? produit.getForme().name() : "")).append(';');
            sb.append(stock.getQuantite()).append(';');
            sb.append(stock.getSeuilAlerte()).append(';');
            sb.append(stock.getPrix()).append(';');
            sb.append(champCsv(stock.getStatut().name())).append(';');
            sb.append(champCsv(String.valueOf(stock.getDateDerniereMaj()))).append('\n');
        }

        return sb.toString();
    }

    private String champCsv(String valeur) {
        if (valeur == null) {
            return "";
        }
        if (valeur.contains(";") || valeur.contains("\"") || valeur.contains("\n")) {
            return "\"" + valeur.replace("\"", "\"\"") + "\"";
        }
        return valeur;
    }
}