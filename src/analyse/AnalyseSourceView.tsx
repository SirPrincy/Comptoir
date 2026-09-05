import React, { useState, useMemo, memo } from 'react';
import {
  Compass,
  ShoppingCart,
  Coins,
  Search,
  ExternalLink,
  ArrowUpDown,
  Filter,
  Package,
  TrendingUp,
  BarChart3,
  X,
  ChevronRight,
  Layers,
  ArrowRight
} from 'lucide-react';
import { THEME } from '../colors';
import { RADIUS, SHADOWS, Card, inputStyle, selectStyle, ghostBtn, primaryBtn, Empty } from '../ui';
import { SourceAnalysisItem } from './types';
import { formatAr, formatRmb } from './analyseUtils';

interface Props {
  sources: SourceAnalysisItem[];
  onNavigateTab?: (targetTab: string, preset?: string) => void;
}

// Couleurs distinctes pour les plateformes d'achat courantes
const getSourceColor = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes('1688')) return '#F97316'; // Orange 1688
  if (s.includes('taobao')) return '#EA580C'; // Rouge-orangé Taobao
  if (s.includes('pinduoduo') || s.includes('pdd')) return '#E11D48'; // Rouge cerise PDD
  if (s.includes('xianyu')) return '#059669'; // Émeraude Xianyu
  if (s.includes('transitaire') || s.includes('fret')) return '#2563EB'; // Bleu Saphir Fret
  if (s.includes('exchanger') || s.includes('change')) return '#D97706'; // Or Change
  if (s.includes('acheteur')) return '#7C3AED'; // Violet Acheteur
  return '#64748B'; // Gris ardoise autre
};

export const AnalyseSourceView = memo(function AnalyseSourceView({ sources, onNavigateTab }: Props) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'montant' | 'commandes' | 'panier' | 'marge' | 'pieces'>('montant');
  const [selectedSource, setSelectedSource] = useState<SourceAnalysisItem | null>(null);

  // Filtrage et Tri
  const filteredSources = useMemo(() => {
    return sources
      .filter(s => {
        if (!search.trim()) return true;
        return s.source.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        if (sortBy === 'commandes') return b.nbCommandes - a.nbCommandes;
        if (sortBy === 'panier') return b.panierMoyenAr - a.panierMoyenAr;
        if (sortBy === 'marge') return b.margeBruteGeneresAr - a.margeBruteGeneresAr;
        if (sortBy === 'pieces') return b.qtyTotalePieces - a.qtyTotalePieces;
        return b.montantTotalAr - a.montantTotalAr;
      });
  }, [sources, search, sortBy]);

  // Totaux globaux
  const totalCommandes = useMemo(() => sources.reduce((acc, s) => acc + s.nbCommandes, 0), [sources]);
  const totalArgentAr = useMemo(() => sources.reduce((acc, s) => acc + s.montantTotalAr, 0), [sources]);
  const totalArgentRmb = useMemo(() => sources.reduce((acc, s) => acc + s.montantTotalRmb, 0), [sources]);
  const totalPieces = useMemo(() => sources.reduce((acc, s) => acc + s.qtyTotalePieces, 0), [sources]);
  const panierMoyenGlobal = totalCommandes > 0 ? Math.round(totalArgentAr / totalCommandes) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* BANNIÈRE SYNTHÈSE DES SOURCES D'ACHAT */}
      <Card style={{ padding: '20px 24px', background: THEME.bg.card }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: RADIUS.control,
              background: 'rgba(217, 119, 6, 0.12)',
              color: THEME.brand.amber,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Compass size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text.primary, letterSpacing: '-0.01em' }}>
                Répartition par Source d'Achat & Fournisseurs Chine
              </div>
              <div style={{ fontSize: 12, color: THEME.text.secondary }}>
                Analyse précise du volume de commandes passées et des montants dépensés par plateforme
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: THEME.text.muted }} />
              <input
                type="text"
                placeholder="Filtrer une source (ex: 1688)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 30, height: 34, fontSize: 12 } as any}
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ ...selectStyle, height: 34, fontSize: 12, width: 'auto' } as any}
            >
              <option value="montant">Trier par: Argent dépensé (Ar)</option>
              <option value="commandes">Trier par: Nombre de commandes</option>
              <option value="panier">Trier par: Panier moyen (Ar)</option>
              <option value="marge">Trier par: Marge générée</option>
              <option value="pieces">Trier par: Quantité de pièces</option>
            </select>
          </div>
        </div>

        {/* 4 MINI-KPIs SOURCING */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          padding: '14px',
          background: THEME.bg.surface,
          borderRadius: RADIUS.item,
          border: `1px solid ${THEME.border.base}`
        }}>
          <div>
            <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 500 }}>Total Commandes Achat</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text.primary }}>{totalCommandes} commandes</div>
            <div style={{ fontSize: 11, color: THEME.text.secondary }}>sur {sources.length} sources actives</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 500 }}>Total Argent Dépensé</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.brand.amber }}>{formatAr(totalArgentAr)}</div>
            <div style={{ fontSize: 11, color: THEME.text.secondary }}>dont {formatRmb(totalArgentRmb)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 500 }}>Panier Moyen / Commande</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.brand.blue }}>{formatAr(panierMoyenGlobal)}</div>
            <div style={{ fontSize: 11, color: THEME.text.secondary }}>coût moyen d'une commande</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 500 }}>Total Pièces Approvisionnées</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.brand.emerald }}>{totalPieces} unités</div>
            <div style={{ fontSize: 11, color: THEME.text.secondary }}>
              ~{totalPieces > 0 ? formatAr(totalArgentAr / totalPieces) : '0 Ar'}/pièce
            </div>
          </div>
        </div>

        {/* BARRE VISUELLE DE RÉPARTITION DU BUDGET */}
        {totalArgentAr > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: THEME.text.secondary, marginBottom: 6 }}>
              <span>Part du budget d'achat par source</span>
              <span>Total : {formatAr(totalArgentAr)}</span>
            </div>
            <div style={{
              display: 'flex',
              height: 12,
              borderRadius: RADIUS.pill,
              overflow: 'hidden',
              background: THEME.bg.surface,
              gap: 2
            }}>
              {sources.map(s => {
                const pct = s.partBudgetPct;
                if (pct < 1) return null;
                const col = getSourceColor(s.source);
                return (
                  <div
                    key={s.source}
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: col,
                      transition: 'width 0.3s ease'
                    }}
                    title={`${s.source}: ${pct}% (${formatAr(s.montantTotalAr)})`}
                  />
                );
              })}
            </div>

            {/* Légende */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: 11 }}>
              {sources.map(s => {
                const col = getSourceColor(s.source);
                return (
                  <div
                    key={s.source}
                    onClick={() => setSelectedSource(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: RADIUS.tag,
                      background: selectedSource?.source === s.source ? THEME.bg.surface : 'transparent'
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: RADIUS.pill, background: col }} />
                    <span style={{ fontWeight: 600, color: THEME.text.primary }}>{s.source}</span>
                    <span style={{ color: THEME.text.muted }}>({s.partBudgetPct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* TABLEAU COMPARATIF DÉTAILLÉ PAR SOURCE */}
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${THEME.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={17} color={THEME.brand.blue} />
            <span>Tableau Détaillé des Sources d'Approvisionnement</span>
          </div>
          <span style={{ fontSize: 12, color: THEME.text.muted }}>
            {filteredSources.length} source{filteredSources.length > 1 ? 's' : ''} répertoriée{filteredSources.length > 1 ? 's' : ''}
          </span>
        </div>

        {filteredSources.length === 0 ? (
          <div style={{ padding: 32 }}>
            <Empty
              title="Aucune source trouvée"
              text="Aucune commande d'achat ne correspond à vos filtres ou aucune commande n'a encore été enregistrée."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: THEME.bg.surface, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Source d'Achat</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Nb Commandes</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Total Argent (Ar)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Total Argent (¥)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Part Budget</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Panier Moyen</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Pièces Achetées</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>CA Généré</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Marge Brute</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSources.map(s => {
                  const col = getSourceColor(s.source);
                  const isSelected = selectedSource?.source === s.source;

                  return (
                    <tr
                      key={s.source}
                      onClick={() => setSelectedSource(s)}
                      style={{
                        borderBottom: `1px solid ${THEME.border.base}`,
                        background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Source Name + Badge */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: RADIUS.pill,
                            background: col,
                            flexShrink: 0
                          }} />
                          <div>
                            <div style={{ fontWeight: 700, color: THEME.text.primary, fontSize: 13 }}>
                              {s.source}
                            </div>
                            <div style={{ fontSize: 11, color: THEME.text.muted }}>
                              {s.nbArticlesDifferents} article{s.nbArticlesDifferents > 1 ? 's' : ''} sourcé{s.nbArticlesDifferents > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Nombre de commandes */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 9px',
                          borderRadius: RADIUS.tag,
                          background: 'rgba(37, 99, 235, 0.1)',
                          color: THEME.brand.blue,
                          fontWeight: 700,
                          fontSize: 12
                        }}>
                          {s.nbCommandes} cmd{s.nbCommandes > 1 ? 's' : ''}
                        </span>
                        <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
                          {s.partNbCommandesPct}% des commandes
                        </div>
                      </td>

                      {/* Montant Total Ariary */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: THEME.brand.amber, fontSize: 13 }}>
                          {formatAr(s.montantTotalAr)}
                        </div>
                      </td>

                      {/* Montant Total RMB */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#C24A3F', fontSize: 12 }}>
                          {s.montantTotalRmb > 0 ? formatRmb(s.montantTotalRmb) : '-'}
                        </div>
                      </td>

                      {/* Part du budget */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <div style={{ width: 44, height: 6, background: THEME.bg.surface, borderRadius: RADIUS.pill, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, s.partBudgetPct)}%`, height: '100%', background: col }} />
                          </div>
                          <span style={{ fontWeight: 700, color: THEME.text.primary }}>
                            {s.partBudgetPct}%
                          </span>
                        </div>
                      </td>

                      {/* Panier Moyen */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: THEME.text.primary }}>
                          {formatAr(s.panierMoyenAr)}
                        </div>
                        <div style={{ fontSize: 10, color: THEME.text.muted }}>
                          par commande
                        </div>
                      </td>

                      {/* Quantité de pièces */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: THEME.brand.emerald }}>
                          {s.qtyTotalePieces} pcs
                        </div>
                        <div style={{ fontSize: 10, color: THEME.text.muted }}>
                          ~{formatAr(s.coutMoyenParPieceAr)}/u
                        </div>
                      </td>

                      {/* CA Ventes généré */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: THEME.brand.blue }}>
                          {formatAr(s.caVentesGeneresAr)}
                        </div>
                      </td>

                      {/* Marge Brute générée */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{
                          fontWeight: 700,
                          color: s.margeBruteGeneresAr >= 0 ? THEME.brand.emerald : THEME.brand.red
                        }}>
                          {formatAr(s.margeBruteGeneresAr)}
                        </div>
                        <div style={{ fontSize: 10, color: THEME.text.muted }}>
                          marge {s.tauxMargeMoyenPct}%
                        </div>
                      </td>

                      {/* Bouton inspecter */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSource(s);
                          }}
                          style={{
                            ...ghostBtn,
                            padding: '4px 10px',
                            fontSize: 11,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span>Détails</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL / VOLET DE DÉTAILS DE LA SOURCE SÉLECTIONNÉE */}
      {selectedSource && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(20, 16, 13, 0.65)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: THEME.bg.card,
            borderRadius: RADIUS.modal,
            border: `1px solid ${THEME.border.strong}`,
            boxShadow: SHADOWS.modal,
            width: '100%',
            maxWidth: 720,
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: `1px solid ${THEME.border.base}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: THEME.bg.surface
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 14,
                  height: 14,
                  borderRadius: RADIUS.pill,
                  background: getSourceColor(selectedSource.source)
                }} />
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: THEME.text.primary }}>
                    Source : {selectedSource.source}
                  </div>
                  <div style={{ fontSize: 12, color: THEME.text.secondary }}>
                    {selectedSource.nbCommandes} commande{selectedSource.nbCommandes > 1 ? 's' : ''} passée{selectedSource.nbCommandes > 1 ? 's' : ''} • {formatAr(selectedSource.montantTotalAr)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSource(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 22,
                  color: THEME.text.muted,
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Résumé des indicateurs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10
              }}>
                <div style={{ padding: '12px', background: THEME.bg.surface, borderRadius: RADIUS.control }}>
                  <div style={{ fontSize: 11, color: THEME.text.muted }}>Argent Dépensé (Ar)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: THEME.brand.amber }}>{formatAr(selectedSource.montantTotalAr)}</div>
                </div>
                <div style={{ padding: '12px', background: THEME.bg.surface, borderRadius: RADIUS.control }}>
                  <div style={{ fontSize: 11, color: THEME.text.muted }}>Argent Dépensé (¥)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#C24A3F' }}>
                    {selectedSource.montantTotalRmb > 0 ? formatRmb(selectedSource.montantTotalRmb) : '0 ¥'}
                  </div>
                </div>
                <div style={{ padding: '12px', background: THEME.bg.surface, borderRadius: RADIUS.control }}>
                  <div style={{ fontSize: 11, color: THEME.text.muted }}>Panier Moyen</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: THEME.brand.blue }}>{formatAr(selectedSource.panierMoyenAr)}</div>
                </div>
                <div style={{ padding: '12px', background: THEME.bg.surface, borderRadius: RADIUS.control }}>
                  <div style={{ fontSize: 11, color: THEME.text.muted }}>Marge Brute Aval</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: THEME.brand.emerald }}>{formatAr(selectedSource.margeBruteGeneresAr)}</div>
                </div>
              </div>

              {/* Statuts des commandes */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, marginBottom: 8 }}>
                  Statuts Logistiques des Commandes ({selectedSource.nbCommandes})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(selectedSource.statutsBreakdown).map(([statut, count]) => (
                    <div
                      key={statut}
                      style={{
                        padding: '6px 12px',
                        borderRadius: RADIUS.control,
                        background: THEME.bg.surface,
                        border: `1px solid ${THEME.border.base}`,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span style={{ fontWeight: 600, color: THEME.text.primary }}>{statut}:</span>
                      <span style={{ fontWeight: 800, color: THEME.brand.blue }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Articles approvisionnés via cette source */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, marginBottom: 8 }}>
                  Articles Approvisionnés sur cette Source ({selectedSource.articlesTop.length})
                </div>
                <div style={{
                  border: `1px solid ${THEME.border.base}`,
                  borderRadius: RADIUS.control,
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: THEME.bg.surface, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Article</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Quantité</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Montant Total (Ar)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSource.articlesTop.map(art => (
                        <tr key={art.id} style={{ borderBottom: `1px solid ${THEME.border.base}` }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: THEME.text.primary }}>{art.nom}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: THEME.brand.emerald }}>{art.qty} pcs</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: THEME.brand.amber }}>{formatAr(art.montantAr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 22px',
              borderTop: `1px solid ${THEME.border.base}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: THEME.bg.surface
            }}>
              {onNavigateTab && (
                <button
                  onClick={() => {
                    setSelectedSource(null);
                    onNavigateTab('achat', selectedSource.source);
                  }}
                  style={{
                    ...primaryBtn,
                    padding: '6px 14px',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>Voir les commandes d'achat</span>
                  <ExternalLink size={13} />
                </button>
              )}
              <button
                onClick={() => setSelectedSource(null)}
                style={{ ...ghostBtn, padding: '6px 14px', fontSize: 12, marginLeft: 'auto' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
