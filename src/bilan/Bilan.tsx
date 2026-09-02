import React, { useMemo } from 'react';
import { Scale, Award } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { BilanProps } from './types';
import { computeBilanData } from './bilanUtils';
import BilanActif from './BilanActif';
import BilanPassif from './BilanPassif';
import BilanNotes from './BilanNotes';

export default function Bilan({
  products = [],
  ventes = [],
  commandes = [],
  mouvements = [],
  immobilisations = [],
  emprunts = [],
  comptes = [],
  devises = { rmb: 680, usd: 4600 },
  paiements = [],
}: BilanProps) {
  const bilanData = useMemo(() => {
    return computeBilanData(
      products,
      ventes,
      commandes,
      mouvements,
      immobilisations,
      emprunts,
      comptes,
      devises,
      paiements
    );
  }, [products, ventes, commandes, mouvements, immobilisations, emprunts, comptes, devises, paiements]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scale size={20} style={{ color: THEME.accent.primary }} />
            Bilan Comptable Estimé
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: THEME.text.muted }}>
            État du patrimoine de l’entreprise à l'instant T (Photo de l'Actif possédé et du Passif dû).
          </p>
        </div>
      </div>

      {/* Alerte équilibre obligatoire */}
      <div style={{
        background: THEME.bg.soft,
        border: `1px solid ${THEME.border.strong}`,
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12.5,
        color: THEME.accent.green,
        fontWeight: 600,
      }}>
        <Award size={16} />
        <div>
          Règle d'or de la partie double respectée : <strong>Total Actif</strong> ({bilanData.totalActif.toLocaleString()} Ar) est rigoureusement égal à <strong>Total Passif & Capitaux Propres</strong> ({bilanData.totalPassif.toLocaleString()} Ar).
        </div>
      </div>

      {/* Deux colonnes : Actif à gauche, Passif à droite */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <BilanActif data={bilanData} />
        <BilanPassif data={bilanData} />
      </div>

      {/* Note d'interprétation patrimoniale */}
      <BilanNotes />
    </div>
  );
}

export * from './types';
export * from './bilanUtils';
