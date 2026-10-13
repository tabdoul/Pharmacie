import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_URL } from './config';

/**
 * Ajoute le token a chaque appel vers le backend. Si le serveur refuse le token
 * (401/403), la session est terminee et on revient a la page de connexion.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.token();
  const requete = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const estAuthentification = req.url.includes('/api/admin/auth/');

  return next(requete).pipe(
    catchError((e: HttpErrorResponse) => {
      if ((e.status === 401 || e.status === 403) && !estAuthentification) {
        auth.deconnexion(true);
      }
      return throwError(() => e);
    }),
  );
};