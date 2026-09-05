import React, { useState, useEffect, useMemo } from 'react';
import { Coins, CheckCircle2, ArrowRightLeft, CreditCard, ShoppingCart, Truck, AlertCircle } from 'lucide-react';
import { Field, Modal, inputStyle, selectStyle, primaryBtn, ghostBtn, safeDateIso } from '../../ui';
import { COMPTES_FINANCIERS, uid } from '../../constants';
import {
  getMontantPayeMarchandise,
  getRestePayeMarchandise,
  getMontantPayeFret,
  getRestePayeFret,
} from '../../paymentUtils';
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

  // Initialisation lors de l'ouverture de la modale
  useEffect(() => {
    if (paiementCommande) {
      const c = paiementCommande;
      const defaultCompte = c.comptePayeur || (activeComptes.includes('MVola') ? 'MVola' : activeComptes[0] || 'Caisse / Espèces');
      setCompteChoisi(defaultCompte);
      setTypePaiement('total');
      setMontantSaisiPaiement('');
    }
  }, [paiementCommande, activeComptes]);

  if (!paiementCommande) return null;

  const c = paiementCommande;
  const p = safeProducts.find((pr: any) => pr.id === c.productId);
  const fourn = fournisseurs.find((f: any) => f.id === c.fournisseurId);
  const transitaire = fournisseurs.find((f: any) => f.id === c.transitaireId);

  // Calculs Marchandise Chine
  const totalMarchandise = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
  const payeMarchandise = getMontantPayeMarchandise(c, paiements);
  const resteMarchandise = getRestePayeMarchandise(c, paiements);

  // Calculs Fret Transitaire (informatif)
  const totalFret = Number(c.fraisTransport) || 0;
  const resteFret = getRestePayeFret(c, paiements);

  const isAchatRmb = c.deviseOrigine === 'RMB' || Number(c.puDevise) > 0;
  const tauxPaiement = c.tauxRmb || devises?.rmb || 680;
  const totalRmbCommande = isAchatRmb
    ? ((Number(c.puDevise || 0) * Number(c.qty || 1)) + Number(c.fraisLivraisonChineDevise || 0))
    : 0;
  const payeRmbPrecedent = isAchatRmb && totalMarchandise > 0
    ? (payeMarchandise / totalMarchandise) * totalRmbCommande
    : 0;
  const resteDuRmb = isAchatRmb ? Math.max(0, totalRmbCommande - payeRmbPrecedent) : 0;

  const montantPayerAr = typePaiement === 'total' ? resteMarchandise : (Number(montantSaisiPaiement) || 0);
  const montantPayerRmb = isAchatRmb
    ? (typePaiement === 'total'
        ? resteDuRmb
        : Math.round(((montantPayerAr / (totalMarchandise || 1)) * totalRmbCommande) * 100) / 100)
    : 0;

  const isCompteRmb = compteChoisi === 'Réserve RMB (¥)';
  const isRmbInsuffisant = isCompteRmb && isAchatRmb && (montantPayerRmb > (soldeRmbInfo?.soldeRmbDispo || 0) + 0.05);

  const validerPaiement = () => {
    if (!c || !datePaiementChoisie || montantPayerAr <= 0) return;
    if (isRmbInsuffisant) return;

    const iso = safeDateIso(datePaiementChoisie);
    const montantAjouteAr = montantPayerAr;

    const nouveauPaye = typePaiement === 'acompte'
      ? Math.min(totalMarchandise, payeMarchandise + montantAjouteAr)
      : totalMarchandise;
    const estEntierementPaye = nouveauPaye >= totalMarchandise;

    const pmtMarchandise = {
      id: uid(),
      date: iso,
      nature: 'marchandise' as const,
      compte: compteChoisi,
      montantTotal: montantAjouteAr,
      montantDevise: isAchatRmb ? montantPayerRmb : undefined,
      devise: isAchatRmb ? 'RMB' : undefined,
      tauxChange: isAchatRmb ? tauxPaiement : undefined,
      beneficiaire: c.source || fourn?.nom || 'Fournisseur Chine',
      description: `Règlement Achat — ${p ? p.nom : 'Article'} (x${c.qty || 1})${isAchatRmb ? ` [${montantPayerRmb.toFixed(2)} ¥ @ ${tauxPaiement} Ar/¥]` : ''}`,
      reference: c.source || '',
      lignes: [
        {
          cibleType: 'marchandise' as const,
          cibleId: c.id,
          montantAlloue: montantAjouteAr,
          montantAlloueDevise: isAchatRmb ? montantPayerRmb : undefined,
        },
      ],
    };

    const mvtMarchandise = {
      id: uid(),
      type: 'sortie',
      categorie: 'achat',
      montant: montantAjouteAr,
      compte: compteChoisi,
      tag: '#stock-chine',
      reference: c.source || '',
      description: `Achat Chine — ${p ? p.nom : 'Article'} ×${c.qty || 1}`,
      date: iso,
      paiementId: pmtMarchandise.id,
      commandeId: c.id,
    };

    const isMgaDirect = !isCompteRmb;
    const updatedCommandes = safeCommandes.map((cmd: any) => cmd.id === c.id ? {
      ...cmd,
      comptePayeur: compteChoisi,
      payeEnMgaDirect: isMgaDirect,
      modeReglement: isMgaDirect ? 'mga_direct' : 'reserve_rmb',
      montantPayeMarchandise: nouveauPaye,
      statutPaiementMarchandise: estEntierementPaye ? 'Payé' : 'Partiel',
      datePaiementMarchandise: iso,
      datePaiement: estEntierementPaye ? iso : cmd.datePaiement,
      statut: estEntierementPaye && cmd.statut === 'Commandé' ? 'En livraison' : cmd.statut,
      dateEnLivraison: estEntierementPaye && cmd.statut === 'Commandé' ? (cmd.dateEnLivraison || iso) : cmd.dateEnLivraison,
    } : cmd);

    if (typeof updateData === 'function') {
      updateData({
        paiements: [...paiements, pmtMarchandise],
        mouvements: [mvtMarchandise, ...mouvements],
        commandes: updatedCommandes,
      });
    } else {
      updateAll(safeProducts, ventes, updatedCommandes);
    }

    setPaiementCommande(null);
  };

  return (
    <Modal title={`Règlement Achat Fournisseur : ${p ? p.nom : 'Article'}`} onClose={() => setPaiementCommande(null)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Récapitulatif montant marchandise */}
        <div style={{ background: '#FAF7F2', padding: '12px 14px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
            <span style={{ color: '#5E584E' }}>Total Achat Chine :</span>
            <strong style={{ color: '#26333D' }}>
              {totalMarchandise.toLocaleString('fr-FR')} Ar
              {isAchatRmb && (
                <span style={{ color: '#736B5E', fontWeight: 500, fontSize: 12, marginLeft: 6 }}>
                  (≈ {(totalMarchandise / tauxPaiement).toFixed(2)} ¥)
                </span>
              )}
            </strong>
          </div>

          {payeMarchandise > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5 }}>
              <span style={{ color: '#5E584E' }}>Déjà réglé :</span>
              <span style={{ color: '#1B6A3E', fontWeight: 600 }}>{payeMarchandise.toLocaleString('fr-FR')} Ar</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed #D8D0C0', fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: resteMarchandise > 0 ? '#B5532A' : '#1B6A3E' }}>Solde restant dû :</span>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ color: resteMarchandise > 0 ? '#B5532A' : '#1B6A3E', fontSize: 16 }}>{resteMarchandise.toLocaleString('fr-FR')} Ar</strong>
              {isAchatRmb && resteMarchandise > 0 && (
                <div style={{ fontSize: 12, color: '#B5532A', fontWeight: 600 }}>
                  ≈ {resteDuRmb.toFixed(2)} ¥ (Taux : {tauxPaiement} Ar/¥)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Note informative pour le Fret */}
        {totalFret > 0 && (
          <div style={{
            fontSize: 11.5,
            color: '#3D5A6C',
            background: '#F0F4F8',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #D1E0EB',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Truck size={14} color="#3D5A6C" />
            <span>
              <strong>Fret Transitaire ({Number(c.fraisTransport).toLocaleString('fr-FR')} Ar) :</strong> Les factures de fret se règlent exclusivement dans l'onglet <strong>Trésorerie ➔ Dettes & Factures Fret</strong>.
            </span>
          </div>
        )}

        {/* Choix type de versement */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setTypePaiement('total');
              setMontantSaisiPaiement(String(resteMarchandise));
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
            <span>Régler tout le solde ({resteMarchandise.toLocaleString('fr-FR')} Ar)</span>
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
              max={resteMarchandise}
              placeholder={`ex: ${Math.round(resteMarchandise / 2)}`}
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
              Nouveau reste dû : {Math.max(0, resteMarchandise - (Number(montantSaisiPaiement) || 0)).toLocaleString('fr-FR')} Ar
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
              {activeComptes.map((acc: string) => {
                const isRmbOpt = acc === 'Réserve RMB (¥)' || acc.toLowerCase().includes('rmb');
                const s = isRmbOpt
                  ? (soldeRmbInfo?.soldeRmbDispo || 0)
                  : (soldesParCompte[acc] || 0);
                const sLabel = isRmbOpt ? `${s.toFixed(2)} ¥` : `${s.toLocaleString('fr-FR')} Ar`;
                return (
                  <option key={acc} value={acc}>
                    {acc} (Solde : {sLabel})
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
          montantDevise={isAchatRmb && isCompteRmb ? montantPayerRmb : undefined}
          typeOperation="debit"
          activeComptes={activeComptes}
          deviseOrigine={c.deviseOrigine}
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
            Valider le règlement ({montantPayerAr.toLocaleString('fr-FR')} Ar)
          </button>
        </div>
      </div>
    </Modal>
  );
}
