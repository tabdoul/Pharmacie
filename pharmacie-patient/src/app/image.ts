import { API_URL } from './config';

/**
 * Adresse affichable d'une image produit.
 * - chemin relatif renvoye par le backend ("/uploads/...") : on ajoute l'adresse de l'API
 * - adresse complete (image fournie par un import CSV) : utilisee telle quelle
 */
export function urlImage(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_URL}${imageUrl}`;
}
