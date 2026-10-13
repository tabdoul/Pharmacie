import { Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Icone } from '../icone';
import { LignePanier, PanierService } from '../panier.service';

interface GroupePharmacie {
  pharmacieId: number;
  nomPharmacie: string;
  ville: string;
  quartier: string | null;
  telephone: string | null;
  articles: LignePanier[];
  total: number;
}

@Component({
  selector: 'app-panier',
  imports: [RouterLink, Icone],
  templateUrl: './panier.html',
  styleUrl: './panier.css',
})
export class Panier {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly panier = inject(PanierService);

  /** Articles regroupes par pharmacie, avec un sous-total. */
  readonly groupes = computed<GroupePharmacie[]>(() => {
    const parPharmacie = new Map<number, GroupePharmacie>();
    for (const item of this.panier.items()) {
      const existant = parPharmacie.get(item.pharmacieId);
      if (existant) {
        existant.articles.push(item);
        existant.total += item.prix;
      } else {
        parPharmacie.set(item.pharmacieId, {
          pharmacieId: item.pharmacieId,
          nomPharmacie: item.nomPharmacie,
          ville: item.ville,
          quartier: item.quartier,
          telephone: item.telephone,
          articles: [item],
          total: item.prix,
        });
      }
    }
    return Array.from(parPharmacie.values());
  });

  readonly totalGeneral = computed(() => this.panier.items().reduce((somme, i) => somme + i.prix, 0));
  readonly nombreAchetes = computed(() => this.panier.items().filter((i) => i.achete).length);

  retour(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/recherche']);
    }
  }

  prix(valeur: number): string {
    return valeur.toLocaleString('fr-FR');
  }
}
