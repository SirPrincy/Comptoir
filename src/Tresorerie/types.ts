export interface MouvementTresorerie {
  id: string;
  type: 'entrée' | 'sortie' | 'transfert' | 'ajustement' | 'amortissement' | string;
  categorie?: string;
  tag?: string;
  montant?: number;
  compte?: string;
  description?: string;
  reference?: string;
  date: string;
  // Liens opérationnels
  venteId?: string;
  commandeId?: string;
  fraisId?: string;
  immoId?: string;
  immoNom?: string;
  annee?: number;
  mois?: number;
  // Ajustements de stock répercutés dans les mouvements
  productId?: string;
  productNom?: string;
  delta?: number;
  motif?: string;
  valeurTotaleAr?: number;
  valeurUnitaireAr?: number;
  paiementId?: string;
  isInvestissement?: boolean;
  isTransfert?: boolean;
  [key: string]: any;
}

export type Mouvement = MouvementTresorerie;
