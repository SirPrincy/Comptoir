/**
 * Constantes métiers et référentiels de Comptoir ERP
 */

import { Zap, Package, LayoutDashboard, ShoppingCart, Truck, Wallet, Factory, Users, Compass, ArrowLeftRight, Calculator, Landmark, TrendingUp, Scale, FileText, Target, Building2, FileSpreadsheet, Grid, Settings } from 'lucide-react';

export const CATEGORIES_FRAIS = [
  'Déplacements & Transport',
  'Repas & Réception',
  'Fournitures & Bureau',
  'Loyer & Charges locatives',
  'Marketing & Publicité',
  'Services & Honoraires',
  'Divers & Autres',
];

export const CATEGORIES = ['Sacs à main', 'Accessoires tech', 'Outils', 'Autre'];
export const SOURCES = ['1688', 'Taobao', 'Pinduoduo', 'Xianyu', 'Transitaire / Fret', 'Exchanger / Agent de change', 'Acheteur', 'Autre'];
export const STATUTS_ACHAT = ['Commandé', 'Payé'];
export const STATUTS_LOGISTIQUE = ['En livraison', 'En entrepôt', 'En expédition', 'Arrivé'];
export const STATUTS = [...STATUTS_ACHAT, ...STATUTS_LOGISTIQUE];
export const STATUTS_SOURCING = ['À explorer', 'En cours', 'Validé', 'Abandonné'];

export const TYPES_ENVOI_MARITIME = ['Normal', 'Batterie'];
export const TYPES_ENVOI_AERIEN = ['Normal', 'Fragile', 'Batterie', 'Téléphone'];

export const COMPTES_FINANCIERS = [
  'Caisse / Espèces',
  'MVola',
  'Orange Money',
  'Airtel Money',
  'Compte Bancaire',
  'Compte Investisseur',
  'Réserve RMB (¥)',
];

export const TAGS_TRANSACTION = [
  '#investissement',
  '#capital',
  '#emprunt',
  '#remboursement',
  '#fond-roulement',
  '#stock-chine',
  '#fret-logistique',
  '#marketing-pub',
  '#materiel',
  '#loyer-charges',
  '#retrait-perso',
];

export const STATUT_DATE_FIELD: Record<string, string> = {
  'En livraison': 'dateEnLivraison',
  'En entrepôt': 'dateEnEntrepot',
  'En expédition': 'dateEnExpedition',
  'Arrivé': 'dateArrivee',
};

export const SECTIONS = [
  // Groupe 1 : Pilotage & Finance
  { id: 'dashboard', label: 'Tableau de bord', group: 'Pilotage & Finance', icon: LayoutDashboard },
  { id: 'tresorerie', label: 'Trésorerie & Devises', group: 'Pilotage & Finance', icon: Wallet },
  { id: 'finances-structurelles', label: 'Finances structurelles', group: 'Pilotage & Finance', icon: Building2 },
  { id: 'etats-financiers', label: 'États financiers', group: 'Pilotage & Finance', icon: FileSpreadsheet },

  // Groupe 2 : Activité & Logistique
  { id: 'vente', label: 'Vente rapide', group: 'Activité & Logistique', icon: Zap },
  { id: 'stock', label: 'Gestion des stocks', group: 'Activité & Logistique', icon: Package },
  { id: 'achat', label: 'Commandes & Achats', group: 'Activité & Logistique', icon: ShoppingCart },
  { id: 'logistique', label: 'Suivi Logistique', group: 'Activité & Logistique', icon: Truck },

  // Groupe 3 : Sourcing & Partenaires
  { id: 'partenaires', label: 'Fournisseurs & Clients', group: 'Sourcing & Partenaires', icon: Users },
  { id: 'sourcing', label: 'Sourcing produits', group: 'Sourcing & Partenaires', icon: Compass },

  // Groupe 4 : Système & Configuration
  { id: 'systeme', label: 'Système & Outils', group: 'Système & Configuration', icon: Settings },
];

export const uid = () => Math.random().toString(36).slice(2, 10);
