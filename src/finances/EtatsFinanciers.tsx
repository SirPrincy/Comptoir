import React, { useState } from 'react';
import { TrendingUp, Scale, FileSpreadsheet } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import ProfitLoss from '../pnl/ProfitLoss';
import Bilan from '../bilan/Bilan';

interface EtatsFinanciersProps {
  products?: any[];
  ventes?: any[];
  commandes?: any[];
  mouvements?: any[];
  frais?: any[];
  immobilisations?: any[];
  emprunts?: any[];
  comptes?: string[];
  devises?: { rmb: number; usd: number };
  initialSubTab?: 'pnl' | 'bilan';
}

export default function EtatsFinanciers({
  products = [],
  ventes = [],
  commandes = [],
  mouvements = [],
  frais = [],
  immobilisations = [],
  emprunts = [],
  comptes = [],
  devises = { rmb: 680, usd: 4600 },
  initialSubTab = 'pnl',
}: EtatsFinanciersProps) {
  const [subTab, setSubTab] = useState<'pnl' | 'bilan'>(
    initialSubTab === 'bilan' ? 'bilan' : 'pnl'
  );

  const TABS = [
    { id: 'pnl', label: 'Compte de Résultat (P&L)', icon: TrendingUp },
    { id: 'bilan', label: 'Bilan Comptable', icon: Scale },
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
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h1 style={{ ...TYPOGRAPHY.sectionTitle, margin: 0, fontSize: 19, color: THEME.text.primary }}>
              États Financiers
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: THEME.text.muted }}>
              P&L analytique (Compte de résultat) et Bilan comptable synthétique de l'entreprise.
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
                  padding: '7px 14px',
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

      {/* Contenu de l'onglet sélectionné */}
      {subTab === 'pnl' && (
        <ProfitLoss
          products={products}
          ventes={ventes}
          commandes={commandes}
          mouvements={mouvements}
          frais={frais}
          immobilisations={immobilisations}
          devises={devises}
        />
      )}

      {subTab === 'bilan' && (
        <Bilan
          products={products}
          ventes={ventes}
          commandes={commandes}
          mouvements={mouvements}
          immobilisations={immobilisations}
          emprunts={emprunts}
          comptes={comptes}
          devises={devises}
        />
      )}
    </div>
  );
}
