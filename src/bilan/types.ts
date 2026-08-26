export interface BilanProps {
  products?: any[];
  ventes?: any[];
  commandes?: any[];
  mouvements?: any[];
  immobilisations?: any[];
  emprunts?: any[];
  comptes?: string[];
  devises?: { rmb: number; usd: number };
}

export interface BilanData {
  totalImmoBrut: number;
  totalImmoAmortissement: number;
  totalImmoNet: number;
  valeurStockTotal: number;
  totalCreancesClients: number;
  totalDisponibilites: number;
  balancesComptes: Record<string, number>;
  totalActifCirculant: number;
  totalActif: number;
  totalDettesFinancieres: number;
  totalDettesFournisseurs: number;
  totalPassifExigible: number;
  capitalSocialEquilibre: number;
  resultatNetCumule: number;
  totalCapitauxPropres: number;
  totalPassif: number;
}
