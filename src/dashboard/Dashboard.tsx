/**
 * Composant Tableau de Bord (Dashboard)
 * Vue analytique personnalisable des indicateurs financiers et logistiques
 */

import React, { useState, memo } from 'react';
import {
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { THEME } from '../colors';
import { Empty, primaryBtn } from '../ui';
import {
  DashboardWidgetConfig,
  loadDashboardConfig,
  saveDashboardConfig,
  PRESET_CONFIGS,
} from './dashboardConfig';
import DashboardCustomizerModal from './DashboardCustomizerModal';
import { useDashboardMetrics } from './useDashboardMetrics';
import DashboardKpiGrid from './DashboardKpiGrid';
import InvestmentRoiWidget from './InvestmentRoiWidget';
import LogistiqueAlertsWidget from './LogistiqueAlertsWidget';
import ProductProfitabilityTable from './ProductProfitabilityTable';
import DashboardCharts from './DashboardCharts';

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
  changes = [],
  paiements = [],
  devises = { rmb: 680, usd: 4600 },
  onNavigateTab,
}: DashboardProps) {
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

  // Calculs unifiés des métriques
  const metrics = useDashboardMetrics({
    products,
    ventes,
    commandes,
    mouvements,
    changes,
    paiements,
    devises,
  });

  const hasAnyData = ventes.length > 0 || commandes.length > 0 || mouvements.length > 0 || products.length > 0;

  if (!hasAnyData) {
    return <Empty text="Enregistrez des ventes, commandes ou investissements pour générer vos analyses de rentabilité." />;
  }

  const k = config.kpis;
  const w = config.widgets;
  const activeKpisCount = Object.values(k).filter(Boolean).length;

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
        <DashboardKpiGrid
          kpisConfig={k}
          metrics={{
            caTotal: metrics.caTotal,
            ventesCount: ventes.length,
            margeTotale: metrics.margeTotale,
            beneficeNet: metrics.beneficeNet,
            tauxRoi: metrics.tauxRoi,
            tauxRecuperation: metrics.tauxRecuperation,
            baseInvestissement: metrics.baseInvestissement,
            capitalInvesti: metrics.capitalInvesti,
            tresorerieDispo: metrics.tresorerieDispo,
            soldeRmbInfo: metrics.soldeRmbInfo,
            creancesClients: metrics.creancesClients,
            dettesFournisseurs: metrics.dettesFournisseurs,
            chargesOperationnelles: metrics.chargesOperationnelles,
            statsPertes: metrics.statsPertes,
            enTransit: metrics.enTransit,
            commandesCount: commandes.length,
            valeurStockLocal: metrics.valeurStockLocal,
            totalArticlesEnRayon: products.reduce((s, p) => s + (Number(p.stock) || 0), 0),
            stockAlertesCount: metrics.stockAlertesList.length,
            articlesVendusTotal: metrics.articlesVendusTotal,
            panierMoyen: metrics.panierMoyen,
          }}
        />
      )}

      {/* MODULE WIDGET 1 : ANALYSE D'INVESTISSEMENT & ROI */}
      {w.investment_roi && (
        <InvestmentRoiWidget
          baseInvestissement={metrics.baseInvestissement}
          capitalInvesti={metrics.capitalInvesti}
          beneficeNet={metrics.beneficeNet}
          tauxRoi={metrics.tauxRoi}
          tauxRecuperation={metrics.tauxRecuperation}
          caTotal={metrics.caTotal}
          resteARecuperer={metrics.resteARecuperer}
        />
      )}

      {/* MODULE WIDGET 2 : ALERTES & PRIORITÉS LOGISTIQUES */}
      {w.alertes_urgentes && (
        <LogistiqueAlertsWidget
          stockAlertesList={metrics.stockAlertesList}
          commandesEnTransitList={metrics.commandesEnTransitList}
          statsPertes={metrics.statsPertes}
          products={products}
          getProductCostBreakdown={metrics.getProductCostBreakdown}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* MODULE WIDGET 3 : ANALYSE DE RENTABILITÉ PAR PRODUIT */}
      {w.rentabilite_produits && (
        <ProductProfitabilityTable
          rentabiliteParProduit={metrics.rentabiliteParProduit}
        />
      )}

      {/* MODULE WIDGETS GRAPHIQUES (TOP PRODUITS & RÉPARTITION CATÉGORIES) */}
      <DashboardCharts
        widgetsConfig={w}
        parProduit={metrics.parProduit}
        parCategorie={metrics.parCategorie}
      />

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
