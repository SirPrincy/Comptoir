import React, { useState, useMemo } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { ProfitLossProps, PnlPeriode } from './types';
import { filterPnlData, computePnl } from './pnlUtils';
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
  const [periode, setPeriode] = useState<PnlPeriode>('all');
  
  // Plage de dates personnalisée
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateDebut, setDateDebut] = useState(formatYMD(startOfMonth));
  const [dateFin, setDateFin] = useState(formatYMD(today));

  // Filtrage des données par période
  const filteredData = useMemo(() => {
    return filterPnlData(periode, dateDebut, dateFin, ventes, mouvements, frais);
  }, [periode, dateDebut, dateFin, ventes, mouvements, frais]);

  // Calculs financiers P&L
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

      {/* KPI Cards */}
      <PnlKpiCards pnl={pnl} />

      {/* Structure du Compte de Résultat */}
      <PnlTable pnl={pnl} />

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
