import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

import { Icone, NomIcone } from '../icone';
import { LIEN_ESPACE_PHARMACIEN } from '../config';

interface Etape {
  icone: NomIcone;
  fond: string;
  couleur: string;
  texte: string;
}

@Component({
  selector: 'app-accueil',
  imports: [Icone],
  templateUrl: './accueil.html',
  styleUrl: './accueil.css',
})
export class Accueil {
  private readonly router = inject(Router);

  readonly lienPharmacien = LIEN_ESPACE_PHARMACIEN;

  readonly etapes: Etape[] = [
    { icone: 'search', fond: 'var(--succes-fond)', couleur: 'var(--primaire)', texte: 'Cherchez votre médicament' },
    { icone: 'location', fond: 'var(--alerte-fond)', couleur: 'var(--alerte)', texte: 'Choisissez une pharmacie et déplacez-vous' },
    { icone: 'chat', fond: 'var(--danger-fond)', couleur: 'var(--danger)', texte: 'Le pharmacien vous conseille sur place' },
  ];

  commencer(): void {
    this.router.navigate(['/recherche']);
  }
}
