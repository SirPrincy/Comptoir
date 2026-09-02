import React, { useState, useEffect, useMemo } from 'react';
import { Coins, CheckCircle2, ArrowRightLeft, CreditCard } from 'lucide-react';
import { Field, Modal, inputStyle, selectStyle, primaryBtn, ghostBtn, safeDateIso } from '../../ui';
import { COMPTES_FINANCIERS, uid } from '../../constants';
import { getMontantPayeMarchandise, getRestePayeMarchandise } from '../../paymentUtils';
import { calculerSoldesComptes } from '../../Tresorerie/tresorerieUtils';
import SoldeCompteInfo from '../../Tresorerie/SoldeCompteInfo';

export default function AchatPaiementModal({
  paiementCommande,
  setPaiementCommande,
  typePaiement,
  setTypePaiement,
  montantSaisiPaiement,
  setMontantSaisiPaiement,
  datePaiementChoisie,
  setDatePaiementChoisie,
  products = [],
  commandes = [],
  ventes = [],
  mouvements = [],
  fournisseurs = [],
  soldeRmbInfo,
  devises = { rmb: 680, usd: 4600 },
  today,
  updateAll,
  updateData,
  paiements = [],
  changes = [],
  comptes = [],
}: any) {
  const safeProducts = products;
  const safeCommandes = commandes;
  const activeComptes = comptes && comptes.length > 0 ? comptes : COMPTES_FINANCIERS;

  const [compteChoisi, setCompteChoisi] = useState<string>('MVola');

  const soldesParCompte = useMemo(() => {
    return calculerSoldesComptes({
      ventes,
      commandes: safeCommandes,
      mouvements,
      paiements,
      products: safeProducts,
      fournisseurs,
      comptes: activeComptes,
    });
  }, [ventes, safeCommandes, mouvements, paiements, safeProducts, fournisseurs, activeComptes]);

  useEffect(() => {
    if (paiementCommande) {
      const defaultCompte = paiementCommande.comptePayeur || (activeComptes.includes('MVola') ? 'MVola' : activeComptes[0] || 'Caisse / Espèces');
      setCompteChoisi(defaultCompte);
    }
  }, [paiementCommande, activeComptes]);

  if (!paiementCommande) return null;

  const p = safeProducts.find((pr: any) => pr.id === paiementCommande.productId);
  const itemTotal = paiementCommande.total !== undefined ? Number(paiementCommande.total) : (Number(paiementCommande.pu || 0) * Number(paiementCommande.qty || 1));
  const dejaPaye = getMontantPayeMarchandise(paiementCommande, paiements);
  const resteDu = getRestePayeMarchandise(paiementCommande, paiements);

  const isAchatRmb = paiementCommande.deviseOrigine === 'RMB' || Number(paiementCommande.puDevise) > 0;
  const tauxPaiement = paiementCommande.tauxRmb || devises?.rmb || 680;

  const montantPayerAr = typePaiement === 'total' ? resteDu : (Number(montantSaisiPaiement) || 0);
  const montantPayerRmb = isAchatRmb ? (montantPayerAr / tauxPaiement) : 0;
  const resteDuRmb = isAchatRmb ? (resteDu / tauxPaiement) : 0;

  const isCompteRmb = compteChoisi === 'Réserve RMB (¥)';
  const isRmbInsuffisant = isCompteRmb && (montantPayerRmb > (soldeRmbInfo?.soldeRmbDispo || 0) + 0.05);

  const validerPaiement = () => {
    if (!paiementCommande || !datePaiementChoisie || montantPayerAr <= 0) return;
    if (isRmbInsuffisant) return;

    const iso = safeDateIso(datePaiementChoisie);
    const montantAjouteAr = montantPayerAr;
    let nouveauPaye = itemTotal;
    if (typePaiement === 'acompte') {
      nouveauPaye = Math.min(itemTotal, dejaPaye + montantAjouteAr);
    }

    const estEntierementPaye = nouveauPaye >= itemTotal;

    const nouveauPaiement = {
      id: uid(),
      date: iso,
      nature: 'marchandise',
      compte: compteChoisi,
      montantTotal: montantAjouteAr,
      beneficiaire: paiementCommande.source || 'Fournisseur Chine',
      description: `Règlement Marchandise — ${p ? p.nom : 'Article'} (x${paiementCommande.qty || 1})${isAchatRmb ? ` [≈ ${montantPayerRmb.toFixed(2)} ¥ @ ${tauxPaiement} Ar/¥]` : ''}`,
      reference: paiementCommande.source || '',
      lignes: [
        {
          cibleType: 'marchandise',
          cibleId: paiementCommande.id,
          montantAlloue: montantAjouteAr,
        }
      ],
    };

    const isMgaDirect = !isCompteRmb;

    const updatedCommandes = safeCommandes.map((c: any) => c.id === paiementCommande.id ? {
      ...c,
      comptePayeur: compteChoisi,
      payeEnMgaDirect: isMgaDirect || c.payeEnMgaDirect,
      modeReglement: isMgaDirect ? 'mga_direct' : 'reserve_rmb',
      montantPayeMarchandise: nouveauPaye,
      statutPaiementMarchandise: estEntierementPaye ? 'Payé' : 'Partiel',
      datePaiementMarchandise: iso,
      datePaiement: estEntierementPaye ? iso : c.datePaiement,
      statut: estEntierementPaye && c.statut === 'Commandé' ? 'En livraison' : c.statut,
      dateEnLivraison: estEntierementPaye && c.statut === 'Commandé' ? (c.dateEnLivraison || iso) : c.dateEnLivraison,
    } : c);

    if (typeof updateData === 'function') {
      updateData({
        paiements: [...paiements, nouveauPaiement],
        commandes: updatedCommandes,
      });
    } else {
      updateAll(safeProducts, ventes, updatedCommandes);
    }
    setPaiementCommande(null);
  };

  return (
    <Modal title={`Règlement achat : ${p ? p.nom : 'Article'}`} onClose={() => setPaiementCommande(null)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Récapitulatif montants & conversion */}
        <div style={{ background: '#FAF7F2', padding: '12px 14px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
            <span style={{ color: '#5E584E' }}>Montant total commande :</span>
            <strong style={{ color: '#26333D' }}>
              {itemTotal.toLocaleString('fr-FR')} Ar
              {isAchatRmb && (
                <span style={{ color: '#736B5E', fontWeight: 500, fontSize: 12, marginLeft: 6 }}>
                  (≈ {(itemTotal / tauxPaiement).toFixed(2)} ¥)
                </span>
              )}
            </strong>
          </div>
          {dejaPaye > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5 }}>
              <span style={{ color: '#5E584E' }}>Déjà versé :</span>
              <span style={{ color: '#1B6A3E', fontWeight: 600 }}>{dejaPaye.toLocaleString('fr-FR')} Ar</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed #D8D0C0', fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: '#B5532A' }}>Solde restant dû :</span>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ color: '#B5532A', fontSize: 16 }}>{resteDu.toLocaleString('fr-FR')} Ar</strong>
              {isAchatRmb && (
                <div style={{ fontSize: 12, color: '#B5532A', fontWeight: 600 }}>
                  ≈ {resteDuRmb.toFixed(2)} ¥ (Taux : {tauxPaiement} Ar/¥)
                </div>
              )}
            </div>
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
              padding: '9px 10px',
              borderRadius: 6,
              border: `1.5px solid ${typePaiement === 'total' ? '#2C5E43' : '#EAE2D4'}`,
              background: typePaiement === 'total' ? '#EBF4EC' : '#FFFFFF',
              color: typePaiement === 'total' ? '#1B6A3E' : '#5E584E',
              fontWeight: typePaiement === 'total' ? 700 : 500,
              cursor: 'pointer',
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={14} />
            <span>Régler tout le solde ({resteDu.toLocaleString('fr-FR')} Ar)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTypePaiement('acompte');
              setMontantSaisiPaiement('');
            }}
            style={{
              flex: 1,
              padding: '9px 10px',
              borderRadius: 6,
              border: `1.5px solid ${typePaiement === 'acompte' ? '#3D5A6C' : '#EAE2D4'}`,
              background: typePaiement === 'acompte' ? '#EAEBF5' : '#FFFFFF',
              color: typePaiement === 'acompte' ? '#384282' : '#5E584E',
              fontWeight: typePaiement === 'acompte' ? 700 : 500,
              cursor: 'pointer',
              fontSize: 12.5,
            }}
          >
            🟡 Verser un acompte
          </button>
        </div>

        {typePaiement === 'acompte' && (
          <Field label="Montant du versement (Ar)">
            <input
              type="number"
              min={1}
              max={resteDu}
              placeholder={`ex: ${Math.round(resteDu / 2)}`}
              style={inputStyle as any}
              value={montantSaisiPaiement}
              onChange={e => setMontantSaisiPaiement(e.target.value)}
            />
            {isAchatRmb && Number(montantSaisiPaiement) > 0 && (
              <div style={{ fontSize: 11.5, color: '#0369A1', marginTop: 4, fontWeight: 600 }}>
                🔄 Équivalent fournisseur : {((Number(montantSaisiPaiement) || 0) / tauxPaiement).toFixed(2)} ¥
              </div>
            )}
            <div style={{ fontSize: 11, color: '#736B5E', marginTop: 2 }}>
              Nouveau reste dû : {Math.max(0, resteDu - (Number(montantSaisiPaiement) || 0)).toLocaleString('fr-FR')} Ar
            </div>
          </Field>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Compte de règlement">
            <select
              style={selectStyle as any}
              value={compteChoisi}
              onChange={e => setCompteChoisi(e.target.value)}
            >
              {activeComptes.map((c: string) => {
                const isRmbOpt = c === 'Réserve RMB (¥)' || c.toLowerCase().includes('rmb');
                const s = isRmbOpt
                  ? (soldeRmbInfo?.soldeRmbDispo || 0)
                  : (soldesParCompte[c] || 0);
                const sLabel = isRmbOpt ? `${s.toFixed(2)} ¥` : `${s.toLocaleString('fr-FR')} Ar`;
                return (
                  <option key={c} value={c}>
                    {c} (Solde : {sLabel})
                  </option>
                );
              })}
            </select>
          </Field>

          <Field label="Date de paiement">
            <input
              type="date"
              max={today}
              style={inputStyle as any}
              value={datePaiementChoisie}
              onChange={e => setDatePaiementChoisie(e.target.value)}
            />
          </Field>
        </div>

        {/* Visualisation du solde du portefeuille sélectionné & après règlement */}
        <SoldeCompteInfo
          compteSelectionne={compteChoisi}
          soldesParCompte={soldesParCompte}
          soldeRmbDispo={soldeRmbInfo?.soldeRmbDispo}
          montantOperation={montantPayerAr}
          typeOperation="debit"
          activeComptes={activeComptes}
          deviseOrigine={paiementCommande.deviseOrigine}
          tauxRmb={tauxPaiement}
        />

        {/* Encadré de conversion directe automatique */}
        {isAchatRmb && !isCompteRmb && (
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ArrowRightLeft size={16} color="#15803D" style={{ flexShrink: 0 }} />
            <div>
              <strong>Conversion directe Ariary ➔ RMB :</strong> Vous payez <strong>{montantPayerAr.toLocaleString('fr-FR')} Ar</strong> depuis <em>{compteChoisi}</em>, converti automatiquement en <strong>{montantPayerRmb.toFixed(2)} ¥</strong> au taux de <strong>{tauxPaiement} Ar/¥</strong>.
            </div>
          </div>
        )}

        {isRmbInsuffisant && (
          <div
            style={{
              background: '#FFF5F5',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#991B1B',
            }}
          >
            Solde RMB insuffisant sur la Réserve ({soldeRmbInfo?.soldeRmbDispo || 0} ¥ dispo, besoin de {montantPayerRmb.toFixed(2)} ¥).
            <div style={{ marginTop: 4 }}>
              👉 <strong>Astuce :</strong> Sélectionnez votre compte <strong>MVola, Caisse ou Banque</strong> pour payer directement en Ariary avec conversion automatique.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <button type="button" onClick={() => setPaiementCommande(null)} style={ghostBtn as any}>
            Annuler
          </button>
          <button
            type="button"
            onClick={validerPaiement}
            disabled={isRmbInsuffisant || montantPayerAr <= 0}
            style={{
              ...primaryBtn,
              padding: '0 18px',
              opacity: (isRmbInsuffisant || montantPayerAr <= 0) ? 0.5 : 1,
              cursor: (isRmbInsuffisant || montantPayerAr <= 0) ? 'not-allowed' : 'pointer',
              background: isRmbInsuffisant ? '#DC2626' : '#2C5E43',
            }}
          >
            Valider le paiement ({montantPayerAr.toLocaleString('fr-FR')} Ar)
          </button>
        </div>
      </div>
    </Modal>
  );
}
