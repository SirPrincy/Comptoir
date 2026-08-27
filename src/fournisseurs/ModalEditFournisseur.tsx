import React from 'react';
import { TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Modal, Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { SOURCES } from '../constants';
import { getQCBadgeInfo } from '../qcUtils';
import { calculerHistoriquePrixFournisseur } from '../paymentUtils';
import TarifFretForm, { TarifFret, sanitizeTarifs } from './TarifFretForm';
import HistoriquePrixFournisseur from './HistoriquePrixFournisseur';

interface ModalEditFournisseurProps {
  editing: any;
  commandes: any[];
  products: any[];
  st: {
    totalDepenseAr: number;
    totalPayeAr: number;
    totalDuAr: number;
    totalPieces: number;
    nbCommandes: number;
  };
  score: any;
  onClose: () => void;
  onSave: (updated: any) => void;
}

export default function ModalEditFournisseur({
  editing: initialEditing,
  commandes,
  products,
  st,
  score,
  onClose,
  onSave,
}: ModalEditFournisseurProps) {
  const [editing, setEditing] = React.useState(initialEditing);

  if (!editing) return null;

  const badge = getQCBadgeInfo(score);
  const historiquePrix = calculerHistoriquePrixFournisseur(editing.id, commandes, products);

  const handleSave = () => {
    const nomTrim = (editing.nom || '').trim();
    if (!nomTrim) return;

    const hasTarifs = editing.tarifs && editing.tarifs.length > 0;
    const isTransitaire = editing.plateforme === 'Transitaire / Fret' || hasTarifs;
    const sanitizedTarifs = isTransitaire ? sanitizeTarifs(editing.tarifs) : [];
    const plateformeFinale = isTransitaire ? 'Transitaire / Fret' : editing.plateforme;

    onSave({
      ...editing,
      nom: nomTrim,
      plateforme: plateformeFinale,
      contact: (editing.contact || '').trim(),
      notes: (editing.notes || '').trim(),
      tarifs: sanitizedTarifs,
    });
  };

  return (
    <Modal title={`Modifier « ${editing.nom} »`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Carte récapitulatif Dépenses & Solde dû */}
        <div style={{ background: '#FAF7F2', border: '1px solid #EAE2D4', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#736B5E' }}>Total Dépensé</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3D5A6C' }}>
                {st.totalDepenseAr.toLocaleString('fr-FR')} Ar
              </div>
              <div style={{ fontSize: 10.5, color: '#8A8375' }}>{st.nbCommandes} cdes · {st.totalPieces} pcs</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#736B5E' }}>Solde Restant Dû</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: st.totalDuAr > 0 ? '#B5532A' : '#1B6A3E' }}>
                {st.totalDuAr > 0 ? `${st.totalDuAr.toLocaleString('fr-FR')} Ar` : 'Soldé'}
              </div>
              <div style={{ fontSize: 10.5, color: '#8A8375' }}>
                {st.totalPayeAr > 0 ? `Versé: ${st.totalPayeAr.toLocaleString('fr-FR')} Ar` : 'Aucun versement'}
              </div>
            </div>
          </div>
        </div>

        {/* Champs d'édition de base */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Nom / boutique" style={{ flex: '2 1 180px' }}>
            <input
              style={inputStyle as any}
              value={editing.nom}
              onChange={e => setEditing({ ...editing, nom: e.target.value })}
            />
          </Field>

          <Field label="Plateforme / Type" style={{ flex: '1 1 140px' }}>
            <select
              style={selectStyle as any}
              value={editing.plateforme}
              onChange={e => setEditing({ ...editing, plateforme: e.target.value })}
            >
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Contact (WeChat, tél…)" style={{ flex: '1 1 160px' }}>
            <input
              style={inputStyle as any}
              value={editing.contact || ''}
              onChange={e => setEditing({ ...editing, contact: e.target.value })}
            />
          </Field>

          <Field label="Notes" style={{ flex: '2 1 200px' }}>
            <input
              style={inputStyle as any}
              value={editing.notes || ''}
              onChange={e => setEditing({ ...editing, notes: e.target.value })}
            />
          </Field>
        </div>

        {/* Section Évolution des Prix & Négociations */}
        <div style={{ background: '#FAF7F2', padding: 12, borderRadius: 8, border: '1px solid #EAE2D4', marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3D5A6C', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} />
            <span>Historique & Évolution des Prix (Détection hausses / baisses)</span>
          </div>
          <HistoriquePrixFournisseur historiquePrix={historiquePrix} fournisseurNom={editing.nom} />
        </div>

        {/* Section Score & Historique QC */}
        <div style={{ background: '#FAF7F2', padding: 12, borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3D5A6C', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} />
              <span>Contrôle Qualité & Conformité (QC)</span>
            </div>
            {badge && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.border}`,
                }}
              >
                {badge.label}
              </span>
            )}
          </div>

          {score === null ? (
            <div style={{ fontSize: 12, color: '#8A8375', fontStyle: 'italic' }}>
              Aucun contrôle qualité finalisé pour ce fournisseur. Dès qu'un colis est inspecté à l'étape 5 (QC), le score de conformité s'affichera ici.
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: '#5E584E', marginBottom: 8 }}>
                <strong>{score.taux}% de conformité</strong> sur <strong>{score.nbCommandesEvaluees} commande{score.nbCommandesEvaluees > 1 ? 's' : ''}</strong> ({score.totalConforme} conformes / {score.totalQty} pièces reçues au total).
              </div>

              {score.historique.length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#C24A3F', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={13} />
                    <span>Historique des litiges ({score.historique.length}) :</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {score.historique.map((lit: any, idx: number) => (
                      <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #F5C6C6', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#26333D' }}>
                          <span>{lit.produitNom} ({lit.qtyDefectueuse} défectueuse{lit.qtyDefectueuse > 1 ? 's' : ''} sur {lit.qtyTotal})</span>
                          <span style={{ fontSize: 11, color: '#8A8375' }}>{new Date(lit.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#C24A3F', marginTop: 2 }}>
                          Statut: {lit.statut}
                        </div>
                        {lit.notes && (
                          <div style={{ fontSize: 11, color: '#5E584E', marginTop: 3, fontStyle: 'italic', background: '#FDF8F8', padding: '4px 6px', borderRadius: 4 }}>
                            « {lit.notes} »
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#3F7A5C', fontWeight: 600, background: '#EBF4EC', padding: '6px 10px', borderRadius: 6 }}>
                  ✅ Aucun litige ni article défectueux enregistré !
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gestion des tarifs de fret */}
        {editing.plateforme === 'Transitaire / Fret' && (
          <TarifFretForm
            tarifs={editing.tarifs || []}
            onChange={tarifs => setEditing((prev: any) => ({ ...prev, tarifs }))}
            prixFretFallback={editing.prixFret}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={ghostBtn as any}>Annuler</button>
          <button
            onClick={handleSave}
            disabled={!editing.nom?.trim()}
            style={{
              ...primaryBtn,
              opacity: editing.nom?.trim() ? 1 : 0.6,
              cursor: editing.nom?.trim() ? 'pointer' : 'not-allowed',
            } as any}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </Modal>
  );
}
