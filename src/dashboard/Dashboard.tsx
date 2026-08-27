/**
 * Composant Tableau de Bord (Dashboard)
 * Vue analytique personnalisable des indicateurs financiers et logistiques
 */

import React, { useState, useMemo, memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Zap,
  Ship,
  Percent,
  Wallet,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PiggyBank,
  ArrowUpRight,
  Receipt,
  Package,
  Award,
  ArrowUpDown,
  Search,
  Activity,
  ShieldCheck,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Boxes,
  CreditCard,
  Coins,
  ShoppingCart,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { THEME, CHART_COLORS as COLORS } from '../colors';
import { STATUTS_LOGISTIQUE } from '../constants';
import { Card, cardTitle, Stat, Empty, tooltipStyle, inputStyle, selectStyle, ghostBtn, primaryBtn } from '../ui';
import { calculerSoldeRMB } from '../paymentUtils';
import {
  DashboardWidgetConfig,
  loadDashboardConfig,
  saveDashboardConfig,
  PRESET_CONFIGS,
  DEFAULT_DASHBOARD_CONFIG,
} from './dashboardConfig';
import DashboardCustomizerModal from './DashboardCustomizerModal';

interface DashboardProps {
  products: any[];
  ventes: any[];
  commandes: any[];
  mouvements?: any[];
  sourcing?: any[];
  changes?: any[];
  immobilisations?: any[];
  emprunts?: any[];
  fournisseurs?: any[];
  clients?: any[];
  paiements?: any[];
  devises?: any;
  chargesFixes?: any[];
  comptes?: string[];
  onNavigateTab?: (tab: string) => void;
}

const Dashboard = memo(function Dashboard({
  products = [],
  ventes = [],
  commandes = [],
  mouvements = [],
  sourcing = [],
  changes = [],
  immobilisations = [],
  emprunts = [],
  fournisseurs = [],
  clients = [],
  paiements = [],
  devises = { rmb: 680, usd: 4600 },
  chargesFixes = [],
  comptes = [],
  onNavigateTab,
}: DashboardProps) {
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [sortBy, setSortBy] = useState<'benefice' | 'margePct' | 'nom' | 'ca'>('benefice');
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Configuration des widgets et indicateurs persistée dans le navigateur
  const [config, setConfig] = useState<DashboardWidgetConfig>(() => loadDashboardConfig());

  const handleSaveConfig = (newConfig: DashboardWidgetConfig) => {
    setConfig(newConfig);
    saveDashboardConfig(newConfig);
  };

  const handleApplyPreset = (presetKey: 'all' | 'finance' | 'logistique' | 'synthese') => {
    const preset = PRESET_CONFIGS[presetKey];
    const newConfig: DashboardWidgetConfig = {
      preset: presetKey,
      kpis: { ...preset.kpis },
      widgets: { ...preset.widgets },
    };
    setConfig(newConfig);
    saveDashboardConfig(newConfig);
  };

  // Helper pour trouver le coût unitaire réel d'un produit (achat + livraison Chine + fret + transport local)
  const getProductCostBreakdown = (productId: string) => {
    const productCmds = commandes.filter(
      (c: any) => c.productId === productId && (
        (c.pu && Number(c.pu) > 0) || (c.total && Number(c.total) > 0) || (c.qty && Number(c.qty) > 0)
      )
    );

    if (productCmds.length > 0) {
      let totalLandedCost = 0;
      let totalQty = 0;
      productCmds.forEach((c: any) => {
        const qty = Math.max(1, Number(c.qty) || 1);
        const pu = Number(c.pu) || 0;
        const fraisChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
        const totalMarchandise = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
          ? Number(c.total)
          : ((pu * qty) + fraisChine);
        const fret = Number(c.fraisTransport || c.fretEstimeAr) || 0;
        const transportLocal = Number(c.fraisTransportLocal) || 0;

        totalLandedCost += (totalMarchandise + fret + transportLocal);
        totalQty += qty;
      });
      const coutRevient = totalQty > 0 ? totalLandedCost / totalQty : 0;
      return { coutRevient };
    } else {
      const p = products.find((pr: any) => pr.id === productId);
      const coutRevient = Number(p?.prixAchat) || 0;
      return { coutRevient };
    }
  };

  // 1. Chiffre d'Affaires Encaissé
  const caTotal = useMemo(() => {
    return ventes.reduce((s: number, v: any) => s + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0), 0);
  }, [ventes]);

  // 2. Marge Commerciale Réelle des ventes
  const margeTotale = useMemo(() => {
    return ventes.reduce((s: number, v: any) => {
      const p = products.find((pr: any) => pr.id === v.productId);
      const puVente = v.pu ?? (p?.prixVente || (v.total && v.qty ? v.total / v.qty : 0));
      const { coutRevient } = getProductCostBreakdown(v.productId);
      return s + (Number(puVente) - Number(coutRevient)) * (Number(v.qty) || 1);
    }, 0);
  }, [ventes, products, commandes]);

  // 3. Capital Investi
  const capitalInvesti = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'entrée' && (m.isInvestissement || m.tag === '#investissement' || m.tag === '#capital' || m.tag === '#fond-roulement'))
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  // 4. Sorties Achats Chine & Fret
  const totalAchatsChine = useMemo(() => {
    return commandes.reduce((s: number, c: any) => {
      const qty = Math.max(1, Number(c.qty) || 1);
      const pu = Number(c.pu) || 0;
      const fraisChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
      const coutAchat = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
        ? Number(c.total)
        : ((pu * qty) + fraisChine);
      return s + coutAchat;
    }, 0);
  }, [commandes]);

  const totalFret = useMemo(() => {
    return commandes.reduce((s: number, c: any) => {
      const fret = Number(c.fraisTransport || c.fretEstimeAr) || 0;
      const transportLocal = Number(c.fraisTransportLocal) || 0;
      return s + fret + transportLocal;
    }, 0);
  }, [commandes]);

  // 5. Charges opérationnelles
  const chargesOperationnelles = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'sortie' && !m.isTransfert && m.tag !== '#stock-chine' && m.tag !== '#fret-logistique')
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  // 5b. Pertes & Régularisations de Stock
  const ajustementsStock = useMemo(() => {
    return (mouvements || []).filter((m: any) => m && m.type === 'Ajustement Stock');
  }, [mouvements]);

  const statsPertes = useMemo(() => {
    let totalPertesAr = 0;
    let totalGainsInventaireAr = 0;
    let quantitePerdue = 0;
    let quantiteAjoutee = 0;

    ajustementsStock.forEach((m: any) => {
      if (!m) return;
      const delta = Number(m.delta) || 0;
      const costData = getProductCostBreakdown(m.productId);
      const coutRevient = (costData && Number(costData.coutRevient)) || 0;
      const valTotale = m.valeurTotaleAr !== undefined && m.valeurTotaleAr !== null && Number(m.valeurTotaleAr) > 0
        ? Number(m.valeurTotaleAr)
        : (Math.abs(delta) * (Number(m.valeurUnitaireAr) || coutRevient || 0));

      if (delta < 0) {
        totalPertesAr += valTotale;
        quantitePerdue += Math.abs(delta);
      } else if (delta > 0) {
        totalGainsInventaireAr += valTotale;
        quantiteAjoutee += delta;
      }
    });

    return {
      totalPertesAr: Math.round(totalPertesAr || 0),
      totalGainsInventaireAr: Math.round(totalGainsInventaireAr || 0),
      quantitePerdue: quantitePerdue || 0,
      quantiteAjoutee: quantiteAjoutee || 0,
      ajustements: [...ajustementsStock].sort((a, b) => {
        const timeA = a && a.date ? new Date(a.date).getTime() : 0;
        const timeB = b && b.date ? new Date(b.date).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      }),
    };
  }, [ajustementsStock, products, commandes]);

  // 6. Dépenses d'exploitation globales
  const totalDepensesGlobales = totalAchatsChine + totalFret + chargesOperationnelles + statsPertes.totalPertesAr;

  // 7. Bénéfice Net Réalisé (Marge brute - charges opérationnelles - pertes stock + gains inventaire)
  const beneficeNet = margeTotale - chargesOperationnelles - statsPertes.totalPertesAr + statsPertes.totalGainsInventaireAr;

  // 8. Base de calcul de l'investissement
  const baseInvestissement = capitalInvesti > 0 ? capitalInvesti : totalDepensesGlobales;

  // 9. ROI (%) & Taux de Récupération du Capital
  const tauxRoi = baseInvestissement > 0 ? (beneficeNet / baseInvestissement) * 100 : 0;
  const tauxRecuperation = baseInvestissement > 0 ? Math.min(100, Math.max(0, (caTotal / baseInvestissement) * 100)) : 0;
  const resteARecuperer = Math.max(0, baseInvestissement - caTotal);

  // 10. Trésorerie Disponible Totale (Solde MGA)
  const tresorerieDispo = useMemo(() => {
    const entrees = mouvements.filter((m: any) => m.type === 'entrée' && !m.isTransfert).reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
    const sorties = mouvements.filter((m: any) => m.type === 'sortie' && !m.isTransfert).reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
    return entrees - sorties;
  }, [mouvements]);

  // 11. Réserve RMB (¥)
  const soldeRmbInfo = useMemo(() => {
    return calculerSoldeRMB(changes, mouvements, commandes, devises, paiements);
  }, [changes, mouvements, commandes, devises, paiements]);

  // 12. Créances Clients (Impayés / Restes à encaisser)
  const creancesClients = useMemo(() => {
    return ventes.reduce((s: number, v: any) => {
      const tot = Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0;
      const paye = Number(v.paye !== undefined ? v.paye : (v.statutPaiement === 'Payé' ? tot : (v.statutPaiement === 'Partiel' ? (v.montantPaye || 0) : 0)));
      return s + Math.max(0, tot - paye);
    }, 0);
  }, [ventes]);

  // 13. Dettes Fournisseurs (Restes à payer marchandises + fret)
  const dettesFournisseurs = useMemo(() => {
    return commandes.reduce((s: number, c: any) => {
      const tot = Number(c.total) || ((Number(c.pu) || 0) * (Number(c.qty) || 1) + (Number(c.fraisLivraisonChine || c.fraisLivraison) || 0));
      const paye = Number(c.montantPayeMarchandise || (c.statutPaiementMarchandise === 'Payé' ? tot : 0));
      const fretTot = Number(c.fraisTransport || c.fretEstimeAr || 0);
      const fretPaye = Number(c.montantPayeTransport || (c.statutPaiementTransport === 'Payé' ? fretTot : 0));
      return s + Math.max(0, tot - paye) + Math.max(0, fretTot - fretPaye);
    }, 0);
  }, [commandes]);

  // 14. Indicateurs Logistiques & Stock
  const enTransit = useMemo(() => {
    return commandes.filter(
      (c: any) => STATUTS_LOGISTIQUE.includes(c.statut) && c.statut !== 'Arrivé'
    ).length;
  }, [commandes]);

  const commandesEnTransitList = useMemo(() => {
    return commandes.filter((c: any) => STATUTS_LOGISTIQUE.includes(c.statut) && c.statut !== 'Arrivé');
  }, [commandes]);

  const valeurStockLocal = useMemo(() => {
    return products.reduce((s: number, p: any) => {
      const stock = Number(p.stock) || 0;
      if (stock <= 0) return s;
      const { coutRevient } = getProductCostBreakdown(p.id);
      return s + (stock * coutRevient);
    }, 0);
  }, [products, commandes]);

  const stockAlertesList = useMemo(() => {
    return products.filter((p: any) => {
      const stock = Number(p.stock) || 0;
      const seuil = Number(p.seuilAlerte) || 2;
      return stock <= seuil;
    });
  }, [products]);

  const articlesVendusTotal = useMemo(() => {
    return ventes.reduce((s: number, v: any) => s + (Number(v.qty) || 1), 0);
  }, [ventes]);

  const panierMoyen = useMemo(() => {
    return ventes.length > 0 ? Math.round(caTotal / ventes.length) : 0;
  }, [ventes, caTotal]);

  // Répartition par catégorie
  const parCategorie = useMemo(() => {
    const map: Record<string, number> = {};
    ventes.forEach((v: any) => {
      const p = products.find((pr: any) => pr.id === v.productId);
      if (!p) return;
      const cat = p.categorie || 'Autre';
      map[cat] = (map[cat] || 0) + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ventes, products]);

  // Top produits par CA
  const parProduit = useMemo(() => {
    const map: Record<string, number> = {};
    ventes.forEach((v: any) => {
      const p = products.find((pr: any) => pr.id === v.productId);
      if (!p) return;
      const key = p.nom + (p.couleur ? ` (${p.couleur})` : '');
      const tot = Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0;
      map[key] = (map[key] || 0) + tot;
    });
    return Object.entries(map)
      .map(([name, ca]) => ({ name, ca }))
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 6);
  }, [ventes, products]);

  // Rentabilité Détaillée par Produit
  const rentabiliteParProduit = useMemo(() => {
    return products.map((p: any) => {
      const pCmds = commandes.filter((c: any) => c.productId === p.id);
      const qtyAchetee = pCmds.reduce((s: number, c: any) => s + (Number(c.qty) || 0), 0);
      const totalAchatsEtFret = pCmds.reduce((s: number, c: any) => {
        const qty = Number(c.qty) || 1;
        const pu = Number(c.pu) || 0;
        const fraisLivraisonChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
        const totalMarchandise = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
          ? Number(c.total)
          : ((pu * qty) + fraisLivraisonChine);
        const fretTransitaire = Number(c.fraisTransport || c.fretEstimeAr) || 0;
        const transportLocal = Number(c.fraisTransportLocal) || 0;
        return s + totalMarchandise + fretTransitaire + transportLocal;
      }, 0);

      const prixMoyenAchat = qtyAchetee > 0 ? totalAchatsEtFret / qtyAchetee : (Number(p.prixAchat) || 0);

      const pVentes = ventes.filter((v: any) => v.productId === p.id);
      const qtyVendue = pVentes.reduce((s: number, v: any) => s + (Number(v.qty) || 0), 0);
      const caTotalProduit = pVentes.reduce((s: number, v: any) => {
        const pu = v.pu ?? (p.prixVente || (v.total && v.qty ? v.total / v.qty : 0));
        return s + (Number(pu) * Number(v.qty || 1));
      }, 0);

      const prixMoyenVente = qtyVendue > 0 ? caTotalProduit / qtyVendue : (Number(p.prixVente) || 0);

      const margeUnitaire = prixMoyenVente - prixMoyenAchat;
      const tauxMargePct = prixMoyenAchat > 0 ? (margeUnitaire / prixMoyenAchat) * 100 : 0;

      // Pertes & dépréciations subies par ce produit
      const pAjustements = ajustementsStock.filter((m: any) => m.productId === p.id || m.productNom === p.nom);
      let pertesProduitAr = 0;
      let pertesProduitQty = 0;
      pAjustements.forEach((m: any) => {
        const delta = Number(m.delta) || 0;
        if (delta < 0) {
          pertesProduitQty += Math.abs(delta);
          const val = m.valeurTotaleAr !== undefined && m.valeurTotaleAr !== null && Number(m.valeurTotaleAr) > 0
            ? Number(m.valeurTotaleAr)
            : (Math.abs(delta) * (Number(m.valeurUnitaireAr) || prixMoyenAchat || 0));
          pertesProduitAr += val;
        }
      });

      const beneficeTotal = Math.round((margeUnitaire * qtyVendue) - pertesProduitAr);

      return {
        id: p.id,
        nom: p.nom,
        couleur: p.couleur,
        categorie: p.categorie || 'Autre',
        qtyAchetee,
        qtyVendue,
        pertesProduitQty,
        pertesProduitAr: Math.round(pertesProduitAr),
        prixMoyenAchat: Math.round(prixMoyenAchat),
        prixMoyenVente: Math.round(prixMoyenVente),
        margeUnitaire: Math.round(margeUnitaire),
        tauxMargePct: Number(tauxMargePct.toFixed(1)),
        beneficeTotal,
        caTotalProduit: Math.round(caTotalProduit),
      };
    });
  }, [products, commandes, ventes, ajustementsStock]);

  // Filtrage et Tri des produits pour la rentabilité
  const produitsFitresEtTries = useMemo(() => {
    return rentabiliteParProduit
      .filter((p) => {
        if (!rechercheProduit.trim()) return true;
        const q = rechercheProduit.toLowerCase();
        return (
          p.nom.toLowerCase().includes(q) ||
          (p.couleur && p.couleur.toLowerCase().includes(q)) ||
          p.categorie.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'margePct') return b.tauxMargePct - a.tauxMargePct;
        if (sortBy === 'ca') return b.caTotalProduit - a.caTotalProduit;
        if (sortBy === 'nom') return a.nom.localeCompare(b.nom);
        return b.beneficeTotal - a.beneficeTotal;
      });
  }, [rentabiliteParProduit, rechercheProduit, sortBy]);

  // Insights clés sur la rentabilité
  const topRentabilitePct = useMemo(() => {
    const list = rentabiliteParProduit.filter((p) => p.prixMoyenAchat > 0 && (p.qtyVendue > 0 || p.prixMoyenVente > 0));
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.tauxMargePct - a.tauxMargePct)[0];
  }, [rentabiliteParProduit]);

  const topBeneficeTotal = useMemo(() => {
    const list = rentabiliteParProduit.filter((p) => p.qtyVendue > 0 && p.beneficeTotal > 0);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.beneficeTotal - a.beneficeTotal)[0];
  }, [rentabiliteParProduit]);

  const hasAnyData = ventes.length > 0 || commandes.length > 0 || mouvements.length > 0 || products.length > 0;

  if (!hasAnyData) {
    return <Empty text="Enregistrez des ventes, commandes ou investissements pour générer vos analyses de rentabilité." />;
  }

  const k = config.kpis;
  const w = config.widgets;

  // Calcul du nombre de KPIs et Widgets visibles
  const activeKpisCount = Object.values(k).filter(Boolean).length;
  const activeWidgetsCount = Object.values(w).filter(Boolean).length;

  const presetLabels: Record<string, string> = {
    all: '🌟 Vue Complète',
    finance: '💰 Focus Finance',
    logistique: '🚢 Focus Logistique',
    synthese: '⚡ Vue Synthèse',
    custom: '⚙️ Affichage Personnalisé',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* BARRE DE CONTRÔLE ET PERSONNALISATION DES WIDGETS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: THEME.bg.card,
          border: `1px solid ${THEME.border.base}`,
          borderRadius: 12,
          padding: '10px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              background: THEME.bg.surface,
              color: THEME.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <TrendingUp size={16} color={THEME.accent.orange} />
            <span>Tableau de Bord</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 6,
                background: THEME.bg.soft,
                color: THEME.accent.primary,
                border: `1px solid ${THEME.border.base}`,
              }}
            >
              {presetLabels[config.preset] || '⚙️ Personnalisé'}
            </span>
          </div>

          {/* Raccourcis de filtres rapides */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleApplyPreset('all')}
              style={{
                padding: '5px 9px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: config.preset === 'all' ? 700 : 500,
                background: config.preset === 'all' ? THEME.bg.soft : 'transparent',
                color: config.preset === 'all' ? THEME.accent.primary : THEME.text.muted,
                border: `1px solid ${config.preset === 'all' ? THEME.accent.primary : THEME.border.base}`,
                cursor: 'pointer',
              }}
            >
              🌟 Tout
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('finance')}
              style={{
                padding: '5px 9px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: config.preset === 'finance' ? 700 : 500,
                background: config.preset === 'finance' ? THEME.bg.soft : 'transparent',
                color: config.preset === 'finance' ? THEME.accent.green : THEME.text.muted,
                border: `1px solid ${config.preset === 'finance' ? THEME.accent.green : THEME.border.base}`,
                cursor: 'pointer',
              }}
            >
              💰 Finance
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('logistique')}
              style={{
                padding: '5px 9px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: config.preset === 'logistique' ? 700 : 500,
                background: config.preset === 'logistique' ? THEME.bg.soft : 'transparent',
                color: config.preset === 'logistique' ? THEME.accent.primary : THEME.text.muted,
                border: `1px solid ${config.preset === 'logistique' ? THEME.accent.primary : THEME.border.base}`,
                cursor: 'pointer',
              }}
            >
              🚢 Logistique
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('synthese')}
              style={{
                padding: '5px 9px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: config.preset === 'synthese' ? 700 : 500,
                background: config.preset === 'synthese' ? THEME.bg.soft : 'transparent',
                color: config.preset === 'synthese' ? THEME.accent.orange : THEME.text.muted,
                border: `1px solid ${config.preset === 'synthese' ? THEME.accent.orange : THEME.border.base}`,
                cursor: 'pointer',
              }}
            >
              ⚡ Synthèse
            </button>
          </div>
        </div>

        {/* Bouton pour ouvrir la personnalisation */}
        <button
          type="button"
          onClick={() => setCustomizerOpen(true)}
          style={{
            ...primaryBtn,
            padding: '7px 14px',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: THEME.bg.surface,
            color: THEME.text.primary,
            border: `1px solid ${THEME.border.strong}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
          title="Choisir les widgets et indicateurs affichés en priorité"
        >
          <SlidersHorizontal size={14} color={THEME.accent.orange} />
          <span>Personnaliser l'affichage ({activeKpisCount} KPIs)</span>
        </button>
      </div>

      {/* GRILLE DES CHIFFRES CLÉS PERSONNALISABLES */}
      {activeKpisCount > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 10,
          }}
        >
          {/* Finance KPIs */}
          {k.ca && (
            <Stat
              label="Chiffre d'affaires"
              value={`${caTotal.toLocaleString('fr-FR')} Ar`}
              subvalue={`${ventes.length} vente(s) enregistrée(s)`}
              icon={TrendingUp}
              accent={THEME.accent.primary}
            />
          )}

          {k.marge && (
            <Stat
              label="Marge brute réelle"
              value={`${margeTotale.toLocaleString('fr-FR')} Ar`}
              subvalue={caTotal > 0 ? `${((margeTotale / caTotal) * 100).toFixed(1)}% du CA` : undefined}
              icon={TrendingUp}
              accent={THEME.accent.green}
            />
          )}

          {k.benefice && (
            <Stat
              label="Bénéfice Net"
              value={`${beneficeNet >= 0 ? '+' : ''}${beneficeNet.toLocaleString('fr-FR')} Ar`}
              subvalue="Marge nette d'exploitation"
              icon={DollarSign}
              accent={beneficeNet >= 0 ? THEME.accent.green : THEME.accent.danger}
            />
          )}

          {k.roi && (
            <Stat
              label="ROI estimé"
              value={`${tauxRoi >= 0 ? '+' : ''}${tauxRoi.toFixed(1)} %`}
              subvalue={`Récupération: ${tauxRecuperation.toFixed(0)}%`}
              icon={Percent}
              accent={tauxRoi >= 0 ? THEME.accent.green : THEME.accent.danger}
            />
          )}

          {k.capital && (
            <Stat
              label="Capital investi"
              value={`${baseInvestissement.toLocaleString('fr-FR')} Ar`}
              subvalue={capitalInvesti > 0 ? 'Apports déclarés' : 'Dépenses globales'}
              icon={Wallet}
              accent={THEME.accent.orange}
            />
          )}

          {k.tresorerie && (
            <Stat
              label="Trésorerie dispo"
              value={`${tresorerieDispo.toLocaleString('fr-FR')} Ar`}
              subvalue="Solde net caisse & banques"
              icon={Coins}
              accent={tresorerieDispo >= 0 ? THEME.accent.green : THEME.accent.danger}
            />
          )}

          {k.reserve_rmb && (
            <Stat
              label="Réserve RMB (¥)"
              value={`${soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} ¥`}
              subvalue={`Achats: ${soldeRmbInfo.totalRmbAchete.toFixed(1)} ¥`}
              icon={Receipt}
              accent="#D97706"
            />
          )}

          {k.creances && (
            <Stat
              label="Créances clients"
              value={`${creancesClients.toLocaleString('fr-FR')} Ar`}
              subvalue="Restes à recouvrer"
              icon={CreditCard}
              accent={creancesClients > 0 ? THEME.accent.orange : THEME.accent.green}
            />
          )}

          {k.dettes && (
            <Stat
              label="Dettes fournisseurs"
              value={`${dettesFournisseurs.toLocaleString('fr-FR')} Ar`}
              subvalue="Marchandises & fret dus"
              icon={AlertCircle}
              accent={dettesFournisseurs > 0 ? THEME.accent.danger : THEME.accent.green}
            />
          )}

          {k.charges && (
            <Stat
              label="Charges d'exploitation"
              value={`${chargesOperationnelles.toLocaleString('fr-FR')} Ar`}
              subvalue="Frais fixes et courants"
              icon={Boxes}
              accent={THEME.accent.orange}
            />
          )}

          {k.pertes_stock && (
            <Stat
              label="Pertes & Casse Stock"
              value={`${statsPertes.totalPertesAr > 0 ? '-' : ''}${statsPertes.totalPertesAr.toLocaleString('fr-FR')} Ar`}
              subvalue={statsPertes.quantitePerdue > 0 ? `${statsPertes.quantitePerdue} pièce(s) perdue(s)/cassée(s)` : 'Aucune perte constatée'}
              icon={AlertTriangle}
              accent={statsPertes.totalPertesAr > 0 ? THEME.accent.danger : THEME.accent.green}
            />
          )}

          {/* Logistique & Stock KPIs */}
          {k.transit && (
            <Stat
              label="Colis en transit"
              value={enTransit}
              subvalue={`${commandes.length} commande(s) totale(s)`}
              icon={Ship}
              accent={THEME.accent.primary}
            />
          )}

          {k.stock_valeur && (
            <Stat
              label="Valeur stock local"
              value={`${valeurStockLocal.toLocaleString('fr-FR')} Ar`}
              subvalue={`${products.reduce((s, p) => s + (Number(p.stock) || 0), 0)} articles en rayon`}
              icon={Package}
              accent={THEME.accent.green}
            />
          )}

          {k.stock_alerte && (
            <Stat
              label="Alertes stock"
              value={`${stockAlertesList.length} produit(s)`}
              subvalue={stockAlertesList.length > 0 ? 'Stock bas ou rupture' : 'Tous stocks OK'}
              icon={AlertTriangle}
              accent={stockAlertesList.length > 0 ? THEME.accent.danger : THEME.accent.green}
            />
          )}

          {k.articles_vendus && (
            <Stat
              label="Articles vendus"
              value={`${articlesVendusTotal} pcs`}
              subvalue="Volume total de pièces"
              icon={ShoppingCart}
              accent={THEME.accent.primary}
            />
          )}

          {k.panier_moyen && (
            <Stat
              label="Panier moyen"
              value={`${panierMoyen.toLocaleString('fr-FR')} Ar`}
              subvalue="Par transaction client"
              icon={PiggyBank}
              accent={THEME.accent.green}
            />
          )}
        </div>
      )}

      {/* MODULE WIDGET 1 : ANALYSE D'INVESTISSEMENT & ROI */}
      {w.investment_roi && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.accent.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <PiggyBank size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: THEME.text.primary }}>Analyse d'Investissement & Rentabilité (ROI)</div>
                <div style={{ fontSize: 12, color: THEME.text.muted }}>Suivi précis du rendement sur capital et du seuil de rentabilité</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: THEME.bg.soft, color: THEME.accent.green }}>
              Temps Réel
            </span>
          </div>

          {/* 4 Blocs d'analyse financière */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
            <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
              <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Capital de Base</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: THEME.text.primary, marginTop: 3 }}>
                {baseInvestissement.toLocaleString('fr-FR')} Ar
              </div>
              <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
                {capitalInvesti > 0 ? 'Apports déclarés' : 'Dépenses stock + fret'}
              </div>
            </div>

            <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
              <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Bénéfice Net Réalisé</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: beneficeNet >= 0 ? THEME.accent.green : THEME.accent.danger, marginTop: 3 }}>
                {beneficeNet >= 0 ? '+' : ''}{beneficeNet.toLocaleString('fr-FR')} Ar
              </div>
              <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
                Marge réelle − charges − pertes stock
              </div>
            </div>

            <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
              <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Taux de Rendement (ROI)</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: tauxRoi >= 0 ? THEME.accent.green : THEME.accent.danger, marginTop: 2 }}>
                {tauxRoi >= 0 ? '+' : ''}{tauxRoi.toFixed(1)} %
              </div>
              <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
                Gains nets / Capital investi
              </div>
            </div>

            <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
              <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Récupération du Capital</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: THEME.accent.primary, marginTop: 3 }}>
                {tauxRecuperation.toFixed(0)} %
              </div>
              <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
                CA encaissé vs mise de départ
              </div>
            </div>
          </div>

          {/* Barre de progression vers le Seuil de rentabilité */}
          <div style={{ marginTop: 14, background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontWeight: 700, color: THEME.text.primary }}>Progression vers le Seuil de Rentabilité (Point Mort)</span>
              <span style={{ fontWeight: 800, color: THEME.accent.primary }}>
                {caTotal.toLocaleString('fr-FR')} Ar / {baseInvestissement.toLocaleString('fr-FR')} Ar
              </span>
            </div>

            <div style={{ width: '100%', height: 9, background: THEME.border.base, borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${tauxRecuperation}%`,
                  height: '100%',
                  background: tauxRecuperation >= 100 ? THEME.accent.green : THEME.accent.orange,
                  borderRadius: 10,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            <div style={{ fontSize: 11.5, color: THEME.text.secondary, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              {tauxRecuperation >= 100 ? (
                <>
                  <CheckCircle2 size={15} style={{ color: THEME.accent.green }} />
                  <span style={{ fontWeight: 600, color: THEME.accent.green }}>
                    Point mort atteint ! Votre mise initiale est amortie et chaque vente génère du pur profit net.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={15} style={{ color: THEME.accent.orange }} />
                  <span>
                    Il reste <strong style={{ color: THEME.text.primary }}>{resteARecuperer.toLocaleString('fr-FR')} Ar</strong> de chiffre d'affaires à encaisser pour atteindre le seuil de rentabilité.
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* MODULE WIDGET 2 : ALERTES & PRIORITÉS LOGISTIQUES */}
      {w.alertes_urgentes && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.accent.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <Activity size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: THEME.text.primary }}>Alertes Opérationnelles & Logistiques</div>
                <div style={{ fontSize: 12, color: THEME.text.muted }}>Points d'attention nécessitant une action prioritaire</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onNavigateTab && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('stock')}
                    style={{ ...ghostBtn, fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <span>Gérer le stock</span>
                    <ChevronRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('achat')}
                    style={{ ...ghostBtn, fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <span>Suivi Achats</span>
                    <ChevronRight size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {/* Colonne 1 : Alertes Stock Faible */}
            <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} color={THEME.accent.danger} />
                <span>Ruptures & Stocks Critiques ({stockAlertesList.length})</span>
              </div>
              {stockAlertesList.length === 0 ? (
                <div style={{ fontSize: 12, color: THEME.accent.green, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
                  <CheckCircle2 size={15} />
                  <span>Aucun produit en rupture. Vos stocks sont à niveau.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                  {stockAlertesList.slice(0, 5).map((p: any) => {
                    const isRupture = (Number(p.stock) || 0) <= 0;
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: isRupture ? '#FEF2F2' : '#FFFBEB',
                          border: `1px solid ${isRupture ? '#FEE2E2' : '#FEF3C7'}`,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isRupture ? '#991B1B' : '#92400E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.nom} {p.couleur ? `(${p.couleur})` : ''}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#6B7280' }}>
                            Stock actuel : <strong>{p.stock || 0} pcs</strong> (Seuil : {p.seuilAlerte || 2})
                          </div>
                        </div>
                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('achat')}
                            style={{
                              background: '#FFF',
                              border: `1px solid ${isRupture ? '#FCA5A5' : '#FCD34D'}`,
                              color: isRupture ? '#DC2626' : '#D97706',
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '3px 7px',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            Commander
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {stockAlertesList.length > 5 && (
                    <div style={{ fontSize: 11, color: THEME.text.muted, textAlign: 'center', paddingTop: 4 }}>
                      + {stockAlertesList.length - 5} autre(s) article(s) à réapprovisionner
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Colonne 2 : Suivi Colis en Transit */}
            <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ship size={15} color={THEME.accent.primary} />
                <span>Colis & Fret en Transit ({commandesEnTransitList.length})</span>
              </div>
              {commandesEnTransitList.length === 0 ? (
                <div style={{ fontSize: 12, color: THEME.text.muted, padding: '8px 0' }}>
                  Aucune expédition active en cours d'acheminement.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                  {commandesEnTransitList.slice(0, 5).map((c: any) => {
                    const pr = products.find((p: any) => p.id === c.productId);
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: THEME.bg.base,
                          border: `1px solid ${THEME.border.base}`,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pr ? pr.nom : 'Article'} ({c.qty} pcs)
                          </div>
                          <div style={{ fontSize: 10.5, color: THEME.text.muted }}>
                            {c.transitaire || 'Transitaire'} · {c.typeFret || 'Maritime'}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: THEME.bg.soft,
                            color: THEME.accent.primary,
                          }}
                        >
                          {c.statut}
                        </span>
                      </div>
                    );
                  })}
                  {commandesEnTransitList.length > 5 && (
                    <div style={{ fontSize: 11, color: THEME.text.muted, textAlign: 'center', paddingTop: 4 }}>
                      + {commandesEnTransitList.length - 5} autre(s) colis en route
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Colonne 3 : Pertes & Régularisations de Stock */}
            <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={15} color={statsPertes.totalPertesAr > 0 ? THEME.accent.danger : THEME.accent.green} />
                  <span>Pertes & Casse ({statsPertes.quantitePerdue} pcs)</span>
                </div>
                {statsPertes.totalPertesAr > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: THEME.accent.danger }}>
                    -{statsPertes.totalPertesAr.toLocaleString('fr-FR')} Ar
                  </span>
                )}
              </div>

              {statsPertes.ajustements.length === 0 ? (
                <div style={{ fontSize: 12, color: THEME.accent.green, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
                  <CheckCircle2 size={15} />
                  <span>Aucune perte ou casse enregistrée sur le stock.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                  {statsPertes.ajustements.slice(0, 5).map((adj: any) => {
                    const delta = Number(adj.delta) || 0;
                    const isLoss = delta < 0;
                    const pCost = getProductCostBreakdown(adj.productId).coutRevient;
                    const valTotale = adj.valeurTotaleAr !== undefined && adj.valeurTotaleAr !== null && Number(adj.valeurTotaleAr) > 0
                      ? Number(adj.valeurTotaleAr)
                      : (Math.abs(delta) * (Number(adj.valeurUnitaireAr) || pCost || 0));

                    return (
                      <div
                        key={adj.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: isLoss ? '#FEF2F2' : '#F0FDF4',
                          border: `1px solid ${isLoss ? '#FEE2E2' : '#DCFCE7'}`,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isLoss ? '#991B1B' : '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {adj.productNom || 'Article'} ({delta > 0 ? `+${delta}` : delta} pcs)
                          </div>
                          <div style={{ fontSize: 10.5, color: '#6B7280' }}>
                            {adj.motif || 'Ajustement'} · {adj.date && !isNaN(new Date(adj.date).getTime()) ? new Date(adj.date).toLocaleDateString('fr-FR') : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: isLoss ? '#DC2626' : '#16A34A',
                            }}
                          >
                            {isLoss ? '-' : '+'}{valTotale.toLocaleString('fr-FR')} Ar
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {statsPertes.ajustements.length > 5 && (
                    <div style={{ fontSize: 11, color: THEME.text.muted, textAlign: 'center', paddingTop: 4 }}>
                      + {statsPertes.ajustements.length - 5} autre(s) ajustement(s)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* MODULE WIDGET 3 : ANALYSE DE RENTABILITÉ PAR PRODUIT */}
      {w.rentabilite_produits && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.accent.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <Package size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: THEME.text.primary }}>Rentabilité par Produit</div>
                <div style={{ fontSize: 12, color: '#8A8375' }}>
                  Calcul basé sur le prix moyen d'achat (achat + fret) et le prix moyen de vente réels
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: 170 }}>
                <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: '#8A8375' }} />
                <input
                  type="text"
                  placeholder="Rechercher produit..."
                  value={rechercheProduit}
                  onChange={(e) => setRechercheProduit(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 28, height: 32, fontSize: 12 } as any}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ ...selectStyle, height: 32, fontSize: 12, width: 'auto' } as any}
              >
                <option value="benefice">Tri : Bénéfice Total (Ar)</option>
                <option value="margePct">Tri : Taux de Marge (%)</option>
                <option value="ca">Tri : Chiffre d'Affaires (Ar)</option>
                <option value="nom">Tri : Nom de Produit</option>
              </select>
            </div>
          </div>

          {/* Insights Clés */}
          {(topRentabilitePct || topBeneficeTotal) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
              {topRentabilitePct && (
                <div style={{ background: THEME.bg.soft, padding: '10px 12px', borderRadius: 8, border: '1px solid ' + THEME.border.base, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, color: THEME.accent.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Award size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Meilleur Taux de Marge</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {topRentabilitePct.nom} {topRentabilitePct.couleur ? `(${topRentabilitePct.couleur})` : ''}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.green }}>
                      +{topRentabilitePct.tauxMargePct}% de marge ({topRentabilitePct.margeUnitaire.toLocaleString('fr-FR')} Ar/u)
                    </div>
                  </div>
                </div>
              )}

              {topBeneficeTotal && (
                <div style={{ background: THEME.bg.soft, padding: '10px 12px', borderRadius: 8, border: '1px solid ' + THEME.border.base, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, color: THEME.accent.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Plus Fort Bénéfice Total</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {topBeneficeTotal.nom} {topBeneficeTotal.couleur ? `(${topBeneficeTotal.couleur})` : ''}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary }}>
                      +{topBeneficeTotal.beneficeTotal.toLocaleString('fr-FR')} Ar générés ({topBeneficeTotal.qtyVendue} vendus)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tableau récapitulatif de rentabilité */}
          {produitsFitresEtTries.length === 0 ? (
            <Empty text="Aucun produit ne correspond aux critères." />
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid ' + THEME.border.base, borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: THEME.bg.soft, borderBottom: '1px solid ' + THEME.border.base, color: THEME.text.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <th style={{ padding: '10px 12px' }}>Produit</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Prix Achat Moy.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Prix Vente Moy.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Marge / Unité</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Taux Marge %</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Bénéfice Total</th>
                  </tr>
                </thead>
                <tbody>
                  {produitsFitresEtTries.map((p, idx) => {
                    const isPositive = p.margeUnitaire >= 0;
                    const bgBadge = p.tauxMargePct >= 50
                      ? THEME.bg.chip
                      : p.tauxMargePct >= 20
                      ? THEME.bg.soft
                      : p.tauxMargePct > 0
                      ? THEME.bg.soft
                      : THEME.bg.alert;

                    const colorBadge = p.tauxMargePct >= 50
                      ? THEME.accent.green
                      : p.tauxMargePct >= 20
                      ? THEME.accent.primary
                      : p.tauxMargePct > 0
                      ? THEME.accent.orange
                      : THEME.accent.danger;

                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: idx === produitsFitresEtTries.length - 1 ? 'none' : '1px solid ' + THEME.border.base,
                          background: idx % 2 === 0 ? THEME.bg.card : THEME.bg.base,
                        }}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: THEME.text.primary, fontSize: 13 }}>
                            {p.nom} {p.couleur ? `(${p.couleur})` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: THEME.text.muted }}>
                            {p.categorie} · {p.qtyVendue} vendu(s) / {p.qtyAchetee} acheté(s)
                          </div>
                        </td>

                        <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: THEME.text.secondary }}>
                            {p.prixMoyenAchat.toLocaleString('fr-FR')} Ar
                          </span>
                          {p.qtyAchetee > 0 && (
                            <div style={{ fontSize: 10.5, color: THEME.text.muted }}>PRU moy. (achat + livr. + fret)</div>
                          )}
                        </td>

                        <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: THEME.text.primary }}>
                            {p.prixMoyenVente.toLocaleString('fr-FR')} Ar
                          </span>
                          {p.qtyVendue > 0 && (
                            <div style={{ fontSize: 10.5, color: THEME.text.muted }}>sur {p.qtyVendue} vente(s)</div>
                          )}
                        </td>

                        <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: isPositive ? THEME.accent.green : THEME.accent.danger }}>
                            {isPositive ? '+' : ''}{p.margeUnitaire.toLocaleString('fr-FR')} Ar
                          </span>
                        </td>

                        <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 12,
                              background: bgBadge,
                              color: colorBadge,
                            }}
                          >
                            {p.tauxMargePct >= 0 ? '+' : ''}{p.tauxMargePct}%
                          </span>
                        </td>

                        <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: p.beneficeTotal >= 0 ? THEME.accent.green : THEME.accent.danger }}>
                            {p.beneficeTotal >= 0 ? '+' : ''}{p.beneficeTotal.toLocaleString('fr-FR')} Ar
                          </span>
                          {p.pertesProduitAr > 0 && (
                            <div style={{ fontSize: 10.5, color: THEME.accent.danger, marginTop: 1 }}>
                              dont -{p.pertesProduitAr.toLocaleString('fr-FR')} Ar perte ({p.pertesProduitQty} pcs)
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* MODULE WIDGETS GRAPHIQUES (TOP PRODUITS & RÉPARTITION CATÉGORIES) */}
      {(w.top_produits || w.repartition_categories) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: (w.top_produits && w.repartition_categories) ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
            gap: 14,
          }}
        >
          {w.top_produits && (
            <Card>
              <div style={cardTitle as any}>Top Produits par Chiffre d'Affaires</div>
              {parProduit.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
                  Aucune vente enregistrée pour afficher les produits.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={parProduit} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: THEME.text.primary }}
                    />
                    <Tooltip
                      formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="ca" fill="#E8985E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          {w.repartition_categories && (
            <Card>
              <div style={cardTitle as any}>Répartition des Ventes par Catégorie</div>
              {parCategorie.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
                  Aucune catégorie vendue pour l'instant.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={parCategorie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {parCategorie.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {parCategorie.map((c, i) => (
                      <div
                        key={c.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11.5,
                          color: THEME.text.muted,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                        {c.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      )}

      {/* MODAL DE PERSONNALISATION DES WIDGETS */}
      {customizerOpen && (
        <DashboardCustomizerModal
          config={config}
          onClose={() => setCustomizerOpen(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
});

export default Dashboard;
