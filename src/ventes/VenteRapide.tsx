import React, {  useState, useMemo , memo } from 'react';
import { Trash2, CheckCircle2, Clock, Search, Filter, Calendar, User, X } from 'lucide-react';
import { COMPTES_FINANCIERS, uid } from '../constants';
import { SectionHeader, Modal, Field, Empty, inputStyle, selectStyle, primaryBtn, ghostBtn, iconBtn } from '../ui';
import { computeStock } from '../stock/stockUtils';
import { getStatutVenteLabel, getMontantPayeVente, getRestePayeVente } from '../paymentUtils';
import ModalDeleteVente from './ModalDeleteVente';

const VenteRapide = memo(function VenteRapide({ products = [], ventes = [], commandes = [], clients = [], updateAll, comptes }: any) {
  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;
  const [showModal, setShowModal] = useState(false);
  const [venteASupprimer, setVenteASupprimer] = useState<any | null>(null);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState<number | string>(1);
  const [prixUnitaire, setPrixUnitaire] = useState('');
  const [fraisLivraison, setFraisLivraison] = useState<string>('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [modePaiement, setModePaiement] = useState('Caisse / Espèces');
  const [statutPaiement, setStatutPaiement] = useState<'Payé' | 'Partiel' | 'Non payé'>('Payé');
  const [montantPaye, setMontantPaye] = useState<string>('');
  const today = new Date().toISOString().slice(0, 10);
  const [dateVente, setDateVente] = useState(today);

  // Filtres dans l'historique des ventes
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<'all' | 'paye' | 'partiel' | 'non_paye' | 'impayes'>('all');
  const [filterClientId, setFilterClientId] = useState('');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');

  const stockByProduct = useMemo(() => computeStock(products, commandes, ventes), [products, commandes, ventes]);
  const selected = products.find((p: any) => p.id === productId);
  const stockSelected = selected ? (stockByProduct[selected.id] || 0) : 0;
  const depasseStock = selected && Number(qty) > stockSelected;
  const pu = (prixUnitaire !== '' && !isNaN(Number(prixUnitaire)))
    ? Number(prixUnitaire)
    : (selected?.prixVente ? Number(selected.prixVente) : 0);
  const fraisLivraisonNum = (fraisLivraison !== '' && !isNaN(Number(fraisLivraison))) ? Math.max(0, Number(fraisLivraison)) : 0;
  const sousTotal = selected ? pu * Number(qty) : 0;
  const total = sousTotal + fraisLivraisonNum;

  const montantPayeNum = statutPaiement === 'Payé'
    ? total
    : (statutPaiement === 'Non payé' ? 0 : (Number(montantPaye) || 0));
  const resteDu = Math.max(0, total - montantPayeNum);

  const choisirProduit = (id: string) => {
    setProductId(id);
    const p = products.find((pr: any) => pr.id === id);
    setPrixUnitaire(p?.prixVente ? String(p.prixVente) : '');
    setQty(1);
    setMontantPaye('');
  };

  const enregistrerVente = () => {
    if (!selected || Number(qty) < 1 || !dateVente || depasseStock || pu < 0) return;

    if (pu === 0 && fraisLivraisonNum === 0) {
      const confirmZero = window.confirm("Le prix total de cette vente est à 0 Ar. Confirmez-vous cette vente gratuite ?");
      if (!confirmZero) return;
    }

    const payeFinal = statutPaiement === 'Payé'
      ? total
      : (statutPaiement === 'Non payé' ? 0 : Math.min(total, Number(montantPaye) || 0));

    const statutFinal = payeFinal >= total && total > 0
      ? 'Payé'
      : (payeFinal > 0 ? 'Partiel' : 'Non payé');

    const vente = {
      id: uid(),
      productId,
      qty: Number(qty),
      pu,
      sousTotal,
      fraisLivraison: fraisLivraisonNum,
      description,
      clientId,
      modePaiement,
      statutPaiement: statutFinal,
      montantPaye: payeFinal,
      date: new Date(dateVente).toISOString(),
      dateEncaissement: statutFinal === 'Payé' ? new Date(dateVente).toISOString() : undefined,
      total,
    };
    updateAll(products, [...ventes, vente], commandes);
    setProductId('');
    setQty(1);
    setPrixUnitaire('');
    setFraisLivraison('');
    setDescription('');
    setDateVente(today);
    setClientId('');
    setModePaiement('Caisse / Espèces');
    setStatutPaiement('Payé');
    setMontantPaye('');
    setShowModal(false);
  };

  const marquerEncaisse = (vId: string) => {
    const updated = ventes.map((v: any) => {
      if (v.id !== vId) return v;
      const totalVente = Number(v.total) || ((Number(v.pu || 0) * Number(v.qty || 1)) + (Number(v.fraisLivraison) || 0));
      return {
        ...v,
        montantPaye: totalVente,
        statutPaiement: 'Payé',
        dateEncaissement: new Date().toISOString(),
      };
    });
    updateAll(products, updated, commandes);
  };

  const confirmerSupprimerVente = () => {
    if (!venteASupprimer) return;
    updateAll(products, ventes.filter((v: any) => v.id !== venteASupprimer.id), commandes);
    setVenteASupprimer(null);
  };

  // Filtrage et Tri de la liste des ventes
  const ventesFiltrees = useMemo(() => {
    return ventes
      .filter((v: any) => {
        const p = products.find((pr: any) => pr.id === v.productId);
        const cl = clients.find((c: any) => c.id === v.clientId);
        const stVente = getStatutVenteLabel(v);

        // Filtre Statut
        if (filterStatut === 'paye' && stVente.type !== 'paye') return false;
        if (filterStatut === 'partiel' && stVente.type !== 'partiel') return false;
        if (filterStatut === 'non_paye' && stVente.type !== 'unpaid') return false;
        if (filterStatut === 'impayes' && stVente.type === 'paye') return false;

        // Filtre Client
        if (filterClientId && v.clientId !== filterClientId) return false;

        // Filtre Date
        const dateStr = (v.date || '').slice(0, 10);
        if (filterDateDebut && dateStr < filterDateDebut) return false;
        if (filterDateFin && dateStr > filterDateFin) return false;

        // Recherche texte libre (produit, client, description, moyen de paiement)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const pNom = (p?.nom || '').toLowerCase();
          const pCouleur = (p?.couleur || '').toLowerCase();
          const clNom = (cl?.nom || '').toLowerCase();
          const desc = (v.description || '').toLowerCase();
          const mode = (v.modePaiement || '').toLowerCase();
          if (!pNom.includes(q) && !pCouleur.includes(q) && !clNom.includes(q) && !desc.includes(q) && !mode.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ventes, products, clients, filterStatut, filterClientId, filterDateDebut, filterDateFin, searchQuery]);

  // Totaux filtrés
  const statsFiltrees = useMemo(() => {
    let totalCA = 0;
    let totalEncaisse = 0;
    let totalRestantDu = 0;

    ventesFiltrees.forEach((v: any) => {
      const tot = Number(v.total) || ((Number(v.pu) || 0) * (Number(v.qty) || 1));
      const paye = getMontantPayeVente(v);
      const reste = getRestePayeVente(v);
      totalCA += tot;
      totalEncaisse += paye;
      totalRestantDu += reste;
    });

    return { totalCA, totalEncaisse, totalRestantDu };
  }, [ventesFiltrees]);

  const hasActiveFilters = searchQuery.trim() !== '' || filterStatut !== 'all' || filterClientId !== '' || filterDateDebut !== '' || filterDateFin !== '';

  const reinitialiserFiltres = () => {
    setSearchQuery('');
    setFilterStatut('all');
    setFilterClientId('');
    setFilterDateDebut('');
    setFilterDateFin('');
  };

  return (
    <div>
      <SectionHeader title="Ventes au comptoir" action={() => setShowModal(true)} actionLabel="+ Vente" />

      {showModal && (
        <Modal title="Nouvelle vente" onClose={() => setShowModal(false)}>
          {products.length === 0 ? (
            <div style={{ fontSize: 12.5, color: '#C24A3F', marginBottom: 10 }}>
              Crée d'abord des produits dans l'onglet Stock et fais entrer des achats.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Produit">
                <select value={productId} onChange={e => choisirProduit(e.target.value)} style={selectStyle as any}>
                  <option value="">Choisir un produit…</option>
                  {products.map((p: any) => {
                    const st = stockByProduct[p.id] || 0;
                    return (
                      <option key={p.id} value={p.id} disabled={st <= 0}>
                        {p.nom}{p.couleur ? ` — ${p.couleur}` : ''} ({st} en stock){st <= 0 ? ' [Épuisé]' : ''}
                      </option>
                    );
                  })}
                </select>
              </Field>

              {depasseStock && (
                <div style={{ fontSize: 12, color: '#C24A3F', padding: '8px 10px', background: '#FBEAE8', borderRadius: 8 }}>
                  ⚠ Stock insuffisant : {stockSelected} disponible{stockSelected > 1 ? 's' : ''} seulement.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Field label="Qté" style={{ flex: '1 1 65px', minWidth: 60 }}>
                  <input type="number" min={1} max={stockSelected || undefined}
                    value={qty} onChange={e => setQty(e.target.value)} style={inputStyle as any} />
                </Field>
                <Field label="PU Vente (Ar)" style={{ flex: '1 1 110px', minWidth: 95 }}>
                  <input type="number" value={prixUnitaire}
                    onChange={e => setPrixUnitaire(e.target.value)}
                    placeholder="ex: 25000"
                    style={inputStyle as any} disabled={!selected} />
                </Field>
                <Field label="Frais livraison (Ar)" style={{ flex: '1 1 110px', minWidth: 95 }}>
                  <input type="number" min={0} value={fraisLivraison}
                    onChange={e => setFraisLivraison(e.target.value)}
                    placeholder="0 Ar (optionnel)"
                    style={inputStyle as any} />
                </Field>
                <Field label="Total à payer" style={{ flex: '1 1 120px', minWidth: 110 }}>
                  <div style={{ ...inputStyle, background: '#F1ECE1', fontWeight: 700, color: '#3D5A6C', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>
                    {total.toLocaleString('fr-FR')} Ar
                  </div>
                </Field>
              </div>

              {fraisLivraisonNum > 0 && selected && (
                <div style={{ fontSize: 11.5, color: '#5E584E', marginTop: -4, padding: '2px 4px', background: '#F4EFE6', borderRadius: 6 }}>
                  Articles : {(pu * Number(qty)).toLocaleString('fr-FR')} Ar + Frais livraison : {fraisLivraisonNum.toLocaleString('fr-FR')} Ar = <strong style={{ color: '#3D5A6C' }}>{total.toLocaleString('fr-FR')} Ar</strong>
                </div>
              )}

              {/* Statut de paiement et éventuel acompte */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Field label="Modalité de paiement" style={{ flex: '1 1 180px' }}>
                  <select
                    style={selectStyle as any}
                    value={statutPaiement}
                    onChange={e => {
                      const newStatut = e.target.value as any;
                      setStatutPaiement(newStatut);
                      if (newStatut === 'Partiel' && !montantPaye && total > 0) {
                        setMontantPaye(String(Math.round(total / 2)));
                      }
                    }}
                  >
                    <option value="Payé">✅ Payé intégral (Comptant / Immédiat)</option>
                    <option value="Partiel">🟡 Acompte partiel versé</option>
                    <option value="Non payé">⏳ Crédit Client total (0 Ar versé)</option>
                  </select>
                </Field>

                {statutPaiement === 'Partiel' && (
                  <Field label="Acompte versé (Ar)" style={{ flex: '1 1 140px' }}>
                    <input
                      type="number"
                      min={0}
                      max={total || undefined}
                      value={montantPaye}
                      onChange={e => setMontantPaye(e.target.value)}
                      placeholder="Ex: 50000"
                      style={inputStyle as any}
                    />
                  </Field>
                )}

                <Field label="Compte de règlement" style={{ flex: '1 1 140px' }}>
                  <select style={selectStyle as any} value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
                    {activeComptes.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              {/* Info récapitulative Acompte / Reste dû */}
              {statutPaiement === 'Partiel' && (
                <div
                  style={{
                    background: '#FFF8E1',
                    border: '1px solid #FFE082',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    Acompte versé : <strong>{montantPayeNum.toLocaleString('fr-FR')} Ar</strong>
                  </span>
                  <span style={{ color: '#B78103', fontWeight: 700 }}>
                    Solde restant dû : {resteDu.toLocaleString('fr-FR')} Ar
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Field label="Date de vente" style={{ flex: '1 1 130px' }}>
                  <input type="date" max={today} value={dateVente} onChange={e => setDateVente(e.target.value)} style={inputStyle as any} />
                </Field>
                {clients.length > 0 && (
                  <Field label="Client" style={{ flex: '1 1 160px' }}>
                    <select style={selectStyle as any} value={clientId} onChange={e => setClientId(e.target.value)}>
                      <option value="">— Vente de passage (sans client) —</option>
                      {clients.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </Field>
                )}
              </div>

              <div>
                <Field label="Description / Remarque (optionnel)">
                  <input style={inputStyle as any} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Note, canal de vente, contact si client de passage…" />
                </Field>
              </div>

              <button
                onClick={enregistrerVente}
                disabled={!selected || depasseStock || pu < 0}
                style={{
                  ...primaryBtn,
                  opacity: (selected && !depasseStock && pu >= 0) ? 1 : 0.4,
                  height: 42,
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: 6,
                }}
              >
                Enregistrer la vente ({total.toLocaleString('fr-FR')} Ar
                {statutPaiement === 'Partiel' ? ` · Acompte: ${montantPayeNum.toLocaleString('fr-FR')} Ar` : ''})
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* Barre de Recherche, Filtres & Synthèse */}
      {ventes.length > 0 && (
        <div style={{ background: '#FAF7F2', border: '1px solid #EAE2D4', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
          {/* Ligne de filtres principaux */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Recherche textuelle libre */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A8375' }}
              />
              <input
                style={{ ...inputStyle, paddingLeft: 30, height: 34, fontSize: 12 } as any}
                placeholder="Rechercher produit, client, note…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8A8375', padding: 2 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filtre Statut de paiement */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFilterStatut('all')}
                style={{
                  fontSize: 11.5,
                  fontWeight: filterStatut === 'all' ? 700 : 500,
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid #EAE2D4',
                  background: filterStatut === 'all' ? '#3D5A6C' : '#FFFFFF',
                  color: filterStatut === 'all' ? '#FAF7F2' : '#5E584E',
                  cursor: 'pointer',
                }}
              >
                Toutes ({ventes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatut('paye')}
                style={{
                  fontSize: 11.5,
                  fontWeight: filterStatut === 'paye' ? 700 : 500,
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid #C4DEC0',
                  background: filterStatut === 'paye' ? '#3F7A5C' : '#FFFFFF',
                  color: filterStatut === 'paye' ? '#FFFFFF' : '#3F7A5C',
                  cursor: 'pointer',
                }}
              >
                ✅ Payées
              </button>
              <button
                type="button"
                onClick={() => setFilterStatut('partiel')}
                style={{
                  fontSize: 11.5,
                  fontWeight: filterStatut === 'partiel' ? 700 : 500,
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid #FFE082',
                  background: filterStatut === 'partiel' ? '#B78103' : '#FFFFFF',
                  color: filterStatut === 'partiel' ? '#FFFFFF' : '#B78103',
                  cursor: 'pointer',
                }}
              >
                🟡 Acomptes
              </button>
              <button
                type="button"
                onClick={() => setFilterStatut('impayes')}
                style={{
                  fontSize: 11.5,
                  fontWeight: filterStatut === 'impayes' ? 700 : 500,
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid #FACFC2',
                  background: filterStatut === 'impayes' ? '#C24A3F' : '#FFFFFF',
                  color: filterStatut === 'impayes' ? '#FFFFFF' : '#C24A3F',
                  cursor: 'pointer',
                }}
              >
                ⏳ Reste dû / Crédit
              </button>
            </div>
          </div>

          {/* Ligne secondaire : Filtre Client & Filtre Plage de Dates */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #EAE2D4' }}>
            {/* Filtre Client */}
            {clients.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 180px', minWidth: 160 }}>
                <User size={13} color="#8A8375" />
                <select
                  style={{ ...selectStyle, height: 32, fontSize: 11.5, padding: '0 8px', flex: 1 } as any}
                  value={filterClientId}
                  onChange={e => setFilterClientId(e.target.value)}
                >
                  <option value="">Tous les clients</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtre Plage de Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Calendar size={13} color="#8A8375" />
              <span style={{ fontSize: 11, color: '#736B5E' }}>Du:</span>
              <input
                type="date"
                value={filterDateDebut}
                onChange={e => setFilterDateDebut(e.target.value)}
                style={{ ...inputStyle, height: 32, fontSize: 11.5, padding: '0 6px', width: 125 } as any}
              />
              <span style={{ fontSize: 11, color: '#736B5E' }}>Au:</span>
              <input
                type="date"
                value={filterDateFin}
                onChange={e => setFilterDateFin(e.target.value)}
                style={{ ...inputStyle, height: 32, fontSize: 11.5, padding: '0 6px', width: 125 } as any}
              />
            </div>

            {/* Reset Filtres */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={reinitialiserFiltres}
                style={{
                  fontSize: 11,
                  color: '#C24A3F',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  marginLeft: 'auto',
                }}
              >
                <X size={12} />
                Réinitialiser filtres
              </button>
            )}
          </div>

          {/* Mini-synthèse sur la sélection filtrée */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, paddingTop: 6, fontSize: 11.5, borderTop: '1px dashed #EAE2D4', color: '#5E584E' }}>
            <span><strong>{ventesFiltrees.length}</strong> vente{ventesFiltrees.length > 1 ? 's' : ''} trouvée{ventesFiltrees.length > 1 ? 's' : ''}</span>
            <span>Total ventes : <strong style={{ color: '#3D5A6C' }}>{statsFiltrees.totalCA.toLocaleString('fr-FR')} Ar</strong></span>
            <span>Encaissé : <strong style={{ color: '#3F7A5C' }}>{statsFiltrees.totalEncaisse.toLocaleString('fr-FR')} Ar</strong></span>
            {statsFiltrees.totalRestantDu > 0 && (
              <span>Reste à percevoir : <strong style={{ color: '#C24A3F' }}>{statsFiltrees.totalRestantDu.toLocaleString('fr-FR')} Ar</strong></span>
            )}
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: '#8A8375', margin: '4px 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Historique des ventes ({ventesFiltrees.length}{ventesFiltrees.length !== ventes.length ? ` / ${ventes.length}` : ''})
      </div>
      {ventes.length === 0 ? (
        <Empty text="Aucune vente enregistrée pour le moment." />
      ) : ventesFiltrees.length === 0 ? (
        <Empty text="Aucune vente ne correspond à vos critères de recherche." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ventesFiltrees.map((v: any) => {
            const p = products.find((pr: any) => pr.id === v.productId);
            const puAffiche = v.pu ?? (p?.prixVente || (v.total && v.qty ? v.total / v.qty : 0));
            const cl = clients.find((c: any) => c.id === v.clientId);
            const stVente = getStatutVenteLabel(v);
            const isUnpaid = stVente.type !== 'paye';
            const paye = getMontantPayeVente(v);
            const reste = getRestePayeVente(v);

            return (
              <div key={v.id} style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{p ? p.nom : '(produit supprimé)'} {p?.couleur ? `· ${p.couleur}` : ''}</span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: stVente.type === 'paye' ? '#E3EFE9' : (stVente.type === 'partiel' ? '#FFF8E1' : '#FFF3E0'),
                        color: stVente.type === 'paye' ? '#3F7A5C' : (stVente.type === 'partiel' ? '#B78103' : '#E65100'),
                        border: `1px solid ${stVente.type === 'paye' ? '#C4DEC0' : (stVente.type === 'partiel' ? '#FFE082' : '#FFE0B2')}`,
                      }}>
                        {stVente.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8A8375', wordBreak: 'break-word', marginTop: 2 }}>
                      {new Date(v.date).toLocaleDateString('fr-FR')} · qté {v.qty} · PU {Number(puAffiche).toLocaleString('fr-FR')} Ar
                      {Number(v.fraisLivraison) > 0 ? ` · 🚚 Livr: ${Number(v.fraisLivraison).toLocaleString('fr-FR')} Ar` : ''}
                      {cl ? ` · Client: ${cl.nom}` : ''}
                      {v.modePaiement ? ` · ${v.modePaiement}` : ''}
                      {v.description ? ` · ${v.description}` : ''}
                    </div>
                    {stVente.type === 'partiel' && (
                      <div style={{ fontSize: 11.5, color: '#B78103', fontWeight: 600, marginTop: 2 }}>
                        Versé: {paye.toLocaleString('fr-FR')} Ar · Solde restant dû: {reste.toLocaleString('fr-FR')} Ar
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: isUnpaid ? '#E65100' : '#3F7A5C', fontSize: 14, whiteSpace: 'nowrap', display: 'block' }}>
                        +{Number(v.total).toLocaleString('fr-FR')} Ar
                      </span>
                      {isUnpaid && reste > 0 && stVente.type === 'partiel' && (
                        <span style={{ fontSize: 10.5, color: '#B78103', fontWeight: 600, display: 'block' }}>
                          reste: {reste.toLocaleString('fr-FR')} Ar
                        </span>
                      )}
                    </div>
                    {isUnpaid && (
                      <button
                        onClick={() => marquerEncaisse(v.id)}
                        style={{ ...primaryBtn, height: 28, fontSize: 11.5, padding: '0 8px' }}
                        title="Régler et solder intégralement la vente"
                      >
                        Solder ({reste.toLocaleString('fr-FR')} Ar)
                      </button>
                    )}
                    <button onClick={() => setVenteASupprimer(v)} style={iconBtn} title="Supprimer la vente">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de confirmation de suppression d'une vente */}
      {venteASupprimer && (
        <ModalDeleteVente
          vente={venteASupprimer}
          product={products.find((p: any) => p.id === venteASupprimer.productId)}
          client={clients.find((c: any) => c.id === venteASupprimer.clientId)}
          onClose={() => setVenteASupprimer(null)}
          onConfirm={confirmerSupprimerVente}
        />
      )}
    </div>
  );
});

export default VenteRapide;
