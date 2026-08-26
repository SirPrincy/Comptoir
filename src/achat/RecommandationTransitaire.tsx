import React, { useState, useMemo } from 'react';
import { Sparkles, Truck, Check, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { parseTarifValue } from '../fournisseurs/ComparateurFret';
import { TarifFret } from '../fournisseurs/TarifFretForm';
import { TYPES_ENVOI_AERIEN, TYPES_ENVOI_MARITIME } from '../constants';
import { calculerPerformanceTransitaire } from '../logistique/logistiqueUtils';
import { calculerScoreFournisseur } from '../qcUtils';

interface RecommandationTransitaireProps {
  product: any;
  commandes: any[];
  fournisseurs: any[];
  currentTransitaireId: string;
  onSelectTransitaire: (transitaireId: string) => void;
}

export default function RecommandationTransitaire({
  product,
  commandes = [],
  fournisseurs = [],
  currentTransitaireId,
  onSelectTransitaire,
}: RecommandationTransitaireProps) {
  const [mode, setMode] = useState<'Aérien' | 'Maritime'>('Aérien');
  
  // Deviner intelligemment le type d'envoi à partir du produit sélectionné
  const suggestedTypeEnvoi = useMemo(() => {
    if (!product) return 'Normal';
    const text = `${product.nom || ''} ${product.categorie || ''} ${product.reference || ''}`.toLowerCase();
    
    if (text.includes('batterie') || text.includes('powerbank') || text.includes('pile') || text.includes('accumulateur')) {
      return 'Batterie';
    }
    if (text.includes('téléphone') || text.includes('phone') || text.includes('smartphone') || text.includes('tablette')) {
      return 'Téléphone';
    }
    if (text.includes('liquide') || text.includes('parfum') || text.includes('crème') || text.includes('huile') || text.includes('cosmétique')) {
      return 'Liquide / Cosmétique';
    }
    if (text.includes('verre') || text.includes('fragile') || text.includes('écran') || text.includes('porcelaine')) {
      return 'Fragile';
    }
    if (text.includes('luxe') || text.includes('marque') || text.includes('bijou') || text.includes('montre')) {
      return 'Luxe / Marque';
    }
    return 'Normal';
  }, [product]);

  const [typeEnvoi, setTypeEnvoi] = useState<string>(suggestedTypeEnvoi);

  // Synchroniser le type si le produit change
  React.useEffect(() => {
    setTypeEnvoi(suggestedTypeEnvoi);
  }, [suggestedTypeEnvoi]);

  const transitaires = useMemo(() => {
    return (fournisseurs || []).filter(
      (f: any) => f.plateforme === 'Transitaire / Fret' || (f.tarifs && f.tarifs.length > 0) || !!f.prixFret
    );
  }, [fournisseurs]);

  // Calcul des recommandations
  const recommandations = useMemo(() => {
    if (transitaires.length === 0) return null;

    const list: Array<{
      transitaire: any;
      tarif: TarifFret | null;
      parsedPrice: { val: number; unite: string } | null;
      delaiEstime: string;
      delaiJours: number;
      performance: any;
      scoreQC: any;
    }> = [];

    transitaires.forEach((tr: any) => {
      const matchingTarif = (tr.tarifs || []).find(
        (t: TarifFret) => t.mode === mode && t.typeEnvoi.toLowerCase() === typeEnvoi.toLowerCase()
      ) || (tr.tarifs || []).find((t: TarifFret) => t.mode === mode) || (tr.prixFret ? { id: tr.id, mode, typeEnvoi, prix: tr.prixFret } as any : null);

      const parsedPrice = matchingTarif ? parseTarifValue(matchingTarif.prix) : parseTarifValue(tr.prixFret);
      const perf = calculerPerformanceTransitaire(tr.id, mode, commandes, fournisseurs);
      const qc = calculerScoreFournisseur(tr.id, commandes);

      let delaiJours = perf.delaiMoyenJours || (mode === 'Aérien' ? 15 : 60);
      let delaiEstime = matchingTarif?.delai || `${delaiJours} jours`;

      list.push({
        transitaire: tr,
        tarif: matchingTarif,
        parsedPrice,
        delaiEstime,
        delaiJours,
        performance: perf,
        scoreQC: qc,
      });
    });

    // 1. Trouver le moins cher
    let bestCheapest: (typeof list)[0] | null = null;
    let minPrice = Infinity;

    list.forEach(item => {
      if (item.parsedPrice && item.parsedPrice.val < minPrice) {
        minPrice = item.parsedPrice.val;
        bestCheapest = item;
      }
    });

    // 2. Trouver le plus fiable / plus rapide
    let bestReliable: (typeof list)[0] | null = null;
    let minDelay = Infinity;

    list.forEach(item => {
      const delay = item.delaiJours;
      const qcRate = item.scoreQC ? item.scoreQC.taux : 100;
      if (delay < minDelay && qcRate >= 80) {
        minDelay = delay;
        bestReliable = item;
      }
    });

    if (!bestReliable && list.length > 0) {
      bestReliable = list[0];
    }

    return {
      bestCheapest: bestCheapest || list[0],
      bestReliable: bestReliable || list[0],
      all: list,
    };
  }, [transitaires, mode, typeEnvoi, commandes, fournisseurs]);

  if (transitaires.length === 0 || !recommandations) {
    return null;
  }

  const cheapestId = recommandations.bestCheapest?.transitaire.id;
  const fastestId = recommandations.bestReliable?.transitaire.id;

  return (
    <div
      style={{
        background: '#F6F9F7',
        border: '1px solid #CDE2D6',
        borderRadius: 8,
        padding: '10px 12px',
        marginTop: 4,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color="#2C5E43" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1B4D33' }}>
            Transitaires disponibles ({recommandations.all.length})
          </span>
          {product && (
            <span
              style={{
                fontSize: 11,
                background: '#E0EFE6',
                color: '#2C5E43',
                padding: '1px 6px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              pour {typeEnvoi}
            </span>
          )}
        </div>

        {/* Boutons de bascule rapide mode & type */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setMode(m => (m === 'Aérien' ? 'Maritime' : 'Aérien'))}
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #B8D6C4',
              background: '#FFFFFF',
              color: '#2C5E43',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {mode === 'Aérien' ? '✈️ Aérien' : '🚢 Maritime'} ⇄
          </button>

          <select
            value={typeEnvoi}
            onChange={e => setTypeEnvoi(e.target.value)}
            style={{
              fontSize: 11,
              padding: '2px 4px',
              borderRadius: 4,
              border: '1px solid #B8D6C4',
              background: '#FFFFFF',
              color: '#2C5E43',
              fontWeight: 500,
            }}
          >
            {(mode === 'Aérien' ? TYPES_ENVOI_AERIEN : TYPES_ENVOI_MARITIME).map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cartes de tous les transitaires disponibles */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {recommandations.all.map(item => {
          const isSelected = currentTransitaireId === item.transitaire.id;
          const isCheapest = item.transitaire.id === cheapestId;
          const isFastest = item.transitaire.id === fastestId;

          return (
            <div
              key={item.transitaire.id}
              style={{
                flex: '1 1 180px',
                background: '#FFFFFF',
                border: `1px solid ${isSelected ? '#2C5E43' : '#DCE9E1'}`,
                borderRadius: 6,
                padding: '8px 10px',
                boxShadow: isSelected ? '0 0 0 1.5px #2C5E43' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    {isCheapest && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          background: '#E0EFE6',
                          color: '#2C5E43',
                          padding: '1px 5px',
                          borderRadius: 3,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <DollarSign size={10} /> Moins cher
                      </span>
                    )}
                    {isFastest && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          background: '#E3EFF5',
                          color: '#3D5A6C',
                          padding: '1px 5px',
                          borderRadius: 3,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Clock size={10} /> Rapide
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#2C5E43', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Check size={11} /> Sélectionné
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: '#26333D', marginTop: 4 }}>
                  {item.transitaire.nom}
                </div>

                <div style={{ fontSize: 11.5, color: '#2C5E43', fontWeight: 600, marginTop: 2 }}>
                  {item.tarif?.prix || item.transitaire.prixFret || 'Tarif sur demande'}
                  {item.delaiEstime && (
                    <span style={{ color: '#736B5E', fontWeight: 400, marginLeft: 4 }}>
                      • {item.delaiEstime}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectTransitaire(item.transitaire.id)}
                disabled={isSelected}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: isSelected ? '#E0EFE6' : '#2C5E43',
                  color: isSelected ? '#2C5E43' : '#FFFFFF',
                  cursor: isSelected ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {isSelected ? (
                  <>
                    <Check size={12} /> Assigné
                  </>
                ) : (
                  'Appliquer ce transitaire'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
