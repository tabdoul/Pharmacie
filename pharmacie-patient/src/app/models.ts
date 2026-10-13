/** Une ligne de resultat de recherche : GET /api/public/recherche?nom= */
export interface StockRecherche {
  stockId: number;
  nomProduit: string;
  formeProduit: string | null;
  imageUrl: string | null;
  nomPharmacie: string;
  ville: string;
  quartier: string | null;
  prix: number;
}

/** Detail d'un stock : GET /api/public/stocks/{id} */
export interface StockDetail {
  stockId: number;
  nomProduit: string;
  formeProduit: string | null;
  imageUrl: string | null;
  description: string | null;
  prix: number;
  dateDerniereMaj: string;
  nomPharmacie: string;
  adresse: string;
  ville: string;
  quartier: string | null;
  telephone: string | null;
}

/** Un medicament de la liste, trouve (ou non) dans une pharmacie. */
export interface ArticleMatch {
  nomDemande: string;
  trouve: boolean;
  nomProduit: string | null;
  formeProduit: string | null;
  prix: number | null;
  stockId: number | null;
}

/** Une pharmacie et ce qu'elle a de la liste : POST /api/public/recherche-liste */
export interface PharmacieMatch {
  pharmacieId: number;
  nomPharmacie: string;
  ville: string;
  quartier: string | null;
  telephone: string | null;
  nombreTrouves: number;
  nombreDemandes: number;
  prixTotal: number;
  articles: ArticleMatch[];
}

/** Un article ajoute au panier. */
export interface ArticlePanier {
  stockId: number;
  nomDemande: string;
  nomProduit: string;
  formeProduit: string | null;
  prix: number;
  nomPharmacie: string;
  pharmacieId: number;
  ville: string;
  quartier: string | null;
  telephone: string | null;
}
