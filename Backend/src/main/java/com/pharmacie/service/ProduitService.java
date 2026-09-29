package com.pharmacie.service;

import com.pharmacie.entity.Produit;
import com.pharmacie.exception.ResourceNotFoundException;
import com.pharmacie.repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProduitService {

    private final ProduitRepository produitRepository;

    public ProduitService(ProduitRepository produitRepository) {
        this.produitRepository = produitRepository;
    }

    @Transactional
    public Produit creer(Produit produit) {
        return produitRepository.save(produit);
    }

    public Produit findById(Long id) {
        return produitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable, id=" + id));
    }

    public List<Produit> findAll() {
        return produitRepository.findAll();
    }

    /**
     * Utilise par le pharmacien dans le formulaire d'ajout au stock,
     * pour retrouver un produit existant avant d'en creer un nouveau.
     */
    public List<Produit> rechercherParNom(String nom) {
        return produitRepository.findByNomContainingIgnoreCase(nom);
    }

    @Transactional
    public Produit mettreAJour(Long id, Produit donnees) {
        Produit existant = findById(id);
        existant.setNom(donnees.getNom());
        existant.setForme(donnees.getForme());
        existant.setImageUrl(donnees.getImageUrl());
        existant.setDescription(donnees.getDescription());
        return produitRepository.save(existant);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!produitRepository.existsById(id)) {
            throw new ResourceNotFoundException("Produit introuvable, id=" + id);
        }
        produitRepository.deleteById(id);
    }
}