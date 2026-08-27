import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { THEME } from '../colors';
import { PnlData } from './types';

interface PnlTableProps {
  pnl: PnlData;
}

export default function PnlTable({ pnl }: PnlTableProps) {
  const [showPertesDetails, setShowPertesDetails] = useState(false);

  if (!pnl) return null;

  const fmt = (n: number | undefined | null) => (Number(n) || 0).toLocaleString('fr-FR');
  const pct = (n: number | undefined | null) => (Number(n) || 0).toFixed(1);
  const hasPertes = (pnl.pertesStock || 0) > 0;
  const pertesList = pnl.detailsPertes || [];

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
          <div
            onClick={() => pertesList.length > 0 && setShowPertesDetails(!showPertesDetails)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '9px 24px',
              fontSize: 12.5,
              borderBottom: `1px solid ${THEME.border.base}`,
              color: hasPertes ? THEME.accent.danger : THEME.text.secondary,
              cursor: pertesList.length > 0 ? 'pointer' : 'default',
              background: hasPertes ? 'rgba(194, 74, 63, 0.04)' : 'transparent',
              transition: 'background 0.15s ease',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: hasPertes ? 600 : 400 }}>
              {pertesList.length > 0 ? (
                showPertesDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : (
                <AlertCircle size={14} style={{ opacity: 0.6 }} />
              )}
              Pertes, casse & vols de stock {(pnl.quantitePertesStock || 0) > 0 ? `(${pnl.quantitePertesStock} pièce${(pnl.quantitePertesStock || 0) > 1 ? 's' : ''})` : '(0 pièce)'}
            </span>
            <span style={{ fontWeight: hasPertes ? 700 : 400 }}>
              {hasPertes ? `-${fmt(pnl.pertesStock)} Ar` : '0 Ar'}
            </span>
          </div>

          {showPertesDetails && pertesList.length > 0 && (
            <div style={{ background: THEME.bg.soft, padding: '8px 24px 10px 42px', borderBottom: `1px solid ${THEME.border.base}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Détail des pertes constatées sur la période :
              </div>
              {pertesList.map((item, idx) => (
                <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '3px 0', borderBottom: idx < pertesList.length - 1 ? `1px dashed ${THEME.border.base}` : 'none' }}>
                  <div>
                    <strong style={{ color: THEME.text.primary }}>{item.productNom}</strong>
                    <span style={{ color: THEME.text.muted, marginLeft: 6 }}>({item.motif})</span>
                    {item.date && (
                      <span style={{ color: THEME.text.muted, fontSize: 10.5, marginLeft: 6 }}>
                        · {new Date(item.date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, color: THEME.accent.danger }}>
                    {item.delta} pc ({fmt(item.valTotale)} Ar)
                  </div>
                </div>
              ))}
            </div>
          )}

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
