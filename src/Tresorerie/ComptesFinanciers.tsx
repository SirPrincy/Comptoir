import React, { useState } from 'react';
import { ArrowRightLeft, Smartphone, Landmark, Wallet, Banknote, Coins, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { COMPTES_FINANCIERS } from '../constants';
import { Modal, ghostBtn, primaryBtn } from '../ui';

interface ComptesFinanciersProps {
  soldesParCompte: Record<string, number>;
  filtreCompte: string;
  setFiltreCompte: (compte: string) => void;
  onOpenTransfert: () => void;
  soldeRmb?: number;
  valeurRmbAr?: number;
  comptes?: string[];
  updateData?: (patch: any) => void;
}

export function getAccountIcon(accountName: string) {
  if (accountName?.toLowerCase().includes('rmb') || accountName?.toLowerCase().includes('yuan')) {
    return <Coins size={13} style={{ color: '#B78103' }} />;
  }
  if (
    accountName?.toLowerCase().includes('mvola') ||
    accountName?.toLowerCase().includes('orange') ||
    accountName?.toLowerCase().includes('airtel')
  ) {
    return <Smartphone size={13} style={{ color: '#E8985E' }} />;
  }
  if (
    accountName?.toLowerCase().includes('banque') ||
    accountName?.toLowerCase().includes('bni') ||
    accountName?.toLowerCase().includes('boa')
  ) {
    return <Landmark size={13} style={{ color: '#3D5A6C' }} />;
  }
  if (accountName?.toLowerCase().includes('invest')) {
    return <Wallet size={13} style={{ color: '#3F7A5C' }} />;
  }
  return <Banknote size={13} style={{ color: '#8A8375' }} />;
}

export default function ComptesFinanciers({
  soldesParCompte,
  filtreCompte,
  setFiltreCompte,
  onOpenTransfert,
  soldeRmb = 0,
  valeurRmbAr = 0,
  comptes,
  updateData,
}: ComptesFinanciersProps) {
  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;
  const [showAdd, setShowAdd] = useState(false);
  const [newCompteName, setNewCompteName] = useState('');
  const [addError, setAddError] = useState('');
  const [compteToDelete, setCompteToDelete] = useState<string | null>(null);

  const handleAddCompte = () => {
    const trimmed = newCompteName.trim();
    if (!trimmed) return;
    if (activeComptes.includes(trimmed)) {
      setAddError('Ce compte existe déjà.');
      return;
    }
    const nextComptes = [...activeComptes, trimmed];
    if (updateData) {
      updateData({ comptes: nextComptes });
    }
    setNewCompteName('');
    setAddError('');
    setShowAdd(false);
  };

  const handleDeleteCompte = (e: React.MouseEvent, cName: string) => {
    e.stopPropagation();
    if (activeComptes.length <= 1) {
      return;
    }
    setCompteToDelete(cName);
  };

  const confirmDeleteCompte = () => {
    if (!compteToDelete) return;
    const nextComptes = activeComptes.filter(c => c !== compteToDelete);
    if (updateData) {
      updateData({ comptes: nextComptes });
    }
    if (filtreCompte === compteToDelete) {
      setFiltreCompte('all');
    }
    setCompteToDelete(null);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8A8375', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Portefeuilles & Comptes ({activeComptes.length})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              color: '#2C5E43',
              background: '#E0EFE6',
              border: '1px solid #B8D6C4',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            <Plus size={12} />
            Créer un compte
          </button>
          <button
            onClick={onOpenTransfert}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              color: '#3D5A6C',
              background: '#FFFFFF',
              border: '1px solid #EAE2D4',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            <ArrowRightLeft size={12} />
            Transfert inter-comptes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
        {activeComptes.map(compte => {
          const isRmbCompte = compte.toLowerCase().includes('rmb') || compte.toLowerCase().includes('yuan');
          const soldeCompte = isRmbCompte ? soldeRmb : (soldesParCompte[compte] || 0);
          const isPositif = soldeCompte >= 0;
          const isSelected = filtreCompte === compte;
          return (
            <div
              key={compte}
              onClick={() => setFiltreCompte(isSelected ? 'all' : compte)}
              style={{
                background: isSelected ? '#F5EFE6' : '#FFFFFF',
                border: `1.5px solid ${isSelected ? '#3D5A6C' : '#EAE2D4'}`,
                borderRadius: 8,
                padding: '8px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#5E584E', fontWeight: 600, overflow: 'hidden' }}>
                  {getAccountIcon(compte)}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{compte}</span>
                </div>
                {updateData && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCompte(e, compte)}
                    title={`Supprimer ${compte}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '2px 4px',
                      cursor: 'pointer',
                      color: '#A8A299',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#C24A3F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A8A299')}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isPositif ? '#26333D' : '#C24A3F', marginTop: 4 }}>
                {isRmbCompte ? `${soldeCompte.toLocaleString('fr-FR')} ¥` : `${soldeCompte.toLocaleString('fr-FR')} Ar`}
              </div>
              {isRmbCompte && (
                <div style={{ fontSize: 10.5, color: '#8A8375', marginTop: 2, fontWeight: 600 }}>
                  ≈ {valeurRmbAr.toLocaleString('fr-FR')} Ar
                </div>
              )}
            </div>
          );
        })}

        {showAdd ? (
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px dashed #3D5A6C',
              borderRadius: 8,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <input
              type="text"
              placeholder="Nom du compte..."
              value={newCompteName}
              onChange={e => setNewCompteName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddCompte();
                if (e.key === 'Escape') setShowAdd(false);
              }}
              autoFocus
              style={{
                width: '100%',
                fontSize: 11.5,
                padding: '4px 6px',
                borderRadius: 4,
                border: '1px solid #EAE2D4',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={handleAddCompte}
                style={{
                  flex: 1,
                  background: '#3D5A6C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                style={{
                  background: '#F5EFE6',
                  color: '#5E584E',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowAdd(true)}
            style={{
              background: '#FAF7F2',
              border: '1.5px dashed #D0C8B8',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 58,
              color: '#8A8375',
              fontSize: 11.5,
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#3D5A6C';
              e.currentTarget.style.color = '#3D5A6C';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#D0C8B8';
              e.currentTarget.style.color = '#8A8375';
            }}
          >
            <Plus size={16} />
            <span>Nouveau compte</span>
          </div>
        )}
      </div>

      {addError && (
        <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
          {addError}
        </div>
      )}

      {compteToDelete && (
        <Modal
          title="Supprimer le compte"
          onClose={() => setCompteToDelete(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 8, color: '#991B1B' }}>
              <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                Voulez-vous vraiment supprimer le compte <strong>"{compteToDelete}"</strong> ?
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.4 }}>
              Ce compte ne sera plus proposé pour les nouveaux paiements. L'historique des transactions passées restera intact.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #EAE2D4' }}>
              <button
                type="button"
                onClick={() => setCompteToDelete(null)}
                style={{ ...ghostBtn, padding: '8px 16px', fontSize: 12.5 }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteCompte}
                style={{
                  ...primaryBtn,
                  background: '#DC2626',
                  borderColor: '#B91C1C',
                  padding: '8px 16px',
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={14} />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

