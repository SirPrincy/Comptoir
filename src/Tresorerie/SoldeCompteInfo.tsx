import React, { useState } from 'react';
import { Wallet, ChevronDown, ChevronUp, AlertTriangle, ArrowRight } from 'lucide-react';

interface SoldeCompteInfoProps {
  compteSelectionne: string;
  soldesParCompte: Record<string, number>;
  soldeRmbDispo?: number;
  montantOperation?: number;
  typeOperation?: 'debit' | 'credit'; // 'debit' = dépense/règlement, 'credit' = encaissement/entrée
  activeComptes?: string[];
  deviseOrigine?: string;
  tauxRmb?: number;
}

export default function SoldeCompteInfo({
  compteSelectionne,
  soldesParCompte = {},
  soldeRmbDispo,
  montantOperation = 0,
  typeOperation = 'debit',
  activeComptes = [],
  deviseOrigine,
  tauxRmb = 680,
}: SoldeCompteInfoProps) {
  const [showAllComptes, setShowAllComptes] = useState(false);

  const isRmb = compteSelectionne === 'Réserve RMB (¥)' || compteSelectionne?.toLowerCase().includes('rmb');
  
  // Solde actuel du compte choisi
  const soldeActuel = isRmb
    ? (soldeRmbDispo !== undefined ? soldeRmbDispo : (soldesParCompte[compteSelectionne] || 0))
    : (soldesParCompte[compteSelectionne] || 0);

  // Montant effectif à déduire ou ajouter
  let montantEffectif = Number(montantOperation) || 0;
  if (isRmb && deviseOrigine !== 'RMB' && montantEffectif > 0 && tauxRmb > 0) {
    // Si l'opération a été saisie en Ar mais on débite le compte RMB
    montantEffectif = montantEffectif / tauxRmb;
  }

  const soldeApres = typeOperation === 'debit'
    ? soldeActuel - montantEffectif
    : soldeActuel + montantEffectif;

  const isNegatifApres = soldeApres < 0;

  return (
    <div
      style={{
        background: '#FAF7F2',
        border: '1px solid #EAE2D4',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 12,
        marginTop: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: '#EAE2D4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3D5A6C',
            }}
          >
            <Wallet size={13} />
          </div>
          <div>
            <span style={{ color: '#736B5E', fontSize: 11 }}>Portefeuille {compteSelectionne} :</span>
            <div style={{ fontWeight: 700, color: soldeActuel < 0 ? '#DC2626' : '#26333D', fontSize: 13 }}>
              {isRmb ? `${soldeActuel.toFixed(2)} ¥` : `${soldeActuel.toLocaleString('fr-FR')} Ar`}
            </div>
          </div>
        </div>

        {montantEffectif > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, background: '#FFFFFF', padding: '4px 8px', borderRadius: 6, border: '1px solid #EAE2D4' }}>
            <span style={{ color: '#736B5E' }}>Après {typeOperation === 'debit' ? 'règlement' : 'encaissement'} :</span>
            <ArrowRight size={11} color="#8A8375" />
            <strong style={{ color: isNegatifApres ? '#DC2626' : '#166534', fontWeight: 700 }}>
              {isRmb ? `${soldeApres.toFixed(2)} ¥` : `${soldeApres.toLocaleString('fr-FR')} Ar`}
            </strong>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAllComptes(s => !s)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3D5A6C',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 4px',
            marginLeft: 'auto',
          }}
        >
          <span>{showAllComptes ? 'Masquer' : 'Voir tous les soldes'}</span>
          {showAllComptes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {isNegatifApres && typeOperation === 'debit' && !isRmb && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#B45309', fontSize: 11, marginTop: 6, background: '#FFFBEB', padding: '4px 8px', borderRadius: 4 }}>
          <AlertTriangle size={12} color="#D97706" />
          <span>Attention : le solde de ce compte passera en négatif après cette opération.</span>
        </div>
      )}

      {/* Mini tableau de tous les portefeuilles / comptes */}
      {showAllComptes && activeComptes.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #EAE2D4', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
          {activeComptes.map(compte => {
            const isCompteRmbItem = compte === 'Réserve RMB (¥)' || compte.toLowerCase().includes('rmb');
            const s = isCompteRmbItem
              ? (soldeRmbDispo !== undefined ? soldeRmbDispo : (soldesParCompte[compte] || 0))
              : (soldesParCompte[compte] || 0);
            const isSelected = compte === compteSelectionne;

            return (
              <div
                key={compte}
                style={{
                  background: isSelected ? '#F0F5F2' : '#FFFFFF',
                  border: `1px solid ${isSelected ? '#3F7A5C' : '#EAE2D4'}`,
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11,
                }}
              >
                <div style={{ color: isSelected ? '#1B6A3E' : '#736B5E', fontWeight: isSelected ? 700 : 500 }}>
                  {compte}
                </div>
                <div style={{ fontWeight: 700, color: s < 0 ? '#DC2626' : '#26333D' }}>
                  {isCompteRmbItem ? `${s.toFixed(2)} ¥` : `${s.toLocaleString('fr-FR')} Ar`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
