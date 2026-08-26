import React, {  useState, useMemo , memo } from 'react';
import { Trash2, Edit2, Truck, ShieldCheck, AlertTriangle, ShoppingBag, Users, TrendingUp, DollarSign, Clock, ArrowUpDown, Filter, Search } from 'lucide-react';
import { SOURCES, uid } from '../constants';
import { SectionHeader, Card, Field, Modal, Empty, inputStyle, selectStyle, primaryBtn, ghostBtn, rowCard, iconBtn } from '../ui';
import { calculerScoreFournisseur, getQCBadgeInfo } from '../qcUtils';
import { calculerPerformanceTransitaire } from '../logistique/logistiqueUtils';
import { calculerStatsFournisseur, calculerHistoriquePrixFournisseur } from '../paymentUtils';
import TarifFretForm, { TarifFret, sanitizeTarifs } from './TarifFretForm';
import ModalDeleteFournisseur from './ModalDeleteFournisseur';
import ComparateurFret from './ComparateurFret';
import ComparateurFournisseursProduit from './ComparateurFournisseursProduit';
import HistoriquePrixFournisseur from './HistoriquePrixFournisseur';

export type { TarifFret };

type FournisseurSortOption = 'depense_desc' | 'du_desc' | 'commandes_desc' | 'score_desc' | 'nom_asc';

const Fournisseurs = memo(function Fournisseurs({ fournisseurs, commandes, products = [], updateData, initialSearch = '' }: any) {
  const [activeSubView, setActiveSubView] = useState<'annuaire' | 'comparateur_produits' | 'comparateur_fret'>('annuaire');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [fournisseurASupprimer, setFournisseurASupprimer] = useState<any>(null);

  // Filtres & Tri pour l'annuaire
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  React.useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);
  const [filterType, setFilterType] = useState<'all' | 'solde_du' | 'top' | 'transitaires' | 'exchangers'>('all');
  const [sortBy, setSortBy] = useState<FournisseurSortOption>('depense_desc');

  // Form pour nouveau fournisseur
  const [form, setForm] = useState({
    nom: '',
    plateforme: SOURCES[0],
    contact: '',
    notes: '',
    tarifs: [] as TarifFret[],
  });

  // Calcul des statistiques de tous les fournisseurs
  const statsParFournisseur = useMemo(() => {
    const stats: Record<string, ReturnType<typeof calculerStatsFournisseur>> = {};
    fournisseurs.forEach((f: any) => {
      stats[f.id] = calculerStatsFournisseur(f.id, commandes);
    });
    return stats;
  }, [fournisseurs, commandes]);

  // Synthèse globale du portefeuille Fournisseurs
  const globalSummary = useMemo(() => {
    let totalDepenses = 0;
    let totalSoldeDu = 0;
    let totalPieces = 0;
    let topFournisseur: { nom: string; montant: number } | null = null;

    fournisseurs.forEach((f: any) => {
      const st = statsParFournisseur[f.id];
      if (st) {
        totalDepenses += st.totalDepenseAr;
        totalSoldeDu += st.totalDuAr;
        totalPieces += st.totalPieces;

        if (!topFournisseur || st.totalDepenseAr > topFournisseur.montant) {
          if (st.totalDepenseAr > 0) {
            topFournisseur = { nom: f.nom, montant: st.totalDepenseAr };
          }
        }
      }
    });

    return {
      totalDepenses,
      totalSoldeDu,
      totalPieces,
      topFournisseur,
    };
  }, [fournisseurs, statsParFournisseur]);

  // Filtrage et Tri des fournisseurs
  const filteredAndSortedFournisseurs = useMemo(() => {
    return fournisseurs
      .filter((f: any) => {
        const st = statsParFournisseur[f.id] || { totalDepenseAr: 0, totalDuAr: 0, nbCommandes: 0 };

        // Filtre rapide
        if (filterType === 'solde_du' && st.totalDuAr <= 0) return false;
        // Filtre rapide
        if (filterType === 'transitaires') {
          const isTransitaire = f.plateforme === 'Transitaire / Fret' || (Array.isArray(f.tarifs) && f.tarifs.length > 0) || !!f.prixFret;
          if (!isTransitaire) return false;
        }
        if (filterType === 'exchangers' && f.plateforme !== 'Exchanger / Agent de change') return false;
        if (filterType === 'top' && st.totalDepenseAr <= 0) return false;

        // Recherche texte
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNom = f.nom?.toLowerCase().includes(q);
          const matchPlateforme = f.plateforme?.toLowerCase().includes(q);
          const matchContact = f.contact?.toLowerCase().includes(q);
          const matchNotes = f.notes?.toLowerCase().includes(q);
          if (!matchNom && !matchPlateforme && !matchContact && !matchNotes) return false;
        }

        return true;
      })
      .sort((a: any, b: any) => {
        const stA = statsParFournisseur[a.id] || { totalDepenseAr: 0, totalDuAr: 0, nbCommandes: 0 };
        const stB = statsParFournisseur[b.id] || { totalDepenseAr: 0, totalDuAr: 0, nbCommandes: 0 };

        switch (sortBy) {
          case 'depense_desc':
            return stB.totalDepenseAr - stA.totalDepenseAr;
          case 'du_desc':
            return stB.totalDuAr - stA.totalDuAr;
          case 'commandes_desc':
            return stB.nbCommandes - stA.nbCommandes;
          case 'score_desc': {
            const scA = calculerScoreFournisseur(a.id, commandes, products)?.taux || 0;
            const scB = calculerScoreFournisseur(b.id, commandes, products)?.taux || 0;
            return scB - scA;
          }
          case 'nom_asc':
            return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
          default:
            return stB.totalDepenseAr - stA.totalDepenseAr;
        }
      });
  }, [fournisseurs, statsParFournisseur, filterType, searchQuery, sortBy, commandes, products]);

  const ajouter = () => {
    const nomTrim = (form.nom || '').trim();
    if (!nomTrim) return;

    const hasTarifs = form.tarifs && form.tarifs.length > 0;
    const isTransitaire = form.plateforme === 'Transitaire / Fret' || hasTarifs;
    const sanitizedTarifs = isTransitaire ? sanitizeTarifs(form.tarifs) : [];
    const plateformeFinale = isTransitaire ? 'Transitaire / Fret' : form.plateforme;

    updateData({
      fournisseurs: [
        ...fournisseurs,
        {
          ...form,
          id: uid(),
          nom: nomTrim,
          plateforme: plateformeFinale,
          contact: (form.contact || '').trim(),
          notes: (form.notes || '').trim(),
          tarifs: sanitizedTarifs,
        },
      ],
    });
    setForm({ nom: '', plateforme: SOURCES[0], contact: '', notes: '', tarifs: [] });
    setShowForm(false);
  };

  const enregistrerEdit = () => {
    if (!editing) return;
    const nomTrim = (editing.nom || '').trim();
    if (!nomTrim) return;

    const hasTarifs = editing.tarifs && editing.tarifs.length > 0;
    const isTransitaire = editing.plateforme === 'Transitaire / Fret' || hasTarifs;
    const sanitizedTarifs = isTransitaire ? sanitizeTarifs(editing.tarifs) : [];
    const plateformeFinale = isTransitaire ? 'Transitaire / Fret' : editing.plateforme;

    updateData({
      fournisseurs: fournisseurs.map((f: any) =>
        f.id === editing.id
          ? {
              ...editing,
              nom: nomTrim,
              plateforme: plateformeFinale,
              contact: (editing.contact || '').trim(),
              notes: (editing.notes || '').trim(),
              tarifs: sanitizedTarifs,
            }
          : f
      ),
    });
    setEditing(null);
  };

  const ouvrirModalSuppression = (f: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFournisseurASupprimer(f);
  };

  const confirmerSuppression = () => {
    if (!fournisseurASupprimer) return;
    updateData({ fournisseurs: fournisseurs.filter((f: any) => f.id !== fournisseurASupprimer.id) });
    setFournisseurASupprimer(null);
  };

  const nbCommandes = (id: string) => commandes.filter((c: any) => c.fournisseurId === id || c.transitaireId === id).length;

  return (
    <div>
      <SectionHeader title="Fournisseurs & Transitaires" action={() => setShowForm(s => !s)} actionLabel={showForm ? 'Fermer' : '+ Fournisseur / Transitaire'} />
      
      {/* Barre d'onglets secondaires */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        <button
          type="button"
          onClick={() => setActiveSubView('annuaire')}
          style={{
            fontSize: 12,
            fontWeight: activeSubView === 'annuaire' ? 700 : 500,
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: activeSubView === 'annuaire' ? '#3D5A6C' : '#EAE2D4',
            color: activeSubView === 'annuaire' ? '#FAF7F2' : '#26333D',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={14} />
          Annuaire ({fournisseurs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('comparateur_produits')}
          style={{
            fontSize: 12,
            fontWeight: activeSubView === 'comparateur_produits' ? 700 : 500,
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: activeSubView === 'comparateur_produits' ? '#384282' : '#EAE2D4',
            color: activeSubView === 'comparateur_produits' ? '#FFFFFF' : '#26333D',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <ShoppingBag size={14} />
          🔍 Comparateur par Produit
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('comparateur_fret')}
          style={{
            fontSize: 12,
            fontWeight: activeSubView === 'comparateur_fret' ? 700 : 500,
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: activeSubView === 'comparateur_fret' ? '#2C5E43' : '#EAE2D4',
            color: activeSubView === 'comparateur_fret' ? '#FFFFFF' : '#26333D',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <Truck size={14} />
          🚢 Comparateur Tarifs Fret
        </button>
      </div>

      {/* Vue 1 : Comparateur Fournisseurs par Produit */}
      {activeSubView === 'comparateur_produits' && (
        <ComparateurFournisseursProduit
          products={products}
          fournisseurs={fournisseurs}
          commandes={commandes}
        />
      )}

      {/* Vue 2 : Comparateur Tarifs de Fret */}
      {activeSubView === 'comparateur_fret' && (
        <ComparateurFret
          fournisseurs={fournisseurs}
          commandes={commandes}
          onSelectTransitaire={(transitaire) => setEditing({ ...transitaire })}
        />
      )}

      {/* Formulaire Nouveau Fournisseur */}
      {showForm && (
        <Card>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Field label="Nom / boutique / transitaire" style={{ flex: '2 1 180px' }}>
              <input style={inputStyle as any} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Boutique 1688 ou Transitaire SpeedCargo" />
            </Field>
            <Field label="Plateforme / Type" style={{ flex: '1 1 140px' }}>
              <select style={selectStyle as any} value={form.plateforme} onChange={e => setForm({ ...form, plateforme: e.target.value })}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Contact (WeChat, tél…)" style={{ flex: '1 1 150px' }}>
              <input style={inputStyle as any} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Ex: +86... ou WeChat ID" />
            </Field>
          </div>

          <div style={{ marginTop: 10 }}>
            <Field label="Notes">
              <input style={inputStyle as any} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Fiable, adresse entrepôt Chine, MOQ…" />
            </Field>
          </div>

          {/* Grille de tarifs de fret si type Transitaire */}
          {form.plateforme === 'Transitaire / Fret' && (
            <TarifFretForm
              tarifs={form.tarifs}
              onChange={tarifs => setForm(f => ({ ...f, tarifs }))}
            />
          )}

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={ajouter}
              disabled={!form.nom?.trim()}
              style={{
                ...primaryBtn,
                opacity: form.nom?.trim() ? 1 : 0.6,
                cursor: form.nom?.trim() ? 'pointer' : 'not-allowed',
              } as any}
            >
              Enregistrer le fournisseur
            </button>
          </div>
        </Card>
      )}

      {/* MODAL D'ÉDITION & HISTORIQUE DES PRIX FOURNISSEUR */}
      {editing && (() => {
        const score = calculerScoreFournisseur(editing.id, commandes, products);
        const badge = getQCBadgeInfo(score);
        const st = statsParFournisseur[editing.id] || { totalDepenseAr: 0, totalPayeAr: 0, totalDuAr: 0, totalPieces: 0, nbCommandes: 0 };
        const historiquePrix = calculerHistoriquePrixFournisseur(editing.id, commandes, products);

        return (
          <Modal title={`Fiche & Historique : ${editing.nom}`} onClose={() => setEditing(null)}>
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
                  <input style={inputStyle as any} value={editing.nom} onChange={e => setEditing({ ...editing, nom: e.target.value })} />
                </Field>

                <Field label="Plateforme / Type" style={{ flex: '1 1 140px' }}>
                  <select style={selectStyle as any} value={editing.plateforme} onChange={e => setEditing({ ...editing, plateforme: e.target.value })}>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Field label="Contact (WeChat, tél…)" style={{ flex: '1 1 160px' }}>
                  <input style={inputStyle as any} value={editing.contact || ''} onChange={e => setEditing({ ...editing, contact: e.target.value })} />
                </Field>

                <Field label="Notes" style={{ flex: '2 1 200px' }}>
                  <input style={inputStyle as any} value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
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
                          {score.historique.map((lit, idx) => (
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
                <button onClick={() => setEditing(null)} style={ghostBtn as any}>Annuler</button>
                <button
                  onClick={enregistrerEdit}
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
      })()}

      {/* Vue 3 : Annuaire des Fournisseurs & Transitaires */}
      {activeSubView === 'annuaire' && (
        <>
          {/* Cartes KPI Synthèse Dépenses Fournisseurs */}
          {fournisseurs.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
                marginBottom: 14,
              }}
            >
              {/* Total Dépensé */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 10,
                  padding: '10px 14px',
                  border: '1px solid #EAE2D4',
                }}
              >
                <div style={{ fontSize: 11, color: '#736B5E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={13} />
                  <span>TOTAL DÉPENSÉ</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#3D5A6C', marginTop: 3 }}>
                  {globalSummary.totalDepenses.toLocaleString('fr-FR')} Ar
                </div>
                <div style={{ fontSize: 10.5, color: '#8A8375', marginTop: 2 }}>
                  {commandes.length} commande{commandes.length > 1 ? 's' : ''} cumulée{commandes.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Solde restant dû */}
              <div
                onClick={() => setFilterType(filterType === 'solde_du' ? 'all' : 'solde_du')}
                style={{
                  background: globalSummary.totalSoldeDu > 0 ? '#FEFAF7' : '#FFFFFF',
                  borderRadius: 10,
                  padding: '10px 14px',
                  border: globalSummary.totalSoldeDu > 0 ? '1px solid #FACFC2' : '1px solid #EAE2D4',
                  cursor: 'pointer',
                }}
                title="Cliquer pour filtrer les fournisseurs avec solde dû"
              >
                <div style={{ fontSize: 11, color: '#B5532A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} />
                  <span>SOLDE RESTANT DÛ</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#B5532A', marginTop: 3 }}>
                  {globalSummary.totalSoldeDu.toLocaleString('fr-FR')} Ar
                </div>
                <div style={{ fontSize: 10.5, color: '#736B5E', marginTop: 2 }}>
                  {globalSummary.totalSoldeDu > 0 ? '⚠️ Avances en cours (filtrer)' : '✅ Tous les soldes réglés'}
                </div>
              </div>

              {/* Partenaire Principal N°1 */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 10,
                  padding: '10px 14px',
                  border: '1px solid #EAE2D4',
                }}
              >
                <div style={{ fontSize: 11, color: '#736B5E', fontWeight: 600 }}>
                  🏆 TOP PARTENAIRE
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#26333D', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {globalSummary.topFournisseur ? globalSummary.topFournisseur.nom : '—'}
                </div>
                <div style={{ fontSize: 10.5, color: '#1B6A3E', fontWeight: 600, marginTop: 2 }}>
                  {globalSummary.topFournisseur ? `${globalSummary.topFournisseur.montant.toLocaleString('fr-FR')} Ar` : '0 Ar'}
                </div>
              </div>

              {/* Total Pièces Achetées */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 10,
                  padding: '10px 14px',
                  border: '1px solid #EAE2D4',
                }}
              >
                <div style={{ fontSize: 11, color: '#736B5E', fontWeight: 600 }}>
                  📦 VOLUME TOTAL
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#26333D', marginTop: 3 }}>
                  {globalSummary.totalPieces.toLocaleString('fr-FR')} pcs
                </div>
                <div style={{ fontSize: 10.5, color: '#8A8375', marginTop: 2 }}>
                  sur {fournisseurs.length} partenaire{fournisseurs.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}

          {/* Barre de Recherche, Filtres & Tri */}
          {fournisseurs.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Recherche textuelle */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A8375' }}
                />
                <input
                  style={{ ...inputStyle, paddingLeft: 30, height: 34, fontSize: 12 } as any}
                  placeholder="Rechercher un fournisseur…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filtres rapides */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  style={{
                    fontSize: 11.5,
                    fontWeight: filterType === 'all' ? 700 : 500,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #EAE2D4',
                    background: filterType === 'all' ? '#3D5A6C' : '#FFFFFF',
                    color: filterType === 'all' ? '#FAF7F2' : '#5E584E',
                    cursor: 'pointer',
                  }}
                >
                  Tous ({fournisseurs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('solde_du')}
                  style={{
                    fontSize: 11.5,
                    fontWeight: filterType === 'solde_du' ? 700 : 500,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #EAE2D4',
                    background: filterType === 'solde_du' ? '#B5532A' : '#FFFFFF',
                    color: filterType === 'solde_du' ? '#FFFFFF' : '#B5532A',
                    cursor: 'pointer',
                  }}
                >
                  ⏳ Solde dû
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('top')}
                  style={{
                    fontSize: 11.5,
                    fontWeight: filterType === 'top' ? 700 : 500,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #EAE2D4',
                    background: filterType === 'top' ? '#3D5A6C' : '#FFFFFF',
                    color: filterType === 'top' ? '#FAF7F2' : '#5E584E',
                    cursor: 'pointer',
                  }}
                >
                  🏆 Top Dépenses
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('transitaires')}
                  style={{
                    fontSize: 11.5,
                    fontWeight: filterType === 'transitaires' ? 700 : 500,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #EAE2D4',
                    background: filterType === 'transitaires' ? '#2C5E43' : '#FFFFFF',
                    color: filterType === 'transitaires' ? '#FFFFFF' : '#2C5E43',
                    cursor: 'pointer',
                  }}
                >
                  🚢 Transitaires
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('exchangers')}
                  style={{
                    fontSize: 11.5,
                    fontWeight: filterType === 'exchangers' ? 700 : 500,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #EAE2D4',
                    background: filterType === 'exchangers' ? '#B78103' : '#FFFFFF',
                    color: filterType === 'exchangers' ? '#FFFFFF' : '#B78103',
                    cursor: 'pointer',
                  }}
                >
                  🔀 Exchangers
                </button>
              </div>

              {/* Sélecteur de Tri */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowUpDown size={13} color="#8A8375" />
                <select
                  style={{ ...selectStyle, height: 34, fontSize: 12, padding: '0 8px' } as any}
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as FournisseurSortOption)}
                >
                  <option value="depense_desc">Dépenses (du + gros au + petit)</option>
                  <option value="du_desc">Solde dû (du + élevé au + bas)</option>
                  <option value="commandes_desc">Nombre de commandes</option>
                  <option value="score_desc">Score Qualité (QC)</option>
                  <option value="nom_asc">Nom (A → Z)</option>
                </select>
              </div>
            </div>
          )}

          {fournisseurs.length === 0 ? (
            <Empty text="Aucun fournisseur ou transitaire enregistré." />
          ) : filteredAndSortedFournisseurs.length === 0 ? (
            <Empty text="Aucun partenaire ne correspond à vos filtres." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: showForm ? 12 : 0 }}>
              {filteredAndSortedFournisseurs.map((f: any) => {
                const isTransitaire = f.plateforme === 'Transitaire / Fret';
                const hasTarifs = f.tarifs && f.tarifs.length > 0;
                const score = calculerScoreFournisseur(f.id, commandes, products);
                const badge = getQCBadgeInfo(score);
                const st = statsParFournisseur[f.id] || { totalDepenseAr: 0, totalPayeAr: 0, totalDuAr: 0, totalPieces: 0, nbCommandes: 0 };
                
                const partBudget = globalSummary.totalDepenses > 0
                  ? Math.round((st.totalDepenseAr / globalSummary.totalDepenses) * 100)
                  : 0;

                return (
                  <div 
                    key={f.id} 
                    onClick={() => setEditing({ ...f })}
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
                        {f.plateforme}{f.contact ? ` · Contact: ${f.contact}` : ''} · {nbCommandes(f.id)} commande{nbCommandes(f.id) > 1 ? 's' : ''}
                        {st.totalPieces > 0 ? ` (${st.totalPieces} pièces)` : ''}
                        {f.notes ? ` · ${f.notes}` : ''}
                      </div>

                      {/* Affichage des tarifs & fiabilité si transitaire */}
                      {isTransitaire && (() => {
                        const perfAir = calculerPerformanceTransitaire(f.id, 'Aérien', commandes, fournisseurs);
                        const perfSea = calculerPerformanceTransitaire(f.id, 'Maritime', commandes, fournisseurs);
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
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
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

                      <button onClick={(e) => { e.stopPropagation(); setEditing({ ...f }); }} style={{ ...iconBtn, color: '#5B7B88' }} title="Modifier / Voir historique prix">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => ouvrirModalSuppression(f, e)} style={iconBtn} title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modale de confirmation de suppression */}
      <ModalDeleteFournisseur
        fournisseur={fournisseurASupprimer}
        nbCommandes={fournisseurASupprimer ? nbCommandes(fournisseurASupprimer.id) : 0}
        scoreQC={fournisseurASupprimer ? calculerScoreFournisseur(fournisseurASupprimer.id, commandes, products) : null}
        onClose={() => setFournisseurASupprimer(null)}
        onConfirm={confirmerSuppression}
      />
    </div>
  );
});

export default Fournisseurs;
