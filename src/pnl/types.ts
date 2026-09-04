import { Product } from '../stock/types';
import { Vente } from '../ventes/types';
import { Commande } from '../achat/types';
import { Mouvement } from '../Tresorerie/types';
import { NoteDeFrais } from '../frais/NotesDeFrais';
import { Immobilisation } from '../immobilisations/types';

export type Frais = NoteDeFrais;

export type PnlPeriode = 'month' | 'quarter' | 'year' | 'all' | 'custom';

export interface ProfitLossProps {
  products?: Product[];
  ventes?: Vente[];
  commandes?: Commande[];
  mouvements?: Mouvement[];
  frais?: NoteDeFrais[];
  updateData?: (patch: any) => void;
  comptes?: string[];
  immobilisations?: Immobilisation[];
  devises?: { rmb: number; usd: number };
}

export interface PnlData {
  chiffreAffaires: number;
  costMarchandises: number;
  costArticlesSeuls: number;
  fraisTransportChineMarchandises: number;
  fretMarchandises: number;
  transportLocalMarchandises?: number;
  cogs: number;
  margeBrute: number;
  margeBrutePct: number;
  loyerEtCharges: number;
  marketingEtPub: number;
  deplacementsEtTransport?: number;
  fretEtLogistique: number;
  fraisGenerauxNotes: number;
  autresSorties: number;
  pertesStock: number;
  gainsInventaire: number;
  quantitePertesStock: number;
  detailsPertes?: Array<{
    id: string;
    productNom: string;
    delta: number;
    motif: string;
    date: string;
    valTotale: number;
  }>;
  totalOpex: number;
  dotationAmortissement: number;
  resultatExploitation: number;
  chargesFinancieres: number;
  resultatNet: number;
  margeNettePct: number;
}

export interface FilteredPnlData {
  ventes: Vente[];
  mouvements: Mouvement[];
  frais: NoteDeFrais[];
  debutStr: string;
  finStr: string;
}
