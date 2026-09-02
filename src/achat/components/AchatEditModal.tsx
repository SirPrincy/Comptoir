import React, { useState, useMemo } from 'react';
import { Package, Truck, Coins, Edit3, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { THEME } from '../../colors';
import { SOURCES, STATUTS, uid } from '../../constants';
import { Field, Modal, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../../ui';
import { calculerScoreFournisseur, getQCBadgeInfo } from '../../qcUtils';
import { getMontantPayeMarchandise, getRestePayeMarchandise } from '../../paymentUtils';
import RecommandationTransitaire from '../RecommandationTransitaire';

interface AchatEditModalProps {
  commande: any | null;
  onClose: () => void;
  products: any[];
  fournisseurs: any[];
  commandes: any[];
  ventes: any[];
  devises: { rmb?: number; usd?: number };
  soldeRmbInfo?: any;
  updateAll?: (...args: any[]) => void;
  updateData?: (data: any) => void;
  paiements?: any[];
  today: string;
  onNavigateTab?: (tab: string) => void;
}

export default function AchatEditModal({
  commande,
  onClose,
  products = [],
  fournisseurs = [],
  commandes = [],
  ventes = [],
  devises = { rmb: 680, usd: 4600 },
  soldeRmbInfo,
  updateAll,
  updateData,
  paiements = [],
  today,
  onNavigateTab,
}: AchatEditModalProps) {
  if (!commande) return null;

  const safeProducts = Array.isArray(products) ? products : [];
  const safeFournisseurs = Array.isArray(fournisseurs) ? fournisseurs : [];
  const safeCommandes = Array.isArray(commandes) ? commandes : [];
  const safeVentes = Array.isArray(ventes) ? ventes : [];

  const initialDevise = commande.deviseOrigine || (commande.puDevise ? 'RMB' : 'Ar');
  const initialTaux = commande.tauxRmb || devises?.rmb || 680;
  const initialDate = commande.dateAchat ? (commande.dateAchat.slice(0, 10)) : today;

  const [form, setForm] = useState({
    productId: commande.productId || '',
    source: commande.source || SOURCES[0],
    fournisseurId: commande.fournisseurId || '',
    transitaireId: commande.transitaireId || '',
    qty: commande.qty !== undefined ? commande.qty : 1,
    devise: initialDevise,
    tauxRmb: String(initialTaux),
    puDevise: commande.puDevise !== undefined ? String(commande.puDevise) : '',
    pu: commande.pu !== undefined ? String(commande.pu) : '',
    fraisLivraisonChineDevise: commande.fraisLivraisonChineDevise !== undefined ? String(commande.fraisLivraisonChineDevise) : '',
    fraisLivraisonChine: commande.fraisLivraisonChine !== undefined ? String(commande.fraisLivraisonChine) : (commande.fraisLivraison !== undefined ? String(commande.fraisLivraison) : ''),
    fraisTransport: commande.fraisTransport !== undefined ? String(commande.fraisTransport) : '',
    modeExpedition: commande.modeExpedition || commande.modeTransport || 'Maritime',
    tracking: commande.tracking || commande.trackingNumber || '',
    statut: commande.statut || 'Commandé',
    dateAchat: initialDate,
    notes: commande.notes || commande.remarques || '',
  });

  const [showQuickProductForm, setShowQuickProductForm] = useState(false);
  const [quickProduct, setQuickProduct] = useState({
    nom: '',
    couleur: '',
    puRmb: '',
    prixAchatAr: '',
    prixVenteAr: '',
  });

  const handleCreateQuickProduct = () => {
    if (!quickProduct.nom.trim()) return;
    const puRmbNum = Number(quickProduct.puRmb) || 0;
    const prixAchatArNum = Number(quickProduct.prixAchatAr) || Math.round(puRmbNum * (devises?.rmb || 680));
    const newProduct = {
      id: uid(),
      nom: quickProduct.nom.trim(),
      couleur: quickProduct.couleur.trim() || undefined,
      puRmb: puRmbNum,
      prixAchatAr: prixAchatArNum,
      prixVente: Number(quickProduct.prixVenteAr) || 0,
      stock: 0,
    };

    if (typeof updateAll === 'function') {
      updateAll([...safeProducts, newProduct], safeVentes, safeCommandes);
    } else if (typeof updateData === 'function') {
      updateData({ products: [...safeProducts, newProduct] });
    }

    setForm(prev => ({
      ...prev,
      productId: newProduct.id,
      puDevise: String(puRmbNum || ''),
      pu: String(prixAchatArNum || ''),
    }));
    setShowQuickProductForm(false);
    setQuickProduct({ nom: '', couleur: '', puRmb: '', prixAchatAr: '', prixVenteAr: '' });
  };

  // Suggestion automatique du meilleur fournisseur
  const bestSupplierSuggestion = useMemo(() => {
    if (!form.productId) return null;
    const productCmds = safeCommandes.filter((c: any) => c.productId === form.productId && c.fournisseurId && c.id !== commande.id);
    if (productCmds.length === 0) return null;

    const map: Record<string, { fId: string; lastPuRmb: number; lastPuAr: number; count: number }> = {};
    productCmds.forEach((c: any) => {
      if (!map[c.fournisseurId]) {
        map[c.fournisseurId] = {
          fId: c.fournisseurId,
          lastPuRmb: Number(c.puDevise || c.puRmb || 0),
          lastPuAr: Number(c.pu || 0),
          count: 0,
        };
      }
      map[c.fournisseurId].count++;
    });

    const list = Object.values(map);
    if (list.length === 0) return null;

    list.sort((a, b) => {
      const scoreA = calculerScoreFournisseur(a.fId, safeCommandes, safeProducts);
      const scoreB = calculerScoreFournisseur(b.fId, safeCommandes, safeProducts);
      const isGoodA = !scoreA || (scoreA.taux >= 90 || scoreA.nbLitiges === 0);
      const isGoodB = !scoreB || (scoreB.taux >= 90 || scoreB.nbLitiges === 0);
      if (isGoodA && !isGoodB) return -1;
      if (!isGoodA && isGoodB) return 1;
      return (a.lastPuAr || 999999999) - (b.lastPuAr || 999999999);
    });

    const best = list[0];
    const four = safeFournisseurs.find((f: any) => f.id === best.fId);
    if (!four) return null;

    return {
      fournisseur: four,
      lastPuRmb: best.lastPuRmb,
      lastPuAr: best.lastPuAr,
      totalFournisseurs: list.length,
    };
  }, [form.productId, safeCommandes, safeProducts, safeFournisseurs, commande.id]);

  const userTauxRmb = form.devise === 'RMB' ? (Number(form.tauxRmb) || 680) : 1;
  const qtyVal = Math.max(1, Number(form.qty) || 1);
  const puVal = form.devise === 'RMB'
    ? Math.round((Number(form.puDevise) || 0) * userTauxRmb)
    : (Number(form.pu) || 0);
  const fraisChineVal = form.devise === 'RMB'
    ? Math.round((Number(form.fraisLivraisonChineDevise) || 0) * userTauxRmb)
    : (Number(form.fraisLivraisonChine) || 0);
  const totalCalcule = (qtyVal * puVal) + fraisChineVal;

  const dejaPaye = getMontantPayeMarchandise(commande, paiements);
  const resteCalcule = Math.max(0, totalCalcule - dejaPaye);

  const selectedProduct = safeProducts.find((p: any) => p.id === form.productId);

  const handleSave = () => {
    if (!form.productId || !form.qty || !form.dateAchat) return;

    const isoDateAchat = new Date(form.dateAchat).toISOString();

    const montantPayeMarchandise = commande.montantPayeMarchandise !== undefined
      ? Math.min(totalCalcule, Number(commande.montantPayeMarchandise))
      : dejaPaye;

    const statutPaiementMarchandise = montantPayeMarchandise >= totalCalcule && totalCalcule > 0
      ? 'Payé'
      : montantPayeMarchandise > 0
      ? 'Partiel'
      : 'Non payé';

    const updatedCommande = {
      ...commande,
      productId: form.productId,
      source: form.source,
      fournisseurId: form.fournisseurId || undefined,
      transitaireId: form.transitaireId || undefined,
      qty: qtyVal,
      deviseOrigine: form.devise,
      tauxRmb: form.devise === 'RMB' ? userTauxRmb : undefined,
      puDevise: form.devise === 'RMB' ? Number(form.puDevise) || 0 : undefined,
      pu: puVal,
      fraisLivraisonChineDevise: form.devise === 'RMB' ? Number(form.fraisLivraisonChineDevise) || 0 : undefined,
      fraisLivraisonChine: fraisChineVal,
      total: totalCalcule,
      fraisTransport: Number(form.fraisTransport) || 0,
      modeExpedition: form.modeExpedition,
      modeTransport: form.modeExpedition,
      tracking: form.tracking,
      trackingNumber: form.tracking,
      statut: form.statut,
      dateAchat: isoDateAchat,
      montantPayeMarchandise,
      statutPaiementMarchandise,
      notes: form.notes,
      remarques: form.notes,
    };

    const updatedList = safeCommandes.map((c: any) => (c.id === commande.id ? updatedCommande : c));

    if (typeof updateData === 'function') {
      updateData({ commandes: updatedList });
    } else if (typeof updateAll === 'function') {
      updateAll(safeProducts, safeVentes, updatedList);
    }

    onClose();
  };

  return (
    <Modal title={`Modifier la commande d'achat : ${selectedProduct?.nom || 'Article'}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {/* Résumé de la commande en cours d'édition */}
        <div style={{ background: '#FAF7F2', border: '1px solid #EAE2D4', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ fontSize: 12, color: '#5E584E' }}>
            ID Commande : <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{commande.id}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#E0E7FF', color: '#3730A3' }}>
              Statut : {form.statut}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: resteCalcule > 0 ? '#FEF3C7' : '#D1FAE5', color: resteCalcule > 0 ? '#92400E' : '#065F46' }}>
              {resteCalcule > 0 ? `Reste dû : ${resteCalcule.toLocaleString('fr-FR')} Ar` : 'Entièrement payé'}
            </span>
          </div>
        </div>

        {/* Sélection Produit */}
        {showQuickProductForm ? (
          <div style={{ background: '#FAF7F2', padding: 12, borderRadius: 8, border: '1px solid #EAE2D4', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#26333D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📦 Création rapide d'un nouvel article</span>
              <button type="button" onClick={() => setShowQuickProductForm(false)} style={ghostBtn}>Annuler</button>
            </div>
            <Field label="Nom du produit *">
              <input style={inputStyle as any} placeholder="Ex: Sac à main cuir serpent" value={quickProduct.nom} onChange={e => setQuickProduct({ ...quickProduct, nom: e.target.value })} />
            </Field>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Field label="Couleur / Variante" style={{ flex: '1 1 120px' }}>
                <input style={inputStyle as any} placeholder="Ex: Noir" value={quickProduct.couleur} onChange={e => setQuickProduct({ ...quickProduct, couleur: e.target.value })} />
              </Field>
              <Field label="Prix d'achat unitaire (¥ RMB)" style={{ flex: '1 1 120px' }}>
                <input style={inputStyle as any} type="number" placeholder="Ex: 25" value={quickProduct.puRmb} onChange={e => setQuickProduct({ ...quickProduct, puRmb: e.target.value })} />
              </Field>
            </div>
            <button
              type="button"
              onClick={handleCreateQuickProduct}
              disabled={!quickProduct.nom.trim()}
              style={{ ...primaryBtn, height: 36, justifyContent: 'center', background: '#3F7A5C', opacity: !quickProduct.nom.trim() ? 0.5 : 1 }}
            >
              Créer & Assigner à cet achat
            </button>
          </div>
        ) : (
          <Field label="Article / Produit *">
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                style={{ ...selectStyle, flex: 1 } as any}
                value={form.productId}
                onChange={e => {
                  const pId = e.target.value;
                  const targetP = safeProducts.find((pr: any) => pr.id === pId);
                  setForm(prev => ({
                    ...prev,
                    productId: pId,
                    puDevise: targetP?.puRmb ? String(targetP.puRmb) : prev.puDevise,
                    pu: targetP?.prixAchatAr ? String(targetP.prixAchatAr) : prev.pu,
                  }));
                }}
              >
                <option value="">Choisir un produit dans le stock…</option>
                {safeProducts.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}{p.couleur ? ` — ${p.couleur}` : ''}{p.reference ? ` (${p.reference})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowQuickProductForm(true)}
                style={{ ...ghostBtn, padding: '0 10px', fontSize: 12, height: 38, border: '1px solid #EAE2D4', whiteSpace: 'nowrap' }}
              >
                + Nouveau
              </button>
            </div>
          </Field>
        )}

        {/* Source & Fournisseur */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Source / Marketplace" style={{ flex: '1 1 130px' }}>
            <select style={selectStyle as any} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          {safeFournisseurs.length > 0 && (
            <Field label="Fournisseur" style={{ flex: '1 1 130px' }}>
              <select style={selectStyle as any} value={form.fournisseurId} onChange={e => setForm({ ...form, fournisseurId: e.target.value })}>
                <option value="">— Aucun fournisseur —</option>
                {safeFournisseurs.map((f: any) => {
                  const score = calculerScoreFournisseur(f.id, safeCommandes, safeProducts);
                  const badge = getQCBadgeInfo(score);
                  const qcTag = badge ? ` [${badge.shortLabel}]` : '';
                  return (
                    <option key={f.id} value={f.id}>
                      {f.nom}{qcTag}
                    </option>
                  );
                })}
              </select>
            </Field>
          )}
        </div>

        {/* Recommandation de fournisseur */}
        {bestSupplierSuggestion && form.fournisseurId !== bestSupplierSuggestion.fournisseur.id && (
          <div
            style={{
              background: '#F4FAF6',
              border: '1px solid #CDE2D6',
              borderRadius: 6,
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              fontSize: 11.5,
              color: '#1B4D33',
            }}
          >
            <div>
              💡 <strong>Fournisseur habituel moins cher</strong> : {bestSupplierSuggestion.fournisseur.nom}
              {bestSupplierSuggestion.lastPuRmb > 0 ? ` (¥${bestSupplierSuggestion.lastPuRmb})` : ` (${bestSupplierSuggestion.lastPuAr.toLocaleString('fr-FR')} Ar)`}
            </div>
            <button
              type="button"
              onClick={() => {
                setForm(prev => ({
                  ...prev,
                  fournisseurId: bestSupplierSuggestion.fournisseur.id,
                  puDevise: bestSupplierSuggestion.lastPuRmb > 0 ? String(bestSupplierSuggestion.lastPuRmb) : prev.puDevise,
                  pu: bestSupplierSuggestion.lastPuAr > 0 ? String(bestSupplierSuggestion.lastPuAr) : prev.pu,
                }));
              }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 7px',
                borderRadius: 4,
                border: 'none',
                background: '#2C5E43',
                color: '#FFFFFF',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Choisir ce fournisseur
            </button>
          </div>
        )}

        {/* Transitaire & Logistique */}
        {safeFournisseurs.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Transitaire (Fret)" style={{ flex: '1 1 180px' }}>
                <select style={selectStyle as any} value={form.transitaireId} onChange={e => setForm({ ...form, transitaireId: e.target.value })}>
                  <option value="">— Aucun transitaire assigné —</option>
                  {safeFournisseurs.map((f: any) => {
                    const score = calculerScoreFournisseur(f.id, safeCommandes, safeProducts);
                    const badge = getQCBadgeInfo(score);
                    const qcTag = badge ? ` [${badge.shortLabel}]` : '';
                    const typeTag = f.plateforme === 'Transitaire / Fret' ? '(Transitaire)' : `(${f.plateforme})`;
                    return (
                      <option key={f.id} value={f.id}>
                        {f.nom} {typeTag}{qcTag}
                      </option>
                    );
                  })}
                </select>
              </Field>

              <Field label="Mode d'acheminement" style={{ flex: '1 1 140px' }}>
                <select style={selectStyle as any} value={form.modeExpedition} onChange={e => setForm({ ...form, modeExpedition: e.target.value })}>
                  <option value="Maritime">🚢 Maritime (Bateau)</option>
                  <option value="Aérien Normal">✈️ Aérien Normal</option>
                  <option value="Aérien Express">⚡ Aérien Express</option>
                </select>
              </Field>
            </div>

            <RecommandationTransitaire
              product={selectedProduct}
              commandes={safeCommandes}
              fournisseurs={safeFournisseurs}
              currentTransitaireId={form.transitaireId}
              onSelectTransitaire={(tId) => setForm(prev => ({ ...prev, transitaireId: tId }))}
            />
          </>
        )}

        {/* Saisie quantité et prix avec sélecteur de devise */}
        <div style={{ background: '#FAF7F2', padding: '12px 14px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3D5A6C' }}>Prix unitaire & Frais d'achat :</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, devise: 'RMB' })}
                style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  background: form.devise === 'RMB' ? '#3D5A6C' : '#FFFFFF',
                  color: form.devise === 'RMB' ? '#FAF7F2' : '#3D5A6C',
                  border: '1px solid #3D5A6C',
                }}
              >
                🇨🇳 RMB (¥)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, devise: 'Ar' })}
                style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  background: form.devise === 'Ar' ? '#3D5A6C' : '#FFFFFF',
                  color: form.devise === 'Ar' ? '#FAF7F2' : '#3D5A6C',
                  border: '1px solid #3D5A6C',
                }}
              >
                🇲🇬 Ariary (Ar)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Field label="Quantité" style={{ flex: '1 1 65px', minWidth: 60 }}>
              <input type="number" min={1} style={inputStyle as any} value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} />
            </Field>

            {form.devise === 'RMB' ? (
              <>
                <Field label="Taux (Ar/¥)" style={{ flex: '1 1 85px', minWidth: 80 }}>
                  <input
                    type="number"
                    step="any"
                    min={1}
                    placeholder="ex: 680"
                    style={{ ...inputStyle, fontWeight: 600 } as any}
                    value={form.tauxRmb}
                    onChange={e => setForm({ ...form, tauxRmb: e.target.value })}
                  />
                </Field>
                <Field label="PU (¥ RMB)" style={{ flex: '1 1 90px', minWidth: 85 }}>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="Prix en ¥"
                    style={inputStyle as any}
                    value={form.puDevise}
                    onChange={e => setForm({ ...form, puDevise: e.target.value })}
                  />
                </Field>
                <Field label="Frais livraison (¥)" style={{ flex: '1 1 95px', minWidth: 90 }}>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="Livr. fournisseur"
                    style={inputStyle as any}
                    value={form.fraisLivraisonChineDevise}
                    onChange={e => setForm({ ...form, fraisLivraisonChineDevise: e.target.value })}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="PU (Ar)" style={{ flex: '1 1 100px', minWidth: 90 }}>
                  <input
                    type="number"
                    min={0}
                    placeholder="Prix en Ar"
                    style={inputStyle as any}
                    value={form.pu}
                    onChange={e => setForm({ ...form, pu: e.target.value })}
                  />
                </Field>
                <Field label="Frais livraison (Ar)" style={{ flex: '1 1 105px', minWidth: 95 }}>
                  <input
                    type="number"
                    min={0}
                    placeholder="Livr. fournisseur"
                    style={inputStyle as any}
                    value={form.fraisLivraisonChine}
                    onChange={e => setForm({ ...form, fraisLivraisonChine: e.target.value })}
                  />
                </Field>
              </>
            )}

            <Field label="Nouveau Total (Ar)" style={{ flex: '1 1 120px', minWidth: 110 }}>
              <div style={{ ...inputStyle, background: '#F1ECE1', fontWeight: 800, color: '#26333D', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>
                {totalCalcule.toLocaleString('fr-FR')} Ar
              </div>
            </Field>
          </div>

          <div style={{ fontSize: 11.5, color: '#5E584E', marginTop: 8, padding: '4px 8px', background: '#F4EFE6', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <span>Marchandise : {(qtyVal * puVal).toLocaleString('fr-FR')} Ar {fraisChineVal > 0 ? `+ Frais Chine : ${fraisChineVal.toLocaleString('fr-FR')} Ar` : ''}</span>
            <span>Déjà payé : <strong>{dejaPaye.toLocaleString('fr-FR')} Ar</strong></span>
          </div>
        </div>

        {/* Paramètres d'acheminement, Tracking & Statut */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Statut de la commande" style={{ flex: '1 1 140px' }}>
            <select style={selectStyle as any} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Frais Fret International (Ar)" style={{ flex: '1 1 140px' }}>
            <input
              type="number"
              min={0}
              placeholder="ex: 45 000 Ar"
              style={inputStyle as any}
              value={form.fraisTransport}
              onChange={e => setForm({ ...form, fraisTransport: e.target.value })}
            />
          </Field>

          <Field label="N° Tracking / Colis" style={{ flex: '1 1 140px' }}>
            <input
              style={inputStyle as any}
              placeholder="ex: SF123456789..."
              value={form.tracking}
              onChange={e => setForm({ ...form, tracking: e.target.value })}
            />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Date d'achat" style={{ flex: '1 1 140px' }}>
            <input type="date" style={inputStyle as any} max={today} value={form.dateAchat} onChange={e => setForm({ ...form, dateAchat: e.target.value })} />
          </Field>
          <Field label="Remarques / Notes" style={{ flex: '2 1 200px' }}>
            <input
              style={inputStyle as any}
              placeholder="Notes optionnelles sur cette commande..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ ...ghostBtn, flex: 1, justifyContent: 'center', height: 42 }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!form.productId || !form.qty || !form.dateAchat}
            style={{
              ...primaryBtn,
              flex: 2,
              height: 42,
              justifyContent: 'center',
              background: '#2D6A4F',
              opacity: (!form.productId || !form.qty || !form.dateAchat) ? 0.5 : 1,
              cursor: (!form.productId || !form.qty || !form.dateAchat) ? 'not-allowed' : 'pointer',
            }}
          >
            <CheckCircle2 size={16} />
            <span>Enregistrer les modifications</span>
          </button>
        </div>

      </div>
    </Modal>
  );
}
