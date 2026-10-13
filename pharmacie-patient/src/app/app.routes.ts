import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Pharma Proche',
    loadComponent: () => import('./accueil/accueil').then((m) => m.Accueil),
  },
  {
    path: 'recherche',
    title: 'Rechercher un médicament — Pharma Proche',
    loadComponent: () => import('./recherche/recherche').then((m) => m.Recherche),
  },
  {
    path: 'resultats',
    title: 'Résultats — Pharma Proche',
    loadComponent: () => import('./resultats/resultats').then((m) => m.Resultats),
  },
  {
    path: 'resultats-liste',
    title: 'Résultats de ma liste — Pharma Proche',
    loadComponent: () =>
      import('./resultats-liste/resultats-liste').then((m) => m.ResultatsListe),
  },
  {
    path: 'panier',
    title: 'Mon panier — Pharma Proche',
    loadComponent: () => import('./panier/panier').then((m) => m.Panier),
  },
  {
    path: 'produit/:stockId',
    title: 'Détail — Pharma Proche',
    loadComponent: () => import('./detail/detail').then((m) => m.Detail),
  },
  { path: '**', redirectTo: '' },
];
