import React from 'react';
import { DollarSign, TrendingDown, CheckCircle, Calendar, Clock } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { ImmoKpis } from './types';
import { MOIS_FR } from './immoUtils';

interface ImmoKpiCardsProps {
  kpis: ImmoKpis;
  selectedYear: number;
  selectedMonth: number;
}

export default function ImmoKpiCards({ kpis, selectedYear, selectedMonth }: ImmoKpiCardsProps) {
  const labelMois = MOIS_FR[selectedMonth - 1] || '';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
      {/* 1. Valeur Brute */}
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <DollarSign size={14} style={{ color: THEME.accent.primary }} />
          Valeur Brute Totale
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.text.primary, fontSize: 17 }}>
          {kpis.bruteTotale.toLocaleString()} MGA
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          Coût d'acquisition des actifs
        </div>
      </div>

      {/* 2. Dotation du mois */}
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <Clock size={14} style={{ color: THEME.accent.orange }} />
          Dotation du mois ({labelMois})
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.orange, fontSize: 17 }}>
          {kpis.dotationMoisTotale.toLocaleString()} MGA
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          Charge mensuelle {labelMois} {selectedYear}
        </div>
      </div>

      {/* 3. Dotation de l'exercice */}
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <TrendingDown size={14} style={{ color: THEME.accent.primary }} />
          Dotation Année {selectedYear}
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.primary, fontSize: 17 }}>
          {kpis.dotationAnneeTotale.toLocaleString()} MGA
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          Total sur l'exercice {selectedYear}
        </div>
      </div>

      {/* 4. Amortissements Cumulés */}
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <CheckCircle size={14} style={{ color: THEME.accent.green }} />
          Cumul Amorti (Fin {labelMois})
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.green, fontSize: 17 }}>
          {kpis.cumulTotale.toLocaleString()} MGA
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          Amortissements cumulés à date
        </div>
      </div>

      {/* 5. VNC */}
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <Calendar size={14} style={{ color: THEME.accent.purple }} />
          VNC Fin {labelMois}
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.purple, fontSize: 17 }}>
          {kpis.vncTotale.toLocaleString()} MGA
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          Valeur résiduelle nette
        </div>
      </div>
    </div>
  );
}

