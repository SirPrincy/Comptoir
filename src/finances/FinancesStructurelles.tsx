import React, { useState } from 'react';
import { Target, Calculator, Landmark, Building2 } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import ChargesFixes, { ChargeFixe } from '../charges/ChargesFixes';
import Immobilisations from '../immobilisations/Immobilisations';
import Emprunts from '../emprunts/Emprunts';

interface FinancesStructurellesProps {
  chargesFixes?: ChargeFixe[];
  immobilisations?: any[];
  emprunts?: any[];
  mouvements?: any[];
  ventes?: any[];
  products?: any[];
  commandes?: any[];
  devises?: { rmb: number; usd: number };
  comptes?: string[];
  updateData: (patch: any) => void;
  initialSubTab?: 'charges-fixes' | 'immobilisations' | 'emprunts';
}

export default function FinancesStructurelles({
  chargesFixes = [],
  immobilisations = [],
  emprunts = [],
  mouvements = [],
  ventes = [],
  products = [],
  commandes = [],
  devises = { rmb: 680, usd: 4600 },
  comptes = [],
  updateData,
  initialSubTab = 'charges-fixes',
}: FinancesStructurellesProps) {
  const [subTab, setSubTab] = useState<'charges-fixes' | 'immobilisations' | 'emprunts'>(
    initialSubTab === 'immobilisations' || initialSubTab === 'emprunts' ? initialSubTab : 'charges-fixes'
  );

  const TABS = [
    { id: 'charges-fixes', label: 'Charges Fixes & Seuil', icon: Target },
    { id: 'immobilisations', label: 'Immobilisations', icon: Calculator },
    { id: 'emprunts', label: 'Emprunts & Dettes', icon: Landmark },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête principal & Navigation par onglets */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 4,
        borderBottom: `1px solid ${THEME.border.base}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: THEME.bg.chip,
            color: THEME.accent.primary,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
          }}>
            <Building2 size={20} />
          </div>
          <div>
            <h1 style={{ ...TYPOGRAPHY.sectionTitle, margin: 0, fontSize: 19, color: THEME.text.primary }}>
              Finances Structurelles
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: THEME.text.muted }}>
              Gestion des charges fixes récurrentes, actifs immobilisés et dettes bancaires / emprunts.
            </p>
          </div>
        </div>

        {/* Boutons d'onglets */}
        <div className="tabs-scrollable" style={{
          display: 'flex',
          background: THEME.bg.soft,
          padding: 3,
          borderRadius: 8,
          border: `1px solid ${THEME.border.base}`,
          gap: 2,
          maxWidth: '100%',
        }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  background: active ? THEME.bg.card : 'transparent',
                  color: active ? THEME.accent.primary : THEME.text.secondary,
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} style={{ color: active ? THEME.accent.primary : THEME.text.muted }} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu de l'onglets sélectionné */}
      {subTab === 'charges-fixes' && (
        <ChargesFixes
          chargesFixes={chargesFixes}
          ventes={ventes}
          products={products}
          commandes={commandes}
          updateData={updateData}
        />
      )}

      {subTab === 'immobilisations' && (
        <Immobilisations
          immobilisations={immobilisations}
          mouvements={mouvements}
          devises={devises}
          updateData={updateData}
          comptes={comptes}
        />
      )}

      {subTab === 'emprunts' && (
        <Emprunts
          emprunts={emprunts}
          mouvements={mouvements}
          updateData={updateData}
          comptes={comptes}
        />
      )}
    </div>
  );
}
