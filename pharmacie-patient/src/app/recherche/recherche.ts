import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../api.service';
import { Icone } from '../icone';
import { ecrireQuartier, lireQuartier } from '../memoire';

interface Article {
  id: number;
  label: string;
}

@Component({
  selector: 'app-recherche',
  imports: [FormsModule, RouterLink, Icone],
  templateUrl: './recherche.html',
  styleUrl: './recherche.css',
})
export class Recherche {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly suggestions = ['Vitamine C', 'Sirop toux', 'Sérum physio'];

  readonly valeur = signal('');
  readonly articles = signal<Article[]>([]);
  readonly quartiers = signal<string[]>([]);
  readonly monQuartier = signal<string | null>(lireQuartier());
  readonly modaleOuverte = signal(false);

  private prochainId = 1;

  readonly peutAjouter = computed(() => this.valeur().trim().length > 0);
  readonly nombre = computed(() => this.articles().length);

  readonly libelleCta = computed(() => {
    const n = this.nombre();
    if (n === 0) return 'Ajoutez un médicament';
    if (n === 1) return 'Rechercher';
    return `Rechercher ma liste (${n})`;
  });

  constructor() {
    // Non bloquant : si la liste des quartiers ne se charge pas, on cache simplement le selecteur.
    this.api
      .quartiers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (q) => this.quartiers.set(q), error: () => {} });
  }

  private dejaDansListe(label: string): boolean {
    return this.articles().some((a) => a.label.toLowerCase() === label.toLowerCase());
  }

  ajouterCourant(): void {
    const terme = this.valeur().trim();
    if (!terme) return;
    if (!this.dejaDansListe(terme)) {
      this.articles.update((liste) => [...liste, { id: this.prochainId++, label: terme }]);
    }
    this.valeur.set('');
  }

  ajouterSuggestion(label: string): void {
    if (this.dejaDansListe(label)) return;
    this.articles.update((liste) => [...liste, { id: this.prochainId++, label }]);
  }

  retirer(id: number): void {
    this.articles.update((liste) => liste.filter((a) => a.id !== id));
  }

  choisirQuartier(quartier: string | null): void {
    const nouveau = this.monQuartier() === quartier ? null : quartier;
    this.monQuartier.set(nouveau);
    ecrireQuartier(nouveau);
    this.modaleOuverte.set(false);
  }

  @HostListener('document:keydown.escape')
  fermerModale(): void {
    this.modaleOuverte.set(false);
  }

  lancer(): void {
    const liste = this.articles();
    if (liste.length === 1) {
      this.router.navigate(['/resultats'], { queryParams: { nom: liste[0].label } });
    } else if (liste.length >= 2) {
      this.router.navigate(['/resultats-liste'], {
        queryParams: { noms: JSON.stringify(liste.map((a) => a.label)) },
      });
    }
  }
}
