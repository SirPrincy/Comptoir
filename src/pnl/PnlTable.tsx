import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { THEME } from '../colors';
import { PnlData } from './types';
import { calcEvolution, calcPointsEvolution } from './pnlUtils';
import { safeDateDisplay } from '../ui';

interface PnlTableProps {
  pnl: PnlData;
  pnlPrevious?: PnlData | null;
  currentLabel?: string;
  previousLabel?: string;
}

export default function PnlTable({
  pnl,
  pnlPrevious,
  currentLabel = 'Période actuelle',
  previousLabel = 'Période précédente',
}: PnlTableProps) {
  const [showPertesDetails, setShowPertesDetails] = useState(false);

  if (!pnl) return null;

  const fmt = (n: number | undefined | null) => (Number(n) || 0).toLocaleString('fr-FR');
  const pct = (n: number | undefined | null) => (Number(n) || 0).toFixed(1);
  const hasPertes = (pnl.pertesStock || 0) > 0;
  const pertesList = pnl.detailsPertes || [];

  const hasComparison = !!pnlPrevious;

  // Helper pour afficher une ligne financière comparative
  const renderRow = ({
    title,
    currentVal,
    prevVal,
    prefix = '',
    isCharge = false,
    isBold = false,
    isTotal = false,
    isGrandTotal = false,
    currentPct,
    prevPct,
    customColor,
    indent = false,
    onClick,
    cursor,
    leftIcon,
  }: {
    title: React.ReactNode;
    currentVal: number;
    prevVal?: number;
    prefix?: '+' | '-' | '';
    isCharge?: boolean;
    isBold?: boolean;
    isTotal?: boolean;
    isGrandTotal?: boolean;
    currentPct?: number;
    prevPct?: number;
    customColor?: string;
    indent?: boolean;
    onClick?: () => void;
    cursor?: string;
    leftIcon?: React.ReactNode;
  }) => {
    // Évolution
    let evolBadge: React.ReactNode = null;

    if (hasComparison && prevVal !== undefined) {
      if (currentPct !== undefined && prevPct !== undefined) {
        const pEvol = calcPointsEvolution(currentPct, prevPct);
        const Icon = pEvol.trend === 'good' ? TrendingUp : pEvol.trend === 'bad' ? TrendingDown : Minus;
        const color = pEvol.trend === 'good' ? THEME.accent.green : pEvol.trend === 'bad' ? THEME.accent.danger : THEME.text.muted;
        const bg = pEvol.trend === 'good' ? 'rgba(34, 197, 94, 0.12)' : pEvol.trend === 'bad' ? 'rgba(239, 68, 68, 0.12)' : THEME.bg.soft;

        evolBadge = (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: bg, color }}>
            <Icon size={12} />
            {pEvol.formattedPoints}
          </span>
        );
      } else {
        const evol = calcEvolution(currentVal, prevVal, isCharge);
        const Icon = evol.trend === 'good' ? TrendingUp : evol.trend === 'bad' ? TrendingDown : Minus;
        const color = evol.trend === 'good' ? THEME.accent.green : evol.trend === 'bad' ? THEME.accent.danger : THEME.text.muted;
        const bg = evol.trend === 'good' ? 'rgba(34, 197, 94, 0.12)' : evol.trend === 'bad' ? 'rgba(239, 68, 68, 0.12)' : THEME.bg.soft;

        evolBadge = (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: bg, color }}>
            <Icon size={12} />
            {evol.formattedPct}
          </span>
        );
      }
    }

    const currentFormatted = currentPct !== undefined
      ? `${fmt(currentVal)} Ar (${pct(currentPct)}%)`
      : `${prefix}${fmt(currentVal)} Ar`;

    const prevFormatted = prevVal !== undefined
      ? prevPct !== undefined
        ? `${fmt(prevVal)} Ar (${pct(prevPct)}%)`
        : `${prefix}${fmt(prevVal)} Ar`
      : '-';

    return (
      <div
        onClick={onClick}
        style={{
          display: 'grid',
          gridTemplateColumns: hasComparison ? 'minmax(220px, 1fr) 150px 140px 100px' : '1fr auto',
          alignItems: 'center',
          gap: 12,
          padding: isGrandTotal
            ? '14px 16px'
            : isTotal
            ? '11px 16px'
            : '9px 16px 9px ' + (indent ? '28px' : '16px'),
          fontSize: isGrandTotal ? 14.5 : isTotal ? 13.5 : 12.5,
          fontWeight: isGrandTotal ? 800 : isBold || isTotal ? 700 : 400,
          background: isGrandTotal
            ? THEME.bg.card
            : isTotal
            ? THEME.bg.soft
            : 'transparent',
          borderBottom: isGrandTotal
            ? 'none'
            : isTotal
            ? `2px solid ${THEME.border.base}`
            : `1px solid ${THEME.border.base}`,
          color: customColor || (isGrandTotal || isTotal ? THEME.text.primary : THEME.text.secondary),
          cursor: cursor || 'default',
          transition: 'background 0.15s ease',
        }}
      >
        {/* Libellé du poste */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {leftIcon}
          <span>{title}</span>
        </div>

        {/* Valeur actuelle */}
        <div style={{ textAlign: 'right', fontWeight: isGrandTotal || isBold || isTotal ? 700 : 600, color: customColor || (isTotal ? THEME.text.primary : THEME.text.primary) }}>
          {currentFormatted}
        </div>

        {/* Valeur précédente (si comparaison) */}
        {hasComparison && (
          <div style={{ textAlign: 'right', color: THEME.text.muted, fontSize: 12 }}>
            {prevFormatted}
          </div>
        )}

        {/* Badge d'évolution (si comparaison) */}
        {hasComparison && (
          <div style={{ textAlign: 'right' }}>
            {evolBadge}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: THEME.bg.card, borderRadius: 12, border: `1px solid ${THEME.border.base}`, overflow: 'hidden' }}>
      {/* En-tête du tableau */}
      <div style={{
        padding: '12px 16px',
        background: THEME.bg.soft,
        borderBottom: `1px solid ${THEME.border.base}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: THEME.text.primary }}>
            Structure du Compte de Résultat (P&L)
          </h3>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            {hasComparison ? `Comparaison active : ${currentLabel} vs ${previousLabel}` : 'Valeurs en Ariary (Ar)'}
          </div>
        </div>
        <span style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>
          Montants en Ariary (Ar)
        </span>
      </div>

      {/* En-têtes de colonnes si comparaison */}
      {hasComparison && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) 150px 140px 100px',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          background: THEME.bg.soft,
          borderBottom: `1px solid ${THEME.border.base}`,
          fontSize: 11,
          fontWeight: 700,
          color: THEME.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          <div>Poste Comptable</div>
          <div style={{ textAlign: 'right' }}>{currentLabel}</div>
          <div style={{ textAlign: 'right' }}>{previousLabel}</div>
          <div style={{ textAlign: 'right' }}>Évolution</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* I. PRODUITS D'EXPLOITATION */}
        <div style={{ background: THEME.bg.soft, padding: '7px 16px', fontWeight: 700, fontSize: 11.5, color: THEME.text.primary, borderBottom: `1px solid ${THEME.border.base}` }}>
          I. PRODUITS D'EXPLOITATION
        </div>

        {renderRow({
          title: "Chiffre d'Affaires (Ventes réalisées)",
          currentVal: pnl.chiffreAffaires,
          prevVal: pnlPrevious?.chiffreAffaires,
          prefix: '+',
          isCharge: false,
          isBold: true,
          customColor: THEME.accent.green,
          indent: true,
        })}

        {/* II. CHARGES D'EXPLOITATION (COGS) */}
        <div style={{ background: THEME.bg.soft, padding: '7px 16px', fontWeight: 700, fontSize: 11.5, color: THEME.text.primary, borderBottom: `1px solid ${THEME.border.base}`, marginTop: 4 }}>
          II. CHARGES DIRECTES SUR VENTES (COGS)
        </div>

        {renderRow({
          title: "Coût d'achat des marchandises vendues (Articles & transport en Chine)",
          currentVal: pnl.costMarchandises,
          prevVal: pnlPrevious?.costMarchandises,
          prefix: '-',
          isCharge: true,
          customColor: THEME.accent.orange,
          indent: true,
        })}

        {((pnl.fraisTransportChineMarchandises > 0) || ((pnlPrevious?.fraisTransportChineMarchandises || 0) > 0)) && renderRow({
          title: "↳ dont Frais transport frns Chine vers entrepôt Chine",
          currentVal: pnl.fraisTransportChineMarchandises,
          prevVal: pnlPrevious?.fraisTransportChineMarchandises,
          prefix: '-',
          isCharge: true,
          customColor: THEME.text.muted,
          indent: true,
        })}

        {renderRow({
          title: "Fret & logistique d'acheminement international (Chine → Madagascar)",
          currentVal: pnl.fretMarchandises,
          prevVal: pnlPrevious?.fretMarchandises,
          prefix: '-',
          isCharge: true,
          customColor: THEME.accent.orange,
          indent: true,
        })}

        {((pnl.transportLocalMarchandises || 0) > 0 || (pnlPrevious?.transportLocalMarchandises || 0) > 0) && renderRow({
          title: "Transport & logistique locale à Madagascar",
          currentVal: pnl.transportLocalMarchandises || 0,
          prevVal: pnlPrevious?.transportLocalMarchandises || 0,
          prefix: '-',
          isCharge: true,
          customColor: THEME.accent.orange,
          indent: true,
        })}

        {/* MARGE BRUTE */}
        {renderRow({
          title: 'MARGE COMMERCIALE BRUTE',
          currentVal: pnl.margeBrute,
          prevVal: pnlPrevious?.margeBrute,
          currentPct: pnl.margeBrutePct,
          prevPct: pnlPrevious?.margeBrutePct,
          isTotal: true,
          customColor: THEME.accent.green,
        })}

        {/* OPEX Details */}
        {renderRow({
          title: 'Loyer & Charges locatives (`#loyer-charges` & Notes de frais)',
          currentVal: pnl.loyerEtCharges,
          prevVal: pnlPrevious?.loyerEtCharges,
          prefix: '-',
          isCharge: true,
          indent: true,
        })}

        {renderRow({
          title: 'Marketing, Publicité & Ads (`#marketing-pub` & Notes de frais)',
          currentVal: pnl.marketingEtPub,
          prevVal: pnlPrevious?.marketingEtPub,
          prefix: '-',
          isCharge: true,
          indent: true,
        })}

        {renderRow({
          title: 'Déplacements & Logistique générale (`#fret-logistique` & Notes)',
          currentVal: pnl.fretEtLogistique,
          prevVal: pnlPrevious?.fretEtLogistique,
          prefix: '-',
          isCharge: true,
          indent: true,
        })}

        {renderRow({
          title: 'Notes de frais généraux (Repas, fournitures, honoraires...)',
          currentVal: pnl.fraisGenerauxNotes,
          prevVal: pnlPrevious?.fraisGenerauxNotes,
          prefix: '-',
          isCharge: true,
          indent: true,
        })}

        {renderRow({
          title: `Pertes, casse & vols de stock ${(pnl.quantitePertesStock || 0) > 0 ? `(${pnl.quantitePertesStock} pc)` : '(0 pc)'}`,
          currentVal: pnl.pertesStock,
          prevVal: pnlPrevious?.pertesStock,
          prefix: '-',
          isCharge: true,
          indent: true,
          customColor: hasPertes ? THEME.accent.danger : undefined,
          cursor: pertesList.length > 0 ? 'pointer' : 'default',
          onClick: () => pertesList.length > 0 && setShowPertesDetails(!showPertesDetails),
          leftIcon: pertesList.length > 0 ? (
            showPertesDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <AlertCircle size={14} style={{ opacity: 0.5 }} />
          ),
        })}

        {/* Détail des pertes si déplié */}
        {showPertesDetails && pertesList.length > 0 && (
          <div style={{ background: THEME.bg.soft, padding: '8px 20px 10px 40px', borderBottom: `1px solid ${THEME.border.base}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                      · {safeDateDisplay(item.date)}
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

        {(pnl.gainsInventaire || 0) > 0 && renderRow({
          title: "Surplus / Écarts positifs d'inventaire constatés",
          currentVal: pnl.gainsInventaire,
          prevVal: pnlPrevious?.gainsInventaire,
          prefix: '+',
          isCharge: false,
          customColor: THEME.accent.green,
          indent: true,
        })}

        {renderRow({
          title: 'Autres sorties de trésorerie courantes',
          currentVal: pnl.autresSorties,
          prevVal: pnlPrevious?.autresSorties,
          prefix: '-',
          isCharge: true,
          indent: true,
        })}

        {/* TOTAL OPEX */}
        {renderRow({
          title: 'Total des Charges de Fonctionnement (OPEX)',
          currentVal: pnl.totalOpex,
          prevVal: pnlPrevious?.totalOpex,
          prefix: '-',
          isCharge: true,
          isTotal: true,
          customColor: THEME.accent.orange,
        })}

        {/* DOTATION AUX AMORTISSEMENTS */}
        {renderRow({
          title: 'Dotations aux Amortissements des Immobilisations',
          currentVal: Math.round(pnl.dotationAmortissement || 0),
          prevVal: pnlPrevious ? Math.round(pnlPrevious.dotationAmortissement || 0) : undefined,
          prefix: '-',
          isCharge: true,
          customColor: THEME.accent.orange,
          indent: true,
        })}

        {/* III. RESULTAT D'EXPLOITATION */}
        {renderRow({
          title: "III. RÉSULTAT D'EXPLOITATION (EBIT)",
          currentVal: pnl.resultatExploitation,
          prevVal: pnlPrevious?.resultatExploitation,
          isTotal: true,
          isBold: true,
          customColor: (pnl.resultatExploitation || 0) >= 0 ? THEME.accent.green : THEME.accent.danger,
        })}

        {/* IV. CHARGES FINANCIERES */}
        <div style={{ background: THEME.bg.soft, padding: '7px 16px', fontWeight: 700, fontSize: 11.5, color: THEME.text.primary, borderBottom: `1px solid ${THEME.border.base}`, marginTop: 4 }}>
          IV. CHARGES FINANCIÈRES
        </div>

        {renderRow({
          title: "Frais bancaires, commissions & intérêts d'emprunts (`#frais-bancaires`)",
          currentVal: pnl.chargesFinancieres,
          prevVal: pnlPrevious?.chargesFinancieres,
          prefix: '-',
          isCharge: true,
          customColor: THEME.accent.orange,
          indent: true,
        })}

        {/* V. RESULTAT NET */}
        <div style={{
          borderTop: `2px solid ${(pnl.resultatNet || 0) >= 0 ? THEME.accent.green : THEME.accent.danger}`,
          background: THEME.bg.card,
        }}>
          {renderRow({
            title: 'V. RÉSULTAT NET DE LA PÉRIODE',
            currentVal: pnl.resultatNet,
            prevVal: pnlPrevious?.resultatNet,
            currentPct: pnl.margeNettePct,
            prevPct: pnlPrevious?.margeNettePct,
            isGrandTotal: true,
            customColor: (pnl.resultatNet || 0) >= 0 ? THEME.accent.green : THEME.accent.danger,
          })}
        </div>
      </div>
    </div>
  );
}
