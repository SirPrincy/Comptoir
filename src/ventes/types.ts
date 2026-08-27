export interface Vente {
  id: string;
  productId: string;
  qty: number;
  pu: number;
  sousTotal?: number;
  fraisLivraison?: number;
  total: number;
  date: string;
  dateEncaissement?: string;
  clientId?: string;
  description?: string;
  modePaiement?: string;
  statutPaiement?: 'Payé' | 'Partiel' | 'Non payé' | string;
  montantPaye?: number;
  resteDu?: number;
  [key: string]: any;
}
