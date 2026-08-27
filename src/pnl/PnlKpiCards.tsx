import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Percent, ShieldCheck, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { PnlData } from './types';
import { calcEvolution, calcPointsEvolution } from './pnlUtils';

interface PnlKpiCardsProps {
  pnl: PnlData;
  pnlPrevious?: PnlData | null;
  previousLabel?: string;
}

export default function PnlKpiCards({ pnl, pnlPrevious, previousLabel }: PnlKpiCardsProps) {
  if (!pnl) return null;

  const fmt = (n: number | undefined | null) => (Number(n) || 0).toLocaleString('fr-FR');
  const pct = (n: number | undefined | null) => (Number(n) || 0).toFixed(1);

  // Évolutions période sur période
  const caEvol = pnlPrevious ? calcEvolution(pnl.chiffreAffaires, pnlPrevious.chiffreAffaires, false) : null;
  const margePctEvol = pnlPrevious ? calcPointsEvolution(pnl.margeBrutePct, pnlPrevious.margeBrutePct) : null;
  const opexEvol = pnlPrevious ? calcEvolution(pnl.totalOpex, pnlPrevious.totalOpex, true) : null;
  const netEvol = pnlPrevious ? calcEvolution(pnl.resultatNet, pnlPrevious.resultatNet, false) : null;

  const renderBadge = (
    evol: { formattedPct?: string; formattedPoints?: string; trend: 'good' | 'bad' | 'neutral' } | null,
    prevValFormatted?: string
  ) => {
    if (!evol || !pnlPrevious) return null;
    const text = evol.formattedPct || evol.formattedPoints || '';
    const isGood = evol.trend === 'good';
    const isBad = evol.trend === 'bad';

    const bg = isGood
      ? 'rgba(34, 197, 94, 0.12)'
      : isBad
      ? 'rgba(239, 68, 68, 0.12)'
      : THEME.bg.soft;
    const color = isGood
      ? THEME.accent.green
      : isBad
      ? THEME.accent.danger
      : THEME.text.muted;

    const Icon = isGood ? TrendingUp : isBad ? TrendingDown : Minus;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            background: bg,
            color,
          }}
        >
          <Icon size={12} />
          {text}
        </span>
        {prevValFormatted && (
          <span style={{ fontSize: 10.5, color: THEME.text.muted }}>
            vs {prevValFormatted}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
      {/* 1. CHIFFRE D'AFFAIRES */}
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <ArrowUpRight size={14} style={{ color: THEME.accent.green }} />
          Chiffre d'Affaires
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.text.primary }}>
          {fmt(pnl.chiffreAffaires)} Ar
        </div>
        {renderBadge(caEvol, pnlPrevious ? `${fmt(pnlPrevious.chiffreAffaires)} Ar` : undefined)}
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: pnlPrevious ? 2 : 2 }}>
          Total des ventes enregistrées
        </div>
      </div>

      {/* 2. MARGE BRUTE % */}
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <Percent size={14} style={{ color: THEME.accent.primary }} />
          Marge Brute %
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.primary }}>
          {pct(pnl.margeBrutePct)}%
        </div>
        {renderBadge(margePctEvol, pnlPrevious ? `${pct(pnlPrevious.margeBrutePct)}%` : undefined)}
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: pnlPrevious ? 2 : 2 }}>
          Marge après coût de revient
        </div>
      </div>

      {/* 3. CHARGES GENERALES */}
      <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
          <ArrowDownLeft size={14} style={{ color: THEME.accent.orange }} />
          Charges Générales
        </div>
        <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.orange }}>
          {fmt(pnl.totalOpex)} Ar
        </div>
        {renderBadge(opexEvol, pnlPrevious ? `${fmt(pnlPrevious.totalOpex)} Ar` : undefined)}
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: pnlPrevious ? 2 : 2 }}>
          {(pnl.pertesStock || 0) > 0 ? (
            <span style={{ color: THEME.accent.danger }}>
              Dont {fmt(pnl.pertesStock)} Ar pertes stock
            </span>
          ) : (
            'Loyer, Pub, Pertes stock & Frais'
          )}
        </div>
      </div>

      {/* 4. RESULTAT NET */}
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
        {renderBadge(netEvol, pnlPrevious ? `${fmt(pnlPrevious.resultatNet)} Ar` : undefined)}
        <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: pnlPrevious ? 2 : 2, fontWeight: 500 }}>
          Marge nette : {pct(pnl.margeNettePct)}% {pnlPrevious && `(vs ${pct(pnlPrevious.margeNettePct)}%)`}
        </div>
      </div>
    </div>
  );
}
