import React, { useState, useMemo, memo } from 'react';
import { Truck, ShoppingBag, Users, ArrowUpDown, Search } from 'lucide-react';
import { SOURCES, uid } from '../constants';
import { SectionHeader, Card, Field, Empty, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { calculerScoreFournisseur } from '../qcUtils';
import { calculerStatsFournisseur } from '../paymentUtils';
import { TarifFret, sanitizeTarifs } from './TarifFretForm';
import TarifFretForm from './TarifFretForm';
import ModalDeleteFournisseur from './ModalDeleteFournisseur';
import ModalEditFournisseur from './ModalEditFournisseur';
import FournisseurCard from './FournisseurCard';
import FournisseurSummaryKpis from './FournisseurSummaryKpis';
import ComparateurFret from './ComparateurFret';
import ComparateurFournisseursProduit from './ComparateurFournisseursProduit';

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

        if (filterType === 'solde_du' && st.totalDuAr <= 0) return false;
        if (filterType === 'transitaires') {
          const isTransitaire = f.plateforme === 'Transitaire / Fret' || (Array.isArray(f.tarifs) && f.tarifs.length > 0) || !!f.prixFret;
          if (!isTransitaire) return false;
        }
        if (filterType === 'exchangers' && f.plateforme !== 'Exchanger / Agent de change') return false;
        if (filterType === 'top' && st.totalDepenseAr <= 0) return false;

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

  const enregistrerEdit = (updated: any) => {
    updateData({
      fournisseurs: fournisseurs.map((f: any) => (f.id === updated.id ? updated : f)),
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
      <SectionHeader
        title="Fournisseurs & Transitaires"
        action={() => setShowForm(s => !s)}
        actionLabel={showForm ? 'Fermer' : '+ Fournisseur / Transitaire'}
      />

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
              <input
                style={inputStyle as any}
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Boutique 1688 ou Transitaire SpeedCargo"
              />
            </Field>
            <Field label="Plateforme / Type" style={{ flex: '1 1 140px' }}>
              <select
                style={selectStyle as any}
                value={form.plateforme}
                onChange={e => setForm({ ...form, plateforme: e.target.value })}
              >
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <Field label="Contact (WeChat, tél…)" style={{ flex: '1 1 160px' }}>
              <input
                style={inputStyle as any}
                value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
                placeholder="Ex: WeChat ID: china_vendor_01"
              />
            </Field>
            <Field label="Notes" style={{ flex: '2 1 200px' }}>
              <input
                style={inputStyle as any}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Spécialités, délais, conditions..."
              />
            </Field>
          </div>

          {form.plateforme === 'Transitaire / Fret' && (
            <div style={{ marginTop: 10 }}>
              <TarifFretForm
                tarifs={form.tarifs}
                onChange={tarifs => setForm({ ...form, tarifs })}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button onClick={() => setShowForm(false)} style={ghostBtn as any}>Annuler</button>
            <button
              onClick={ajouter}
              disabled={!form.nom.trim()}
              style={{
                ...primaryBtn,
                opacity: form.nom.trim() ? 1 : 0.6,
                cursor: form.nom.trim() ? 'pointer' : 'not-allowed',
              } as any}
            >
              Ajouter
            </button>
          </div>
        </Card>
      )}

      {/* Modal d'édition Fournisseur */}
      {editing && (
        <ModalEditFournisseur
          editing={editing}
          commandes={commandes}
          products={products}
          st={statsParFournisseur[editing.id] || { totalDepenseAr: 0, totalPayeAr: 0, totalDuAr: 0, totalPieces: 0, nbCommandes: 0 }}
          score={calculerScoreFournisseur(editing.id, commandes, products)}
          onClose={() => setEditing(null)}
          onSave={enregistrerEdit}
        />
      )}

      {/* Vue 3 : Annuaire des Fournisseurs & Transitaires */}
      {activeSubView === 'annuaire' && (
        <>
          {/* Cartes KPI Synthèse Dépenses Fournisseurs */}
          {fournisseurs.length > 0 && (
            <FournisseurSummaryKpis
              totalDepenses={globalSummary.totalDepenses}
              totalSoldeDu={globalSummary.totalSoldeDu}
              topFournisseur={globalSummary.topFournisseur}
              totalPieces={globalSummary.totalPieces}
              totalFournisseurs={fournisseurs.length}
              commandesCount={commandes.length}
              filterType={filterType}
              onFilterSoldeDu={() => setFilterType(filterType === 'solde_du' ? 'all' : 'solde_du')}
            />
          )}

          {/* Barre de Recherche, Filtres & Tri */}
          {fournisseurs.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                background: '#FFFFFF',
                border: '1px solid #EAE2D4',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 10,
              }}
            >
              {/* Barre de recherche */}
              <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 150 }}>
                <Search size={14} style={{ position: 'absolute', left: 9, top: 10, color: '#8A8375' }} />
                <input
                  style={{ ...inputStyle, paddingLeft: 28, height: 34, fontSize: 12 } as any}
                  placeholder="Rechercher par nom, plateforme, contact..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filtres rapides */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  style={{
                    fontSize: 11.5,
                    fontWeight: filterType === 'all' ? 700 : 500,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid #EAE2D4',
                    background: filterType === 'all' ? '#26333D' : '#FFFFFF',
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
              {filteredAndSortedFournisseurs.map((f: any) => (
                <FournisseurCard
                  key={f.id}
                  fournisseur={f}
                  allFournisseurs={fournisseurs}
                  commandes={commandes}
                  products={products}
                  stats={statsParFournisseur[f.id] || { totalDepenseAr: 0, totalPayeAr: 0, totalDuAr: 0, totalPieces: 0, nbCommandes: 0 }}
                  globalTotalDepenses={globalSummary.totalDepenses}
                  onEdit={(item) => setEditing({ ...item })}
                  onDelete={ouvrirModalSuppression}
                />
              ))}
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
