import React from 'react';
import { Search, Filter, Coins, CheckCircle, Edit3, Trash2, ShieldCheck, Star } from 'lucide-react';
import { Card, Empty, rowCard, iconBtn, selectStyle, inputStyle } from '../ui';
import { OperationChange, CANAUX_RMB } from './types';

interface JournalOperationsChangeProps {
  operations: OperationChange[];
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  filterFournisseur: string;
  setFilterFournisseur: (f: string) => void;
  filterCanal: string;
  setFilterCanal: (c: string) => void;
  intermediairesList: string[];
  onEdit: (op: OperationChange) => void;
  onDelete: (id: string) => void;
}

export default function JournalOperationsChange({
  operations,
  searchQuery,
  setSearchQuery,
  filterFournisseur,
  setFilterFournisseur,
  filterCanal,
  setFilterCanal,
  intermediairesList,
  onEdit,
  onDelete,
}: JournalOperationsChangeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Barre de Recherche & Filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} color="#8A8375" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Rechercher par intermédiaire, référence, note, compte..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: 30,
                fontSize: 12,
                height: 34,
              } as any}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5E584E' }}>
            <Filter size={13} color="#8A8375" />
            <span>Exchanger :</span>
            <select
              style={{ ...selectStyle, height: 32, fontSize: 12, padding: '0 8px' } as any}
              value={filterFournisseur}
              onChange={e => setFilterFournisseur(e.target.value)}
            >
              <option value="Tous">Tous les exchangers</option>
              {intermediairesList.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5E584E' }}>
            <span>Canal :</span>
            <select
              style={{ ...selectStyle, height: 32, fontSize: 12, padding: '0 8px' } as any}
              value={filterCanal}
              onChange={e => setFilterCanal(e.target.value)}
            >
              <option value="Tous">Tous les canaux</option>
              {CANAUX_RMB.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des Opérations */}
      {operations.length === 0 ? (
        <Empty
          title="Aucune opération de change trouvée"
          desc="Essayez de modifier vos filtres ou enregistrez votre premier achat de RMB."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {operations.map(op => {
            const provider = op.fournisseur || op.exchanger?.split(' (')[0] || 'Intermédiaire non spécifié';
            const channel = op.canal || 'Alipay Direct';
            const totalSortie = (op.montantMga || 0) + (op.fraisMga || 0);

            return (
              <Card key={op.id} style={{ ...rowCard, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, width: '100%' }}>
                  {/* Colonne Gauche : Date & Exchanger */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: '#F0F7F4',
                        color: '#2C5E43',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      <Coins size={18} color="#2C5E43" />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 14, color: '#26333D' }}>{provider}</strong>
                        <span style={{ fontSize: 11, background: '#FAF7F2', border: '1px solid #EAE2D4', padding: '2px 6px', borderRadius: 4, color: '#5E584E' }}>
                          {channel}
                        </span>
                        {op.noteFiabilite && (
                          <span style={{ fontSize: 11, color: '#B78103', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Star size={11} fill="#FFD700" color="#B78103" />
                            <span>{op.noteFiabilite}/5</span>
                          </span>
                        )}
                        {op.vitesseExecution && (
                          <span style={{ fontSize: 10.5, color: '#3D5A6C', background: '#F0F4F8', padding: '1px 5px', borderRadius: 4 }}>
                            ⚡ {op.vitesseExecution}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 11.5, color: '#8A8375', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span>Date : <strong>{op.date}</strong></span>
                        {op.compteSource && (
                          <span>· Compte : <strong>{op.compteSource}</strong></span>
                        )}
                        {op.reference && (
                          <span>· Réf : <code>{op.reference}</code></span>
                        )}
                      </div>

                      {op.notes && (
                        <div style={{ fontSize: 11.5, color: '#5E584E', marginTop: 3, fontStyle: 'italic' }}>
                          « {op.notes} »
                        </div>
                      )}

                      {/* Badge Synchronisation Trésorerie */}
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {op.genererMouvementTresorerie !== false ? (
                          <span
                            style={{
                              fontSize: 10.5,
                              color: '#1E4632',
                              background: '#E1F0E8',
                              border: '1px solid #A8D5BA',
                              padding: '2px 8px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle size={12} color="#1E4632" />
                            <span>Débit automatique Trésorerie MGA ({op.compteSource || 'MVola'})</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 10.5,
                              color: '#8A8375',
                              background: '#FAF7F2',
                              border: '1px solid #EAE2D4',
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}
                          >
                            Opération hors trésorerie
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Colonne Droite : Montants & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#2C5E43' }}>
                        + {op.montantRmb.toLocaleString('fr-FR')} ¥
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#C24A3F', marginTop: 1 }}>
                        - {totalSortie.toLocaleString('fr-FR')} Ar
                        {op.fraisMga ? <span style={{ fontSize: 10, color: '#8A8375', fontWeight: 400 }}> (dont {op.fraisMga.toLocaleString('fr-FR')} Ar frais)</span> : ''}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#B78103', marginTop: 1 }}>
                        Taux réel : {op.taux} Ar / ¥
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => onEdit(op)}
                        title="Modifier l'opération"
                        style={iconBtn}
                      >
                        <Edit3 size={15} color="#5E584E" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(op.id)}
                        title="Supprimer l'opération"
                        style={{ ...iconBtn, color: '#C24A3F' }}
                      >
                        <Trash2 size={15} color="#C24A3F" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
