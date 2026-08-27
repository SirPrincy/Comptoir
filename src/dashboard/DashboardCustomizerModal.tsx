import React, { useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Package,
  LayoutGrid,
  Check,
  Zap,
  TrendingUp,
  Ship,
  PieChart,
} from 'lucide-react';
import { Modal, ghostBtn, primaryBtn } from '../ui';
import { THEME } from '../colors';
import {
  DashboardWidgetConfig,
  KPI_DEFINITIONS,
  WIDGET_DEFINITIONS,
  PRESET_CONFIGS,
  DEFAULT_DASHBOARD_CONFIG,
} from './dashboardConfig';

interface DashboardCustomizerModalProps {
  config: DashboardWidgetConfig;
  onClose: () => void;
  onSave: (newConfig: DashboardWidgetConfig) => void;
}

export default function DashboardCustomizerModal({
  config,
  onClose,
  onSave,
}: DashboardCustomizerModalProps) {
  const [currentConfig, setCurrentConfig] = useState<DashboardWidgetConfig>({
    ...config,
    kpis: { ...config.kpis },
    widgets: { ...config.widgets },
  });

  const [activeTab, setActiveTab] = useState<'finance' | 'logistique' | 'widgets'>('finance');

  const applyPreset = (presetKey: 'all' | 'finance' | 'logistique' | 'synthese') => {
    const preset = PRESET_CONFIGS[presetKey];
    setCurrentConfig({
      preset: presetKey,
      kpis: { ...preset.kpis },
      widgets: { ...preset.widgets },
    });
  };

  const toggleKpi = (kpiId: keyof DashboardWidgetConfig['kpis']) => {
    setCurrentConfig((prev) => ({
      ...prev,
      preset: 'custom',
      kpis: {
        ...prev.kpis,
        [kpiId]: !prev.kpis[kpiId],
      },
    }));
  };

  const toggleWidget = (widgetId: keyof DashboardWidgetConfig['widgets']) => {
    setCurrentConfig((prev) => ({
      ...prev,
      preset: 'custom',
      widgets: {
        ...prev.widgets,
        [widgetId]: !prev.widgets[widgetId],
      },
    }));
  };

  const selectAllCategory = (cat: 'finance' | 'logistique' | 'widgets', value: boolean) => {
    if (cat === 'widgets') {
      const nextWidgets = { ...currentConfig.widgets };
      WIDGET_DEFINITIONS.forEach((w) => {
        nextWidgets[w.id] = value;
      });
      setCurrentConfig((prev) => ({ ...prev, preset: 'custom', widgets: nextWidgets }));
    } else {
      const nextKpis = { ...currentConfig.kpis };
      KPI_DEFINITIONS.filter((k) => k.category === cat).forEach((k) => {
        nextKpis[k.id] = value;
      });
      setCurrentConfig((prev) => ({ ...prev, preset: 'custom', kpis: nextKpis }));
    }
  };

  const resetDefault = () => {
    setCurrentConfig({
      preset: DEFAULT_DASHBOARD_CONFIG.preset,
      kpis: { ...DEFAULT_DASHBOARD_CONFIG.kpis },
      widgets: { ...DEFAULT_DASHBOARD_CONFIG.widgets },
    });
  };

  const kpisFinance = KPI_DEFINITIONS.filter((k) => k.category === 'finance');
  const kpisLogistique = KPI_DEFINITIONS.filter((k) => k.category === 'logistique');

  const activeKpisCount = Object.values(currentConfig.kpis).filter(Boolean).length;
  const activeWidgetsCount = Object.values(currentConfig.widgets).filter(Boolean).length;

  return (
    <Modal title="Personnaliser les Widgets & Indicateurs" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* SÉLECTEUR DE PROFILS RAPIDES (PRESETS) */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.secondary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} color={THEME.accent.orange} />
            <span>Profils d'affichage rapide :</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6 }}>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${currentConfig.preset === 'all' ? THEME.accent.primary : THEME.border.base}`,
                background: currentConfig.preset === 'all' ? THEME.bg.soft : THEME.bg.card,
                color: currentConfig.preset === 'all' ? THEME.accent.primary : THEME.text.secondary,
                fontWeight: currentConfig.preset === 'all' ? 700 : 500,
                fontSize: 11.5,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              🌟 Tout afficher
            </button>

            <button
              type="button"
              onClick={() => applyPreset('finance')}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${currentConfig.preset === 'finance' ? THEME.accent.green : THEME.border.base}`,
                background: currentConfig.preset === 'finance' ? THEME.bg.soft : THEME.bg.card,
                color: currentConfig.preset === 'finance' ? THEME.accent.green : THEME.text.secondary,
                fontWeight: currentConfig.preset === 'finance' ? 700 : 500,
                fontSize: 11.5,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              💰 Focus Finance
            </button>

            <button
              type="button"
              onClick={() => applyPreset('logistique')}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${currentConfig.preset === 'logistique' ? THEME.accent.primary : THEME.border.base}`,
                background: currentConfig.preset === 'logistique' ? THEME.bg.soft : THEME.bg.card,
                color: currentConfig.preset === 'logistique' ? THEME.accent.primary : THEME.text.secondary,
                fontWeight: currentConfig.preset === 'logistique' ? 700 : 500,
                fontSize: 11.5,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              🚢 Focus Logistique
            </button>

            <button
              type="button"
              onClick={() => applyPreset('synthese')}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${currentConfig.preset === 'synthese' ? THEME.accent.orange : THEME.border.base}`,
                background: currentConfig.preset === 'synthese' ? THEME.bg.soft : THEME.bg.card,
                color: currentConfig.preset === 'synthese' ? THEME.accent.orange : THEME.text.secondary,
                fontWeight: currentConfig.preset === 'synthese' ? 700 : 500,
                fontSize: 11.5,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              ⚡ Vue Synthèse
            </button>
          </div>
        </div>

        {/* ONGLETS DES CATÉGORIES */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${THEME.border.base}`, gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'finance' ? `2px solid ${THEME.accent.green}` : '2px solid transparent',
              color: activeTab === 'finance' ? THEME.accent.green : THEME.text.muted,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <DollarSign size={14} />
            <span>Finance ({kpisFinance.filter((k) => currentConfig.kpis[k.id]).length}/{kpisFinance.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logistique')}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'logistique' ? `2px solid ${THEME.accent.primary}` : '2px solid transparent',
              color: activeTab === 'logistique' ? THEME.accent.primary : THEME.text.muted,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ship size={14} />
            <span>Logistique & Stock ({kpisLogistique.filter((k) => currentConfig.kpis[k.id]).length}/{kpisLogistique.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('widgets')}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'widgets' ? `2px solid ${THEME.accent.orange}` : '2px solid transparent',
              color: activeTab === 'widgets' ? THEME.accent.orange : THEME.text.muted,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LayoutGrid size={14} />
            <span>Graphiques & Modules ({activeWidgetsCount}/{WIDGET_DEFINITIONS.length})</span>
          </button>
        </div>

        {/* CONTENU DE L'ONGLET SÉLECTIONNÉ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
          {/* Boutons d'action rapide Tout cocher / Décocher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 11.5, color: THEME.text.muted }}>
              Sélectionnez les éléments à afficher en priorité sur votre tableau de bord :
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => selectAllCategory(activeTab, true)}
                style={{ background: 'none', border: 'none', color: THEME.accent.primary, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '2px 4px' }}
              >
                Tout cocher
              </button>
              <span style={{ color: THEME.border.strong }}>|</span>
              <button
                type="button"
                onClick={() => selectAllCategory(activeTab, false)}
                style={{ background: 'none', border: 'none', color: THEME.text.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '2px 4px' }}
              >
                Tout masquer
              </button>
            </div>
          </div>

          {activeTab === 'finance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {kpisFinance.map((kpi) => {
                const checked = !!currentConfig.kpis[kpi.id];
                return (
                  <label
                    key={kpi.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${checked ? THEME.accent.green : THEME.border.base}`,
                      background: checked ? THEME.bg.card : THEME.bg.base,
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKpi(kpi.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: THEME.accent.green }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: checked ? THEME.text.primary : THEME.text.secondary }}>
                        {kpi.label}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.text.muted }}>
                        {kpi.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {activeTab === 'logistique' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {kpisLogistique.map((kpi) => {
                const checked = !!currentConfig.kpis[kpi.id];
                return (
                  <label
                    key={kpi.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${checked ? THEME.accent.primary : THEME.border.base}`,
                      background: checked ? THEME.bg.card : THEME.bg.base,
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKpi(kpi.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: THEME.accent.primary }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: checked ? THEME.text.primary : THEME.text.secondary }}>
                        {kpi.label}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.text.muted }}>
                        {kpi.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {activeTab === 'widgets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {WIDGET_DEFINITIONS.map((widget) => {
                const checked = !!currentConfig.widgets[widget.id];
                return (
                  <label
                    key={widget.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${checked ? THEME.accent.orange : THEME.border.base}`,
                      background: checked ? THEME.bg.card : THEME.bg.base,
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWidget(widget.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: THEME.accent.orange }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: checked ? THEME.text.primary : THEME.text.secondary }}>
                        {widget.label}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.text.muted }}>
                        {widget.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* PIED DU MODAL AVEC ACTIONS */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
            borderTop: `1px solid ${THEME.border.base}`,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={resetDefault}
            style={{
              ...ghostBtn,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: THEME.text.muted,
            }}
          >
            <RotateCcw size={13} />
            <span>Rétablir par défaut</span>
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ ...ghostBtn, fontSize: 12.5, padding: '7px 14px' }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(currentConfig);
                onClose();
              }}
              style={{
                ...primaryBtn,
                fontSize: 12.5,
                padding: '7px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={14} />
              <span>Appliquer ({activeKpisCount} KPIs · {activeWidgetsCount} Modules)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
