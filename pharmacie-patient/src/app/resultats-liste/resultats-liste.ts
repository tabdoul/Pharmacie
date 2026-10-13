import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Location, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';

import { ApiService } from '../api.service';
import { ErreurChargement } from '../erreur-chargement';
import { messageErreur } from '../erreurs';
import { Icone } from '../icone';
import { lireQuartier } from '../memoire';
import { ArticleMatch, PharmacieMatch } from '../models';
import { PanierService } from '../panier.service';

/** Une pharmacie est une "bonne correspondance" si elle a au moins la moitie de la liste. */
const SEUIL_BONNE_CORRESPONDANCE = 0.5;

type Etat = { data: PharmacieMatch[] } | { erreur: string };

@Component({
  selector: 'app-resultats-liste',
  imports: [RouterLink, NgTemplateOutlet, Icone, ErreurChargement],
  templateUrl: './resultats-liste.html',
  styleUrl: './resultats-liste.css',
})
export class ResultatsListe {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tentative = new BehaviorSubject(0);

  readonly panier = inject(PanierService);

  readonly resultats = signal<PharmacieMatch[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly articlesDemandes = signal<string[]>([]);
  readonly pharmacieOuverte = signal<number | null>(null);
  readonly autresDepliees = signal(false);
  readonly monQuartier = signal<string | null>(lireQuartier());

  /** Meme quartier d'abord, puis le plus de medicaments trouves, puis le total le moins cher. */
  readonly tries = computed(() => {
    const quartier = this.monQuartier();
    return [...this.resultats()].sort((a, b) => {
      if (quartier) {
        const aMatch = a.quartier === quartier ? 0 : 1;
        const bMatch = b.quartier === quartier ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      if (a.nombreTrouves !== b.nombreTrouves) return b.nombreTrouves - a.nombreTrouves;
      return a.prixTotal - b.prixTotal;
    });
  });

  readonly bonnes = computed(() =>
    this.tries().filter((r) => r.nombreTrouves / r.nombreDemandes >= SEUIL_BONNE_CORRESPONDANCE),
  );
  readonly autres = computed(() =>
    this.tries().filter((r) => r.nombreTrouves / r.nombreDemandes < SEUIL_BONNE_CORRESPONDANCE),
  );

  constructor() {
    combineLatest([this.route.queryParamMap, this.tentative])
      .pipe(
        tap(() => {
          this.chargement.set(true);
          this.erreur.set(null);
        }),
        switchMap(([params]): ReturnType<ResultatsListe['chargerListe']> =>
          this.chargerListe(params.get('noms')),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((etat) => {
        if ('data' in etat) {
          this.resultats.set(etat.data);
        } else {
          this.erreur.set(etat.erreur);
        }
        this.chargement.set(false);
      });
  }

  private chargerListe(brut: string | null) {
    let liste: string[];
    try {
      const valeur = JSON.parse(brut ?? '');
      if (!Array.isArray(valeur) || valeur.length === 0 || valeur.some((v) => typeof v !== 'string')) {
        throw new Error('liste invalide');
      }
      liste = valeur;
    } catch {
      return of<Etat>({ erreur: 'Liste de médicaments invalide.' });
    }
    this.articlesDemandes.set(liste);
    return this.api.rechercherListe(liste).pipe(
      map((data): Etat => ({ data })),
      catchError((e) => of<Etat>({ erreur: messageErreur(e, 'Impossible de charger les résultats.') })),
    );
  }

  relancer(): void {
    this.tentative.next(this.tentative.value + 1);
  }

  retour(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/recherche']);
    }
  }

  basculerOuverte(pharmacieId: number): void {
    this.pharmacieOuverte.set(this.pharmacieOuverte() === pharmacieId ? null : pharmacieId);
  }

  basculerAutres(): void {
    this.autresDepliees.set(!this.autresDepliees());
  }

  complet(item: PharmacieMatch): boolean {
    return item.nombreTrouves === item.nombreDemandes;
  }

  pourcentage(item: PharmacieMatch): number {
    return (item.nombreTrouves / item.nombreDemandes) * 100;
  }

  estMemeQuartier(item: PharmacieMatch): boolean {
    const quartier = this.monQuartier();
    return quartier !== null && item.quartier === quartier;
  }

  cliquable(article: ArticleMatch): boolean {
    return article.trouve && article.stockId !== null;
  }

  dansPanier(article: ArticleMatch): boolean {
    return article.stockId !== null && this.panier.estDansPanier(article.stockId);
  }

  basculerPanier(pharmacie: PharmacieMatch, article: ArticleMatch): void {
    if (!article.trouve || article.stockId === null || article.prix === null || !article.nomProduit) {
      return;
    }
    if (this.panier.estDansPanier(article.stockId)) {
      this.panier.retirer(article.stockId);
      return;
    }
    this.panier.ajouter({
      stockId: article.stockId,
      nomDemande: article.nomDemande,
      nomProduit: article.nomProduit,
      formeProduit: article.formeProduit,
      prix: article.prix,
      nomPharmacie: pharmacie.nomPharmacie,
      pharmacieId: pharmacie.pharmacieId,
      ville: pharmacie.ville,
      quartier: pharmacie.quartier,
      telephone: pharmacie.telephone,
    });
  }

  prix(valeur: number): string {
    return valeur.toLocaleString('fr-FR');
  }
}
