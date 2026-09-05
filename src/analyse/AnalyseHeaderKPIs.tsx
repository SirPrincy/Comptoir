import React, { memo } from 'react';
import { ShoppingCart, Zap, TrendingUp, Compass, Package, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { THEME } from '../colors';
import { RADIUS, SHADOWS } from '../ui';
import { AnalysisGlobalKpis } from './types';
import { formatAr, formatRmb } from './analyseUtils';

interface Props {
  kpis: AnalysisGlobalKpis;
}

export const AnalyseHeaderKPIs = memo(function AnalyseHeaderKPIs({ kpis }: Props) {
  const isMargePositive = kpis.margeBruteTotaleAr >= 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: 12,
      marginBottom: 20
    }}>
      {/* 1. Dépenses d'Achats & Sourcing */}
      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.base}`,
        borderRadius: RADIUS.card,
        padding: '16px 18px',
        boxShadow: SHADOWS.card,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.secondary }}>
            Budget Achats Engagé
          </span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.control,
            background: 'rgba(217, 119, 6, 0.12)',
            color: THEME.brand.amber,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingCart size={17} />
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: THEME.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {formatAr(kpis.totalAchatsAr)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.text.muted }}>
          <span style={{ fontWeight: 600, color: THEME.brand.amber }}>{kpis.totalCommandesAchat} cdes</span>
          <span>•</span>
          <span>{formatRmb(kpis.totalAchatsRmb)}</span>
        </div>
      </div>

      {/* 2. Chiffre d'Affaires Ventes */}
      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.base}`,
        borderRadius: RADIUS.card,
        padding: '16px 18px',
        boxShadow: SHADOWS.card,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.secondary }}>
            Chiffre d'Affaires Ventes
          </span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.control,
            background: 'rgba(37, 99, 235, 0.12)',
            color: THEME.brand.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={17} />
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: THEME.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {formatAr(kpis.totalVentesAr)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.text.muted }}>
          <span style={{ fontWeight: 600, color: THEME.brand.blue }}>{kpis.totalPiecesVendues} pcs vendues</span>
          <span>•</span>
          <span>Coût marchandise: {formatAr(kpis.totalCogsAr)}</span>
        </div>
      </div>

      {/* 3. Marge Brute Réalisée */}
      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.base}`,
        borderRadius: RADIUS.card,
        padding: '16px 18px',
        boxShadow: SHADOWS.card,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.secondary }}>
            Marge Brute Réalisée
          </span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.control,
            background: isMargePositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: isMargePositive ? THEME.brand.emerald : THEME.brand.red,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={17} />
          </div>
        </div>
        <div style={{
          fontSize: 20,
          fontWeight: 800,
          color: isMargePositive ? THEME.brand.emerald : THEME.brand.red,
          letterSpacing: '-0.02em',
          marginBottom: 4
        }}>
          {formatAr(kpis.margeBruteTotaleAr)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.text.muted }}>
          <span style={{
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: RADIUS.tag,
            background: isMargePositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isMargePositive ? THEME.brand.emerald : THEME.brand.red
          }}>
            {kpis.tauxMargeMoyenPct}% de marge
          </span>
          <span>sur le CA</span>
        </div>
      </div>

      {/* 4. Source d'Achat N°1 */}
      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.base}`,
        borderRadius: RADIUS.card,
        padding: '16px 18px',
        boxShadow: SHADOWS.card,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.secondary }}>
            Source d'Achat Principale
          </span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.control,
            background: 'rgba(147, 51, 234, 0.12)',
            color: '#9333EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Compass size={17} />
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text.primary, letterSpacing: '-0.01em', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {kpis.sourceTopBudget?.source || 'Aucun achat'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.text.muted }}>
          {kpis.sourceTopBudget ? (
            <>
              <span style={{ fontWeight: 700, color: '#9333EA' }}>{kpis.sourceTopBudget.pct}% du budget</span>
              <span>•</span>
              <span>{formatAr(kpis.sourceTopBudget.montantAr)}</span>
            </>
          ) : (
            <span>Pas de commande enregistrée</span>
          )}
        </div>
      </div>

      {/* 5. Taux d'Écoulement du Stock */}
      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.base}`,
        borderRadius: RADIUS.card,
        padding: '16px 18px',
        boxShadow: SHADOWS.card,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.secondary }}>
            Écoulement Global Stock
          </span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.control,
            background: 'rgba(16, 185, 129, 0.12)',
            color: THEME.brand.emerald,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={17} />
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: THEME.text.primary, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {kpis.tauxEcoulementGlobalPct}%
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.text.muted }}>
          <div style={{ flex: 1, height: 5, background: THEME.bg.surface, borderRadius: RADIUS.pill, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, kpis.tauxEcoulementGlobalPct)}%`,
              height: '100%',
              background: THEME.brand.emerald,
              borderRadius: RADIUS.pill
            }} />
          </div>
          <span>vendus</span>
        </div>
      </div>
    </div>
  );
});
