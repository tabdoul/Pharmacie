import { HttpErrorResponse } from '@angular/common/http';

/** Message lisible pour une erreur HTTP (le backend renvoie { message }). */
export function messageErreur(e: unknown, parDefaut: string): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) {
      return 'Serveur injoignable. Vérifiez que le backend est démarré.';
    }
    const corps = e.error;
    if (corps && typeof corps === 'object' && 'message' in corps && corps.message) {
      return String(corps.message);
    }
  }
  return parDefaut;
}

/** Minuscules sans accents, pour la recherche. */
export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}