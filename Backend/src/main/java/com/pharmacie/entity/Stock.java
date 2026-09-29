package com.pharmacie.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(
    name = "stocks",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_stock_pharmacie_produit",
        columnNames = {"pharmacie_id", "produit_id"}
    )
)
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pharmacie_id", nullable = false)
    private Pharmacie pharmacie;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer quantite;

    /**
     * Seuil en dessous duquel une notification de stock faible est generee.
     */
    @NotNull
    @Min(0)
    @Column(name = "seuil_alerte", nullable = false)
    private Integer seuilAlerte;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prix;

    @Column(name = "date_derniere_maj", nullable = false)
    private LocalDateTime dateDerniereMaj;

    public Stock() {
    }

    public Stock(Long id, Pharmacie pharmacie, Produit produit, Integer quantite,
                 Integer seuilAlerte, BigDecimal prix, LocalDateTime dateDerniereMaj) {
        this.id = id;
        this.pharmacie = pharmacie;
        this.produit = produit;
        this.quantite = quantite;
        this.seuilAlerte = seuilAlerte;
        this.prix = prix;
        this.dateDerniereMaj = dateDerniereMaj;
    }

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.dateDerniereMaj = LocalDateTime.now();
    }

    @Transient
    public StatutStock getStatut() {
        if (quantite == null || quantite <= 0) {
            return StatutStock.RUPTURE;
        }
        if (seuilAlerte != null && quantite <= seuilAlerte) {
            return StatutStock.STOCK_FAIBLE;
        }
        return StatutStock.DISPONIBLE;
    }

    public enum StatutStock {
        DISPONIBLE,
        STOCK_FAIBLE,
        RUPTURE
    }

    // --- Getters / Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Pharmacie getPharmacie() {
        return pharmacie;
    }

    public void setPharmacie(Pharmacie pharmacie) {
        this.pharmacie = pharmacie;
    }

    public Produit getProduit() {
        return produit;
    }

    public void setProduit(Produit produit) {
        this.produit = produit;
    }

    public Integer getQuantite() {
        return quantite;
    }

    public void setQuantite(Integer quantite) {
        this.quantite = quantite;
    }

    public Integer getSeuilAlerte() {
        return seuilAlerte;
    }

    public void setSeuilAlerte(Integer seuilAlerte) {
        this.seuilAlerte = seuilAlerte;
    }

    public BigDecimal getPrix() {
        return prix;
    }

    public void setPrix(BigDecimal prix) {
        this.prix = prix;
    }

    public LocalDateTime getDateDerniereMaj() {
        return dateDerniereMaj;
    }

    public void setDateDerniereMaj(LocalDateTime dateDerniereMaj) {
        this.dateDerniereMaj = dateDerniereMaj;
    }
}