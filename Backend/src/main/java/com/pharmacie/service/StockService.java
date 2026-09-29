package com.pharmacie.service;

import com.pharmacie.entity.Pharmacie;
import com.pharmacie.entity.Produit;
import com.pharmacie.entity.Stock;
import com.pharmacie.exception.ConflictException;
import com.pharmacie.exception.ResourceNotFoundException;
import com.pharmacie.repository.StockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class StockService {

    private final StockRepository stockRepository;
    private final NotificationService notificationService;

    public StockService(StockRepository stockRepository, NotificationService notificationService) {
        this.stockRepository = stockRepository;
        this.notificationService = notificationService;
    }

    /**
     * Ajoute un produit au stock d'une pharmacie. Un couple pharmacie/produit
     * ne peut exister qu'une seule fois (cf. contrainte d'unicite en base).
     */
    @Transactional
    public Stock ajouterAuStock(Pharmacie pharmacie, Produit produit, Integer quantite,
                                 Integer seuilAlerte, BigDecimal prix) {
        stockRepository.findByPharmacieIdAndProduitId(pharmacie.getId(), produit.getId())
            .ifPresent(s -> {
                throw new ConflictException(
                    "Ce produit est deja reference dans le stock de cette pharmacie."
                );
            });

        Stock stock = new Stock();
        stock.setPharmacie(pharmacie);
        stock.setProduit(produit);
        stock.setQuantite(quantite);
        stock.setSeuilAlerte(seuilAlerte);
        stock.setPrix(prix);

        Stock enregistre = stockRepository.save(stock);
        genererNotificationSiStockFaible(enregistre);
        return enregistre;
    }

    /**
     * Mise a jour manuelle de la quantite et/ou du prix par le pharmacien
     * (edition rapide dans le tableau des stocks).
     */
    @Transactional
    public Stock mettreAJourQuantiteEtPrix(Long stockId, Integer quantite, BigDecimal prix) {
        Stock stock = findById(stockId);
        stock.setQuantite(quantite);
        stock.setPrix(prix);
        Stock enregistre = stockRepository.save(stock);
        genererNotificationSiStockFaible(enregistre);
        return enregistre;
    }

    @Transactional
    public Stock mettreAJourSeuilAlerte(Long stockId, Integer seuilAlerte) {
        Stock stock = findById(stockId);
        stock.setSeuilAlerte(seuilAlerte);
        Stock enregistre = stockRepository.save(stock);
        genererNotificationSiStockFaible(enregistre);
        return enregistre;
    }

    public Stock findById(Long id) {
    return stockRepository.findByIdWithDetails(id)
        .orElseThrow(() -> new ResourceNotFoundException("Stock introuvable, id=" + id));
}
    /**
     * Tableau des stocks pour le tableau de bord pharmacien.
     */
    public List<Stock> findByPharmacie(Long pharmacieId) {
        return stockRepository.findByPharmacieId(pharmacieId);
    }

    /**
     * Recherche patient : uniquement les stocks disponibles (quantite > 0).
     */
    public List<Stock> rechercherDisponiblesParNomProduit(String nomProduit) {
        return stockRepository.rechercherDisponiblesParNomProduit(nomProduit);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!stockRepository.existsById(id)) {
            throw new ResourceNotFoundException("Stock introuvable, id=" + id);
        }
        stockRepository.deleteById(id);
    }

    /**
     * Genere une notification interne des que la quantite passe au niveau
     * ou en dessous du seuil d'alerte defini par le pharmacien.
     */
    private void genererNotificationSiStockFaible(Stock stock) {
        if (stock.getQuantite() != null
            && stock.getSeuilAlerte() != null
            && stock.getQuantite() <= stock.getSeuilAlerte()) {
            notificationService.creerAlerteStockFaible(stock.getPharmacie(), stock);
        }
    }
}