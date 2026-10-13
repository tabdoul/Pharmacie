import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';

import { ApiService } from '../api.service';
import { ErreurChargement } from '../erreur-chargement';
import { messageErreur } from '../erreurs';
import { urlImage } from '../image';
import { libelleForme } from '../libelles';
import { ecrireQuartier, lireQuartier } from '../memoire';
import { StockRecherche } from '../models';

type Etat = { data: StockRecherche[] } | { erreur: string };

@Component({
  selector: 'app-resultats',
  imports: [RouterLink, ErreurChargement],
  templateUrl: './resultats.html',
  styleUrl: './resultats.css',
})
export class Resultats {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tentative = new BehaviorSubject(0);

  readonly nom = signal('');
  readonly resultats = signal<StockRecherche[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  readonly quartiers = signal<string[]>([]);
  readonly monQuartier = signal<string | null>(lireQuartier());
  readonly formeFiltre = signal<string | null>(null);

  /** Formes presentes dans les resultats de cette recherche (pour le filtre). */
  readonly formesDisponibles = computed(() =>
    Array.from(
      new Set(this.resultats().map((r) => r.formeProduit).filter((f): f is string => !!f)),
    ).sort(),
  );

  /** Meme quartier que le patient en premier, puis prix croissant dans chaque groupe. */
  readonly tries = computed(() => {
    const quartier = this.monQuartier();
    const forme = this.formeFiltre();
    return this.resultats()
      .filter((r) => !forme || r.formeProduit === forme)
      .sort((a, b) => {
        if (quartier) {
          const aMatch = a.quartier === quartier ? 0 : 1;
          const bMatch = b.quartier === quartier ? 0 : 1;
          if (aMatch !== bMatch) return aMatch - bMatch;
        }
        return a.prix - b.prix;
      });
  });

  /** Une pharmacie peut avoir plusieurs references : on compte les pharmacies distinctes. */
  readonly nombrePharmacies = computed(
    () =>
      new Set(this.tries().map((r) => `${r.nomPharmacie}|${r.ville}|${r.quartier ?? ''}`)).size,
  );

  constructor() {
    // Liste des quartiers : non bloquant si elle echoue.
    this.api
      .quartiers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (q) => this.quartiers.set(q), error: () => {} });

    // Une recherche par valeur du parametre "nom" (ou a chaque clic sur "Reessayer").
    combineLatest([this.route.queryParamMap, this.tentative])
      .pipe(
        tap(([params]) => {
          this.nom.set(params.get('nom') ?? '');
          this.chargement.set(true);
          this.erreur.set(null);
          this.formeFiltre.set(null);
        }),
        switchMap(([params]) =>
          this.api.rechercher(params.get('nom') ?? '').pipe(
            map((data): Etat => ({ data })),
            catchError((e) =>
              of<Etat>({ erreur: messageErreur(e, 'Impossible de charger les résultats.') }),
            ),
          ),
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

  relancer(): void {
    this.tentative.next(this.tentative.value + 1);
  }

  choisirQuartier(quartier: string): void {
    const nouveau = this.monQuartier() === quartier ? null : quartier;
    this.monQuartier.set(nouveau);
    ecrireQuartier(nouveau);
  }

  choisirForme(forme: string): void {
    this.formeFiltre.set(this.formeFiltre() === forme ? null : forme);
  }

  estMemeQuartier(item: StockRecherche): boolean {
    const quartier = this.monQuartier();
    return quartier !== null && item.quartier === quartier;
  }

  estMeilleurPrix(item: StockRecherche, index: number): boolean {
    return this.monQuartier() === null ? index === 0 : this.estMemeQuartier(item) && index === 0;
  }

  prix(valeur: number): string {
    return valeur.toLocaleString('fr-FR');
  }

  image(item: StockRecherche): string | null {
    return urlImage(item.imageUrl);
  }

  nomForme(code: string): string {
    return libelleForme(code);
  }
}
