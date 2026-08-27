import React, { useState } from 'react';
import { Search, Trash2, ChevronRight, AlertTriangle } from 'lucide-react';
import { Empty, inputStyle, selectStyle, ghostBtn, iconBtn, rowCard, Modal, primaryBtn } from '../ui';
import { COMPTES_FINANCIERS } from '../constants';
import { getAccountIcon } from './ComptesFinanciers';

interface JournalTransactionsProps {
  transactionsFiltrees: any[];
  toutesTransactions: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filtreType: 'all' | 'entrée' | 'sortie' | 'investissement';
  setFiltreType: (t: 'all' | 'entrée' | 'sortie' | 'investissement') => void;
  filtreDomaine: 'all' | 'business' | 'perso';
  setFiltreDomaine: (d: 'all' | 'business' | 'perso') => void;
  filtreCompte: string;
  setFiltreCompte: (c: string) => void;
  filtreTag: string;
  setFiltreTag: (t: string) => void;
  tagsDisponibles: string[];
  supprimerMouvement: (id: string, item?: any) => void;
  comptes?: string[];
  onSelectTransaction?: (transaction: any) => void;
}

export function formatDateDisplay(dateString: string) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function getCategoryBadge(cat: string, tag?: string, isInvest = false) {
  if (tag === '#retrait-perso') {
    return { label: '👤 Prélèvement Perso', bg: '#FFF8E1', color: '#B78103' };
  }
  if (isInvest || cat === 'investissement' || tag === '#investissement' || tag === '#capital') {
    return { label: '👤 Apport / Capital', bg: '#FEF3EB', color: '#E8985E' };
  }
  switch (cat) {
    case 'vente':
      return { label: '🛒 Vente Business', bg: '#EBF4EC', color: '#3F7A5C' };
    case 'achat':
      return { label: '📦 Achat Chine', bg: '#F5EFE6', color: '#3D5A6C' };
    case 'fret':
      return { label: '🚢 Fret Logistique', bg: '#FEF3EB', color: '#E8985E' };
    case 'transfert':
      return { label: '⇄ Transfert', bg: '#EDF2F7', color: '#4A5568' };
    case 'manuel':
    default:
      return { label: '💼 Charge/Recette', bg: '#EFE9DE', color: '#5E584E' };
  }
}

export default function JournalTransactions({
  transactionsFiltrees,
  toutesTransactions,
  searchQuery,
  setSearchQuery,
  filtreType,
  setFiltreType,
  filtreDomaine,
  setFiltreDomaine,
  filtreCompte,
  setFiltreCompte,
  filtreTag,
  setFiltreTag,
  tagsDisponibles,
  supprimerMouvement,
  comptes,
  onSelectTransaction,
}: JournalTransactionsProps) {
  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;
  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);

  const confirmerSuppression = () => {
    if (!transactionToDelete || !supprimerMouvement) return;
    supprimerMouvement(transactionToDelete.id, transactionToDelete);
    setTransactionToDelete(null);
  };
  return (
    <>
      {/* BARRE DE FILTRES MULTICRITÈRES & RECHERCHE */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #EAE2D4',
          borderRadius: 8,
          padding: '10px 12px',
          margin: '14px 0 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#8A8375' }} />
            <input
              type="text"
              placeholder="Rechercher une transaction..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 28, height: 32, fontSize: 12, width: '100%' } as any}
            />
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#8A8375', whiteSpace: 'nowrap' }}>
            {transactionsFiltrees.length} trouvée{transactionsFiltrees.length > 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', width: '100%', maxWidth: '100%', flex: '1 1 auto' }}>
          <select
            value={filtreDomaine}
            onChange={e => setFiltreDomaine(e.target.value as any)}
            style={{ ...selectStyle, height: 32, fontSize: 11.5, padding: '0 6px', flex: '1 1 130px', fontWeight: 600 } as any}
          >
            <option value="all">Tous domaines (Business & Perso)</option>
            <option value="business">💼 Business / Exploitation</option>
            <option value="perso">👤 Prélèvements & Apports Perso</option>
          </select>

          <select
            value={filtreType}
            onChange={e => setFiltreType(e.target.value as any)}
            style={{ ...selectStyle, height: 32, fontSize: 11.5, padding: '0 6px', flex: '1 1 110px' } as any}
          >
            <option value="all">Tous flux (+ & −)</option>
            <option value="entrée">📥 Entrées (+)</option>
            <option value="sortie">📤 Sorties (−)</option>
          </select>

          <select
            value={filtreCompte}
            onChange={e => setFiltreCompte(e.target.value)}
            style={{ ...selectStyle, height: 32, fontSize: 11.5, padding: '0 6px', flex: '1 1 110px' } as any}
          >
            <option value="all">Tous comptes</option>
            {activeComptes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filtreTag}
            onChange={e => setFiltreTag(e.target.value)}
            style={{ ...selectStyle, height: 32, fontSize: 11.5, padding: '0 6px', flex: '1 1 100px' } as any}
          >
            <option value="all">Tous tags</option>
            {tagsDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {(filtreType !== 'all' || filtreDomaine !== 'all' || filtreCompte !== 'all' || filtreTag !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFiltreType('all');
                setFiltreDomaine('all');
                setFiltreCompte('all');
                setFiltreTag('all');
                setSearchQuery('');
              }}
              style={{ ...ghostBtn, height: 30, fontSize: 11, padding: '0 8px', marginLeft: 'auto' }}
            >
              Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* LISTE DES TRANSACTIONS */}
      {transactionsFiltrees.length === 0 ? (
        <Empty
          text={
            toutesTransactions.length === 0
              ? 'Aucune transaction pour le moment. Enregistrez des ventes, des achats ou des investissements pour alimenter le journal.'
              : 'Aucune transaction ne correspond à vos filtres de recherche.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {transactionsFiltrees.map(item => {
            const badge = getCategoryBadge(item.categorie, item.tag, item.isInvestissement);
            const isPositif = item.type === 'entrée';
            const nbLignes = item.paiementObj?.lignes?.length || 0;
            const isRegroupe = nbLignes > 1;

            return (
              <div
                key={item.id}
                onClick={() => onSelectTransaction && onSelectTransaction(item)}
                style={{
                  ...rowCard,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                } as any}
                className="hover:border-emerald-600 hover:shadow-sm"
              >
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: badge.bg,
                        color: badge.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.label}
                    </span>

                    {isRegroupe && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#EBF5FF',
                          color: '#0066CC',
                          whiteSpace: 'nowrap',
                          border: '1px solid #BEE3F8',
                        }}
                      >
                        📑 Multi-Règlement ({nbLignes} factures)
                      </span>
                    )}

                    {item.compte && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#F1ECE1',
                          color: '#5E584E',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getAccountIcon(item.compte)}
                        {item.compte}
                      </span>
                    )}

                    {item.tag && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: item.tag === '#retrait-perso' ? '#FFF8E1' : '#EAE2D4',
                          color: item.tag === '#retrait-perso' ? '#B78103' : '#3D5A6C',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.tag}
                      </span>
                    )}

                    {item.reference && (
                      <span style={{ fontSize: 10.5, color: '#8A8375', fontStyle: 'italic' }}>
                        [{item.reference}]
                      </span>
                    )}
                  </div>

                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#26333D', marginTop: 4, wordBreak: 'break-word' }}>
                    {item.description}
                  </div>

                  <div style={{ fontSize: 11.5, color: '#8A8375', marginTop: 2 }}>
                    {formatDateDisplay(item.date)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: isPositif ? '#3F7A5C' : '#C24A3F',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isPositif ? '+' : '−'}
                    {item.montant.toLocaleString('fr-FR')} Ar
                  </span>

                  {supprimerMouvement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransactionToDelete(item);
                      }}
                      style={iconBtn}
                      title="Supprimer cette transaction"
                    >
                      <Trash2 size={14} style={{ color: '#C24A3F' }} />
                    </button>
                  )}

                  <ChevronRight size={16} style={{ color: '#A0AEC0' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      {transactionToDelete && (
        <Modal
          title="Supprimer la transaction"
          onClose={() => setTransactionToDelete(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                borderRadius: 8,
                color: '#991B1B',
              }}
            >
              <AlertTriangle size={22} style={{ flexShrink: 0, color: '#DC2626' }} />
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                Êtes-vous sûr de vouloir supprimer cette transaction de trésorerie ?
              </div>
            </div>

            {/* Récapitulatif de la transaction ciblée */}
            <div
              style={{
                background: '#FAF6F0',
                border: '1px solid #EAE2D4',
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#5E584E' }}>
                  {formatDateDisplay(transactionToDelete.date)}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: transactionToDelete.type === 'entrée' ? '#3F7A5C' : '#C24A3F',
                  }}
                >
                  {transactionToDelete.type === 'entrée' ? '+' : '−'}
                  {Number(transactionToDelete.montant || 0).toLocaleString('fr-FR')} Ar
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#26333D', wordBreak: 'break-word' }}>
                {transactionToDelete.description}
              </div>
              <div style={{ fontSize: 11.5, color: '#8A8375', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {transactionToDelete.compte && <span>Compte : <strong>{transactionToDelete.compte}</strong></span>}
                {transactionToDelete.tag && <span>Tag : <strong>{transactionToDelete.tag}</strong></span>}
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.45 }}>
              Cette action supprimera l'écriture du journal et mettra à jour automatiquement le solde des comptes ainsi que le statut des factures ou commandes rattachées.
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6, paddingTop: 12, borderTop: '1px solid #EAE2D4' }}>
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                style={{ ...ghostBtn, padding: '8px 16px', fontSize: 13 }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerSuppression}
                style={{
                  ...primaryBtn,
                  background: '#DC2626',
                  borderColor: '#B91C1C',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                  padding: '8px 18px',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={15} />
                <span>Supprimer définitivement</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
