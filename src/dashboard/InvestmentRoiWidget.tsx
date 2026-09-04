import React, { memo } from 'react';
import { PiggyBank, CheckCircle2, AlertCircle, TrendingUp, ShieldCheck } from 'lucide-react';
import { THEME } from '../colors';
import { FONTS } from '../fonts';
import { Card, RADIUS, SHADOWS } from '../ui';

interface InvestmentRoiWidgetProps {
  baseInvestissement: number;
  capitalInvesti: number;
  totalApportsCapital?: number;
  totalRetraitsCapital?: number;
  beneficeNet: number;
  tauxRoi: number;
  tauxRecuperation: number;
  caTotal: number;
  resteARecuperer: number;
}

const InvestmentRoiWidget = memo(function InvestmentRoiWidget({
  baseInvestissement,
  capitalInvesti,
  totalApportsCapital = 0,
  totalRetraitsCapital = 0,
  beneficeNet,
  tauxRoi,
  tauxRecuperation,
  caTotal,
  resteARecuperer,
}: InvestmentRoiWidgetProps) {
  const isBreakEven = tauxRecuperation >= 100;

  return (
    <Card>
      {/* En-tête Dense Pro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: RADIUS.control, background: `${THEME.brand.emerald}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PiggyBank size={15} color={THEME.brand.emerald} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: THEME.text.primary, fontFamily: FONTS.display }}>Analyse d'Investissement & Rentabilité (ROI)</div>
            <div style={{ fontSize: 11, color: THEME.text.muted }}>Rendement sur capital engagé & suivi temps réel du point mort</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontFamily: FONTS.mono, fontWeight: 700, padding: '2px 8px', borderRadius: RADIUS.tag, background: isBreakEven ? `${THEME.brand.emerald}18` : `${THEME.brand.amber}18`, color: isBreakEven ? THEME.brand.emerald : THEME.brand.amber, border: `1px solid ${isBreakEven ? THEME.brand.emerald : THEME.brand.amber}40` }}>
            {isBreakEven ? 'Point Mort Validé' : 'En Amortissement'}
          </span>
        </div>
      </div>

      {/* Cockpit Asymétrique : 65% métriques financières + 35% Seuil de rentabilité jauge */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 12, alignItems: 'stretch' }}>
        {/* Grille 2x2 Dense des 4 métriques capitales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: THEME.bg.surface, padding: '9px 11px', borderRadius: RADIUS.item, border: `1px solid ${THEME.border.base}` }}>
            <div style={{ fontSize: 10, color: THEME.text.muted, fontWeight: 700, textTransform: 'uppercase', fontFamily: FONTS.mono }}>Capital de Base</div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16, color: THEME.brand.terracotta, marginTop: 2 }}>
              {baseInvestissement.toLocaleString('fr-FR')} <span style={{ fontSize: 11, fontFamily: FONTS.mono, fontWeight: 500 }}>Ar</span>
            </div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              {totalRetraitsCapital > 0
                ? (totalApportsCapital > 0
                    ? `Net apports (${totalApportsCapital.toLocaleString('fr-FR')} − ${totalRetraitsCapital.toLocaleString('fr-FR')} Ar)`
                    : `Net débours (−${totalRetraitsCapital.toLocaleString('fr-FR')} Ar retirés)`)
                : (capitalInvesti > 0 ? 'Apports déclarés' : 'Dépenses stock + fret')}
            </div>
          </div>

          <div style={{ background: THEME.bg.surface, padding: '9px 11px', borderRadius: RADIUS.item, border: `1px solid ${THEME.border.base}` }}>
            <div style={{ fontSize: 10, color: THEME.text.muted, fontWeight: 700, textTransform: 'uppercase', fontFamily: FONTS.mono }}>Bénéfice Net</div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16, color: beneficeNet >= 0 ? THEME.brand.emerald : THEME.accent.danger, marginTop: 2 }}>
              {beneficeNet >= 0 ? '+' : ''}{beneficeNet.toLocaleString('fr-FR')} <span style={{ fontSize: 11, fontFamily: FONTS.mono, fontWeight: 500 }}>Ar</span>
            </div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              Marge réelle − charges
            </div>
          </div>

          <div style={{ background: THEME.bg.surface, padding: '9px 11px', borderRadius: RADIUS.item, border: `1px solid ${THEME.border.base}` }}>
            <div style={{ fontSize: 10, color: THEME.text.muted, fontWeight: 700, textTransform: 'uppercase', fontFamily: FONTS.mono }}>Rendement (ROI)</div>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 800, fontSize: 16, color: tauxRoi >= 0 ? THEME.brand.emerald : THEME.accent.danger, marginTop: 2 }}>
              {tauxRoi >= 0 ? '+' : ''}{tauxRoi.toFixed(1)} %
            </div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              Gains nets / Capital investi
            </div>
          </div>

          <div style={{ background: THEME.bg.surface, padding: '9px 11px', borderRadius: RADIUS.item, border: `1px solid ${THEME.border.base}` }}>
            <div style={{ fontSize: 10, color: THEME.text.muted, fontWeight: 700, textTransform: 'uppercase', fontFamily: FONTS.mono }}>Taux Recouvrement</div>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 800, fontSize: 16, color: THEME.brand.navy, marginTop: 2 }}>
              {tauxRecuperation.toFixed(0)} %
            </div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              CA encaissé vs mise
            </div>
          </div>
        </div>

        {/* Console Jauge Point Mort */}
        <div style={{ background: THEME.bg.surface, padding: '10px 12px', borderRadius: RADIUS.item, border: `1px solid ${THEME.border.base}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: THEME.text.primary, fontFamily: FONTS.display }}>Point Mort</span>
              <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: THEME.brand.navy, fontSize: 10.5 }}>
                {caTotal.toLocaleString('fr-FR')} / {baseInvestissement.toLocaleString('fr-FR')} Ar
              </span>
            </div>

            <div style={{ width: '100%', height: 7, background: THEME.border.base, borderRadius: RADIUS.pill, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, tauxRecuperation))}%`,
                  height: '100%',
                  background: isBreakEven ? THEME.brand.emerald : THEME.brand.amber,
                  borderRadius: RADIUS.pill,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: 10.5, color: THEME.text.secondary, marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            {isBreakEven ? (
              <>
                <CheckCircle2 size={14} style={{ color: THEME.brand.emerald, flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: THEME.brand.emerald, fontWeight: 600, lineHeight: 1.35 }}>
                  Point mort atteint ! Votre mise initiale est amortie et chaque vente génère du bénéfice pur.
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={14} style={{ color: THEME.brand.amber, flexShrink: 0, marginTop: 1 }} />
                <span style={{ lineHeight: 1.35 }}>
                  Reste <strong style={{ color: THEME.text.primary, fontFamily: FONTS.mono }}>{resteARecuperer.toLocaleString('fr-FR')} Ar</strong> de CA pour atteindre le seuil de rentabilité.
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

export default InvestmentRoiWidget;

