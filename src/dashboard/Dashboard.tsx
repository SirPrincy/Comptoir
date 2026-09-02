/**
 * Composant Tableau de Bord (Dashboard)
 * Vue analytique personnalisable des indicateurs financiers et logistiques
 */

import React, { useState, memo } from 'react';
import {
  TrendingUp,
  SlidersHorizontal,
  MoveUp,
  MoveDown,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { THEME } from '../colors';
import { Empty, primaryBtn, ghostBtn } from '../ui';
import {
  DashboardWidgetConfig,
  loadDashboardConfig,
  saveDashboardConfig,
  PRESET_CONFIGS,
  WIDGET_DEFINITIONS,
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
  const [isEditMode, setIsEditMode] = useState(false);

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
      widgetOrder: [...preset.widgetOrder],
      kpis: { ...preset.kpis },
      widgets: { ...preset.widgets },
    };
    setConfig(newConfig);
    saveDashboardConfig(newConfig);
  };

  const moveWidgetOnDashboard = (widgetId: string, direction: 'up' | 'down') => {
    const currentOrder = [...(config.widgetOrder || WIDGET_DEFINITIONS.map(w => w.id))];
    const index = currentOrder.indexOf(widgetId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const [moved] = currentOrder.splice(index, 1);
    currentOrder.splice(targetIndex, 0, moved);

    const updatedConfig: DashboardWidgetConfig = {
      ...config,
      preset: 'custom',
      widgetOrder: currentOrder,
    };
    setConfig(updatedConfig);
    saveDashboardConfig(updatedConfig);
  };

  const hideWidgetOnDashboard = (widgetId: keyof DashboardWidgetConfig['widgets']) => {
    const updatedConfig: DashboardWidgetConfig = {
      ...config,
      preset: 'custom',
      widgets: {
        ...config.widgets,
        [widgetId]: false,
      },
    };
    setConfig(updatedConfig);
    saveDashboardConfig(updatedConfig);
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
  const activeWidgetsCount = Object.values(w).filter(Boolean).length;

  const presetLabels: Record<string, string> = {
    all: '🌟 Vue Complète',
    finance: '💰 Focus Finance',
    logistique: '🚢 Focus Logistique',
    synthese: '⚡ Vue Synthèse',
    custom: '⚙️ Affichage Personnalisé',
  };

  // Ordre actuel des widgets
  const widgetOrderList = config.widgetOrder || WIDGET_DEFINITIONS.map(w => w.id);

  const renderWidgetContent = (widgetId: string, index: number, totalActive: number) => {
    if (!w[widgetId as keyof typeof w]) return null;

    const meta = WIDGET_DEFINITIONS.find((item) => item.id === widgetId);
    if (!meta) return null;

    let content: React.ReactNode = null;

    switch (widgetId) {
      case 'investment_roi':
        content = (
          <InvestmentRoiWidget
            baseInvestissement={metrics.baseInvestissement}
            capitalInvesti={metrics.capitalInvesti}
            beneficeNet={metrics.beneficeNet}
            tauxRoi={metrics.tauxRoi}
            tauxRecuperation={metrics.tauxRecuperation}
            caTotal={metrics.caTotal}
            resteARecuperer={metrics.resteARecuperer}
          />
        );
        break;

      case 'alertes_urgentes':
        content = (
          <LogistiqueAlertsWidget
            stockAlertesList={metrics.stockAlertesList}
            commandesEnTransitList={metrics.commandesEnTransitList}
            statsPertes={metrics.statsPertes}
            products={products}
            getProductCostBreakdown={metrics.getProductCostBreakdown}
            onNavigateTab={onNavigateTab}
          />
        );
        break;

      case 'rentabilite_produits':
        content = (
          <ProductProfitabilityTable
            rentabiliteParProduit={metrics.rentabiliteParProduit}
          />
        );
        break;

      case 'flux_finances':
      case 'sourcing_costs':
      case 'logistics_transit':
      case 'top_produits':
      case 'repartition_categories':
        content = (
          <DashboardCharts
            widgetsConfig={{
              investment_roi: false,
              flux_finances: widgetId === 'flux_finances',
              alertes_urgentes: false,
              sourcing_costs: widgetId === 'sourcing_costs',
              rentabilite_produits: false,
              top_produits: widgetId === 'top_produits',
              repartition_categories: widgetId === 'repartition_categories',
              logistics_transit: widgetId === 'logistics_transit',
            }}
            parProduit={metrics.parProduit}
            parCategorie={metrics.parCategorie}
            financialSummary={{
              caTotal: metrics.caTotal,
              totalAchatsChine: metrics.totalAchatsChine,
              totalFret: metrics.totalFret,
              chargesOperationnelles: metrics.chargesOperationnelles,
              beneficeNet: metrics.beneficeNet,
            }}
            rentabiliteParProduit={metrics.rentabiliteParProduit}
            commandesEnTransitList={metrics.commandesEnTransitList}
          />
        );
        break;

      default:
        content = null;
    }

    if (!content) return null;

    return (
      <div
        key={widgetId}
        style={{
          position: 'relative',
          borderRadius: 12,
          border: isEditMode ? `2px dashed ${THEME.accent.orange}` : 'none',
          padding: isEditMode ? 8 : 0,
          background: isEditMode ? THEME.bg.soft : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        {/* BARRE DE RÉRORGANISATION EN MODE ÉDITION SUR DASHBOARD */}
        {isEditMode && (
          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '6px 12px',
              background: THEME.bg.card,
              border: `1px solid ${THEME.border.strong}`,
              borderRadius: '8px 8px 0 0',
              marginBottom: 6,
              fontSize: 11.5,
              fontWeight: 700,
              color: THEME.text.primary,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <GripVertical size={14} color={THEME.accent.orange} />
              <span>Position {index + 1} : {meta.label}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveWidgetOnDashboard(widgetId, 'up')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${THEME.border.base}`,
                  background: THEME.bg.surface,
                  color: index === 0 ? THEME.text.muted : THEME.text.primary,
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                <MoveUp size={12} />
                <span>Monter</span>
              </button>

              <button
                type="button"
                disabled={index === totalActive - 1}
                onClick={() => moveWidgetOnDashboard(widgetId, 'down')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${THEME.border.base}`,
                  background: THEME.bg.surface,
                  color: index === totalActive - 1 ? THEME.text.muted : THEME.text.primary,
                  cursor: index === totalActive - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                <MoveDown size={12} />
                <span>Descendre</span>
              </button>

              <button
                type="button"
                onClick={() => hideWidgetOnDashboard(widgetId as keyof DashboardWidgetConfig['widgets'])}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${THEME.border.base}`,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                }}
                title="Masquer ce widget du tableau de bord"
              >
                <EyeOff size={12} />
                <span>Masquer</span>
              </button>
            </div>
          </div>
        )}

        {content}
      </div>
    );
  };

  const activeWidgetIds = widgetOrderList.filter((id) => !!w[id as keyof typeof w]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* BARRE DE CONTRÔLE ET PERSONNALISATION DES WIDGETS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
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

        {/* Boutons d'édition directe et de personnalisation */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: `1px solid ${isEditMode ? THEME.accent.orange : THEME.border.base}`,
              background: isEditMode ? THEME.bg.soft : THEME.bg.card,
              color: isEditMode ? THEME.accent.orange : THEME.text.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            title="Activer le mode de réorganisation directe sur le tableau de bord"
          >
            <GripVertical size={14} />
            <span>{isEditMode ? "Terminer la Réorganisation" : "Réorganiser Directement"}</span>
          </button>

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
            <span>Personnaliser ({activeKpisCount} KPIs · {activeWidgetsCount} Widgets)</span>
          </button>
        </div>
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

      {/* AFFICHAGE DES WIDGETS DYNAMIQUES SELON WIDGETORDER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {activeWidgetIds.map((widgetId, index) =>
          renderWidgetContent(widgetId, index, activeWidgetIds.length)
        )}
      </div>

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

