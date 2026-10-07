package com.pharmacie.service;

import com.pharmacie.dto.response.ArticleMatchDTO;
import com.pharmacie.dto.response.PharmacieMatchDTO;
import com.pharmacie.entity.Pharmacie;
import com.pharmacie.entity.Produit;
import com.pharmacie.entity.Stock;
import com.pharmacie.exception.ConflictException;
import com.pharmacie.exception.ResourceNotFoundException;
import com.pharmacie.repository.StockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    /**
     * Recherche groupee pour une liste de medicaments : regroupe les resultats
     * par pharmacie plutot que par medicament, pour aider le patient a trouver
     * une pharmacie qui couvre le plus d'articles de sa liste (ex: ordonnance
     * avec plusieurs medicaments).
     */
    public List<PharmacieMatchDTO> rechercherListe(List<String> noms) {
        List<String> termes = noms.stream()
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .distinct()
            .toList();

        if (termes.isEmpty()) {
            return List.of();
        }

        // pharmacieId -> (terme demande -> meilleur stock trouve pour ce terme chez cette pharmacie)
        Map<Long, Map<String, Stock>> stocksParPharmacieEtTerme = new LinkedHashMap<>();
        Map<Long, Pharmacie> pharmaciesParId = new LinkedHashMap<>();

        for (String terme : termes) {
            List<Stock> resultats = stockRepository.rechercherDisponiblesParNomProduit(terme);

            // Si plusieurs stocks correspondent au meme terme dans la meme pharmacie
            // (rare, mais possible si plusieurs produits partagent un mot), on garde
            // le moins cher.
            Map<Long, Stock> meilleurParPharmacie = new LinkedHashMap<>();
            for (Stock s : resultats) {
                Long pharmacieId = s.getPharmacie().getId();
                Stock actuel = meilleurParPharmacie.get(pharmacieId);
                if (actuel == null || s.getPrix().compareTo(actuel.getPrix()) < 0) {
                    meilleurParPharmacie.put(pharmacieId, s);
                }
            }

            for (Map.Entry<Long, Stock> entree : meilleurParPharmacie.entrySet()) {
                stocksParPharmacieEtTerme
                    .computeIfAbsent(entree.getKey(), k -> new LinkedHashMap<>())
                    .put(terme, entree.getValue());
                pharmaciesParId.putIfAbsent(entree.getKey(), entree.getValue().getPharmacie());
            }
        }

        List<PharmacieMatchDTO> resultatsFinaux = new ArrayList<>();

        for (Map.Entry<Long, Map<String, Stock>> entree : stocksParPharmacieEtTerme.entrySet()) {
            Long pharmacieId = entree.getKey();
            Map<String, Stock> stocksParTerme = entree.getValue();
            Pharmacie pharmacie = pharmaciesParId.get(pharmacieId);

            List<ArticleMatchDTO> articles = new ArrayList<>();
            int trouves = 0;
            BigDecimal total = BigDecimal.ZERO;

            for (String terme : termes) {
                Stock stock = stocksParTerme.get(terme);
                if (stock != null) {
                    trouves++;
                    total = total.add(stock.getPrix());
                    articles.add(new ArticleMatchDTO(
                        terme, true, stock.getProduit().getNom(),
                        stock.getProduit().getForme() != null ? stock.getProduit().getForme().name() : null,
                        stock.getPrix(), stock.getId()
                    ));
                } else {
                    articles.add(new ArticleMatchDTO(terme, false, null, null, null, null));
                }
            }

            resultatsFinaux.add(new PharmacieMatchDTO(
                pharmacieId, pharmacie.getNom(), pharmacie.getVille(), pharmacie.getQuartier(),
                pharmacie.getTelephone(), trouves, termes.size(), total, articles
            ));
        }

        // Tri : le plus d'articles trouves en premier, puis le prix total le plus bas
        // pour departager les pharmacies a egalite de couverture.
        resultatsFinaux.sort(
            Comparator.comparingInt(PharmacieMatchDTO::getNombreTrouves).reversed()
                .thenComparing(PharmacieMatchDTO::getPrixTotal)
        );

        return resultatsFinaux;
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