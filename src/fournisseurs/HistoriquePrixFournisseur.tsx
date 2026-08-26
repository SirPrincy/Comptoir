import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, Calendar, ArrowRight, AlertCircle, ShoppingCart } from 'lucide-react';
import { HistoriquePrixProduit, PointHistoriquePrix } from '../paymentUtils';

interface HistoriquePrixFournisseurProps {
  historiquePrix: HistoriquePrixProduit[];
  fournisseurNom: string;
}

export default function HistoriquePrixFournisseur({
  historiquePrix = [],
  fournisseurNom,
}: HistoriquePrixFournisseurProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    historiquePrix[0]?.productId || ''
  );

  if (historiquePrix.length === 0) {
    return (
      <div
        style={{
          padding: '14px',
          background: '#FAF7F2',
          borderRadius: 8,
          border: '1px dashed #D8D0C0',
          fontSize: 12,
          color: '#736B5E',
          textAlign: 'center',
        }}
      >
        Aucune commande enregistrée pour ce fournisseur afin de retracer l'historique des prix.
      </div>
    );
  }

  const selectedItem =
    historiquePrix.find(h => h.productId === selectedProductId) || historiquePrix[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Sélecteur de produit si plusieurs articles achetés */}
      {historiquePrix.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {historiquePrix.map(item => {
            const isSelected = item.productId === selectedItem?.productId;
            return (
              <button
                key={item.productId}
                type="button"
                onClick={() => setSelectedProductId(item.productId)}
                style={{
                  fontSize: 11.5,
                  fontWeight: isSelected ? 700 : 500,
                  padding: '4px 9px',
                  borderRadius: 6,
                  border: isSelected ? '1px solid #3D5A6C' : '1px solid #EAE2D4',
                  background: isSelected ? '#3D5A6C' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#26333D',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{item.productNom}</span>
                {item.points.length > 1 && (
                  <span
                    style={{
                      fontSize: 10,
                      background: isSelected ? 'rgba(255,255,255,0.2)' : '#F0ECE1',
                      color: isSelected ? '#FFFFFF' : '#736B5E',
                      padding: '1px 5px',
                      borderRadius: 10,
                    }}
                  >
                    {item.points.length} achats
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fiche résumé du produit sélectionné */}
      {selectedItem && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #EAE2D4',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: '1px solid #F0ECE1',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#26333D' }}>
                {selectedItem.productNom}
                {selectedItem.productCouleur ? ` · ${selectedItem.productCouleur}` : ''}
              </div>
              <div style={{ fontSize: 11, color: '#8A8375' }}>
                {selectedItem.points.length} commande{selectedItem.points.length > 1 ? 's' : ''} chez {fournisseurNom}
              </div>
            </div>

            {/* Variation globale */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {selectedItem.points.length > 1 ? (
                selectedItem.variationGlobalePct > 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#B5532A',
                      background: '#FDF0EC',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #FACFC2',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <TrendingUp size={13} />
                    Hausse totale de +{selectedItem.variationGlobalePct}%
                  </span>
                ) : selectedItem.variationGlobalePct < 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#1B6A3E',
                      background: '#EAF6EE',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #C4E6D1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <TrendingDown size={13} />
                    Baisse négociée de {selectedItem.variationGlobalePct}%
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#5E584E',
                      background: '#F5F0E6',
                      padding: '3px 8px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Minus size={13} />
                    Prix stable (0%)
                  </span>
                )
              ) : (
                <span style={{ fontSize: 11, color: '#8A8375' }}>1er achat enregistré</span>
              )}
            </div>
          </div>

          {/* Tableau chronologique des prix */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #EAE2D4', color: '#5E584E' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Qté</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Prix Unitaire (RMB / Ar)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Évolution vs précédent</th>
                </tr>
              </thead>
              <tbody>
                {selectedItem.points.map((pt: PointHistoriquePrix, idx: number) => {
                  return (
                    <tr
                      key={pt.commandeId}
                      style={{
                        borderBottom: idx === selectedItem.points.length - 1 ? 'none' : '1px solid #F4EFE6',
                        background: idx === 0 ? '#FCFAF7' : '#FFFFFF',
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: '6px 8px', color: '#26333D', fontWeight: idx === 0 ? 600 : 400 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} color="#8A8375" />
                          <span>{new Date(pt.date).toLocaleDateString('fr-FR')}</span>
                          {idx === 0 && (
                            <span
                              style={{
                                fontSize: 9.5,
                                background: '#EAE2D4',
                                color: '#3D5A6C',
                                padding: '0 4px',
                                borderRadius: 3,
                                fontWeight: 700,
                              }}
                            >
                              Dernier
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quantité */}
                      <td style={{ padding: '6px 8px', color: '#5E584E' }}>{pt.qty} pcs</td>

                      {/* Prix */}
                      <td style={{ padding: '6px 8px' }}>
                        <div style={{ fontWeight: 600, color: '#26333D' }}>
                          {pt.puRmb > 0 ? `¥${pt.puRmb}` : ''}
                          {pt.puAr > 0 ? (
                            <span style={{ color: pt.puRmb > 0 ? '#736B5E' : '#26333D', fontSize: pt.puRmb > 0 ? 10.5 : 11.5, marginLeft: pt.puRmb > 0 ? 6 : 0 }}>
                              ({pt.puAr.toLocaleString('fr-FR')} Ar)
                            </span>
                          ) : '—'}
                        </div>
                      </td>

                      {/* Variation vs achat précédent */}
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        {pt.variationPct !== undefined ? (
                          pt.variationPct > 0 ? (
                            <span style={{ color: '#B5532A', fontWeight: 700, fontSize: 11 }}>
                              ↗ +{pt.variationPct}% (Hausse)
                            </span>
                          ) : pt.variationPct < 0 ? (
                            <span style={{ color: '#1B6A3E', fontWeight: 700, fontSize: 11 }}>
                              ↘ {pt.variationPct}% (Baisse)
                            </span>
                          ) : (
                            <span style={{ color: '#736B5E', fontSize: 11 }}>= 0%</span>
                          )
                        ) : (
                          <span style={{ color: '#8A8375', fontSize: 10.5, fontStyle: 'italic' }}>Prix de base</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
