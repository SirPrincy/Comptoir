import React, { useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  DollarSign,
  Ship,
  LayoutGrid,
  Check,
  Zap,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ShoppingBag,
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
    widgetOrder: [...(config.widgetOrder || WIDGET_DEFINITIONS.map(w => w.id))],
    kpis: { ...config.kpis },
    widgets: { ...config.widgets },
  });

  const [activeTab, setActiveTab] = useState<'finance' | 'logistique' | 'widgets' | 'order'>('widgets');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const applyPreset = (presetKey: 'all' | 'finance' | 'logistique' | 'synthese') => {
    const preset = PRESET_CONFIGS[presetKey];
    setCurrentConfig({
      preset: presetKey,
      widgetOrder: [...preset.widgetOrder],
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

  const moveWidget = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= currentConfig.widgetOrder.length) return;
    const newOrder = [...currentConfig.widgetOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    setCurrentConfig((prev) => ({
      ...prev,
      preset: 'custom',
      widgetOrder: newOrder,
    }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveWidget(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
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
      widgetOrder: [...DEFAULT_DASHBOARD_CONFIG.widgetOrder],
      kpis: { ...DEFAULT_DASHBOARD_CONFIG.kpis },
      widgets: { ...DEFAULT_DASHBOARD_CONFIG.widgets },
    });
  };

  const kpisFinance = KPI_DEFINITIONS.filter((k) => k.category === 'finance');
  const kpisLogistique = KPI_DEFINITIONS.filter((k) => k.category === 'logistique');

  const activeKpisCount = Object.values(currentConfig.kpis).filter(Boolean).length;
  const activeWidgetsCount = Object.values(currentConfig.widgets).filter(Boolean).length;

  // Obtenir la liste ordonnée des widgets
  const orderedWidgets = currentConfig.widgetOrder
    .map((id) => WIDGET_DEFINITIONS.find((w) => w.id === id))
    .filter(Boolean) as typeof WIDGET_DEFINITIONS;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'finance':
        return { label: '💰 Finance', color: THEME.accent.green, bg: 'rgba(16, 185, 129, 0.12)' };
      case 'sourcing':
        return { label: '🛒 Sourcing', color: THEME.accent.orange, bg: 'rgba(245, 158, 11, 0.12)' };
      case 'logistique':
        return { label: '🚢 Logistique', color: THEME.accent.primary, bg: 'rgba(37, 99, 235, 0.12)' };
      default:
        return { label: '📊 Graphique', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
    }
  };

  return (
    <Modal title="Personnaliser & Réorganiser les Widgets" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* SÉLECTEUR DE PROFILS RAPIDES (PRESETS) */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.secondary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} color={THEME.accent.orange} />
            <span>Profils d'affichage pré-configurés :</span>
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

        {/* ONGLETS DES CATÉGORIES ET DE RÉORGANISATION */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${THEME.border.base}`, gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
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
            <span>Widgets & Graphiques ({activeWidgetsCount}/{WIDGET_DEFINITIONS.length})</span>
          </button>

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
            <span>KPIs Finance ({kpisFinance.filter((k) => currentConfig.kpis[k.id]).length}/{kpisFinance.length})</span>
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
            <span>KPIs Logistique ({kpisLogistique.filter((k) => currentConfig.kpis[k.id]).length}/{kpisLogistique.length})</span>
          </button>
        </div>

        {/* CONTENU DE L'ONGLET SÉLECTIONNÉ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
          {/* Entête avec rappel Glisser-Déposer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 11.5, color: THEME.text.muted }}>
              {activeTab === 'widgets'
                ? '💡 Glissez-déposez ou utilisez les flèches ⬆️ ⬇️ pour modifier l’ordre des widgets :'
                : 'Cochez ou décochez les cartes d’indicateurs (KPIs) :'
              }
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

          {/* ONGLET WIDGETS AVEC DRAG AND DROP & FLECHES */}
          {activeTab === 'widgets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orderedWidgets.map((widget, index) => {
                const checked = !!currentConfig.widgets[widget.id];
                const badge = getCategoryBadge(widget.category);
                const isDragging = draggedIndex === index;

                return (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${checked ? badge.color : THEME.border.base}`,
                      background: isDragging
                        ? THEME.bg.soft
                        : checked ? THEME.bg.card : THEME.bg.base,
                      opacity: isDragging ? 0.6 : 1,
                      cursor: 'grab',
                      transition: 'all 0.15s ease',
                      boxShadow: checked ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                    }}
                  >
                    {/* Poignée Drag Handle */}
                    <div
                      title="Glisser-déposer pour modifier la position"
                      style={{ color: THEME.text.muted, cursor: 'grab', display: 'flex', alignItems: 'center' }}
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* Flèches Monter / Descendre */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveWidget(index, index - 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: index === 0 ? THEME.border.strong : THEME.text.primary,
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          padding: 2,
                          borderRadius: 3,
                          display: 'flex',
                        }}
                        title="Monter"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={index === orderedWidgets.length - 1}
                        onClick={() => moveWidget(index, index + 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: index === orderedWidgets.length - 1 ? THEME.border.strong : THEME.text.primary,
                          cursor: index === orderedWidgets.length - 1 ? 'not-allowed' : 'pointer',
                          padding: 2,
                          borderRadius: 3,
                          display: 'flex',
                        }}
                        title="Descendre"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    {/* Checkbox activation */}
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWidget(widget.id)}
                      style={{ width: 17, height: 17, cursor: 'pointer', accentColor: badge.color }}
                    />

                    {/* Infos widget */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: checked ? THEME.text.primary : THEME.text.muted }}>
                          {index + 1}. {widget.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: THEME.text.muted }}>
                        {widget.description}
                      </div>
                    </div>

                    {/* Bouton rapide d'état œil */}
                    <button
                      type="button"
                      onClick={() => toggleWidget(widget.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: checked ? badge.color : THEME.text.muted,
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 6,
                      }}
                      title={checked ? "Masquer ce widget" : "Afficher ce widget"}
                    >
                      {checked ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ONGLETS KPIS FINANCE */}
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

          {/* ONGLETS KPIS LOGISTIQUE */}
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
              <span>Appliquer ({activeKpisCount} KPIs · {activeWidgetsCount} Widgets)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

