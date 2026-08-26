import React from 'react';
import { THEME } from '../colors';
import { BilanData } from './types';

interface BilanPassifProps {
  data: BilanData;
}

export default function BilanPassif({ data }: BilanPassifProps) {
  return (
    <div style={{ background: THEME.bg.card, borderRadius: 12, border: `1px solid ${THEME.border.base}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: THEME.text.primary, fontSize: 14 }}>PASSIF & CAPITAUX PROPRES (Ressources)</span>
        <span style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Ar Net</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* CAPITAUX PROPRES */}
        <div style={{ background: THEME.bg.soft, padding: '6px 12px', fontWeight: 700, fontSize: 11.5, color: THEME.text.secondary }}>
          CAPITAUX PROPRES (Ressources permanentes)
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}` }}>
          <span style={{ color: THEME.text.secondary, display: 'flex', flexDirection: 'column' }}>
            <span>Capital Social & Apports</span>
            <span style={{ fontSize: 10, color: THEME.text.muted }}>Fonds d'amorçage de l'entreprise</span>
          </span>
          <strong style={{ color: THEME.text.primary }}>{Math.round(data.capitalSocialEquilibre).toLocaleString()} Ar</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}` }}>
          <span style={{ color: THEME.text.secondary, display: 'flex', flexDirection: 'column' }}>
            <span>Résultat Net cumulé de l'exercice</span>
            <span style={{ fontSize: 10, color: THEME.text.muted }}>Bénéfices ou pertes accumulés</span>
          </span>
          <strong style={{ color: data.resultatNetCumule >= 0 ? '#047857' : '#B91C1C' }}>
            {Math.round(data.resultatNetCumule).toLocaleString()} Ar
          </strong>
        </div>

        {/* DETTES */}
        <div style={{ background: THEME.bg.soft, padding: '6px 12px', fontWeight: 700, fontSize: 11.5, color: THEME.text.secondary, marginTop: 4 }}>
          DETTES (Ressources empruntées)
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}` }}>
          <span style={{ color: THEME.text.secondary, display: 'flex', flexDirection: 'column' }}>
            <span>Dettes Financières & Emprunts</span>
            <span style={{ fontSize: 10, color: THEME.text.muted }}>Reste du principal dû aux prêteurs</span>
          </span>
          <strong style={{ color: THEME.accent.orange }}>{data.totalDettesFinancieres.toLocaleString()} Ar</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}` }}>
          <span style={{ color: THEME.text.secondary, display: 'flex', flexDirection: 'column' }}>
            <span>Dettes Fournisseurs (Achats de stock restant dus)</span>
            <span style={{ fontSize: 10, color: THEME.text.muted }}>Reliquat à payer sur commandes en cours</span>
          </span>
          <strong style={{ color: THEME.accent.orange }}>{data.totalDettesFournisseurs.toLocaleString()} Ar</strong>
        </div>

        {/* Spacer to align visually with left column */}
        <div style={{ height: 28, background: 'transparent' }} />

        {/* TOTAL PASSIF */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: THEME.bg.soft,
          borderTop: `2px solid ${THEME.border.base}`,
          fontSize: 14,
          fontWeight: 800,
          color: THEME.text.primary,
        }}>
          <span>TOTAL DU PASSIF</span>
          <span>{data.totalPassif.toLocaleString()} Ar</span>
        </div>
      </div>
    </div>
  );
}
