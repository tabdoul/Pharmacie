import { Injectable, computed, signal } from '@angular/core';

import { ArticlePanier } from './models';

/** Un article du panier, avec la case "deja achete". */
export interface LignePanier extends ArticlePanier {
  achete: boolean;
}

/** Panier du patient : les articles qu'il a choisis dans les pharmacies. */
@Injectable({ providedIn: 'root' })
export class PanierService {
  readonly items = signal<LignePanier[]>([]);
  readonly nombre = computed(() => this.items().length);

  estDansPanier(stockId: number): boolean {
    return this.items().some((i) => i.stockId === stockId);
  }

  ajouter(item: ArticlePanier): void {
    if (this.estDansPanier(item.stockId)) return;
    this.items.update((liste) => [...liste, { ...item, achete: false }]);
  }

  retirer(stockId: number): void {
    this.items.update((liste) => liste.filter((i) => i.stockId !== stockId));
  }

  basculerAchete(stockId: number): void {
    this.items.update((liste) =>
      liste.map((i) => (i.stockId === stockId ? { ...i, achete: !i.achete } : i)),
    );
  }

  retirerAchetes(): void {
    this.items.update((liste) => liste.filter((i) => !i.achete));
  }

  vider(): void {
    this.items.set([]);
  }
}
