export type PnlPeriode = 'month' | 'quarter' | 'year' | 'all' | 'custom';

export interface ProfitLossProps {
  products?: any[];
  ventes?: any[];
  commandes?: any[];
  mouvements?: any[];
  frais?: any[];
  updateData?: (patch: any) => void;
  comptes?: string[];
  immobilisations?: any[];
  devises?: { rmb: number; usd: number };
}

export interface PnlData {
  chiffreAffaires: number;
  costMarchandises: number;
  fretMarchandises: number;
  cogs: number;
  margeBrute: number;
  margeBrutePct: number;
  loyerEtCharges: number;
  marketingEtPub: number;
  fretEtLogistique: number;
  fraisGenerauxNotes: number;
  autresSorties: number;
  pertesStock: number;
  gainsInventaire: number;
  quantitePertesStock: number;
  totalOpex: number;
  dotationAmortissement: number;
  resultatExploitation: number;
  chargesFinancieres: number;
  resultatNet: number;
  margeNettePct: number;
}

export interface FilteredPnlData {
  ventes: any[];
  mouvements: any[];
  frais: any[];
  debutStr: string;
  finStr: string;
}
