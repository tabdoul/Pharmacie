import { HttpErrorResponse } from '@angular/common/http';

/** Message lisible pour une erreur HTTP (le backend renvoie { message }). */
export function messageErreur(e: unknown, parDefaut: string): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) {
      return 'Serveur injoignable. Vérifiez votre connexion et réessayez.';
    }
    const corps = e.error;
    if (corps && typeof corps === 'object' && 'message' in corps && corps.message) {
      return String(corps.message);
    }
  }
  return parDefaut;
}
