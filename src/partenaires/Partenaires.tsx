import React, { useState } from 'react';
import { Factory, Users, UserCheck } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import Fournisseurs from '../fournisseurs/Fournisseurs';
import Clients from '../clients/Clients';

interface PartenairesProps {
  fournisseurs?: any[];
  clients?: any[];
  commandes?: any[];
  ventes?: any[];
  products?: any[];
  updateData: (patch: any) => void;
  initialSubTab?: 'fournisseurs' | 'clients';
  initialSearch?: string;
  paiements?: any[];
}

export default function Partenaires({
  fournisseurs = [],
  clients = [],
  commandes = [],
  ventes = [],
  products = [],
  updateData,
  initialSubTab = 'fournisseurs',
  initialSearch = '',
  paiements = [],
}: PartenairesProps) {
  const [subTab, setSubTab] = useState<'fournisseurs' | 'clients'>(
    initialSubTab === 'clients' ? 'clients' : 'fournisseurs'
  );

  React.useEffect(() => {
    if (initialSearch) {
      // Check if query matches a client or supplier
      const q = initialSearch.toLowerCase();
      const matchClient = clients.some((c: any) => c.nom && c.nom.toLowerCase().includes(q));
      if (matchClient) {
        setSubTab('clients');
      }
    }
  }, [initialSearch, clients]);

  const TABS = [
    { id: 'fournisseurs', label: 'Fournisseurs', icon: Factory },
    { id: 'clients', label: 'Clients B2B / Pro', icon: Users },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête principal & Navigation par onglets */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
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
            <UserCheck size={20} />
          </div>
          <div>
            <h1 style={{ ...TYPOGRAPHY.sectionTitle, margin: 0, fontSize: 19, color: THEME.text.primary }}>
              Fournisseurs & Clients
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: THEME.text.muted }}>
              Gestion du carnet de partenaires commerciaux (Fournisseurs Chine/Locaux et Clients B2B).
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
      {subTab === 'fournisseurs' && (
        <Fournisseurs
          fournisseurs={fournisseurs}
          commandes={commandes}
          products={products}
          updateData={updateData}
          initialSearch={initialSearch}
          paiements={paiements}
        />
      )}

      {subTab === 'clients' && (
        <Clients
          clients={clients}
          ventes={ventes}
          products={products}
          updateData={updateData}
          initialSearch={initialSearch}
          paiements={paiements}
        />
      )}
    </div>
  );
}
