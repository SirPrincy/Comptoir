import React, {  useState , memo } from 'react';
import { Compass, Plus, ExternalLink, Trash2, ArrowRight, TrendingUp, Search, CheckCircle2, XCircle, Clock, PackageCheck, AlertCircle, Coins } from 'lucide-react';
import { Card, SectionHeader, Field, Label, Empty, inputStyle, selectStyle, primaryBtn, ghostBtn, iconBtn, rowCard } from '../ui';
import { STATUTS_SOURCING, SOURCES, uid } from '../constants';
import ModalConvertirSourcing from './ModalConvertirSourcing';

interface SourcingItem {
  id: string;
  nom: string;
  categorie?: string;
  lien?: string;
  source?: string;
  fournisseurId?: string;
  puRmb?: number;
  tauxRmb?: number;
  poidsKg?: number;
  tarifFretArKg?: number;
  prixVenteEstimeAr?: number;
  moq?: number;
  statut: string; // 'À explorer' | 'En cours' | 'Validé' | 'Abandonné'
  notes?: string;
  createdAt?: string;
}

interface SourcingProps {
  sourcing: SourcingItem[];
  products: any[];
  fournisseurs?: any[];
  devises?: { rmb: number; usd: number };
  changes?: any[];
  updateData: (patch: any) => void;
}

const Sourcing = memo(function Sourcing({
  sourcing,
  products,
  fournisseurs = [],
  devises = { rmb: 680, usd: 4600 },
  changes = [],
  updateData,
}: SourcingProps) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatut, setFilterStatut] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemAConvertir, setItemAConvertir] = useState<SourcingItem | null>(null);

  // Calcul du taux moyen réel à partir de l'historique des opérations de change
  const totalMgaChanges = changes.reduce((acc: number, c: any) => acc + (Number(c.montantMga) || 0), 0);
  const totalRmbChanges = changes.reduce((acc: number, c: any) => acc + (Number(c.montantRmb) || 0), 0);
  const tauxReelMoyen = totalRmbChanges > 0 ? Math.round(totalMgaChanges / totalRmbChanges) : null;

  const defaultTauxRmb = String(tauxReelMoyen || devises?.rmb || 680);

  // Form state
  const [form, setForm] = useState({
    nom: '',
    categorie: 'Autre',
    lien: '',
    source: '1688',
    fournisseurId: '',
    puRmb: '',
    tauxRmb: defaultTauxRmb,
    poidsKg: '0.2',
    tarifFretArKg: '45000', // ~45 000 Ar / kg maritime ou aérien
    prixVenteEstimeAr: '',
    moq: '1',
    statut: 'À explorer',
    notes: '',
  });

  // Calculateur de rentabilité estimée pour le formulaire
  const puRmbVal = Number(form.puRmb) || 0;
  const tauxRmbVal = Number(form.tauxRmb) || (devises?.rmb || 680);
  const coutAchatAr = Math.round(puRmbVal * tauxRmbVal);

  const poidsKgVal = Number(form.poidsKg) || 0;
  const tarifFretVal = Number(form.tarifFretArKg) || 0;
  const coutFretAr = Math.round(poidsKgVal * tarifFretVal);

  const coutTotalRenduAr = coutAchatAr + coutFretAr;
  const prixVenteVal = Number(form.prixVenteEstimeAr) || 0;
  const margeNetteAr = prixVenteVal > 0 ? prixVenteVal - coutTotalRenduAr : 0;
  const tauxMarge = prixVenteVal > 0 && coutTotalRenduAr > 0 ? Math.round((margeNetteAr / prixVenteVal) * 100) : 0;

  const ajouter = () => {
    if (!form.nom.trim()) return;

    const newItem: SourcingItem = {
      id: uid(),
      nom: form.nom.trim(),
      categorie: form.categorie,
      lien: form.lien.trim(),
      source: form.source,
      fournisseurId: form.fournisseurId || undefined,
      puRmb: puRmbVal,
      tauxRmb: tauxRmbVal,
      poidsKg: poidsKgVal,
      tarifFretArKg: tarifFretVal,
      prixVenteEstimeAr: prixVenteVal,
      moq: Number(form.moq) || 1,
      statut: form.statut,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    updateData({ sourcing: [newItem, ...sourcing] });
    setForm({
      nom: '',
      categorie: 'Autre',
      lien: '',
      source: '1688',
      fournisseurId: '',
      puRmb: '',
      tauxRmb: defaultTauxRmb,
      poidsKg: '0.2',
      tarifFretArKg: '45000',
      prixVenteEstimeAr: '',
      moq: '1',
      statut: 'À explorer',
      notes: '',
    });
    setShowForm(false);
  };

  const supprimer = (id: string) => {
    updateData({ sourcing: sourcing.filter(s => s.id !== id) });
  };

  const changerStatut = (id: string, statut: string) => {
    updateData({
      sourcing: sourcing.map(s => (s.id === id ? { ...s, statut } : s)),
    });
  };

  // Traitement de la conversion depuis la modale
  const executerConversion = ({
    mode,
    existingProductId,
    productData,
    sourcingId,
  }: {
    mode: 'creer' | 'update_existant';
    existingProductId?: string;
    productData: any;
    sourcingId: string;
  }) => {
    const sourcingMisAJour = sourcing.map(s => (s.id === sourcingId ? { ...s, statut: 'Validé' } : s));

    if (mode === 'update_existant' && existingProductId) {
      const updatedProducts = products.map(p => (p.id === existingProductId ? productData : p));
      updateData({
        sourcing: sourcingMisAJour,
        products: updatedProducts,
      });
    } else {
      updateData({
        sourcing: sourcingMisAJour,
        products: [...products, productData],
      });
    }

    setItemAConvertir(null);
  };

  // Filtrage des éléments
  const itemsFiltres = sourcing.filter(item => {
    const matchStatut = filterStatut === 'Tous' || item.statut === filterStatut;
    const matchSearch =
      !searchQuery ||
      item.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatut && matchSearch;
  });

  // Statistiques rapides
  const totalIdees = sourcing.length;
  const aExplorerCount = sourcing.filter(s => s.statut === 'À explorer').length;
  const enCoursCount = sourcing.filter(s => s.statut === 'En cours').length;
  const validesCount = sourcing.filter(s => s.statut === 'Validé').length;

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'À explorer':
        return { bg: '#F1ECE1', color: '#8A8375', icon: Clock };
      case 'En cours':
        return { bg: '#FFF8E1', color: '#B78103', icon: Search };
      case 'Validé':
        return { bg: '#E9F2EC', color: '#3F7A5C', icon: CheckCircle2 };
      case 'Abandonné':
        return { bg: '#FBEAE8', color: '#C24A3F', icon: XCircle };
      default:
        return { bg: '#F1ECE1', color: '#8A8375', icon: Clock };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête de la section */}
      <SectionHeader
        title="Sourcing & Recherche Produits"
        action={() => setShowForm(s => !s)}
        actionLabel={showForm ? 'Fermer' : '+ Nouvelle Idée'}
      />

      {/* Cartes de synthèse rapide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ fontSize: 11, color: '#8A8375', fontWeight: 600 }}>Idées totales</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#26333D', marginTop: 2 }}>{totalIdees}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ fontSize: 11, color: '#8A8375', fontWeight: 600 }}>À explorer</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#3D5A6C', marginTop: 2 }}>{aExplorerCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ fontSize: 11, color: '#B78103', fontWeight: 600 }}>En négociation</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#B78103', marginTop: 2 }}>{enCoursCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ fontSize: 11, color: '#3F7A5C', fontWeight: 600 }}>Validés</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#3F7A5C', marginTop: 2 }}>{validesCount}</div>
        </div>
      </div>

      {/* Formulaire de création / Sourcing complet */}
      {showForm && (
        <Card style={{ background: '#FFFFFF', border: '1px solid #E3D9C6', padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3D5A6C', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Compass size={16} />
            <span>Étude d'opportunité Sourcing & Marge prévisionnelle</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Nom du produit" style={{ flex: '2 1 200px' }}>
                <input
                  style={inputStyle as any}
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Mini Imprimante Thermique Bluetooth"
                />
              </Field>
              <Field label="Source / Plateforme" style={{ flex: '1 1 120px' }}>
                <select
                  style={selectStyle as any}
                  value={form.source}
                  onChange={e => setForm({ ...form, source: e.target.value })}
                >
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Statut d'étude" style={{ flex: '1 1 130px' }}>
                <select
                  style={selectStyle as any}
                  value={form.statut}
                  onChange={e => setForm({ ...form, statut: e.target.value })}
                >
                  {STATUTS_SOURCING.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </Field>
            </div>

            {/* Calculateur de coût et de rentabilité */}
            <div style={{ background: '#FAF7F2', padding: 12, borderRadius: 8, border: '1px solid #EAE2D4' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3D5A6C', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={14} />
                <span>Simulation du coût de revient & Marge commerciale (Ar)</span>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Field label="Prix d'achat Chine (¥)" style={{ flex: '1 1 110px' }}>
                  <input
                    type="number"
                    step="any"
                    style={inputStyle as any}
                    value={form.puRmb}
                    onChange={e => setForm({ ...form, puRmb: e.target.value })}
                    placeholder="ex: 25.5"
                  />
                </Field>
                <Field label="Taux (Ar/¥)" style={{ flex: '1 1 90px' }}>
                  <input
                    type="number"
                    style={inputStyle as any}
                    value={form.tauxRmb}
                    onChange={e => setForm({ ...form, tauxRmb: e.target.value })}
                  />
                </Field>
                <Field label="Poids estimé (Kg)" style={{ flex: '1 1 100px' }}>
                  <input
                    type="number"
                    step="any"
                    style={inputStyle as any}
                    value={form.poidsKg}
                    onChange={e => setForm({ ...form, poidsKg: e.target.value })}
                    placeholder="ex: 0.3"
                  />
                </Field>
                <Field label="Prix vente cible (Ar)" style={{ flex: '1 1 130px' }}>
                  <input
                    type="number"
                    style={inputStyle as any}
                    value={form.prixVenteEstimeAr}
                    onChange={e => setForm({ ...form, prixVenteEstimeAr: e.target.value })}
                    placeholder="ex: 45000"
                  />
                </Field>
              </div>

              {/* Rendu du calcul en temps réel */}
              {puRmbVal > 0 && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#FFFFFF', borderRadius: 6, border: '1px solid #EAE2D4', fontSize: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <span>Achat : <strong>{coutAchatAr.toLocaleString('fr-FR')} Ar</strong></span>
                  <span>Fret est. : <strong>{coutFretAr.toLocaleString('fr-FR')} Ar</strong></span>
                  <span>Coût total : <strong style={{ color: '#3D5A6C' }}>{coutTotalRenduAr.toLocaleString('fr-FR')} Ar</strong></span>
                  {prixVenteVal > 0 && (
                    <span style={{ color: margeNetteAr > 0 ? '#3F7A5C' : '#C24A3F', fontWeight: 700 }}>
                      Marge : {margeNetteAr > 0 ? '+' : ''}{margeNetteAr.toLocaleString('fr-FR')} Ar ({tauxMarge}%)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Lien de l'annonce 1688 / Taobao / Fournisseur" style={{ flex: '2 1 220px' }}>
                <input
                  style={inputStyle as any}
                  value={form.lien}
                  onChange={e => setForm({ ...form, lien: e.target.value })}
                  placeholder="https://detail.1688.com/offer/..."
                />
              </Field>
              <Field label="Fournisseur rattaché (optionnel)" style={{ flex: '1.5 1 180px' }}>
                <select
                  style={selectStyle as any}
                  value={form.fournisseurId}
                  onChange={e => setForm({ ...form, fournisseurId: e.target.value })}
                >
                  <option value="">Aucun fournisseur rattaché</option>
                  {fournisseurs.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} {f.plateforme ? `(${f.plateforme})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="MOQ (Qté Min. Commande)" style={{ flex: '1 1 100px' }}>
                <input
                  type="number"
                  min="1"
                  style={inputStyle as any}
                  value={form.moq}
                  onChange={e => setForm({ ...form, moq: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Remarques & Analyse Concurrence">
              <input
                style={inputStyle as any}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Avantage concurrentiel, qualité perçue, demande marché Tana…"
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button onClick={() => setShowForm(false)} style={ghostBtn}>
                Annuler
              </button>
              <button onClick={ajouter} style={primaryBtn}>
                Enregistrer l'idée Sourcing
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Barre de filtres et recherche */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['Tous', ...STATUTS_SOURCING].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatut(st)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                borderColor: filterStatut === st ? '#3D5A6C' : '#EAE2D4',
                background: filterStatut === st ? '#3D5A6C' : '#FFFFFF',
                color: filterStatut === st ? '#FAF7F2' : '#5E584E',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ minWidth: 180, flex: '1 1 180px', maxWidth: 260 }}>
          <input
            style={{ ...inputStyle, height: 32, fontSize: 12 } as any}
            placeholder="🔍 Rechercher un produit…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Liste des idées de sourcing */}
      {itemsFiltres.length === 0 ? (
        <Empty text="Aucune idée de sourcing correspondant aux critères." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {itemsFiltres.map(s => {
            const badge = getStatusBadge(s.statut);
            const StatusIcon = badge.icon;

            const puR = s.puRmb || 0;
            const tR = s.tauxRmb || devises?.rmb || 680;
            const cAchat = Math.round(puR * tR);
            const cFret = Math.round((s.poidsKg || 0) * (s.tarifFretArKg || 45000));
            const cTotal = cAchat + cFret;
            const pVente = s.prixVenteEstimeAr || 0;
            const marge = pVente > 0 ? pVente - cTotal : 0;

            return (
              <div
                key={s.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #EAE2D4',
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14.5, color: '#26333D' }}>{s.nom}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: badge.bg,
                          color: badge.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <StatusIcon size={12} />
                        <span>{s.statut}</span>
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: '#8A8375', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      {s.source && <span>Plateforme : <strong>{s.source}</strong></span>}
                      {(() => {
                        const fourn = fournisseurs.find((f: any) => f.id === s.fournisseurId);
                        if (!fourn) return null;
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#E8EFF5', color: '#2C4C64', padding: '1px 7px', borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                            🏭 {fourn.nom}
                          </span>
                        );
                      })()}
                      {s.moq && s.moq > 1 && <span>MOQ : <strong>{s.moq} pcs</strong></span>}
                      {s.lien && (
                        <a
                          href={s.lien.startsWith('http') ? s.lien : `https://${s.lien}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#3D5A6C', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                        >
                          <span>Voir l'annonce</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Boutons d'action et sélecteur de statut */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <select
                      value={s.statut}
                      onChange={e => changerStatut(s.id, e.target.value)}
                      style={{
                        ...selectStyle,
                        height: 32,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                        border: '1px solid #EAE2D4',
                        width: 125,
                      } as any}
                    >
                      {STATUTS_SOURCING.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>

                    {/* Bouton rapide : Valider et ajouter au Stock */}
                    {s.statut === 'Validé' && (
                      <button
                        onClick={() => setItemAConvertir(s)}
                        style={{
                          ...primaryBtn,
                          height: 32,
                          fontSize: 11.5,
                          background: '#3F7A5C',
                          padding: '0 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title="Ajouter au catalogue des produits en Stock"
                      >
                        <PackageCheck size={13} />
                        <span>Ajouter au Stock</span>
                      </button>
                    )}

                    <button onClick={() => supprimer(s.id)} style={iconBtn} title="Supprimer l'idée">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Synthèse des coûts si saisis */}
                {(puR > 0 || pVente > 0) && (
                  <div style={{ background: '#FAF7F2', padding: '8px 10px', borderRadius: 6, fontSize: 12, color: '#5E584E', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, border: '1px solid #EAE2D4' }}>
                    <div>
                      {puR > 0 && <span>Achat : {puR} ¥ ({cAchat.toLocaleString('fr-FR')} Ar) · </span>}
                      {cTotal > 0 && <span>Rendu Tana est. : <strong>{cTotal.toLocaleString('fr-FR')} Ar</strong></span>}
                    </div>
                    {pVente > 0 && (
                      <div style={{ fontWeight: 600 }}>
                        Vente : {pVente.toLocaleString('fr-FR')} Ar
                        {marge > 0 && <span style={{ color: '#3F7A5C', marginLeft: 6 }}> (Marge +{marge.toLocaleString('fr-FR')} Ar)</span>}
                      </div>
                    )}
                  </div>
                )}

                {s.notes && (
                  <div style={{ fontSize: 12, color: '#5E584E', fontStyle: 'italic', background: '#FFFFFF', padding: '4px 6px' }}>
                    "{s.notes}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal intelligente de conversion Sourcing -> Stock */}
      {itemAConvertir && (
        <ModalConvertirSourcing
          item={itemAConvertir}
          products={products}
          fournisseurs={fournisseurs}
          devises={devises}
          onClose={() => setItemAConvertir(null)}
          onConvert={executerConversion}
        />
      )}
    </div>
  );
});

export default Sourcing;
