import React, { useState, useMemo } from 'react';
import { Compass, Coins, AlertCircle } from 'lucide-react';
import { SOURCES, uid } from '../../constants';
import { getNextProductUid, getNextAchatUid, getNextImportUid } from '../../utils/uidUtils';
import { Field, Modal, inputStyle, selectStyle, primaryBtn, ghostBtn, safeDateIso } from '../../ui';
import { calculerScoreFournisseur, getQCBadgeInfo } from '../../qcUtils';
import RecommandationTransitaire from '../RecommandationTransitaire';

export default function AchatFormModal({
  showCmd,
  setShowCmd,
  products,
  fournisseurs,
  commandes,
  ventes,
  devises,
  soldeRmbInfo,
  sourcing,
  updateAll,
  updateData,
  paiements = [],
  today,
  onNavigateTab,
}: any) {
  const safeProducts = products;
  const safeVentes = ventes;
  const safeCommandes = commandes;
  const safeFournisseurs = fournisseurs;
  const safeSourcing = sourcing;

  const [createdCommandeSuccess, setCreatedCommandeSuccess] = useState<any | null>(null);
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
      uidCode: getNextProductUid(safeProducts),
      nom: quickProduct.nom.trim(),
      couleur: quickProduct.couleur.trim() || undefined,
      puRmb: puRmbNum,
      prixAchatAr: prixAchatArNum,
      prixVente: Number(quickProduct.prixVenteAr) || 0,
      stock: 0,
    };

    updateAll([...safeProducts, newProduct], safeVentes, safeCommandes);
    setCmdForm(prev => ({
      ...prev,
      productId: newProduct.id,
      puDevise: String(puRmbNum || ''),
      pu: String(prixAchatArNum || ''),
    }));
    setShowQuickProductForm(false);
    setQuickProduct({ nom: '', couleur: '', puRmb: '', prixAchatAr: '', prixVenteAr: '' });
  };


  const sourcingValides = useMemo(() => {
    return safeSourcing.filter((s: any) => s.statut === 'Validé');
  }, [safeSourcing]);
  
  // Modale de paiement / acompte
  const [paiementCommande, setPaiementCommande] = useState<any | null>(null);
  const [typePaiement, setTypePaiement] = useState<'total' | 'acompte'>('total');
  const [montantSaisiPaiement, setMontantSaisiPaiement] = useState('');

  const [datePaiementChoisie, setDatePaiementChoisie] = useState(today);

  const [cmdForm, setCmdForm] = useState({
    productId: '',
    source: SOURCES[0],
    fournisseurId: '',
    acheteurNom: '',
    commissionAcheteurPct: '',
    transitaireId: '',
    qty: 1,
    devise: 'RMB', // 'RMB' ou 'Ar'
    tauxRmb: devises?.rmb || '680',
    puDevise: '',
    pu: '',
    fraisLivraisonChineDevise: '',
    fraisLivraisonChine: '',
    acompteDevise: '',
    acompteAr: '',
    tracking: '',
    statut: 'Commandé',
    dateAchat: today,
  });


  // Suggestion automatique du meilleur fournisseur pour le produit sélectionné
  const bestSupplierSuggestion = React.useMemo(() => {
    if (!cmdForm.productId) return null;
    const productCmds = safeCommandes.filter((c: any) => c.productId === cmdForm.productId && c.fournisseurId);
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
      const scoreA = calculerScoreFournisseur(a.fId, safeCommandes, products);
      const scoreB = calculerScoreFournisseur(b.fId, safeCommandes, products);
      
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
  }, [cmdForm.productId, safeCommandes, safeFournisseurs]);

  const userTauxRmb = cmdForm.devise === 'RMB' ? (Number(cmdForm.tauxRmb) || 680) : 1;
  const qtyVal = Number(cmdForm.qty) || 0;
  const puVal = cmdForm.devise === 'RMB'
    ? Math.round((Number(cmdForm.puDevise) || 0) * userTauxRmb)
    : (Number(cmdForm.pu) || 0);
  const fraisChineVal = cmdForm.devise === 'RMB'
    ? Math.round((Number(cmdForm.fraisLivraisonChineDevise) || 0) * userTauxRmb)
    : (Number(cmdForm.fraisLivraisonChine) || 0);
  const totalCalcule = (qtyVal * puVal) + fraisChineVal;

  const totalRmbCommande = cmdForm.devise === 'RMB'
    ? Math.round(((Number(cmdForm.puDevise) || 0) * (Number(cmdForm.qty) || 1) + (Number(cmdForm.fraisLivraisonChineDevise) || 0)) * 100) / 100
    : 0;

  const requestedRmbAcompte = cmdForm.devise === 'RMB' ? (Number(cmdForm.acompteDevise) || 0) : 0;
  const isAcompteExcedeSoldeRmb = cmdForm.devise === 'RMB' && requestedRmbAcompte > soldeRmbInfo.soldeRmbDispo;
  const isRmbTotalSuperieurSolde = cmdForm.devise === 'RMB' && totalRmbCommande > soldeRmbInfo.soldeRmbDispo;

  const acompteCalcule = cmdForm.devise === 'RMB'
    ? Math.round(requestedRmbAcompte * userTauxRmb)
    : (Number(cmdForm.acompteAr) || 0);

  const ajouterCommande = () => {
    if (!cmdForm.productId || !cmdForm.qty || !cmdForm.dateAchat) return;

    // Conversion directe Ariary <-> RMB : l'acompte est directement pris en compte au taux de change
    const acompteEffectifAr = acompteCalcule;

    const montantPayeInitial = acompteEffectifAr > 0 ? Math.min(totalCalcule, acompteEffectifAr) : 0;
    const statutPaiementInitial = montantPayeInitial >= totalCalcule && totalCalcule > 0
      ? 'Payé'
      : montantPayeInitial > 0
      ? 'Partiel'
      : 'Non payé';

    const isoDateAchat = safeDateIso(cmdForm.dateAchat);

    const commPctNum = Number(cmdForm.commissionAcheteurPct) || 0;
    const commArNum = commPctNum > 0 ? Math.round(totalCalcule * (commPctNum / 100)) : 0;

    const c = {
      id: uid(),
      codeAchat: getNextAchatUid(safeCommandes),
      codeImport: getNextImportUid(safeCommandes),
      productId: cmdForm.productId,
      source: cmdForm.source,
      fournisseurId: cmdForm.fournisseurId,
      acheteurNom: cmdForm.acheteurNom?.trim() || undefined,
      commissionAcheteurPct: commPctNum > 0 ? commPctNum : undefined,
      commissionAcheteurAr: commArNum > 0 ? commArNum : undefined,
      tauxRmbPondereApplique: cmdForm.devise === 'RMB' ? (soldeRmbInfo?.tauxActuel || userTauxRmb) : undefined,
      transitaireId: cmdForm.transitaireId,
      qty: qtyVal,
      deviseOrigine: cmdForm.devise,
      tauxRmb: cmdForm.devise === 'RMB' ? userTauxRmb : undefined,
      puDevise: cmdForm.devise === 'RMB' ? Number(cmdForm.puDevise) || 0 : undefined,
      pu: puVal,
      fraisLivraisonChineDevise: cmdForm.devise === 'RMB' ? Number(cmdForm.fraisLivraisonChineDevise) || 0 : undefined,
      fraisLivraisonChine: fraisChineVal,
      total: totalCalcule,
      montantPayeMarchandise: montantPayeInitial,
      statutPaiementMarchandise: statutPaiementInitial,
      datePaiementMarchandise: montantPayeInitial > 0 ? isoDateAchat : undefined,
      datePaiement: (montantPayeInitial >= totalCalcule && totalCalcule > 0) ? isoDateAchat : undefined,
      payeEnMgaDirect: cmdForm.devise === 'RMB' ? (requestedRmbAcompte > 0 ? false : undefined) : true,
      modeReglement: cmdForm.devise === 'RMB' ? (requestedRmbAcompte > 0 ? 'reserve_rmb' : undefined) : 'mga_direct',
      comptePayeur: cmdForm.devise === 'RMB' && requestedRmbAcompte > 0 ? 'Réserve RMB (¥)' : undefined,
      tracking: cmdForm.tracking,
      statut: (montantPayeInitial >= totalCalcule && totalCalcule > 0) ? 'En livraison' : 'Commandé',
      dateAchat: isoDateAchat,
    };

    const prod = safeProducts.find((p: any) => p.id === cmdForm.productId);

    if (montantPayeInitial > 0 && typeof updateData === 'function') {
      const isPmtRmb = cmdForm.devise === 'RMB' && requestedRmbAcompte > 0;
      const comptePmt = isPmtRmb ? 'Réserve RMB (¥)' : 'Caisse / Espèces';

      const nouveauPaiement = {
        id: uid(),
        date: isoDateAchat,
        nature: 'marchandise' as const,
        compte: comptePmt,
        montantTotal: montantPayeInitial,
        montantDevise: isPmtRmb ? requestedRmbAcompte : undefined,
        devise: isPmtRmb ? 'RMB' : undefined,
        tauxChange: isPmtRmb ? userTauxRmb : undefined,
        beneficiaire: cmdForm.source || 'Fournisseur Chine',
        description: `Acompte Achat — ${prod ? prod.nom : 'Article'} (x${qtyVal})${cmdForm.devise === 'RMB' ? ` [${requestedRmbAcompte.toFixed(2)} ¥ @ ${userTauxRmb} Ar/¥]` : ''}`,
        reference: cmdForm.source || '',
        lignes: [
          {
            cibleType: 'marchandise' as const,
            cibleId: c.id,
            montantAlloue: montantPayeInitial,
            montantAlloueDevise: isPmtRmb ? requestedRmbAcompte : undefined,
          }
        ],
      };

      updateData({
        commandes: [...safeCommandes, c],
        paiements: [...paiements, nouveauPaiement],
      });
    } else {
      updateAll(safeProducts, safeVentes, [...safeCommandes, c]);
    }
    setCmdForm({
      productId: '',
      source: SOURCES[0],
      fournisseurId: '',
      acheteurNom: '',
      commissionAcheteurPct: '',
      transitaireId: '',
      qty: 1,
      devise: 'RMB',
      tauxRmb: devises?.rmb || '680',
      puDevise: '',
      pu: '',
      fraisLivraisonChineDevise: '',
      fraisLivraisonChine: '',
      acompteDevise: '',
      acompteAr: '',
      tracking: '',
      statut: 'Commandé',
      dateAchat: today,
    });

    setCreatedCommandeSuccess(c);
  };

  if (!showCmd) return null;

  if (createdCommandeSuccess) {
    const pSuccess = safeProducts.find((pr: any) => pr.id === createdCommandeSuccess.productId);
    const fSuccess = safeFournisseurs.find((fr: any) => fr.id === createdCommandeSuccess.fournisseurId);
    return (
      <Modal
        title="Achat enregistré avec succès !"
        onClose={() => {
          setCreatedCommandeSuccess(null);
          setShowCmd(false);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '10px 4px' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#E9F2EC',
            border: '2px solid #3F7A5C',
            color: '#3F7A5C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            margin: '0 auto',
          }}>
            ✓
          </div>

          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#26333D' }}>
              Commande ajoutée au registre d'achat
            </div>
            <div style={{ fontSize: 13, color: '#8A8375', marginTop: 4 }}>
              <strong>{createdCommandeSuccess.qty}x</strong> {pSuccess ? pSuccess.nom : 'Article'} {fSuccess ? `· Fournisseur : ${fSuccess.nom}` : ''}
            </div>
            <div style={{ fontSize: 12, color: '#3F7A5C', fontWeight: 700, marginTop: 4 }}>
              Montant total : {Number(createdCommandeSuccess.total || 0).toLocaleString('fr-FR')} Ar
            </div>
          </div>

          <div style={{
            background: '#FAF7F2',
            border: '1px solid #EAE2D4',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 12.5,
            color: '#5E584E',
            textAlign: 'left',
          }}>
            💡 <strong>Étape suivante recommandée :</strong> Vous pouvez basculer directement vers le <strong>Suivi Logistique</strong> pour suivre les 5 étapes d'acheminement (expédition Chine, transit maritime/aérien, arrivée Madagascar et contrôle qualité).
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  setCreatedCommandeSuccess(null);
                  setShowCmd(false);
                  onNavigateTab('logistique');
                }}
                style={{
                  ...primaryBtn,
                  height: 42,
                  width: '100%',
                  justifyContent: 'center',
                  background: '#3D5A6C',
                  fontSize: 13.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>🚚 Suivre l'acheminement en Logistique</span>
              </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setCreatedCommandeSuccess(null);
                }}
                style={{
                  ...ghostBtn,
                  height: 38,
                  fontSize: 12.5,
                  fontWeight: 600,
                  justifyContent: 'center',
                  border: '1px solid #D9CFC1',
                }}
              >
                ➕ Ajouter un autre achat
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedCommandeSuccess(null);
                  setShowCmd(false);
                }}
                style={{
                  ...ghostBtn,
                  height: 38,
                  fontSize: 12.5,
                  fontWeight: 600,
                  justifyContent: 'center',
                  border: '1px solid #D9CFC1',
                }}
              >
                Terminer & Rester ici
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
        <Modal title="Nouvel achat & Acompte fournisseur" onClose={() => setShowCmd(false)}>
          {products.length === 0 && !showQuickProductForm && (
            <div
              style={{
                background: '#FFF8E1',
                border: '1px solid #F0DDB3',
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 10,
                fontSize: 12,
                color: '#B78103',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span>Aucun produit en stock. Créez votre produit ici sans quitter cette fenêtre.</span>
              <button
                type="button"
                onClick={() => setShowQuickProductForm(true)}
                style={{ ...primaryBtn, height: 28, fontSize: 11, background: '#B78103', padding: '0 10px', whiteSpace: 'nowrap' }}
              >
                + Créer le produit
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {showQuickProductForm ? (
              <div style={{ background: '#FAF7F2', padding: 12, borderRadius: 8, border: '1px solid #EAE2D4', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#26333D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📦 Création rapide de produit en stock</span>
                  {products.length > 0 && (
                    <button type="button" onClick={() => setShowQuickProductForm(false)} style={ghostBtn}>Annuler</button>
                  )}
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
                  Créer & Sélectionner pour l'achat
                </button>
              </div>
            ) : (
              <Field label="Produit *">
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    style={{ ...selectStyle, flex: 1 } as any}
                    value={cmdForm.productId}
                    onChange={e => {
                      const pId = e.target.value;
                      const targetP = products.find((pr: any) => pr.id === pId);
                      setCmdForm(prev => ({
                        ...prev,
                        productId: pId,
                        puDevise: targetP?.puRmb ? String(targetP.puRmb) : prev.puDevise,
                        pu: targetP?.prixAchatAr ? String(targetP.prixAchatAr) : prev.pu,
                      }));
                    }}
                  >
                    <option value="">Choisir un produit dans le stock…</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nom}{p.couleur ? ` — ${p.couleur}` : ''}{p.reference ? ` (${p.reference})` : ''}</option>
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

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Source" style={{ flex: '1 1 130px' }}>
                <select style={selectStyle as any} value={cmdForm.source} onChange={e => setCmdForm({ ...cmdForm, source: e.target.value })}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              {fournisseurs.length > 0 && (
                <Field label="Fournisseur" style={{ flex: '1 1 130px' }}>
                  <select style={selectStyle as any} value={cmdForm.fournisseurId} onChange={e => setCmdForm({ ...cmdForm, fournisseurId: e.target.value })}>
                    <option value="">— Aucun fournisseur —</option>
                    {fournisseurs.map((f: any) => {
                      const score = calculerScoreFournisseur(f.id, commandes, products);
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

            {/* Recommandation de fournisseur habituel moins cher */}
            {bestSupplierSuggestion && cmdForm.fournisseurId !== bestSupplierSuggestion.fournisseur.id && (
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
                  marginBottom: 6,
                }}
              >
                <div>
                  💡 <strong>Fournisseur habituel moins cher</strong> : {bestSupplierSuggestion.fournisseur.nom}
                  {bestSupplierSuggestion.lastPuRmb > 0 ? ` (¥${bestSupplierSuggestion.lastPuRmb})` : ` (${bestSupplierSuggestion.lastPuAr.toLocaleString('fr-FR')} Ar)`}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCmdForm(prev => ({
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

            {fournisseurs.length > 0 && (
              <>
                <Field label="Transitaire (optionnel)">
                  <select style={selectStyle as any} value={cmdForm.transitaireId} onChange={e => setCmdForm({ ...cmdForm, transitaireId: e.target.value })}>
                    <option value="">— Aucun transitaire assigné —</option>
                    {fournisseurs.map((f: any) => {
                      const score = calculerScoreFournisseur(f.id, commandes, products);
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

                {/* Moteur de recommandation automatique de transitaire */}
                <RecommandationTransitaire
                  product={products.find((p: any) => p.id === cmdForm.productId)}
                  commandes={commandes}
                  fournisseurs={fournisseurs}
                  currentTransitaireId={cmdForm.transitaireId}
                  onSelectTransitaire={(tId) => setCmdForm(prev => ({ ...prev, transitaireId: tId }))}
                />
              </>
            )}

            {/* Saisie quantité et prix avec sélecteur de devise */}
            <div style={{ background: '#FAF7F2', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#3D5A6C' }}>Prix d'achat unitaire :</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setCmdForm({ ...cmdForm, devise: 'RMB' })}
                    style={{
                      padding: '3px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                      background: cmdForm.devise === 'RMB' ? '#3D5A6C' : '#FFFFFF',
                      color: cmdForm.devise === 'RMB' ? '#FAF7F2' : '#3D5A6C',
                      border: '1px solid #3D5A6C',
                    }}
                  >
                    🇨🇳 RMB (¥)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCmdForm({ ...cmdForm, devise: 'Ar' })}
                    style={{
                      padding: '3px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                      background: cmdForm.devise === 'Ar' ? '#3D5A6C' : '#FFFFFF',
                      color: cmdForm.devise === 'Ar' ? '#FAF7F2' : '#3D5A6C',
                      border: '1px solid #3D5A6C',
                    }}
                  >
                    🇲🇬 Ariary (Ar)
                  </button>
                </div>
              </div>

              {cmdForm.devise === 'RMB' && (
                <div
                  style={{
                    background: soldeRmbInfo.soldeRmbDispo > 0 ? '#F0F7F4' : '#FFF5F5',
                    border: `1px solid ${soldeRmbInfo.soldeRmbDispo > 0 ? '#C2E0D1' : '#F2C2C2'}`,
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: '#26333D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Coins size={15} color={soldeRmbInfo.soldeRmbDispo > 0 ? '#2C5E43' : '#C24A3F'} />
                    <span>
                      Solde RMB Disponible : <strong>{soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} ¥</strong> ({soldeRmbInfo.totalRmbAchete.toLocaleString('fr-FR')} ¥ achetés - {soldeRmbInfo.totalRmbDepense.toLocaleString('fr-FR')} ¥ dépensés)
                    </span>
                  </div>
                  {((Number(cmdForm.puDevise) || 0) * (Number(cmdForm.qty) || 1) + (Number(cmdForm.fraisLivraisonChineDevise) || 0)) > 0 && (
                    <div style={{ fontWeight: 700, fontSize: 11, color: (soldeRmbInfo.soldeRmbDispo >= ((Number(cmdForm.puDevise) || 0) * (Number(cmdForm.qty) || 1) + (Number(cmdForm.fraisLivraisonChineDevise) || 0))) ? '#2C5E43' : '#C24A3F' }}>
                      {(soldeRmbInfo.soldeRmbDispo >= ((Number(cmdForm.puDevise) || 0) * (Number(cmdForm.qty) || 1) + (Number(cmdForm.fraisLivraisonChineDevise) || 0)))
                        ? '✅ Solde RMB suffisant pour cette commande'
                        : `⚠️ Solde RMB insuffisant (Manque ${Math.round(((Number(cmdForm.puDevise) || 0) * (Number(cmdForm.qty) || 1) + (Number(cmdForm.fraisLivraisonChineDevise) || 0)) - soldeRmbInfo.soldeRmbDispo).toLocaleString('fr-FR')} ¥) - Recharger dans Change RMB`}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Field label="Qté" style={{ flex: '1 1 60px', minWidth: 60 }}>
                  <input type="number" min={1} style={inputStyle as any} value={cmdForm.qty} onChange={e => setCmdForm({ ...cmdForm, qty: e.target.value })} />
                </Field>

                {cmdForm.devise === 'RMB' ? (
                  <>
                    <Field label="Taux (Ar/¥)" style={{ flex: '1 1 110px', minWidth: 105 }}>
                      <input
                        type="number"
                        step="any"
                        min={1}
                        placeholder="ex: 650"
                        style={{ ...inputStyle, fontWeight: 700, color: '#8D6E00' } as any}
                        value={cmdForm.tauxRmb}
                        onChange={e => setCmdForm({ ...cmdForm, tauxRmb: e.target.value })}
                      />
                      {/* Raccourcis de taux fréquents pour l'utilisateur */}
                      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {[640, 645, 650, 655, 660].map(tx => (
                          <button
                            key={tx}
                            type="button"
                            onClick={() => setCmdForm({ ...cmdForm, tauxRmb: String(tx) })}
                            style={{
                              padding: '1px 4px',
                              fontSize: 9.5,
                              borderRadius: 3,
                              border: '1px solid #D8D0C0',
                              background: String(cmdForm.tauxRmb) === String(tx) ? '#E1F0E8' : '#FAF7F2',
                              color: String(cmdForm.tauxRmb) === String(tx) ? '#1E4632' : '#5E584E',
                              cursor: 'pointer',
                            }}
                          >
                            {tx}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="PU (¥ RMB)" style={{ flex: '1 1 90px', minWidth: 85 }}>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="Prix en ¥"
                        style={inputStyle as any}
                        value={cmdForm.puDevise}
                        onChange={e => setCmdForm({ ...cmdForm, puDevise: e.target.value })}
                      />
                    </Field>
                    <Field label="Frais livraison (¥)" style={{ flex: '1 1 95px', minWidth: 90 }}>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="Livr. fournisseur"
                        style={inputStyle as any}
                        value={cmdForm.fraisLivraisonChineDevise}
                        onChange={e => setCmdForm({ ...cmdForm, fraisLivraisonChineDevise: e.target.value })}
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
                        value={cmdForm.pu}
                        onChange={e => setCmdForm({ ...cmdForm, pu: e.target.value })}
                      />
                    </Field>
                    <Field label="Frais livraison (Ar)" style={{ flex: '1 1 105px', minWidth: 95 }}>
                      <input
                        type="number"
                        min={0}
                        placeholder="Livr. fournisseur"
                        style={inputStyle as any}
                        value={cmdForm.fraisLivraisonChine}
                        onChange={e => setCmdForm({ ...cmdForm, fraisLivraisonChine: e.target.value })}
                      />
                    </Field>
                  </>
                )}

                <Field label="Total (Ar)" style={{ flex: '1 1 110px', minWidth: 100 }}>
                  <div style={{ ...inputStyle, background: '#F1ECE1', fontWeight: 700, display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>
                    {totalCalcule.toLocaleString('fr-FR')} Ar
                  </div>
                </Field>
              </div>

              {/* Champs Acheteur Chine & Commission éventuelle */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #EAE2D4' }}>
                <Field label="Acheteur / Intermédiaire Chine (optionnel)" style={{ flex: '1.5 1 180px' }}>
                  <input
                    style={inputStyle as any}
                    placeholder="Ex: Acheteur Guangzhou, Agent Sourcing..."
                    value={cmdForm.acheteurNom}
                    onChange={e => setCmdForm({ ...cmdForm, acheteurNom: e.target.value })}
                    list="acheteurs-commandes-list"
                  />
                  <datalist id="acheteurs-commandes-list">
                    <option value="Acheteur Guangzhou / Yiwu" />
                    <option value="Agent de sourcing Chine" />
                    <option value="Contact WeChat Direct" />
                    <option value="Tanà Exchange" />
                  </datalist>
                </Field>
                <Field label="Commission acheteur (%)" style={{ flex: '1 1 130px' }}>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="Ex: 3%"
                    style={inputStyle as any}
                    value={cmdForm.commissionAcheteurPct}
                    onChange={e => setCmdForm({ ...cmdForm, commissionAcheteurPct: e.target.value })}
                  />
                </Field>
              </div>


              {fraisChineVal > 0 && (
                <div style={{ fontSize: 11.5, color: '#5E584E', marginTop: 6, padding: '3px 8px', background: '#F4EFE6', borderRadius: 6 }}>
                  Articles : {(qtyVal * puVal).toLocaleString('fr-FR')} Ar + Frais livraison : {fraisChineVal.toLocaleString('fr-FR')} Ar {cmdForm.devise === 'RMB' && (Number(cmdForm.fraisLivraisonChineDevise) > 0) ? `(¥${Number(cmdForm.fraisLivraisonChineDevise)})` : ''} = <strong style={{ color: '#3D5A6C' }}>{totalCalcule.toLocaleString('fr-FR')} Ar</strong>
                </div>
              )}

              {/* Section Avance / Acompte versé au fournisseur */}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #D8D0C0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#26333D' }}>
                    Avance / Acompte versé au fournisseur (optionnel) :
                  </span>
                  {acompteCalcule > 0 && (
                    <span style={{ fontSize: 11, color: '#1B6A3E', fontWeight: 600 }}>
                      Solde dû : {Math.max(0, totalCalcule - acompteCalcule).toLocaleString('fr-FR')} Ar
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {cmdForm.devise === 'RMB' ? (
                    <Field label="Acompte (¥ RMB)" style={{ flex: '1 1 140px' }}>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="ex: 100 ¥ (acompte)"
                        style={inputStyle as any}
                        value={cmdForm.acompteDevise}
                        onChange={e => setCmdForm({ ...cmdForm, acompteDevise: e.target.value })}
                      />
                    </Field>
                  ) : (
                    <Field label="Acompte (Ar)" style={{ flex: '1 1 140px' }}>
                      <input
                        type="number"
                        min={0}
                        placeholder="ex: 50 000 Ar"
                        style={inputStyle as any}
                        value={cmdForm.acompteAr}
                        onChange={e => setCmdForm({ ...cmdForm, acompteAr: e.target.value })}
                      />
                    </Field>
                  )}

                  <div style={{ fontSize: 11, color: '#736B5E', flex: '1 1 180px', marginTop: 16 }}>
                    {acompteCalcule === 0 ? (
                      'Aucun acompte (solde à payer plus tard)'
                    ) : acompteCalcule >= totalCalcule ? (
                      '✅ Payé intégralement à la commande'
                    ) : (
                      `🟡 Acompte de ${acompteCalcule.toLocaleString('fr-FR')} Ar versé`
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Field label="N° de colis / Tracking (optionnel)">
              <input
                style={inputStyle as any}
                placeholder="ex: SF123456789, YT2023948..."
                value={cmdForm.tracking}
                onChange={e => setCmdForm({ ...cmdForm, tracking: e.target.value })}
              />
            </Field>
            <Field label="Date d'achat">
              <input type="date" style={inputStyle as any} max={today} value={cmdForm.dateAchat} onChange={e => setCmdForm({ ...cmdForm, dateAchat: e.target.value })} />
            </Field>

            {cmdForm.devise === 'RMB' && (
              <div
                style={{
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: 8,
                  padding: '9px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#0369A1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <Coins size={16} color="#0284C7" style={{ flexShrink: 0 }} />
                <span>
                  💡 <strong>Conversion directe</strong> : Facturation au taux de <strong>{userTauxRmb} Ar / ¥</strong>. Le paiement s'effectue directement en Ariary (MGA) avec conversion automatique en RMB.
                </span>
              </div>
            )}

            <button
              onClick={ajouterCommande}
              disabled={!cmdForm.productId || !cmdForm.qty || !cmdForm.dateAchat}
              style={{
                ...primaryBtn,
                height: 42,
                width: '100%',
                justifyContent: 'center',
                marginTop: 10,
                opacity: (!cmdForm.productId || !cmdForm.qty || !cmdForm.dateAchat) ? 0.5 : 1,
                cursor: (!cmdForm.productId || !cmdForm.qty || !cmdForm.dateAchat) ? 'not-allowed' : 'pointer',
                background: '#3F7A5C',
              }}
            >
              Ajouter la commande d'achat
            </button>
          </div>
        </Modal>

  );
}
