import React from 'react';
import { THEME } from '../colors';
import { PnlData } from './types';

interface PnlTableProps {
  pnl: PnlData;
}

export default function PnlTable({ pnl }: PnlTableProps) {
  if (!pnl) return null;

  const fmt = (n: number | undefined | null) => (Number(n) || 0).toLocaleString('fr-FR');
  const pct = (n: number | undefined | null) => (Number(n) || 0).toFixed(1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: '1fr', gap: 14 }}>
      <div style={{ background: THEME.bg.card, borderRadius: 12, border: `1px solid ${THEME.border.base}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: THEME.text.primary }}>
            Structure du Compte de Résultat (P&L)
          </h3>
          <span style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Valeurs en Ariary (Ar)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* I. PRODUITS D'EXPLOITATION */}
          <div style={{ background: THEME.bg.soft, padding: '8px 16px', fontWeight: 700, fontSize: 12, color: THEME.text.primary, borderBottom: `1px solid ${THEME.border.base}` }}>
            I. PRODUITS D'EXPLOITATION
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 24px', fontSize: 13, borderBottom: `1px solid ${THEME.border.base}` }}>
            <span style={{ color: THEME.text.secondary }}>Chiffre d'Affaires (Ventes réalisées)</span>
            <strong style={{ color: THEME.accent.green }}>+{fmt(pnl.chiffreAffaires)} Ar</strong>
          </div>

          {/* II. CHARGES D'EXPLOITATION */}
          <div style={{ background: THEME.bg.soft, padding: '8px 16px', fontWeight: 700, fontSize: 12, color: THEME.text.primary, borderBottom: `1px solid ${THEME.border.base}`, marginTop: 4 }}>
            II. CHARGES D'EXPLOITATION
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 24px', fontSize: 13, borderBottom: `1px solid ${THEME.border.base}` }}>
            <span style={{ color: THEME.text.secondary }}>Coût d'achat des marchandises vendues (Prix d'achat unitaire d'origine)</span>
            <span style={{ color: THEME.accent.orange, fontWeight: 600 }}>-{fmt(pnl.costMarchandises)} Ar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 24px', fontSize: 13, borderBottom: `1px solid ${THEME.border.base}` }}>
            <span style={{ color: THEME.text.secondary }}>Fret & transport d'acheminement des marchandises vendues</span>
            <span style={{ color: THEME.accent.orange, fontWeight: 600 }}>-{fmt(pnl.fretMarchandises)} Ar</span>
          </div>

          {/* MARGE BRUTE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 13.5, background: THEME.bg.soft, borderBottom: `2px solid ${THEME.border.base}`, fontWeight: 700 }}>
            <span style={{ color: THEME.text.primary }}>MARGE COMMERCIALE BRUTE</span>
            <span style={{ color: THEME.accent.green }}>{fmt(pnl.margeBrute)} Ar ({pct(pnl.margeBrutePct)}%)</span>
          </div>

          {/* OPEX Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
            <span>Loyer & Charges locatives (`#loyer-charges` & Notes de frais)</span>
            <span>-{fmt(pnl.loyerEtCharges)} Ar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
            <span>Marketing, Publicité & Facebook Ads (`#marketing-pub` & Notes de frais)</span>
            <span>-{fmt(pnl.marketingEtPub)} Ar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
            <span>Déplacements & Frais logistiques généraux (`#fret-logistique` & Notes de frais)</span>
            <span>-{fmt(pnl.fretEtLogistique)} Ar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
            <span>Notes de frais généraux (Repas, fournitures, honoraires...)</span>
            <span>-{fmt(pnl.fraisGenerauxNotes)} Ar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}`, color: (pnl.pertesStock || 0) > 0 ? THEME.accent.danger : THEME.text.secondary }}>
            <span>
              Pertes, casse & vols de stock {(pnl.quantitePertesStock || 0) > 0 ? `(${pnl.quantitePertesStock} pièce${(pnl.quantitePertesStock || 0) > 1 ? 's' : ''})` : ''}
            </span>
            <span style={{ fontWeight: (pnl.pertesStock || 0) > 0 ? 700 : 400 }}>-{fmt(pnl.pertesStock)} Ar</span>
          </div>
          {(pnl.gainsInventaire || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.accent.green }}>
              <span>Surplus / Écarts positifs d'inventaire constatés</span>
              <span style={{ fontWeight: 700 }}>+{fmt(pnl.gainsInventaire)} Ar</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
            <span>Autres sorties de trésorerie courantes</span>
            <span>-{fmt(pnl.autresSorties)} Ar</span>
          </div>

          {/* TOTAL OPEX */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 13, background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, fontWeight: 600 }}>
            <span style={{ color: THEME.text.secondary }}>Total des Charges de Fonctionnement (OPEX)</span>
            <span style={{ color: THEME.accent.orange }}>-{fmt(pnl.totalOpex)} Ar</span>
          </div>

          {/* DOTATION AUX AMORTISSEMENTS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 13, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
            <span style={{ fontWeight: 600 }}>Dotations aux Amortissements des Immobilisations</span>
            <span style={{ color: THEME.accent.orange, fontWeight: 600 }}>-{fmt(Math.round(pnl.dotationAmortissement || 0))} Ar</span>
          </div>

          {/* III. RESULTAT D'EXPLOITATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 14, background: THEME.bg.soft, borderBottom: `2px solid ${THEME.border.base}`, fontWeight: 800 }}>
            <span style={{ color: THEME.text.primary }}>III. RÉSULTAT D'EXPLOITATION (EBIT)</span>
            <span style={{ color: (pnl.resultatExploitation || 0) >= 0 ? THEME.accent.green : THEME.accent.danger }}>
              {fmt(pnl.resultatExploitation)} Ar
            </span>
          </div>

          {/* IV. CHARGES FINANCIERES */}
          <div style={{ background: THEME.bg.soft, padding: '8px 16px', fontWeight: 700, fontSize: 12, color: THEME.text.primary, borderBottom: `1px solid ${THEME.border.base}`, marginTop: 4 }}>
            IV. CHARGES FINANCIÈRES
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 24px', fontSize: 13, borderBottom: `1px solid ${THEME.border.base}` }}>
            <span style={{ color: THEME.text.secondary }}>Frais bancaires, commissions & intérêts d'emprunts (`#frais-bancaires`)</span>
            <span style={{ color: THEME.accent.orange, fontWeight: 600 }}>-{fmt(pnl.chargesFinancieres)} Ar</span>
          </div>

          {/* V. RESULTAT NET */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 16px',
            fontSize: 15,
            background: THEME.bg.card,
            border: `1.5px solid ${(pnl.resultatNet || 0) >= 0 ? THEME.accent.green : THEME.accent.danger}`,
            borderRadius: 8,
            marginTop: 4,
            fontWeight: 800,
            color: (pnl.resultatNet || 0) >= 0 ? THEME.accent.green : THEME.accent.danger,
          }}>
            <span>RÉSULTAT NET NET DE LA PÉRIODE</span>
            <span>{fmt(pnl.resultatNet)} Ar ({pct(pnl.margeNettePct)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
