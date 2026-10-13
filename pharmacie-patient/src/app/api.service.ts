import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from './config';
import { PharmacieMatch, StockDetail, StockRecherche } from './models';

/** Appels a l'API publique (aucun compte necessaire). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  rechercher(nom: string): Observable<StockRecherche[]> {
    const params = new HttpParams().set('nom', nom);
    return this.http.get<StockRecherche[]>(`${API_URL}/api/public/recherche`, { params });
  }

  /** Recherche d'une liste de medicaments : les pharmacies sont regroupees. */
  rechercherListe(noms: string[]): Observable<PharmacieMatch[]> {
    return this.http.post<PharmacieMatch[]>(`${API_URL}/api/public/recherche-liste`, { noms });
  }

  quartiers(): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/api/public/quartiers`);
  }

  detail(stockId: string): Observable<StockDetail> {
    return this.http.get<StockDetail>(`${API_URL}/api/public/stocks/${encodeURIComponent(stockId)}`);
  }
}
