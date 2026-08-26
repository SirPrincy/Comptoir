import React from 'react';
import { Calendar } from 'lucide-react';
import { THEME } from '../colors';
import { PnlPeriode } from './types';

interface PnlFilterBarProps {
  periode: PnlPeriode;
  setPeriode: (p: PnlPeriode) => void;
  dateDebut: string;
  setDateDebut: (d: string) => void;
  dateFin: string;
  setDateFin: (d: string) => void;
  debutStr: string;
  finStr: string;
}

export default function PnlFilterBar({
  periode,
  setPeriode,
  dateDebut,
  setDateDebut,
  dateFin,
  setDateFin,
  debutStr,
  finStr,
}: PnlFilterBarProps) {
  return (
    <>
      {/* Sélecteur de période */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: THEME.bg.soft, padding: 4, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
        {(['all', 'month', 'quarter', 'year', 'custom'] as const).map((p) => {
          const labels = {
            all: 'Tout',
            month: 'Ce Mois',
            quarter: 'Ce Trimestre',
            year: 'Cette Année',
            custom: 'Perso',
          };
          return (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: periode === p ? THEME.accent.primary : 'transparent',
                color: periode === p ? '#FFFFFF' : THEME.text.secondary,
                transition: 'all 0.1s ease',
              }}
            >
              {labels[p]}
            </button>
          );
        })}
      </div>

      {/* Inputs dates personnalisées */}
      {periode === 'custom' && (
        <div style={{
          background: THEME.bg.card,
          border: `1px solid ${THEME.border.base}`,
          borderRadius: 12,
          padding: 12,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} style={{ color: THEME.text.muted }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: THEME.text.secondary }}>Du :</span>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              style={{
                background: THEME.bg.soft,
                border: `1px solid ${THEME.border.base}`,
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 13,
                color: THEME.text.primary,
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: THEME.text.secondary }}>Au :</span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              style={{
                background: THEME.bg.soft,
                border: `1px solid ${THEME.border.base}`,
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 13,
                color: THEME.text.primary,
              }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: THEME.text.muted, marginLeft: 'auto' }}>
            Plage filtrée active pour l'ensemble des indicateurs ci-dessous.
          </div>
        </div>
      )}

      {/* Période active affichée */}
      <div style={{ fontSize: 12, color: THEME.text.muted, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
        <Calendar size={13} />
        Analyse du : <strong style={{ color: THEME.text.primary }}>{debutStr}</strong> au <strong style={{ color: THEME.text.primary }}>{finStr}</strong>
      </div>
    </>
  );
}
