/**
 * Configuration des widgets et indicateurs du Dashboard
 * Permet la personnalisation des indicateurs financiers et logistiques
 */

export interface DashboardWidgetConfig {
  preset: 'all' | 'finance' | 'logistique' | 'synthese' | 'custom';
  kpis: {
    // Indicateurs Financiers
    ca: boolean;
    marge: boolean;
    benefice: boolean;
    roi: boolean;
    capital: boolean;
    tresorerie: boolean;
    reserve_rmb: boolean;
    creances: boolean;
    dettes: boolean;
    charges: boolean;
    pertes_stock: boolean;
    // Indicateurs Logistiques & Stock
    transit: boolean;
    stock_valeur: boolean;
    stock_alerte: boolean;
    articles_vendus: boolean;
    panier_moyen: boolean;
  };
  widgets: {
    investment_roi: boolean;
    alertes_urgentes: boolean;
    rentabilite_produits: boolean;
    top_produits: boolean;
    repartition_categories: boolean;
  };
}

export type DashboardKpisConfig = DashboardWidgetConfig['kpis'];
export type DashboardWidgetsConfig = DashboardWidgetConfig['widgets'];

export interface KpiMeta {
  id: keyof DashboardWidgetConfig['kpis'];
  label: string;
  category: 'finance' | 'logistique';
  description: string;
  defaultOn: boolean;
}

export interface WidgetMeta {
  id: keyof DashboardWidgetConfig['widgets'];
  label: string;
  category: 'analyse' | 'graphique' | 'alerte';
  description: string;
  defaultOn: boolean;
}

export const KPI_DEFINITIONS: KpiMeta[] = [
  // Finance
  {
    id: 'ca',
    label: "Chiffre d'affaires",
    category: 'finance',
    description: 'CA total encaissé sur les ventes',
    defaultOn: true,
  },
  {
    id: 'marge',
    label: 'Marge brute réelle',
    category: 'finance',
    description: 'Marge commerciale sur prix de revient réel (achat + fret)',
    defaultOn: true,
  },
  {
    id: 'benefice',
    label: 'Bénéfice Net',
    category: 'finance',
    description: 'Marge brute moins les charges opérationnelles',
    defaultOn: true,
  },
  {
    id: 'roi',
    label: 'ROI estimé (%)',
    category: 'finance',
    description: 'Rendement net sur le capital investi',
    defaultOn: true,
  },
  {
    id: 'capital',
    label: 'Capital investi',
    category: 'finance',
    description: 'Total des apports et investissements initiaux',
    defaultOn: true,
  },
  {
    id: 'tresorerie',
    label: 'Trésorerie disponible',
    category: 'finance',
    description: 'Solde net en Ariary sur tous les comptes financiers',
    defaultOn: false,
  },
  {
    id: 'reserve_rmb',
    label: 'Réserve RMB (¥)',
    category: 'finance',
    description: 'Solde disponible en Yuans chinois pour les achats',
    defaultOn: false,
  },
  {
    id: 'creances',
    label: 'Créances clients',
    category: 'finance',
    description: 'Total des impayés et restes à recouvrer sur ventes',
    defaultOn: false,
  },
  {
    id: 'dettes',
    label: 'Dettes fournisseurs',
    category: 'finance',
    description: 'Restes à payer sur commandes marchandises et fret',
    defaultOn: false,
  },
  {
    id: 'charges',
    label: 'Charges opérationnelles',
    category: 'finance',
    description: 'Dépenses courantes hors achat de marchandises',
    defaultOn: false,
  },
  {
    id: 'pertes_stock',
    label: 'Pertes & Casse de Stock',
    category: 'finance',
    description: 'Valorisation des pertes, casse, vols et écarts de stock',
    defaultOn: true,
  },

  // Logistique & Stock
  {
    id: 'transit',
    label: 'Colis en transit',
    category: 'logistique',
    description: 'Commandes expédiées en mer, vol ou douane',
    defaultOn: true,
  },
  {
    id: 'stock_valeur',
    label: 'Valeur du stock local',
    category: 'logistique',
    description: 'Valorisation marchande du stock disponible à Madagascar',
    defaultOn: true,
  },
  {
    id: 'stock_alerte',
    label: 'Alertes stock bas / rupture',
    category: 'logistique',
    description: 'Articles épuisés ou sous le seuil critique de réappro',
    defaultOn: true,
  },
  {
    id: 'articles_vendus',
    label: 'Articles vendus',
    category: 'logistique',
    description: 'Nombre total de pièces vendues sur la période',
    defaultOn: false,
  },
  {
    id: 'panier_moyen',
    label: 'Panier moyen',
    category: 'logistique',
    description: 'Montant moyen généré par commande/vente',
    defaultOn: false,
  },
];

export const WIDGET_DEFINITIONS: WidgetMeta[] = [
  {
    id: 'investment_roi',
    label: "Analyse d'Investissement & Point Mort",
    category: 'analyse',
    description: 'Suivi du seuil de rentabilité et récupération du capital',
    defaultOn: true,
  },
  {
    id: 'alertes_urgentes',
    label: 'Alertes & Priorités Opérationnelles',
    category: 'alerte',
    description: 'Ruptures de stock critiques et colis en transit',
    defaultOn: true,
  },
  {
    id: 'rentabilite_produits',
    label: 'Tableau Rentabilité Détaillée par Produit',
    category: 'analyse',
    description: 'Prix moyen achat, vente, marge unitaire et bénéfice par article',
    defaultOn: true,
  },
  {
    id: 'top_produits',
    label: "Top Produits par Chiffre d'Affaires",
    category: 'graphique',
    description: 'Histogramme des produits les plus performants en CA',
    defaultOn: true,
  },
  {
    id: 'repartition_categories',
    label: 'Répartition des Ventes par Catégorie',
    category: 'graphique',
    description: 'Camembert analytique des ventes par catégorie d’article',
    defaultOn: true,
  },
];

export const DEFAULT_DASHBOARD_CONFIG: DashboardWidgetConfig = {
  preset: 'all',
  kpis: {
    ca: true,
    marge: true,
    benefice: true,
    roi: true,
    capital: true,
    tresorerie: true,
    reserve_rmb: false,
    creances: false,
    dettes: false,
    charges: false,
    pertes_stock: true,
    transit: true,
    stock_valeur: true,
    stock_alerte: true,
    articles_vendus: false,
    panier_moyen: false,
  },
  widgets: {
    investment_roi: true,
    alertes_urgentes: true,
    rentabilite_produits: true,
    top_produits: true,
    repartition_categories: true,
  },
};

export const PRESET_CONFIGS: Record<'all' | 'finance' | 'logistique' | 'synthese', DashboardWidgetConfig> = {
  all: {
    preset: 'all',
    kpis: {
      ca: true,
      marge: true,
      benefice: true,
      roi: true,
      capital: true,
      tresorerie: true,
      reserve_rmb: true,
      creances: true,
      dettes: true,
      charges: true,
      pertes_stock: true,
      transit: true,
      stock_valeur: true,
      stock_alerte: true,
      articles_vendus: true,
      panier_moyen: true,
    },
    widgets: {
      investment_roi: true,
      alertes_urgentes: true,
      rentabilite_produits: true,
      top_produits: true,
      repartition_categories: true,
    },
  },
  finance: {
    preset: 'finance',
    kpis: {
      ca: true,
      marge: true,
      benefice: true,
      roi: true,
      capital: true,
      tresorerie: true,
      reserve_rmb: true,
      creances: true,
      dettes: true,
      charges: true,
      pertes_stock: true,
      transit: false,
      stock_valeur: false,
      stock_alerte: false,
      articles_vendus: false,
      panier_moyen: true,
    },
    widgets: {
      investment_roi: true,
      alertes_urgentes: false,
      rentabilite_produits: true,
      top_produits: true,
      repartition_categories: true,
    },
  },
  logistique: {
    preset: 'logistique',
    kpis: {
      ca: true,
      marge: false,
      benefice: false,
      roi: false,
      capital: false,
      tresorerie: false,
      reserve_rmb: false,
      creances: false,
      dettes: true,
      charges: false,
      pertes_stock: true,
      transit: true,
      stock_valeur: true,
      stock_alerte: true,
      articles_vendus: true,
      panier_moyen: false,
    },
    widgets: {
      investment_roi: false,
      alertes_urgentes: true,
      rentabilite_produits: true,
      top_produits: true,
      repartition_categories: true,
    },
  },
  synthese: {
    preset: 'synthese',
    kpis: {
      ca: true,
      marge: true,
      benefice: true,
      roi: true,
      capital: false,
      tresorerie: true,
      reserve_rmb: false,
      creances: false,
      dettes: false,
      charges: false,
      pertes_stock: true,
      transit: true,
      stock_valeur: true,
      stock_alerte: true,
      articles_vendus: false,
      panier_moyen: false,
    },
    widgets: {
      investment_roi: true,
      alertes_urgentes: true,
      rentabilite_produits: true,
      top_produits: true,
      repartition_categories: true,
    },
  },
};

const STORAGE_KEY = 'comptoir_dashboard_widgets_v1';

export function loadDashboardConfig(): DashboardWidgetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      preset: parsed.preset || 'custom',
      kpis: { ...DEFAULT_DASHBOARD_CONFIG.kpis, ...(parsed.kpis || {}) },
      widgets: { ...DEFAULT_DASHBOARD_CONFIG.widgets, ...(parsed.widgets || {}) },
    };
  } catch (_) {
    return DEFAULT_DASHBOARD_CONFIG;
  }
}

export function saveDashboardConfig(config: DashboardWidgetConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (_) {}
}
