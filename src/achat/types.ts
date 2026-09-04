export interface Commande {
  id: string;
  productId: string;
  productNom?: string;
  fournisseurId?: string;
  acheteurNom?: string; // Nom de l'acheteur / intermédiaire Chine
  commissionAcheteurPct?: number; // % commission de l'acheteur
  commissionAcheteurAr?: number; // Montant commission en Ariary
  tauxRmbPondereApplique?: number; // Taux PUMP figé à la commande
  qty: number;
  pu?: number | string;
  puDevise?: number | string;
  total?: number | string;
  devise?: 'RMB' | 'USD' | 'MGA' | string;
  fraisTransport?: number | string;
  coutTotalAr?: number | string;
  statut?: string;
  statutLogistique?: string;
  dateCommande?: string;
  dateLivraisonEstimee?: string;
  dateArrivee?: string;
  trackingNumber?: string;
  transitaireId?: string;
  modeTransport?: string;
  qualityCheck?: {
    isCompleted?: boolean;
    conforme?: boolean;
    note?: number;
    remarques?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

