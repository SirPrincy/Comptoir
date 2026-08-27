import React, { memo } from 'react';
import { PiggyBank, CheckCircle2, AlertCircle } from 'lucide-react';
import { THEME } from '../colors';
import { Card } from '../ui';

interface InvestmentRoiWidgetProps {
  baseInvestissement: number;
  capitalInvesti: number;
  beneficeNet: number;
  tauxRoi: number;
  tauxRecuperation: number;
  caTotal: number;
  resteARecuperer: number;
}

const InvestmentRoiWidget = memo(function InvestmentRoiWidget({
  baseInvestissement,
  capitalInvesti,
  beneficeNet,
  tauxRoi,
  tauxRecuperation,
  caTotal,
  resteARecuperer,
}: InvestmentRoiWidgetProps) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.accent.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
            <PiggyBank size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: THEME.text.primary }}>Analyse d'Investissement & Rentabilité (ROI)</div>
            <div style={{ fontSize: 12, color: THEME.text.muted }}>Suivi précis du rendement sur capital et du seuil de rentabilité</div>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: THEME.bg.soft, color: THEME.accent.green }}>
          Temps Réel
        </span>
      </div>

      {/* 4 Blocs d'analyse financière */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
        <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
          <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Capital de Base</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: THEME.text.primary, marginTop: 3 }}>
            {baseInvestissement.toLocaleString('fr-FR')} Ar
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
            {capitalInvesti > 0 ? 'Apports déclarés' : 'Dépenses stock + fret'}
          </div>
        </div>

        <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
          <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Bénéfice Net Réalisé</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: beneficeNet >= 0 ? THEME.accent.green : THEME.accent.danger, marginTop: 3 }}>
            {beneficeNet >= 0 ? '+' : ''}{beneficeNet.toLocaleString('fr-FR')} Ar
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
            Marge réelle − charges − pertes stock
          </div>
        </div>

        <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
          <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Taux de Rendement (ROI)</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: tauxRoi >= 0 ? THEME.accent.green : THEME.accent.danger, marginTop: 2 }}>
            {tauxRoi >= 0 ? '+' : ''}{tauxRoi.toFixed(1)} %
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
            Gains nets / Capital investi
          </div>
        </div>

        <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
          <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Récupération du Capital</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: THEME.accent.primary, marginTop: 3 }}>
            {tauxRecuperation.toFixed(0)} %
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
            CA encaissé vs mise de départ
          </div>
        </div>
      </div>

      {/* Barre de progression vers le Seuil de rentabilité */}
      <div style={{ marginTop: 14, background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontWeight: 700, color: THEME.text.primary }}>Progression vers le Seuil de Rentabilité (Point Mort)</span>
          <span style={{ fontWeight: 800, color: THEME.accent.primary }}>
            {caTotal.toLocaleString('fr-FR')} Ar / {baseInvestissement.toLocaleString('fr-FR')} Ar
          </span>
        </div>

        <div style={{ width: '100%', height: 9, background: THEME.border.base, borderRadius: 10, overflow: 'hidden' }}>
          <div
            style={{
              width: `${tauxRecuperation}%`,
              height: '100%',
              background: tauxRecuperation >= 100 ? THEME.accent.green : THEME.accent.orange,
              borderRadius: 10,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ fontSize: 11.5, color: THEME.text.secondary, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {tauxRecuperation >= 100 ? (
            <>
              <CheckCircle2 size={15} style={{ color: THEME.accent.green }} />
              <span style={{ fontWeight: 600, color: THEME.accent.green }}>
                Point mort atteint ! Votre mise initiale est amortie et chaque vente génère du pur profit net.
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={15} style={{ color: THEME.accent.orange }} />
              <span>
                Il reste <strong style={{ color: THEME.text.primary }}>{resteARecuperer.toLocaleString('fr-FR')} Ar</strong> de chiffre d'affaires à encaisser pour atteindre le seuil de rentabilité.
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
});

export default InvestmentRoiWidget;
