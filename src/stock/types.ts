export interface Product {
  id: string;
  nom: string;
  reference?: string;
  categorie: string;
  couleur?: string;
  puRmb?: number | string;
  prixAchatAr?: number | string;
  prixAchat?: number | string;
  coutTotalRenduAr?: number | string;
  prixVente: number | string;
  seuilMin?: number | string;
  images?: string[];
  stock?: number;
  fournisseurId?: string;
  notes?: string;
  [key: string]: any;
}

export interface MouvementStock {
  id: string;
  productId: string;
  productNom?: string;
  delta: number;
  motif?: string;
  type?: string;
  date: string;
  valeurTotaleAr?: number;
  valeurUnitaireAr?: number;
  [key: string]: any;
}
