/** Noms affiches pour les formes de produit (le backend renvoie le code). */
export const LIBELLE_FORME: Record<string, string> = {
  COMPRIME: 'Comprimé',
  GELULE: 'Gélule',
  SIROP: 'Sirop',
  INJECTABLE: 'Injectable',
  POMMADE: 'Pommade',
  CREME: 'Crème',
  SUPPOSITOIRE: 'Suppositoire',
  POUDRE: 'Poudre',
  GOUTTES: 'Gouttes',
  PATCH: 'Patch',
  SPRAY: 'Spray',
  AUTRE: 'Autre',
};

export function libelleForme(forme: string | null | undefined): string {
  if (!forme) return '';
  return LIBELLE_FORME[forme] ?? forme;
}
