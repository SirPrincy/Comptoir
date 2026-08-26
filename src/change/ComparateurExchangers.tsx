import React, { useState } from 'react';
import { Star, Zap, ShieldCheck, Award, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Empty, ghostBtn } from '../ui';
import { OperationChange } from './types';

interface ComparateurExchangersProps {
  exchangersAnalysis: {
    list: Array<{
      name: string;
      nbOps: number;
      totalMga: number;
      totalRmb: number;
      tauxMoyen: number;
      minTaux: number;
      maxTaux: number;
      dernierTaux: number;
      derniereDate: string;
      avgNote: number;
      vitesseDominante: string;
      ops: OperationChange[];
    }>;
    bestRateItem: any;
    fastestItem: any;
    mostReliableItem: any;
  };
}

export default function ComparateurExchangers({ exchangersAnalysis }: ComparateurExchangersProps) {
  const [expandedExchanger, setExpandedExchanger] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Champions / Highlights */}
      {exchangersAnalysis.list.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {exchangersAnalysis.bestRateItem && (
            <Card style={{ background: '#F0F7F4', border: '1px solid #C2E0D1', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2C5E43', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={15} color="#2C5E43" />
                <span>Meilleur Taux Moyen</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1E4632', marginTop: 4 }}>
                {exchangersAnalysis.bestRateItem.name}
              </div>
              <div style={{ fontSize: 12, color: '#2C5E43', marginTop: 2 }}>
                Taux moyen : <strong>{exchangersAnalysis.bestRateItem.tauxMoyen} Ar/¥</strong> (Meilleur : {exchangersAnalysis.bestRateItem.minTaux} Ar/¥)
              </div>
            </Card>
          )}

          {exchangersAnalysis.fastestItem && (
            <Card style={{ background: '#FFF9EF', border: '1px solid #F0DDB3', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#B78103', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} color="#B78103" />
                <span>Le Plus Rapide</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#735200', marginTop: 4 }}>
                {exchangersAnalysis.fastestItem.name}
              </div>
              <div style={{ fontSize: 12, color: '#B78103', marginTop: 2 }}>
                Vitesse habituelle : <strong>⚡ {exchangersAnalysis.fastestItem.vitesseDominante}</strong>
              </div>
            </Card>
          )}

          {exchangersAnalysis.mostReliableItem && (
            <Card style={{ background: '#F0F4F8', border: '1px solid #D1DEE8', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3D5A6C', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={15} color="#3D5A6C" />
                <span>Ultra Fiable</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#26333D', marginTop: 4 }}>
                {exchangersAnalysis.mostReliableItem.name}
              </div>
              <div style={{ fontSize: 12, color: '#3D5A6C', marginTop: 2 }}>
                Note globale : <strong>⭐ {exchangersAnalysis.mostReliableItem.avgNote} / 5</strong> ({exchangersAnalysis.mostReliableItem.nbOps} transactions)
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Liste des Exchangers avec Historique des Prix et Taux */}
      {exchangersAnalysis.list.length === 0 ? (
        <Empty
          title="Aucun intermédiaire de change enregistré"
          desc="Enregistrez vos premières opérations de change pour comparer les taux et la fiabilité des exchangers P2P."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {exchangersAnalysis.list.map(ex => {
            const isExpanded = expandedExchanger === ex.name;
            const isBestRate = exchangersAnalysis.bestRateItem?.name === ex.name;
            const isFastest = exchangersAnalysis.fastestItem?.name === ex.name;
            const isMostReliable = exchangersAnalysis.mostReliableItem?.name === ex.name;

            return (
              <Card
                key={ex.name}
                style={{
                  background: '#FFFFFF',
                  border: isBestRate ? '1.5px solid #3F7A5C' : '1px solid #EAE2D4',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#26333D' }}>
                        {ex.name}
                      </h3>
                      <span style={{ fontSize: 12, color: '#B78103', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Star size={13} fill="#FFD700" color="#B78103" />
                        <span>{ex.avgNote} / 5</span>
                      </span>
                      {isBestRate && (
                        <span style={{ background: '#E1F0E8', color: '#1E4632', border: '1px solid #A8D5BA', fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                          🏆 Meilleur Taux
                        </span>
                      )}
                      {isFastest && (
                        <span style={{ background: '#FFF4D9', color: '#8D6E00', border: '1px solid #F0DDB3', fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                          ⚡ Le Plus Rapide
                        </span>
                      )}
                      {isMostReliable && (
                        <span style={{ background: '#E3EDF2', color: '#223843', border: '1px solid #B8CBD8', fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                          🛡️ Ultra Fiable
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#8A8375', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{ex.nbOps} opération{ex.nbOps > 1 ? 's' : ''} réalisée{ex.nbOps > 1 ? 's' : ''}</span>
                      <span>· Volume : <strong>{ex.totalRmb.toLocaleString('fr-FR')} ¥</strong> ({ex.totalMga.toLocaleString('fr-FR')} Ar)</span>
                      <span>· Vitesse habituelle : ⚡ <strong>{ex.vitesseDominante}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedExchanger(isExpanded ? null : ex.name)}
                    style={{
                      ...ghostBtn,
                      fontSize: 12,
                      height: 30,
                      padding: '0 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{isExpanded ? 'Masquer l\'historique' : 'Historique des taux'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Grille de Taux et Métriques */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12, background: '#FAF7F2', padding: 10, borderRadius: 8, border: '1px solid #EAE2D4' }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#8A8375', textTransform: 'uppercase', fontWeight: 600 }}>Taux Moyen Pondéré</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#2C5E43', marginTop: 2 }}>
                      {ex.tauxMoyen} Ar/¥
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10.5, color: '#8A8375', textTransform: 'uppercase', fontWeight: 600 }}>Meilleur Taux Accordé</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#3F7A5C', marginTop: 2 }}>
                      {ex.minTaux} Ar/¥
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10.5, color: '#8A8375', textTransform: 'uppercase', fontWeight: 600 }}>Pire Taux Pratiqué</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#C24A3F', marginTop: 2 }}>
                      {ex.maxTaux} Ar/¥
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10.5, color: '#8A8375', textTransform: 'uppercase', fontWeight: 600 }}>Dernier Taux Pratiqué</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#B78103', marginTop: 2 }}>
                      {ex.dernierTaux} Ar/¥
                    </div>
                    <div style={{ fontSize: 10, color: '#8A8375' }}>({ex.derniereDate})</div>
                  </div>
                </div>

                {/* Historique détaillé dépliant pour cet Exchanger */}
                {isExpanded && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #EAE2D4', paddingTop: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#26333D', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} color="#3F7A5C" />
                      <span>Historique des opérations de change avec {ex.name}</span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                        <thead>
                          <tr style={{ background: '#F0ECE1', color: '#5E584E', textAlign: 'left' }}>
                            <th style={{ padding: '6px 8px', borderRadius: '4px 0 0 4px' }}>Date</th>
                            <th style={{ padding: '6px 8px' }}>MGA Sorti</th>
                            <th style={{ padding: '6px 8px' }}>RMB Reçu</th>
                            <th style={{ padding: '6px 8px' }}>Taux Réel</th>
                            <th style={{ padding: '6px 8px' }}>Canal</th>
                            <th style={{ padding: '6px 8px' }}>Vitesse</th>
                            <th style={{ padding: '6px 8px' }}>Note</th>
                            <th style={{ padding: '6px 8px', borderRadius: '0 4px 4px 0' }}>Notes / Réf</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ex.ops.map(op => (
                            <tr key={op.id} style={{ borderBottom: '1px solid #F0ECE1' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{op.date}</td>
                              <td style={{ padding: '6px 8px' }}>{op.montantMga.toLocaleString('fr-FR')} Ar</td>
                              <td style={{ padding: '6px 8px', fontWeight: 700, color: '#2C5E43' }}>{op.montantRmb.toLocaleString('fr-FR')} ¥</td>
                              <td style={{ padding: '6px 8px', fontWeight: 700, color: '#B78103' }}>{op.taux} Ar/¥</td>
                              <td style={{ padding: '6px 8px' }}>{op.canal || '-'}</td>
                              <td style={{ padding: '6px 8px' }}>⚡ {op.vitesseExecution || 'Très rapide (< 1h)'}</td>
                              <td style={{ padding: '6px 8px', color: '#B78103' }}>⭐ {op.noteFiabilite || 5}/5</td>
                              <td style={{ padding: '6px 8px', color: '#8A8375', fontStyle: 'italic' }}>
                                {op.reference ? `[${op.reference}] ` : ''}{op.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
