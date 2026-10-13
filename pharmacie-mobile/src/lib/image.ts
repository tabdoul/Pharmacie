import { API_BASE_URL } from '@/api/client';

/**
 * Construit l'URL affichable d'une image produit.
 * - chemin relatif renvoye par le backend ("/uploads/...") -> prefixe avec l'URL de l'API
 * - URL absolue (ex: image fournie dans un import CSV) -> utilisee telle quelle
 */
export function urlImage(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
}