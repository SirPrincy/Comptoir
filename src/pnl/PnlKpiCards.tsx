import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Percent, ShieldCheck, AlertCircle } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { PnlData } from './types';

interface PnlKpiCardsProps {
  pnl: PnlData;
}

export default function PnlKpiCards({ pnl }: PnlKpiCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <ArrowUpRight size={14} style={{ color: THEME.accent.green }} />
          Chiffre d'Affaires
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.text.primary }}>
          {pnl.chiffreAffaires.toLocaleString()} Ar
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          Total des ventes enregistrées
        </div>
      </div>

      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <Percent size={14} style={{ color: THEME.accent.primary }} />
          Marge Brute %
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.primary }}>
          {pnl.margeBrutePct.toFixed(1)}%
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          Marge après coût de revient
        </div>
      </div>

      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <ArrowDownLeft size={14} style={{ color: THEME.accent.orange }} />
          Charges Générales
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.orange }}>
          {pnl.totalOpex.toLocaleString()} Ar
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          Loyer, Pub, Matériel & Fonctionnement
        </div>
      </div>

      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${pnl.resultatNet >= 0 ? THEME.accent.green : THEME.accent.danger}`,
        borderRadius: 12,
        padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: pnl.resultatNet >= 0 ? THEME.accent.green : THEME.accent.danger, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          {pnl.resultatNet >= 0 ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
          Résultat Net Net
        </div>
        <div style={{
          ...TYPOGRAPHY.statValue,
          color: pnl.resultatNet >= 0 ? THEME.accent.green : THEME.accent.danger,
        }}>
          {pnl.resultatNet.toLocaleString()} Ar
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2, fontWeight: 500 }}>
          Marge nette : {pnl.margeNettePct.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
