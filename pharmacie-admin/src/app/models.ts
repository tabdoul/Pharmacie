export type Statut = 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';

export interface Pharmacie {
  id: number;
  identifiantConnexion: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string | null;
  telephone: string | null;
  statutValidation: Statut;
  motifRejet: string | null;
}

export interface LoginResponse {
  token: string;
  identifiant: string;
}

export const STATUTS: { valeur: Statut; libelle: string; vide: string }[] = [
  { valeur: 'EN_ATTENTE', libelle: 'En attente', vide: 'Aucune pharmacie en attente de validation.' },
  { valeur: 'VALIDEE', libelle: 'Validées', vide: 'Aucune pharmacie validée.' },
  { valeur: 'REJETEE', libelle: 'Rejetées', vide: 'Aucune pharmacie rejetée.' },
];

export const LIBELLE_STATUT: Record<Statut, string> = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  REJETEE: 'Rejetée',
};