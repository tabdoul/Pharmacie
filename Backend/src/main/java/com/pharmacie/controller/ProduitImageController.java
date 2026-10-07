package com.pharmacie.controller;

import com.pharmacie.dto.response.ProduitResponse;
import com.pharmacie.entity.Produit;
import com.pharmacie.service.FileStorageService;
import com.pharmacie.service.ProduitService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;

/**
 * Gestion des photos de produits : upload protege (pharmacien authentifie)
 * et consultation publique (utilisee par l'ecran patient comme par le
 * back-office pharmacien pour afficher la photo).
 */
@RestController
public class ProduitImageController {

    private final ProduitService produitService;
    private final FileStorageService fileStorageService;

    public ProduitImageController(ProduitService produitService, FileStorageService fileStorageService) {
        this.produitService = produitService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Upload/remplacement de la photo d'un produit. Protege par le filtre JWT
     * standard (anyRequest().authenticated() dans SecurityConfig).
     */
    @PostMapping(value = "/api/pharmacien/produits/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProduitResponse> televerser(
        @PathVariable Long id,
        @RequestPart("image") MultipartFile image
    ) {
        String nomFichier = fileStorageService.sauvegarderImageProduit(image);
        String imageUrl = "/api/public/produits/images/" + nomFichier;
        Produit produit = produitService.mettreAJourImage(id, imageUrl);
        return ResponseEntity.ok(versDTO(produit));
    }

    /**
     * Consultation publique d'une image de produit (aucune authentification
     * necessaire : /api/public/** est deja ouvert dans SecurityConfig).
     */
    @GetMapping("/api/public/produits/images/{nomFichier}")
    public ResponseEntity<Resource> consulter(@PathVariable String nomFichier) {
        Path chemin = fileStorageService.chargerImageProduit(nomFichier);
        MediaType type = deduireTypeImage(nomFichier);

        try {
            Resource ressource = new UrlResource(chemin.toUri());
            return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(ressource);
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Chemin d'image invalide.", e);
        }
    }

    private MediaType deduireTypeImage(String nomFichier) {
        String minuscule = nomFichier.toLowerCase();
        if (minuscule.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (minuscule.endsWith(".webp")) return MediaType.valueOf("image/webp");
        return MediaType.IMAGE_JPEG;
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