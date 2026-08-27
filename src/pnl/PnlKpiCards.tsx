import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Percent, ShieldCheck, AlertCircle } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { PnlData } from './types';

interface PnlKpiCardsProps {
  pnl: PnlData;
}

export default function PnlKpiCards({ pnl }: PnlKpiCardsProps) {
  if (!pnl) return null;

  const fmt = (n: number | undefined | null) => (Number(n) || 0).toLocaleString('fr-FR');
  const pct = (n: number | undefined | null) => (Number(n) || 0).toFixed(1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <ArrowUpRight size={14} style={{ color: THEME.accent.green }} />
          Chiffre d'Affaires
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.text.primary }}>
          {fmt(pnl.chiffreAffaires)} Ar
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
          {pct(pnl.margeBrutePct)}%
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
          {fmt(pnl.totalOpex)} Ar
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
          {(pnl.pertesStock || 0) > 0 ? (
            <span style={{ color: THEME.accent.danger }}>
              Dont {fmt(pnl.pertesStock)} Ar pertes stock
            </span>
          ) : (
            'Loyer, Pub, Pertes stock & Frais'
          )}
        </div>
      </div>

      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${(pnl.resultatNet || 0) >= 0 ? THEME.accent.green : THEME.accent.danger}`,
        borderRadius: 12,
        padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: (pnl.resultatNet || 0) >= 0 ? THEME.accent.green : THEME.accent.danger, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          {(pnl.resultatNet || 0) >= 0 ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
          Résultat Net Net
        </div>
        <div style={{
          ...TYPOGRAPHY.statValue,
          color: (pnl.resultatNet || 0) >= 0 ? THEME.accent.green : THEME.accent.danger,
        }}>
          {fmt(pnl.resultatNet)} Ar
        </div>
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2, fontWeight: 500 }}>
          Marge nette : {pct(pnl.margeNettePct)}%
        </div>
      </div>
    </div>
  );
}
