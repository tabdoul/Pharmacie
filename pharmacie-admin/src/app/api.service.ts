import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './config';
import { Pharmacie } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/admin/pharmacies`;

  lister(): Observable<Pharmacie[]> {
    return this.http.get<Pharmacie[]>(this.base);
  }

  valider(id: number): Observable<Pharmacie> {
    return this.http.post<Pharmacie>(`${this.base}/${id}/valider`, {});
  }

  rejeter(id: number, motif: string): Observable<Pharmacie> {
    return this.http.post<Pharmacie>(`${this.base}/${id}/rejeter`, { motif });
  }

  document(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/document`, { responseType: 'blob' });
  }
}