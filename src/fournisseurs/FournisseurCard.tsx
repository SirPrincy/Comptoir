import React from 'react';
import { Trash2, Edit2, Truck, Clock, Package } from 'lucide-react';
import { rowCard, iconBtn } from '../ui';
import { TarifFret } from './TarifFretForm';
import { calculerScoreFournisseur, getQCBadgeInfo } from '../qcUtils';
import { calculerPerformanceTransitaire } from '../logistique/logistiqueUtils';

interface FournisseurCardProps {
  key?: React.Key;
  fournisseur: any;
  allFournisseurs: any[];
  commandes: any[];
  products: any[];
  stats: {
    totalDepenseAr: number;
    totalPayeAr: number;
    totalDuAr: number;
    totalPieces: number;
    nbCommandes: number;
  };
  globalTotalDepenses: number;
  onEdit: (f: any) => void;
  onDelete: (f: any, e: React.MouseEvent) => void;
  onOpenDetailArticles?: (f: any) => void;
}

export default function FournisseurCard({
  fournisseur: f,
  allFournisseurs,
  commandes,
  products,
  stats: st,
  globalTotalDepenses,
  onEdit,
  onDelete,
  onOpenDetailArticles,
}: FournisseurCardProps) {
  const isTransitaire = f.plateforme === 'Transitaire / Fret';
  const hasTarifs = f.tarifs && f.tarifs.length > 0;
  const score = calculerScoreFournisseur(f.id, commandes, products);
  const badge = getQCBadgeInfo(score);

  const partBudget = globalTotalDepenses > 0
    ? Math.round((st.totalDepenseAr / globalTotalDepenses) * 100)
    : 0;

  const nbCmds = (id: string) => commandes.filter((c: any) => c.fournisseurId === id || c.transitaireId === id).length;

  return (
    <div
      onClick={() => onEdit(f)}
      style={{ ...rowCard as any, cursor: 'pointer', transition: 'background 0.15s ease' }}
      title="Cliquer pour modifier ou voir l'historique des prix"
    >
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{f.nom}</span>

          {badge && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 6,
                background: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
                whiteSpace: 'nowrap',
              }}
            >
              {badge.label}
            </span>
          )}

          {isTransitaire && (
            <span style={{ fontSize: 11, background: '#E3EFE9', color: '#2C5E43', padding: '2px 7px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Truck size={12} /> Transitaire
            </span>
          )}

          {f.plateforme === 'Exchanger / Agent de change' && (
            <span style={{ fontSize: 11, background: '#FFF9E6', color: '#B78103', border: '1px solid #F5E5B8', padding: '2px 7px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              🔀 Exchanger
            </span>
          )}

          {st.totalDuAr > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: '#FDF0EC',
                color: '#B5532A',
                padding: '2px 7px',
                borderRadius: 6,
                border: '1px solid #FACFC2',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Clock size={11} /> Solde dû : {st.totalDuAr.toLocaleString('fr-FR')} Ar
            </span>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#8A8375', marginTop: 2, wordBreak: 'break-word' }}>
          {f.plateforme}{f.contact ? ` · Contact: ${f.contact}` : ''} · {nbCmds(f.id)} commande{nbCmds(f.id) > 1 ? 's' : ''}
          {st.totalPieces > 0 ? ` (${st.totalPieces} pièces)` : ''}
          {f.notes ? ` · ${f.notes}` : ''}
        </div>

        {/* Affichage des tarifs & fiabilité si transitaire */}
        {isTransitaire && (() => {
          const perfAir = calculerPerformanceTransitaire(f.id, 'Aérien', commandes, allFournisseurs);
          const perfSea = calculerPerformanceTransitaire(f.id, 'Maritime', commandes, allFournisseurs);
          const hasPerf = perfAir.nbColisAnalyses > 0 || perfSea.nbColisAnalyses > 0;

          return (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {hasTarifs ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {f.tarifs.map((t: TarifFret) => (
                    <span key={t.id} style={{ fontSize: 11.5, background: '#F0F5F2', border: '1px solid #D4E3DA', color: '#2C5E43', borderRadius: 5, padding: '3px 8px', fontWeight: 500 }}>
                      <strong>{t.mode === 'Aérien' ? '✈️' : '🚢'} {t.typeEnvoi}</strong> : {t.prix} {t.delai ? `(${t.delai})` : ''}
                    </span>
                  ))}
                </div>
              ) : f.prixFret ? (
                <div style={{ fontSize: 12, fontWeight: 600, color: '#2C5E43' }}>
                  Tarif : {f.prixFret}
                </div>
              ) : (
                <div style={{ fontSize: 11, fontStyle: 'italic', color: '#B57236' }}>
                  + Cliquer pour ajouter la grille des tarifs (Aérien/Maritime: Normal, Batterie, Fragile...)
                </div>
              )}

              {hasPerf && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2, alignItems: 'center' }}>
                  {perfAir.nbColisAnalyses > 0 && (
                    <span style={{ fontSize: 10.5, fontWeight: 600, background: '#EBF4EC', color: '#3F7A5C', padding: '2px 6px', borderRadius: 4, border: '1px solid #C2E0D1' }}>
                      ✈️ Fiabilité : {perfAir.fiabiliteLabel}
                    </span>
                  )}
                  {perfSea.nbColisAnalyses > 0 && (
                    <span style={{ fontSize: 10.5, fontWeight: 600, background: '#FEF3EB', color: '#E8985E', padding: '2px 6px', borderRadius: 4, border: '1px solid #FAD1B5' }}>
                      🚢 Fiabilité : {perfSea.fiabiliteLabel}
                    </span>
                  )}
                </div>
              )}

              {onOpenDetailArticles && (
                <div style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetailArticles(f);
                    }}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#2C5E43',
                      background: '#F0F7F3',
                      border: '1px solid #C2E0D1',
                      borderRadius: 5,
                      padding: '3px 8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Voir les articles acheminés et le temps réel vs théorique par article"
                  >
                    <Package size={12} />
                    <span>Articles & Délais Réels vs Théoriques ({nbCmds(f.id)})</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Bloc Chiffre d'Affaires / Total Dépensé + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#3D5A6C' }}>
            {st.totalDepenseAr.toLocaleString('fr-FR')} Ar
          </div>
          {partBudget > 0 && (
            <div style={{ fontSize: 10.5, color: '#8A8375' }}>
              {partBudget}% des dépenses
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onEdit(f); }}
          style={{ ...iconBtn, color: '#5B7B88' }}
          title="Modifier / Voir historique prix"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={(e) => onDelete(f, e)}
          style={iconBtn}
          title="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
