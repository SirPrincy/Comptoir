import React, { useState, useMemo } from 'react';
import { Truck, ChevronDown, ChevronUp, Award, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TarifFret } from './TarifFretForm';
import { TYPES_ENVOI_AERIEN, TYPES_ENVOI_MARITIME } from '../constants';
import { calculerPerformanceTransitaire } from '../logistique/logistiqueUtils';

interface ComparateurFretProps {
  fournisseurs: any[];
  commandes?: any[];
  onSelectTransitaire?: (transitaire: any) => void;
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
  onSelectTransitaire,
}: ComparateurFretProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedMode, setSelectedMode] = useState<'Aérien' | 'Maritime'>('Aérien');
  const [selectedType, setSelectedType] = useState<string>('all');

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
                  <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, minWidth: 130 }}>
                    Transitaire
                  </th>
                  <th style={{ padding: '8px 10px', color: '#1B4D33', fontWeight: 700, minWidth: 150, borderLeft: '1px solid #EAE2D4', background: '#F2F8F4' }}>
                    ⏱️ Réel vs Théorique
                  </th>
                  {comparisonData.typesToShow.map(t => (
                    <th key={t} style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, minWidth: 110, borderLeft: '1px solid #EAE2D4' }}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transitaires.map((tr: any, idx: number) => {
                  const perf = comparisonData.perfsByTransitaireId[tr.id];
                  const hasRealData = perf && perf.source === 'historique' && perf.nbColisAnalyses > 0;

                  return (
                    <tr
                      key={tr.id}
                      onClick={() => onSelectTransitaire && onSelectTransitaire(tr)}
                      style={{
                        borderBottom: idx === transitaires.length - 1 ? 'none' : '1px solid #F0ECE1',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FDFAF5',
                        cursor: onSelectTransitaire ? 'pointer' : 'default',
                      }}
                    >
                      {/* Transitaire */}
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#26333D' }}>
                        <div>{tr.nom}</div>
                        {tr.contact && <div style={{ fontSize: 10.5, color: '#8A8375', fontWeight: 400 }}>{tr.contact}</div>}
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
                          </div>
                        ) : (
                          <div style={{ fontSize: 10.5, color: '#8A8375', fontStyle: 'italic' }}>
                            {perf?.fiabiliteLabel || (selectedMode === 'Aérien' ? '~15j standard' : '~60j standard')}
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
