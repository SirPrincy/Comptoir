import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Field, Modal, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../../ui';
import { getMontantPayeMarchandise, getRestePayeMarchandise, getStatutMarchandiseLabel } from '../../paymentUtils';

export default function AchatPaiementModal({
  paiementCommande,
  setPaiementCommande,
  typePaiement,
  setTypePaiement,
  montantSaisiPaiement,
  setMontantSaisiPaiement,
  datePaiementChoisie,
  setDatePaiementChoisie,
  products,
  commandes,
  ventes,
  soldeRmbInfo,
  devises,
  today,
  updateAll
}: any) {
  const safeProducts = products;
  const safeCommandes = commandes;
  const safeVentes = ventes;

  const ouvrirModalPaiement = (c: any) => {
    setPaiementCommande(c);
    setTypePaiement('total');
    const reste = getRestePayeMarchandise(c);
    setMontantSaisiPaiement(String(reste));
    setDatePaiementChoisie(today);
  };

  const validerPaiement = () => {
    if (!paiementCommande || !datePaiementChoisie) return;
    const isAchatRmb = paiementCommande.deviseOrigine === 'RMB' || Number(paiementCommande.puDevise) > 0;
    const itemTotal = paiementCommande.total !== undefined ? Number(paiementCommande.total) : (Number(paiementCommande.pu || 0) * Number(paiementCommande.qty || 1));
    const ancienPaye = getMontantPayeMarchandise(paiementCommande);
    const resteDu = getRestePayeMarchandise(paiementCommande);
    const montantAjouteAr = typePaiement === 'total' ? resteDu : (Number(montantSaisiPaiement) || 0);
    const tauxPaiement = paiementCommande.tauxRmb || devises?.rmb || 680;
    const montantPayerRmb = isAchatRmb ? (montantAjouteAr / tauxPaiement) : 0;

    if (isAchatRmb && montantPayerRmb > soldeRmbInfo.soldeRmbDispo + 0.05) {
      return;
    }

    const iso = new Date(datePaiementChoisie).toISOString();
    let nouveauPaye = itemTotal;
    if (typePaiement === 'acompte') {
      nouveauPaye = Math.min(itemTotal, ancienPaye + montantAjouteAr);
    }

    const estEntierementPaye = nouveauPaye >= itemTotal;

    updateAll(safeProducts, safeVentes, safeCommandes.map((c: any) => c.id === paiementCommande.id ? {
      ...c,
      montantPayeMarchandise: nouveauPaye,
      statutPaiementMarchandise: estEntierementPaye ? 'Payé' : 'Partiel',
      datePaiementMarchandise: iso,
      datePaiement: estEntierementPaye ? iso : c.datePaiement,
      statut: estEntierementPaye && c.statut === 'Commandé' ? 'En livraison' : c.statut,
      dateEnLivraison: estEntierementPaye && c.statut === 'Commandé' ? (c.dateEnLivraison || iso) : c.dateEnLivraison,
    } : c));
    setPaiementCommande(null);
  };

  if (!paiementCommande) return null;
  const p = products.find((pr: any) => pr.id === paiementCommande.productId);
  const itemTotal = paiementCommande.total !== undefined ? Number(paiementCommande.total) : (Number(paiementCommande.pu || 0) * Number(paiementCommande.qty || 1));
  const dejaPaye = getMontantPayeMarchandise(paiementCommande);
  const resteDu = getRestePayeMarchandise(paiementCommande);
  const isAchatRmb = paiementCommande.deviseOrigine === 'RMB' || Number(paiementCommande.puDevise) > 0;
  const tauxPaiement = paiementCommande.tauxRmb || devises?.rmb || 680;


  const montantPayerAr = typePaiement === 'total' ? resteDu : (Number(montantSaisiPaiement) || 0);
  const montantPayerRmb = isAchatRmb ? (montantPayerAr / tauxPaiement) : 0;
  const isRmbInsuffisantPourPaiement = isAchatRmb && montantPayerRmb > soldeRmbInfo.soldeRmbDispo + 0.05;

  return (
          <Modal title={`Réglement fournisseur : ${p ? p.nom : 'Article'}`} onClose={() => setPaiementCommande(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Récapitulatif montants */}
              <div style={{ background: '#FAF7F2', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5 }}>
                  <span style={{ color: '#5E584E' }}>Montant total commande :</span>
                  <strong style={{ color: '#26333D' }}>{itemTotal.toLocaleString('fr-FR')} Ar</strong>
                </div>
                {Number(paiementCommande.fraisLivraisonChine || paiementCommande.fraisLivraison || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11.5, color: '#736B5E' }}>
                    <span>Dont frais de livraison :</span>
                    <span>
                      {Number(paiementCommande.fraisLivraisonChine || paiementCommande.fraisLivraison).toLocaleString('fr-FR')} Ar
                      {paiementCommande.fraisLivraisonChineDevise ? ` (¥${paiementCommande.fraisLivraisonChineDevise})` : ''}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5 }}>
                  <span style={{ color: '#5E584E' }}>Déjà versé (avances) :</span>
                  <span style={{ color: '#1B6A3E', fontWeight: 600 }}>{dejaPaye.toLocaleString('fr-FR')} Ar</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px dashed #D8D0C0', fontSize: 13.5 }}>
                  <span style={{ fontWeight: 700, color: '#B5532A' }}>Solde restant dû :</span>
                  <strong style={{ color: '#B5532A', fontSize: 15 }}>{resteDu.toLocaleString('fr-FR')} Ar</strong>
                </div>
              </div>

              {/* Choix type de versement */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setTypePaiement('total');
                    setMontantSaisiPaiement(String(resteDu));
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: `1px solid ${typePaiement === 'total' ? '#2C5E43' : '#EAE2D4'}`,
                    background: typePaiement === 'total' ? '#EBF4EC' : '#FFFFFF',
                    color: typePaiement === 'total' ? '#1B6A3E' : '#5E584E',
                    fontWeight: typePaiement === 'total' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✅ Régler tout le solde ({resteDu.toLocaleString('fr-FR')} Ar)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypePaiement('acompte');
                    setMontantSaisiPaiement('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: `1px solid ${typePaiement === 'acompte' ? '#3D5A6C' : '#EAE2D4'}`,
                    background: typePaiement === 'acompte' ? '#EAEBF5' : '#FFFFFF',
                    color: typePaiement === 'acompte' ? '#384282' : '#5E584E',
                    fontWeight: typePaiement === 'acompte' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  🟡 Verser un acompte partiel
                </button>
              </div>

              {typePaiement === 'acompte' && (
                <Field label="Montant du versement supplémentaire (Ar)">
                  <input
                    type="number"
                    min={1}
                    max={resteDu}
                    placeholder={`ex: ${Math.round(resteDu / 2)}`}
                    style={inputStyle as any}
                    value={montantSaisiPaiement}
                    onChange={e => setMontantSaisiPaiement(e.target.value)}
                  />
                  <div style={{ fontSize: 11, color: '#736B5E', marginTop: 4 }}>
                    Nouveau reste dû estimé : {Math.max(0, resteDu - (Number(montantSaisiPaiement) || 0)).toLocaleString('fr-FR')} Ar
                  </div>
                </Field>
              )}

              <Field label="Date de paiement">
                <input
                  type="date"
                  max={today}
                  style={inputStyle as any}
                  value={datePaiementChoisie}
                  onChange={e => setDatePaiementChoisie(e.target.value)}
                />
              </Field>

              {isRmbInsuffisantPourPaiement && (
                <div
                  style={{
                    background: '#FFF5F5',
                    border: '1.5px solid #F2C2C2',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#9E2A2B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={18} color="#C24A3F" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Solde RMB insuffisant</strong> : Ce versement nécessite <strong>{Math.round(montantPayerRmb * 100) / 100} ¥</strong>, mais vous disposez actuellement de <strong>{soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} ¥</strong>. Effectuez d'abord un achat de devises dans l'onglet <strong>Change RMB</strong>.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button type="button" onClick={() => setPaiementCommande(null)} style={ghostBtn as any}>
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={validerPaiement}
                  disabled={isRmbInsuffisantPourPaiement || montantPayerAr <= 0}
                  style={{
                    ...primaryBtn,
                    padding: '0 16px',
                    opacity: (isRmbInsuffisantPourPaiement || montantPayerAr <= 0) ? 0.5 : 1,
                    cursor: (isRmbInsuffisantPourPaiement || montantPayerAr <= 0) ? 'not-allowed' : 'pointer',
                    background: isRmbInsuffisantPourPaiement ? '#C24A3F' : '#3F7A5C',
                  }}
                >
                  {isRmbInsuffisantPourPaiement ? 'Solde RMB insuffisant' : 'Enregistrer le paiement'}
                </button>
              </div>
            </div>
          </Modal>
  );
}
