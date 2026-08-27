import React, { useState, useMemo } from 'react';
import { TrendingUp, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { ProfitLossProps, PnlPeriode } from './types';
import {
  filterPnlData,
  filterPnlDataWithBounds,
  computePnl,
  computePnlWithBounds,
  getPreviousPeriodeBounds,
  getPeriodeLabel,
} from './pnlUtils';
import PnlFilterBar from './PnlFilterBar';
import PnlKpiCards from './PnlKpiCards';
import PnlTable from './PnlTable';

export default function ProfitLoss({
  products = [],
  ventes = [],
  commandes = [],
  mouvements = [],
  frais = [],
  immobilisations = [],
  devises = { rmb: 680, usd: 4600 },
}: ProfitLossProps) {
  // Périodes de filtrage
  const [periode, setPeriode] = useState<PnlPeriode>('month');
  const [comparaisonActive, setComparaisonActive] = useState<boolean>(true);
  
  // Plage de dates personnalisée
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateDebut, setDateDebut] = useState(formatYMD(startOfMonth));
  const [dateFin, setDateFin] = useState(formatYMD(today));

  // Filtrage des données par période actuelle
  const filteredData = useMemo(() => {
    return filterPnlData(periode, dateDebut, dateFin, ventes, mouvements, frais);
  }, [periode, dateDebut, dateFin, ventes, mouvements, frais]);

  // Calculs financiers P&L période actuelle
  const pnl = useMemo(() => {
    return computePnl(
      filteredData,
      periode,
      dateDebut,
      dateFin,
      products,
      commandes,
      immobilisations,
      devises
    );
  }, [filteredData, periode, dateDebut, dateFin, products, commandes, immobilisations, devises]);

  // Bornes de la période précédente pour comparaison (M-1, T-1, N-1...)
  const prevBounds = useMemo(() => {
    return getPreviousPeriodeBounds(periode, dateDebut, dateFin);
  }, [periode, dateDebut, dateFin]);

  // Filtrage des données de la période précédente
  const filteredDataPrevious = useMemo(() => {
    if (!comparaisonActive || (!prevBounds.debut && !prevBounds.fin)) return null;
    return filterPnlDataWithBounds(prevBounds.debut, prevBounds.fin, ventes, mouvements, frais);
  }, [comparaisonActive, prevBounds, ventes, mouvements, frais]);

  // Calculs financiers P&L période précédente
  const pnlPrevious = useMemo(() => {
    if (!filteredDataPrevious || !comparaisonActive) return null;
    return computePnlWithBounds(
      filteredDataPrevious,
      periode,
      prevBounds,
      products,
      commandes,
      immobilisations,
      devises
    );
  }, [filteredDataPrevious, comparaisonActive, periode, prevBounds, products, commandes, immobilisations, devises]);

  // Libellés clairs des périodes
  const currentLabel = getPeriodeLabel(periode, dateDebut, dateFin);
  const previousLabel = prevBounds.label;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête & Filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} style={{ color: THEME.accent.primary }} />
            P&L · Compte de Résultat Simplifié
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: THEME.text.muted }}>
            Analyse de rentabilité : chiffre d’affaires, coût de revient des ventes, charges d’exploitation et résultat net.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {periode !== 'all' && (
            <button
              onClick={() => setComparaisonActive(!comparaisonActive)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${comparaisonActive ? THEME.accent.primary : THEME.border.base}`,
                background: comparaisonActive ? 'rgba(59, 130, 246, 0.1)' : THEME.bg.card,
                color: comparaisonActive ? THEME.accent.primary : THEME.text.secondary,
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowLeftRight size={13} />
              {comparaisonActive ? `Comparé à ${previousLabel}` : 'Comparer avec période N-1'}
            </button>
          )}

          <PnlFilterBar
            periode={periode}
            setPeriode={setPeriode}
            dateDebut={dateDebut}
            setDateDebut={setDateDebut}
            dateFin={dateFin}
            setDateFin={setDateFin}
            debutStr={filteredData.debutStr}
            finStr={filteredData.finStr}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <PnlKpiCards
        pnl={pnl}
        pnlPrevious={comparaisonActive ? pnlPrevious : null}
        previousLabel={previousLabel}
      />

      {/* Structure du Compte de Résultat */}
      <PnlTable
        pnl={pnl}
        pnlPrevious={comparaisonActive ? pnlPrevious : null}
        currentLabel={currentLabel}
        previousLabel={previousLabel}
      />

      {/* Warning Box */}
      <div style={{
        background: THEME.bg.soft,
        border: `1px solid ${THEME.border.strong}`,
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        fontSize: 12,
        color: THEME.accent.orange,
      }}>
        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong style={{ color: THEME.text.primary }}>Note de cohérence comptable</strong> : Pour éviter la double-comptabilisation, les sorties directes de trésorerie pour "achat de stock" (ex: tag <strong>#stock-chine</strong> ou mot clé "achat stock") ne sont pas incluses dans les charges de fonctionnement (OPEX) ci-dessus. Elles sont intégrées dynamiquement au prorata des ventes réelles sous forme de <strong>Coût des Marchandises Vendues (COGS)</strong>.
        </div>
      </div>
    </div>
  );
}

export * from './types';
export * from './pnlUtils';

