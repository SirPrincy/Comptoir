import React, { useState, useMemo } from 'react';
import { Truck, ChevronDown, ChevronUp, Award, Clock, AlertTriangle, CheckCircle2, Package, Maximize2 } from 'lucide-react';
import { TarifFret } from './TarifFretForm';
import { TYPES_ENVOI_AERIEN, TYPES_ENVOI_MARITIME } from '../constants';
import { calculerPerformanceTransitaire } from '../logistique/logistiqueUtils';
import DetailTransitaireArticles from './DetailTransitaireArticles';
import ModalDetailTransitaireArticles from './ModalDetailTransitaireArticles';

interface ComparateurFretProps {
  fournisseurs: any[];
  commandes?: any[];
  products?: any[];
  onSelectTransitaire?: (transitaire: any) => void;
  onNavigateToLogistique?: (commandeId?: string) => void;
}

export function parseTarifValue(prixStr?: string): { val: number; unite: string } | null {
  if (!prixStr || typeof prixStr !== 'string') return null;
  const clean = prixStr.replace(/\s+/g, '').replace(',', '.');
  const match = clean.match(/([\d.]+)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  let unite = '';
  const lower = prixStr.toLowerCase();
  if (lower.includes('ar') || lower.includes('mga')) unite = 'Ar';
  else if (lower.includes('$') || lower.includes('usd')) unite = '$';
  else if (lower.includes('€') || lower.includes('eur')) unite = '€';

  if (lower.includes('kg')) unite += '/kg';
  else if (lower.includes('m3') || lower.includes('m³')) unite += '/m³';

  return { val: num, unite };
}

export default function ComparateurFret({
  fournisseurs = [],
  commandes = [],
  products = [],
  onSelectTransitaire,
  onNavigateToLogistique,
}: ComparateurFretProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedMode, setSelectedMode] = useState<'Aérien' | 'Maritime'>('Aérien');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedTransitaireId, setExpandedTransitaireId] = useState<string | null>(null);
  const [modalTransitaire, setModalTransitaire] = useState<any | null>(null);

  const transitaires = useMemo(() => {
    return (fournisseurs || []).filter(
      (f: any) => f.plateforme === 'Transitaire / Fret' || (f.tarifs && f.tarifs.length > 0) || !!f.prixFret
    );
  }, [fournisseurs]);

  // Fonction utilitaire pour trouver le tarif ou utiliser prixFret en repli
  const resolveTarif = (tr: any, mode: 'Aérien' | 'Maritime', type: string): TarifFret | null => {
    const match = (tr.tarifs || []).find(
      (t: TarifFret) => t.mode === mode && t.typeEnvoi.toLowerCase() === type.toLowerCase()
    );
    if (match) return match;
    if (tr.prixFret && typeof tr.prixFret === 'string' && tr.prixFret.trim().length > 0) {
      return { id: tr.id, mode, typeEnvoi: type, prix: tr.prixFret };
    }
    return null;
  };

  // Types d'envois uniques
  const typesDisponibles = useMemo(() => {
    const defaultTypes = selectedMode === 'Aérien' ? TYPES_ENVOI_AERIEN : TYPES_ENVOI_MARITIME;
    const customTypes = new Set<string>(defaultTypes);

    transitaires.forEach((t: any) => {
      (t.tarifs || []).forEach((tar: TarifFret) => {
        if (tar.mode === selectedMode && tar.typeEnvoi) {
          customTypes.add(tar.typeEnvoi);
        }
      });
    });

    return Array.from(customTypes);
  }, [transitaires, selectedMode]);

  // Données de comparaison croisant les tarifs théoriques ET les délais réels constatés
  const comparisonData = useMemo(() => {
    const typesToShow = selectedType === 'all' ? typesDisponibles : [selectedType];
    const minPricesByType: Record<string, { minVal: number; unite: string }> = {};

    typesToShow.forEach(type => {
      let minVal = Infinity;
      let minUnite = '';

      transitaires.forEach((tr: any) => {
        const matchingTarif = resolveTarif(tr, selectedMode, type);
        if (matchingTarif) {
          const parsed = parseTarifValue(matchingTarif.prix);
          if (parsed && parsed.val < minVal) {
            minVal = parsed.val;
            minUnite = parsed.unite;
          }
        }
      });

      if (minVal !== Infinity) {
        minPricesByType[type] = { minVal, unite: minUnite };
      }
    });

    // Performances réelles par transitaire
    const perfsByTransitaireId: Record<string, any> = {};
    transitaires.forEach((tr: any) => {
      perfsByTransitaireId[tr.id] = calculerPerformanceTransitaire(tr.id, selectedMode, commandes, fournisseurs);
    });

    return {
      typesToShow,
      minPricesByType,
      perfsByTransitaireId,
    };
  }, [transitaires, selectedMode, selectedType, typesDisponibles, commandes, fournisseurs]);

  if (transitaires.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #EAE2D4',
        borderRadius: 10,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* Barre d'en-tête cliquable (Dépliable / Repliable) */}
      <div
        onClick={() => setIsOpen(v => !v)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: '#FAF7F2',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#E3EFE9',
              color: '#2C5E43',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Truck size={15} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#26333D', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Grille Comparative Fret & Délais Réels</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#2C5E43', background: '#E0EFE6', padding: '1px 6px', borderRadius: 4 }}>
                {transitaires.length} transitaire{transitaires.length > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#8A8375' }}>
              Tarifs contractuels + Délais réels & retards constatés sur livraisons
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#5E584E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {isOpen ? 'Réduire' : 'Déplier'}
          </button>
        </div>
      </div>

      {/* Corps du comparateur repliable */}
      {isOpen && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #EAE2D4' }}>
          {/* Ligne des filtres : Mode et Type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {/* Mode Aérien / Maritime */}
            <div style={{ display: 'flex', gap: 4, background: '#F4EFE6', padding: 3, borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedMode('Aérien');
                  setSelectedType('all');
                }}
                style={{
                  fontSize: 11.5,
                  fontWeight: selectedMode === 'Aérien' ? 700 : 500,
                  padding: '3px 9px',
                  borderRadius: 6,
                  border: 'none',
                  background: selectedMode === 'Aérien' ? '#FFFFFF' : 'transparent',
                  color: selectedMode === 'Aérien' ? '#2C5E43' : '#736B5E',
                  boxShadow: selectedMode === 'Aérien' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                ✈️ Aérien
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMode('Maritime');
                  setSelectedType('all');
                }}
                style={{
                  fontSize: 11.5,
                  fontWeight: selectedMode === 'Maritime' ? 700 : 500,
                  padding: '3px 9px',
                  borderRadius: 6,
                  border: 'none',
                  background: selectedMode === 'Maritime' ? '#FFFFFF' : 'transparent',
                  color: selectedMode === 'Maritime' ? '#2C5E43' : '#736B5E',
                  boxShadow: selectedMode === 'Maritime' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                🚢 Maritime
              </button>
            </div>

            {/* Filtre type d'envoi */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                style={{
                  fontSize: 11,
                  fontWeight: selectedType === 'all' ? 700 : 500,
                  padding: '2px 7px',
                  borderRadius: 12,
                  border: `1px solid ${selectedType === 'all' ? '#2C5E43' : '#EAE2D4'}`,
                  background: selectedType === 'all' ? '#2C5E43' : '#FAF7F2',
                  color: selectedType === 'all' ? '#FFFFFF' : '#5E584E',
                  cursor: 'pointer',
                }}
              >
                Tous
              </button>
              {typesDisponibles.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  style={{
                    fontSize: 11,
                    fontWeight: selectedType === t ? 700 : 500,
                    padding: '2px 7px',
                    borderRadius: 12,
                    border: `1px solid ${selectedType === t ? '#2C5E43' : '#EAE2D4'}`,
                    background: selectedType === t ? '#2C5E43' : '#FAF7F2',
                    color: selectedType === t ? '#FFFFFF' : '#5E584E',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tableau */}
          <div style={{ overflowX: 'auto', border: '1px solid #EAE2D4', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #EAE2D4' }}>
                  <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, minWidth: 140 }}>
                    Transitaire
                  </th>
                  <th style={{ padding: '8px 10px', color: '#1B4D33', fontWeight: 700, minWidth: 160, borderLeft: '1px solid #EAE2D4', background: '#F2F8F4' }}>
                    ⏱️ Réel vs Théorique
                  </th>
                  {comparisonData.typesToShow.map(t => (
                    <th key={t} style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, minWidth: 110, borderLeft: '1px solid #EAE2D4' }}>
                      {t}
                    </th>
                  ))}
                  <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, minWidth: 130, borderLeft: '1px solid #EAE2D4', textAlign: 'center' }}>
                    Détails & Articles
                  </th>
                </tr>
              </thead>
              <tbody>
                {transitaires.map((tr: any, idx: number) => {
                  const perf = comparisonData.perfsByTransitaireId[tr.id];
                  const hasRealData = perf && perf.source === 'historique' && perf.nbColisAnalyses > 0;
                  const isExpanded = expandedTransitaireId === tr.id;

                  // Calcul du nombre de colis / articles confiés à ce transitaire
                  const matchedCmds = (commandes || []).filter(
                    (c: any) => c.transitaireId === tr.id || (c.fournisseurId === tr.id && tr.plateforme === 'Transitaire / Fret')
                  );
                  const nbArticles = matchedCmds.length;

                  const totalColumns = comparisonData.typesToShow.length + 3;

                  return (
                    <React.Fragment key={tr.id}>
                      <tr
                        style={{
                          borderBottom: isExpanded ? 'none' : idx === transitaires.length - 1 ? 'none' : '1px solid #F0ECE1',
                          background: isExpanded ? '#FAF6F0' : idx % 2 === 0 ? '#FFFFFF' : '#FDFAF5',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Transitaire */}
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#26333D' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{tr.nom}</div>
                              {tr.contact && <div style={{ fontSize: 10.5, color: '#8A8375', fontWeight: 400 }}>{tr.contact}</div>}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedTransitaireId(isExpanded ? null : tr.id);
                              }}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: 10,
                                border: '1px solid #D8CFC0',
                                background: isExpanded ? '#2C5E43' : '#F4EFE6',
                                color: isExpanded ? '#FFFFFF' : '#5E584E',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                              title="Déplier l'analyse détaillée des articles"
                            >
                              📦 {nbArticles} colis
                            </button>
                          </div>
                        </td>

                        {/* Performance RÉELLE vs Théorique */}
                        <td style={{ padding: '8px 10px', borderLeft: '1px solid #F0ECE1', background: '#F8FAF9' }}>
                          {hasRealData ? (
                            <div>
                              <div style={{ fontWeight: 700, color: perf.retardMoyenJours > 2 ? '#B5532A' : '#1B6A3E', fontSize: 11.5 }}>
                                {perf.delaiMoyenJours} jours réels
                              </div>
                              <div style={{ fontSize: 10, color: '#736B5E' }}>
                                sur {perf.nbColisAnalyses} colis ({perf.retardMoyenJours > 0 ? `+${perf.retardMoyenJours}j retard` : 'ponctuel'})
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTransitaireId(isExpanded ? null : tr.id);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#2C5E43',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: 0,
                                  marginTop: 2,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                }}
                              >
                                {isExpanded ? '▲ Masquer' : '🔍 Détail articles ▾'}
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: 10.5, color: '#8A8375', fontStyle: 'italic' }}>
                                {perf?.fiabiliteLabel || (selectedMode === 'Aérien' ? '~15j standard' : '~60j standard')}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTransitaireId(isExpanded ? null : tr.id);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#3D5A6C',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: 0,
                                  marginTop: 2,
                                  cursor: 'pointer',
                                }}
                              >
                                {isExpanded ? '▲ Masquer' : '📦 Voir articles'}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Colonnes par type d'envoi */}
                        {comparisonData.typesToShow.map(type => {
                          const tarif = resolveTarif(tr, selectedMode, type);

                          if (!tarif) {
                            return (
                              <td key={type} style={{ padding: '8px 10px', color: '#B0A898', fontStyle: 'italic', borderLeft: '1px solid #F0ECE1' }}>
                                —
                              </td>
                            );
                          }

                          const parsed = parseTarifValue(tarif.prix);
                          const minInfo = comparisonData.minPricesByType[type];
                          const isBest = parsed && minInfo && parsed.val === minInfo.minVal && minInfo.minVal > 0;

                          return (
                            <td key={type} style={{ padding: '8px 10px', borderLeft: '1px solid #F0ECE1', background: isBest ? '#F2FAF5' : 'transparent' }}>
                              <div style={{ fontWeight: isBest ? 700 : 600, color: isBest ? '#1B6A3E' : '#26333D' }}>
                                {tarif.prix} {isBest && <span style={{ fontSize: 9.5, background: '#D9F2E2', color: '#1B6A3E', padding: '1px 3px', borderRadius: 3 }}>★ Top</span>}
                              </div>
                              {tarif.delai && <div style={{ fontSize: 10, color: '#8A8375' }}>Théo: {tarif.delai}</div>}
                            </td>
                          );
                        })}

                        {/* Colonne Actions & Détails */}
                        <td style={{ padding: '8px 10px', borderLeft: '1px solid #F0ECE1', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedTransitaireId(isExpanded ? null : tr.id);
                              }}
                              style={{
                                border: `1px solid ${isExpanded ? '#2C5E43' : '#D8CFC0'}`,
                                background: isExpanded ? '#2C5E43' : '#FFFFFF',
                                color: isExpanded ? '#FFFFFF' : '#2C5E43',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              title="Déplier l'historique détaillé des articles et délais réels vs théoriques"
                            >
                              <Package size={12} />
                              <span>{isExpanded ? 'Fermer' : 'Articles'}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalTransitaire(tr);
                              }}
                              style={{
                                border: '1px solid #E0D8CA',
                                background: '#FFFFFF',
                                color: '#5E584E',
                                borderRadius: 6,
                                padding: '4px 6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                              title="Ouvrir les détails et articles en plein écran"
                            >
                              <Maximize2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Ligne dépliée avec le composant d'analyse par article */}
                      {isExpanded && (
                        <tr key={`${tr.id}-articles-expanded`}>
                          <td
                            colSpan={totalColumns}
                            style={{
                              padding: '14px 16px',
                              background: '#FDFBF7',
                              borderBottom: '2px solid #D8CFC0',
                              boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.03)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#26333D', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Package size={16} color="#2C5E43" />
                                <span>Articles acheminés par « {tr.nom} » & Comparatif Délais Réels vs Théoriques</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => setModalTransitaire(tr)}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#3D5A6C',
                                    background: '#FFFFFF',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: 5,
                                    padding: '3px 8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <Maximize2 size={12} />
                                  <span>Plein écran</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedTransitaireId(null)}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#8A8375',
                                    background: '#F4EFE6',
                                    border: '1px solid #EAE2D4',
                                    borderRadius: 5,
                                    padding: '3px 8px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Fermer ✕
                                </button>
                              </div>
                            </div>

                            <DetailTransitaireArticles
                              transitaire={tr}
                              commandes={commandes}
                              products={products}
                              initialMode={selectedMode}
                              onNavigateToLogistique={onNavigateToLogistique}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal plein écran pour les détails et articles du transitaire */}
      {modalTransitaire && (
        <ModalDetailTransitaireArticles
          transitaire={modalTransitaire}
          commandes={commandes}
          products={products}
          initialMode={selectedMode}
          onClose={() => setModalTransitaire(null)}
          onNavigateToLogistique={onNavigateToLogistique}
        />
      )}
    </div>
  );
}
