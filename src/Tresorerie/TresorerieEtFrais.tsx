import React, { useState } from 'react';
import { Wallet, FileText, ArrowLeftRight } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import Tresorerie from './index';
import NotesDeFrais from '../frais/NotesDeFrais';
import ChangeRMB from '../change/ChangeRMB';

interface TresorerieEtFraisProps {
  ventes?: any[];
  commandes?: any[];
  products?: any[];
  fournisseurs?: any[];
  clients?: any[];
  mouvements?: any[];
  changes?: any[];
  devises?: { rmb: number; usd: number };
  frais?: any[];
  comptes?: string[];
  paiements?: any[];
  updateData: (patch: any) => void;
  initialSubTab?: 'tresorerie' | 'frais' | 'change';
}

export default function TresorerieEtFrais({
  ventes = [],
  commandes = [],
  products = [],
  fournisseurs = [],
  clients = [],
  mouvements = [],
  changes = [],
  devises = { rmb: 680, usd: 4600 },
  frais = [],
  comptes = [],
  paiements = [],
  updateData,
  initialSubTab = 'tresorerie',
}: TresorerieEtFraisProps) {
  const [subTab, setSubTab] = useState<'tresorerie' | 'frais' | 'change'>(
    initialSubTab === 'frais' || initialSubTab === 'change' ? initialSubTab : 'tresorerie'
  );

  const TABS = [
    { id: 'tresorerie', label: 'Trésorerie & Mouvements', icon: Wallet },
    { id: 'change', label: 'Change RMB', icon: ArrowLeftRight },
    { id: 'frais', label: 'Notes de Frais', icon: FileText },
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
            <Wallet size={20} />
          </div>
          <div>
            <h1 style={{ ...TYPOGRAPHY.sectionTitle, margin: 0, fontSize: 19, color: THEME.text.primary }}>
              Trésorerie & Devises
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: THEME.text.muted }}>
              Gestion des comptes financiers, opérations de change RMB et notes de frais.
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
      {subTab === 'tresorerie' && (
        <Tresorerie
          ventes={ventes}
          commandes={commandes}
          products={products}
          fournisseurs={fournisseurs}
          clients={clients}
          mouvements={mouvements}
          changes={changes}
          devises={devises}
          updateData={updateData}
          comptes={comptes}
          paiements={paiements}
        />
      )}

      {subTab === 'change' && (
        <ChangeRMB
          changes={changes}
          mouvements={mouvements}
          commandes={commandes}
          devises={devises}
          fournisseurs={fournisseurs}
          updateData={updateData}
          comptes={comptes}
          paiements={paiements}
        />
      )}

      {subTab === 'frais' && (
        <NotesDeFrais
          frais={frais}
          mouvements={mouvements}
          comptes={comptes}
          updateData={updateData}
        />
      )}
    </div>
  );
}
