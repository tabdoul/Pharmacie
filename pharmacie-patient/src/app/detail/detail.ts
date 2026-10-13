import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap, tap } from 'rxjs';

import { ApiService } from '../api.service';
import { messageErreur } from '../erreurs';
import { urlImage } from '../image';
import { libelleForme } from '../libelles';
import { StockDetail } from '../models';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class Detail {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  readonly detail = signal<StockDetail | null>(null);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.chargement.set(true);
          this.erreur.set(null);
        }),
        switchMap((params) => this.api.detail(params.get('stockId') ?? '')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.detail.set(data);
          this.chargement.set(false);
        },
        error: (e) => {
          this.erreur.set(messageErreur(e, 'Impossible de charger ce produit.'));
          this.chargement.set(false);
        },
      });
  }

  /** Retour aux resultats ; si la page a ete ouverte directement, retour a la recherche. */
  retour(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/recherche']);
    }
  }

  image(d: StockDetail): string | null {
    return urlImage(d.imageUrl);
  }

  forme(code: string): string {
    return libelleForme(code);
  }

  prix(valeur: number): string {
    return valeur.toLocaleString('fr-FR');
  }

  date(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  lienMaps(d: StockDetail): string {
    return `https://maps.google.com/?q=${encodeURIComponent(`${d.adresse}, ${d.ville}`)}`;
  }

  lienTel(d: StockDetail): string {
    return `tel:${d.telephone}`;
  }
}
