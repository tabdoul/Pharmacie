import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { API_URL } from './config';
import { LoginResponse } from './models';

const CLE_TOKEN = 'admin_token';
const CLE_IDENTIFIANT = 'admin_identifiant';

// sessionStorage : la session s'arrete a la fermeture de l'onglet.
function lire(cle: string): string | null {
  try {
    return sessionStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string | null): void {
  try {
    if (valeur === null) {
      sessionStorage.removeItem(cle);
    } else {
      sessionStorage.setItem(cle, valeur);
    }
  } catch {
    // stockage indisponible : la session ne survivra pas a un rechargement
  }
}

function estExpire(token: string): boolean {
  try {
    const charge = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(charge));
    return typeof exp === 'number' ? exp * 1000 <= Date.now() : false;
  } catch {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly jeton = signal<string | null>(lire(CLE_TOKEN));
  readonly identifiant = signal<string | null>(lire(CLE_IDENTIFIANT));

  /** Token valide, ou null s'il est absent ou expire. */
  token(): string | null {
    const t = this.jeton();
    return t && !estExpire(t) ? t : null;
  }

  estConnecte(): boolean {
    return this.token() !== null;
  }

  connexion(identifiant: string, motDePasse: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/api/admin/auth/login`, { identifiant, motDePasse })
      .pipe(tap((reponse) => this.ouvrirSession(reponse)));
  }

  /** Vrai tant qu'aucun compte administrateur n'a ete cree (premier lancement). */
  installationNecessaire(): Observable<boolean> {
    return this.http
      .get<{ installationNecessaire: boolean }>(`${API_URL}/api/admin/auth/etat`)
      .pipe(map((r) => r.installationNecessaire));
  }

  /** Premiere installation : cree le compte admin avec le code affiche dans la console du backend. */
  installer(codeInstallation: string, identifiant: string, motDePasse: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/api/admin/auth/installation`, {
        codeInstallation,
        identifiant,
        motDePasse,
      })
      .pipe(tap((reponse) => this.ouvrirSession(reponse)));
  }

  private ouvrirSession(reponse: LoginResponse): void {
    this.jeton.set(reponse.token);
    this.identifiant.set(reponse.identifiant);
    ecrire(CLE_TOKEN, reponse.token);
    ecrire(CLE_IDENTIFIANT, reponse.identifiant);
  }

  deconnexion(sessionExpiree = false): void {
    this.jeton.set(null);
    this.identifiant.set(null);
    ecrire(CLE_TOKEN, null);
    ecrire(CLE_IDENTIFIANT, null);
    this.router.navigate(['/connexion'], {
      queryParams: sessionExpiree ? { expire: 1 } : {},
    });
  }
}