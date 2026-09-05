export interface ArticleAnalysisItem {
  id: string;
  nom: string;
  reference?: string;
  categorie: string;
  couleur?: string;
  image?: string;
  // Achats
  nbCommandesAchat: number;
  qtyAchetee: number;
  totalDepenseAchatAr: number;
  totalDepenseAchatRmb: number;
  prixAchatUnitaireMoyenAr: number;
  fraisChineUnitaireMoyenAr: number;
  fretUnitaireMoyenAr: number;
  coutRevientUnitaireAr: number;
  // Ventes
  nbVentes: number;
  qtyVendue: number;
  caTotalAr: number;
  prixVenteUnitaireMoyenAr: number;
  // Marge & Rentabilité
  cogsAr: number;
  margeBruteAr: number;
  tauxMargePct: number;
  tauxMarquePct: number;
  coefficientMultiplicateur: number;
  // Stock & Écoulement
  stockActuel: number;
  tauxEcoulementPct: number;
  valeurStockCoutAr: number;
  margePotentielleStockAr: number;
  // Statut & Tags
  statutRentabilite: 'excellente' | 'bonne' | 'moyenne' | 'faible' | 'negative' | 'sans_vente';
  sourcesUtilisees: { source: string; qty: number; montantAr: number }[];
}

export interface SourceAnalysisItem {
  source: string;
  nbCommandes: number;
  partNbCommandesPct: number;
  montantTotalAr: number;
  montantTotalRmb: number;
  partBudgetPct: number;
  panierMoyenAr: number;
  qtyTotalePieces: number;
  coutMoyenParPieceAr: number;
  statutsBreakdown: Record<string, number>;
  nbArticlesDifferents: number;
  articlesTop: { id: string; nom: string; qty: number; montantAr: number }[];
  // Performance aval (ventes et marges des produits achetés sur cette source)
  caVentesGeneresAr: number;
  cogsVentesGeneresAr: number;
  margeBruteGeneresAr: number;
  tauxMargeMoyenPct: number;
}

export interface AnalysisGlobalKpis {
  totalAchatsAr: number;
  totalAchatsRmb: number;
  totalCommandesAchat: number;
  totalVentesAr: number;
  totalPiecesVendues: number;
  totalCogsAr: number;
  margeBruteTotaleAr: number;
  tauxMargeMoyenPct: number;
  tauxEcoulementGlobalPct: number;
  sourceTopBudget: { source: string; montantAr: number; pct: number } | null;
  sourceTopVolume: { source: string; nbCommandes: number; pct: number } | null;
  articleTopMarge: { id: string; nom: string; margeAr: number } | null;
  articleTopCA: { id: string; nom: string; caAr: number } | null;
}

export type PeriodeFiltre = 'all' | '30j' | 'month' | 'quarter' | 'year' | 'custom';
