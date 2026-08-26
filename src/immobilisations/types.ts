export interface Immobilisation {
  id: string;
  nom: string;
  categorie: string;
  valeurOrigine: number;
  dateAchat: string;
  dureeAmortissement: number; // en années
  notes?: string;
}

export interface AmortissementMensuelRow {
  annee: number;
  mois: number;
  labelMois: string;
  dotation: number;
  cumul: number;
  vnc: number;
}

export interface AmortissementRow {
  annee: number;
  baseCalcul: number;
  annuite: number;
  cumul: number;
  vnc: number;
  nbMois?: number;
  nbJours?: number;
}

export interface ImmoCalculatedDetail extends Immobilisation {
  planAnnuel: AmortissementRow[];
  totalMois: number;
  moisEcoules: number;
  dotationMensuelle: number;
  dotationMois: number;
  dotationAnnee: number;
  cumulMois: number;
  vncMois: number;
  etat: string;
}

export interface ImmoKpis {
  bruteTotale: number;
  dotationMoisTotale: number;
  dotationAnneeTotale: number;
  cumulTotale: number;
  vncTotale: number;
}

export interface ImmobilisationsProps {
  immobilisations?: Immobilisation[];
  mouvements?: any[];
  devises?: { rmb: number; usd: number };
  updateData: (patch: any) => void;
  comptes?: string[];
}

