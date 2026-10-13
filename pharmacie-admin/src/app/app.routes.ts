import { Routes } from '@angular/router';
import { authGuard, dejaConnecteGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'connexion',
    canActivate: [dejaConnecteGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'installation',
    canActivate: [dejaConnecteGuard],
    loadComponent: () => import('./installation/installation').then((m) => m.Installation),
  },
  {
    path: 'pharmacies',
    canActivate: [authGuard],
    loadComponent: () => import('./pharmacies/pharmacies').then((m) => m.Pharmacies),
  },
  { path: '', pathMatch: 'full', redirectTo: 'pharmacies' },
  { path: '**', redirectTo: 'pharmacies' },
];
