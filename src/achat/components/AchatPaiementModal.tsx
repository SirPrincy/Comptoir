import React, { useState, useEffect, useMemo } from 'react';
import { Coins, CheckCircle2, ArrowRightLeft, CreditCard, Truck, ShoppingCart, Package } from 'lucide-react';
import { Field, Modal, inputStyle, selectStyle, primaryBtn, ghostBtn, safeDateIso } from '../../ui';
import { COMPTES_FINANCIERS, uid } from '../../constants';
import {
  getMontantPayeMarchandise,
  getRestePayeMarchandise,
  getMontantPayeFret,
  getRestePayeFret,
  getStatutMarchandiseLabel,
  getStatutFretLabel,
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
  initialCible,
}: any) {
  const safeProducts = products;
  const safeCommandes = commandes;
  const activeComptes = comptes && comptes.length > 0 ? comptes : COMPTES_FINANCIERS;

  const [compteChoisi, setCompteChoisi] = useState<string>('MVola');
  const [ciblePaiement, setCiblePaiement] = useState<'marchandise' | 'fret' | 'tout'>('marchandise');

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
      const resteMarchandise = getRestePayeMarchandise(c, paiements);
      const resteFret = getRestePayeFret(c, paiements);

      let target: 'marchandise' | 'fret' | 'tout' = 'marchandise';
      if (initialCible === 'fret' || c.targetCible === 'fret') {
        target = 'fret';
      } else if (initialCible === 'marchandise' || c.targetCible === 'marchandise') {
        target = 'marchandise';
      } else if (initialCible === 'tout' || c.targetCible === 'tout') {
        target = 'tout';
      } else if (resteMarchandise <= 0 && resteFret > 0) {
        target = 'fret';
      } else {
        target = 'marchandise';
      }

      setCiblePaiement(target);

      const defaultCompte = target === 'fret'
        ? (c.compteFret || (activeComptes.includes('MVola') ? 'MVola' : activeComptes[0] || 'Caisse / Espèces'))
        : (c.comptePayeur || (activeComptes.includes('MVola') ? 'MVola' : activeComptes[0] || 'Caisse / Espèces'));
      setCompteChoisi(defaultCompte);
      setTypePaiement('total');
      setMontantSaisiPaiement('');
    }
  }, [paiementCommande, activeComptes, initialCible]);

  if (!paiementCommande) return null;

  const c = paiementCommande;
  const p = safeProducts.find((pr: any) => pr.id === c.productId);
  const fourn = fournisseurs.find((f: any) => f.id === c.fournisseurId);
  const transitaire = fournisseurs.find((f: any) => f.id === c.transitaireId);

  // Calculs Marchandise
  const totalMarchandise = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
  const payeMarchandise = getMontantPayeMarchandise(c, paiements);
  const resteMarchandise = getRestePayeMarchandise(c, paiements);

  // Calculs Fret
  const totalFret = Number(c.fraisTransport) || 0;
  const payeFret = getMontantPayeFret(c, paiements);
  const resteFret = getRestePayeFret(c, paiements);

  // Déterminer le reste dû et le montant total selon la cible active
  let totalActif = totalMarchandise;
  let dejaPayeActif = payeMarchandise;
  let resteDuActif = resteMarchandise;

  if (ciblePaiement === 'fret') {
    totalActif = totalFret;
    dejaPayeActif = payeFret;
    resteDuActif = resteFret;
  } else if (ciblePaiement === 'tout') {
    totalActif = totalMarchandise + totalFret;
    dejaPayeActif = payeMarchandise + payeFret;
    resteDuActif = resteMarchandise + resteFret;
  }

  const isAchatRmb = (ciblePaiement === 'marchandise' || ciblePaiement === 'tout') && (c.deviseOrigine === 'RMB' || Number(c.puDevise) > 0);
  const tauxPaiement = c.tauxRmb || devises?.rmb || 680;

  const montantPayerAr = typePaiement === 'total' ? resteDuActif : (Number(montantSaisiPaiement) || 0);
  const montantPayerRmb = (isAchatRmb && ciblePaiement === 'marchandise') ? (montantPayerAr / tauxPaiement) : 0;
  const resteDuRmb = (isAchatRmb && ciblePaiement === 'marchandise') ? (resteMarchandise / tauxPaiement) : 0;

  const isCompteRmb = compteChoisi === 'Réserve RMB (¥)';
  const isRmbInsuffisant = isCompteRmb && isAchatRmb && ciblePaiement === 'marchandise' && (montantPayerRmb > (soldeRmbInfo?.soldeRmbDispo || 0) + 0.05);

  const validerPaiement = () => {
    if (!c || !datePaiementChoisie || montantPayerAr <= 0) return;
    if (isRmbInsuffisant) return;

    const iso = safeDateIso(datePaiementChoisie);
    const montantAjouteAr = montantPayerAr;

    const nouveauxPaiements: any[] = [];
    const nouveauxMouvements: any[] = [];

    let updatedCommandes = [...safeCommandes];

    if (ciblePaiement === 'fret') {
      // 1. Paiement du Fret Transitaire uniquement
      const nouveauPayeFret = typePaiement === 'acompte'
        ? Math.min(totalFret, payeFret + montantAjouteAr)
        : totalFret;
      const estEntierementPayeFret = nouveauPayeFret >= totalFret;

      const pmtFret = {
        id: uid(),
        date: iso,
        nature: 'fret',
        compte: compteChoisi,
        montantTotal: montantAjouteAr,
        beneficiaire: transitaire?.nom || 'Transitaire / Fret',
        description: `Règlement Fret — ${p ? p.nom : 'Article'} (${transitaire?.nom || c.modeExpedition || 'Fret'})`,
        reference: c.tracking || '',
        lignes: [
          {
            cibleType: 'fret',
            cibleId: c.id,
            montantAlloue: montantAjouteAr,
          },
        ],
      };
      nouveauxPaiements.push(pmtFret);

      const mvtFret = {
        id: uid(),
        type: 'sortie',
        categorie: 'fret',
        montant: montantAjouteAr,
        compte: compteChoisi,
        tag: '#fret-logistique',
        reference: c.tracking || (transitaire ? transitaire.nom : ''),
        description: `Règlement Fret — ${p ? p.nom : 'Article'} (${transitaire?.nom || 'Transitaire'})`,
        date: iso,
        paiementId: pmtFret.id,
        commandeId: c.id,
      };
      nouveauxMouvements.push(mvtFret);

      updatedCommandes = safeCommandes.map((cmd: any) => cmd.id === c.id ? {
        ...cmd,
        compteFret: compteChoisi,
        montantPayeFret: nouveauPayeFret,
        statutPaiementFret: estEntierementPayeFret ? 'Payé' : 'Partiel',
        datePaiementFret: iso,
      } : cmd);

    } else if (ciblePaiement === 'tout') {
      // 2. Paiement global : Marchandise + Fret
      const pmtTout = {
        id: uid(),
        date: iso,
        nature: 'marchandise',
        compte: compteChoisi,
        montantTotal: resteMarchandise + resteFret,
        beneficiaire: fourn?.nom || c.source || 'Fournisseur & Transitaire',
        description: `Règlement Total (Marchandise + Fret) — ${p ? p.nom : 'Article'}`,
        reference: c.tracking || c.source || '',
        lignes: [
          ...(resteMarchandise > 0 ? [{
            cibleType: 'marchandise',
            cibleId: c.id,
            montantAlloue: resteMarchandise,
          }] : []),
          ...(resteFret > 0 ? [{
            cibleType: 'fret',
            cibleId: c.id,
            montantAlloue: resteFret,
          }] : []),
        ],
      };
      nouveauxPaiements.push(pmtTout);

      if (resteMarchandise > 0) {
        nouveauxMouvements.push({
          id: uid(),
          type: 'sortie',
          categorie: 'achat',
          montant: resteMarchandise,
          compte: compteChoisi,
          tag: '#stock-chine',
          reference: c.source || '',
          description: `Règlement Marchandise — ${p ? p.nom : 'Article'}`,
          date: iso,
          paiementId: pmtTout.id,
          commandeId: c.id,
        });
      }

      if (resteFret > 0) {
        nouveauxMouvements.push({
          id: uid(),
          type: 'sortie',
          categorie: 'fret',
          montant: resteFret,
          compte: compteChoisi,
          tag: '#fret-logistique',
          reference: c.tracking || (transitaire ? transitaire.nom : ''),
          description: `Règlement Fret — ${p ? p.nom : 'Article'} (${transitaire?.nom || 'Transitaire'})`,
          date: iso,
          paiementId: pmtTout.id,
          commandeId: c.id,
        });
      }

      const isMgaDirect = !isCompteRmb;
      updatedCommandes = safeCommandes.map((cmd: any) => cmd.id === c.id ? {
        ...cmd,
        comptePayeur: compteChoisi,
        compteFret: compteChoisi,
        payeEnMgaDirect: isMgaDirect || cmd.payeEnMgaDirect,
        modeReglement: isMgaDirect ? 'mga_direct' : 'reserve_rmb',
        montantPayeMarchandise: totalMarchandise,
        statutPaiementMarchandise: 'Payé',
        datePaiementMarchandise: iso,
        datePaiement: iso,
        montantPayeFret: totalFret,
        statutPaiementFret: totalFret > 0 ? 'Payé' : cmd.statutPaiementFret,
        datePaiementFret: totalFret > 0 ? iso : cmd.datePaiementFret,
        statut: cmd.statut === 'Commandé' ? 'En livraison' : cmd.statut,
        dateEnLivraison: cmd.statut === 'Commandé' ? (cmd.dateEnLivraison || iso) : cmd.dateEnLivraison,
      } : cmd);

    } else {
      // 3. Paiement Marchandise Chine uniquement
      const nouveauPaye = typePaiement === 'acompte'
        ? Math.min(totalMarchandise, payeMarchandise + montantAjouteAr)
        : totalMarchandise;
      const estEntierementPaye = nouveauPaye >= totalMarchandise;

      const pmtMarchandise = {
        id: uid(),
        date: iso,
        nature: 'marchandise',
        compte: compteChoisi,
        montantTotal: montantAjouteAr,
        beneficiaire: c.source || fourn?.nom || 'Fournisseur Chine',
        description: `Règlement Marchandise — ${p ? p.nom : 'Article'} (x${c.qty || 1})${isAchatRmb ? ` [≈ ${montantPayerRmb.toFixed(2)} ¥ @ ${tauxPaiement} Ar/¥]` : ''}`,
        reference: c.source || '',
        lignes: [
          {
            cibleType: 'marchandise',
            cibleId: c.id,
            montantAlloue: montantAjouteAr,
          },
        ],
      };
      nouveauxPaiements.push(pmtMarchandise);

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
      nouveauxMouvements.push(mvtMarchandise);

      const isMgaDirect = !isCompteRmb;
      updatedCommandes = safeCommandes.map((cmd: any) => cmd.id === c.id ? {
        ...cmd,
        comptePayeur: compteChoisi,
        payeEnMgaDirect: isMgaDirect || cmd.payeEnMgaDirect,
        modeReglement: isMgaDirect ? 'mga_direct' : 'reserve_rmb',
        montantPayeMarchandise: nouveauPaye,
        statutPaiementMarchandise: estEntierementPaye ? 'Payé' : 'Partiel',
        datePaiementMarchandise: iso,
        datePaiement: estEntierementPaye ? iso : cmd.datePaiement,
        statut: estEntierementPaye && cmd.statut === 'Commandé' ? 'En livraison' : cmd.statut,
        dateEnLivraison: estEntierementPaye && cmd.statut === 'Commandé' ? (cmd.dateEnLivraison || iso) : cmd.dateEnLivraison,
      } : cmd);
    }

    if (typeof updateData === 'function') {
      updateData({
        paiements: [...paiements, ...nouveauxPaiements],
        mouvements: [...nouveauxMouvements, ...mouvements],
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

        {/* Sélecteur de Cible de Règlement si la commande a Fret et/ou Marchandise */}
        {totalFret > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#5E584E' }}>
              Que souhaitez-vous régler ?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: resteMarchandise > 0 && resteFret > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 6 }}>
              {/* Option Marchandise */}
              <button
                type="button"
                onClick={() => {
                  setCiblePaiement('marchandise');
                  setTypePaiement('total');
                  setMontantSaisiPaiement(String(resteMarchandise));
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: `1.5px solid ${ciblePaiement === 'marchandise' ? '#2C5E43' : '#EAE2D4'}`,
                  background: ciblePaiement === 'marchandise' ? '#EBF4EC' : '#FFFFFF',
                  color: ciblePaiement === 'marchandise' ? '#1B6A3E' : '#5E584E',
                  fontWeight: ciblePaiement === 'marchandise' ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'center',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShoppingCart size={13} /> Marchandise Chine
                </span>
                <span style={{ fontSize: 10.5, color: resteMarchandise > 0 ? '#B5532A' : '#1B6A3E', fontWeight: 600 }}>
                  {resteMarchandise > 0 ? `Reste : ${resteMarchandise.toLocaleString('fr-FR')} Ar` : '✅ Réglée'}
                </span>
              </button>

              {/* Option Fret Transitaire */}
              <button
                type="button"
                onClick={() => {
                  setCiblePaiement('fret');
                  setTypePaiement('total');
                  setMontantSaisiPaiement(String(resteFret));
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: `1.5px solid ${ciblePaiement === 'fret' ? '#3D5A6C' : '#EAE2D4'}`,
                  background: ciblePaiement === 'fret' ? '#EAEBF5' : '#FFFFFF',
                  color: ciblePaiement === 'fret' ? '#384282' : '#5E584E',
                  fontWeight: ciblePaiement === 'fret' ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'center',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Truck size={13} /> Fret Transitaire
                </span>
                <span style={{ fontSize: 10.5, color: resteFret > 0 ? '#B5532A' : '#1B6A3E', fontWeight: 600 }}>
                  {resteFret > 0 ? `Reste : ${resteFret.toLocaleString('fr-FR')} Ar` : '✅ Réglé'}
                </span>
              </button>

              {/* Option Tout Solder (si les 2 ont un solde) */}
              {resteMarchandise > 0 && resteFret > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCiblePaiement('tout');
                    setTypePaiement('total');
                    setMontantSaisiPaiement(String(resteMarchandise + resteFret));
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: `1.5px solid ${ciblePaiement === 'tout' ? '#8A5D3B' : '#EAE2D4'}`,
                    background: ciblePaiement === 'tout' ? '#FDF5E6' : '#FFFFFF',
                    color: ciblePaiement === 'tout' ? '#8A5D3B' : '#5E584E',
                    fontWeight: ciblePaiement === 'tout' ? 700 : 500,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Package size={13} /> Tout Solder
                  </span>
                  <span style={{ fontSize: 10.5, color: '#B5532A', fontWeight: 700 }}>
                    {(resteMarchandise + resteFret).toLocaleString('fr-FR')} Ar
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Récapitulatif montants & conversion */}
        <div style={{ background: '#FAF7F2', padding: '12px 14px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
            <span style={{ color: '#5E584E' }}>
              {ciblePaiement === 'fret' ? 'Total Fret Transitaire :' : (ciblePaiement === 'tout' ? 'Total Global (Marchandise + Fret) :' : 'Total Marchandise Chine :')}
            </span>
            <strong style={{ color: '#26333D' }}>
              {totalActif.toLocaleString('fr-FR')} Ar
              {isAchatRmb && ciblePaiement === 'marchandise' && (
                <span style={{ color: '#736B5E', fontWeight: 500, fontSize: 12, marginLeft: 6 }}>
                  (≈ {(totalMarchandise / tauxPaiement).toFixed(2)} ¥)
                </span>
              )}
            </strong>
          </div>

          {dejaPayeActif > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5 }}>
              <span style={{ color: '#5E584E' }}>Déjà versé :</span>
              <span style={{ color: '#1B6A3E', fontWeight: 600 }}>{dejaPayeActif.toLocaleString('fr-FR')} Ar</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed #D8D0C0', fontSize: 14 }}>
            <span style={{ fontWeight: 700, color: resteDuActif > 0 ? '#B5532A' : '#1B6A3E' }}>Solde restant dû :</span>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ color: resteDuActif > 0 ? '#B5532A' : '#1B6A3E', fontSize: 16 }}>{resteDuActif.toLocaleString('fr-FR')} Ar</strong>
              {isAchatRmb && ciblePaiement === 'marchandise' && resteDuActif > 0 && (
                <div style={{ fontSize: 12, color: '#B5532A', fontWeight: 600 }}>
                  ≈ {resteDuRmb.toFixed(2)} ¥ (Taux : {tauxPaiement} Ar/¥)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails complémentaires si Fret */}
        {ciblePaiement === 'fret' && transitaire && (
          <div style={{ fontSize: 12, color: '#5E584E', background: '#F4F7F5', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1E5D9' }}>
            🚛 <strong>Transitaire :</strong> {transitaire.nom} {c.modeExpedition ? `· Mode : ${c.modeExpedition}` : ''} {c.tracking ? `· Tracking : ${c.tracking}` : ''}
          </div>
        )}

        {/* Choix type de versement */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setTypePaiement('total');
              setMontantSaisiPaiement(String(resteDuActif));
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
            <span>Régler tout le solde ({resteDuActif.toLocaleString('fr-FR')} Ar)</span>
          </button>
          {ciblePaiement !== 'tout' && (
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
          )}
        </div>

        {typePaiement === 'acompte' && ciblePaiement !== 'tout' && (
          <Field label="Montant du versement (Ar)">
            <input
              type="number"
              min={1}
              max={resteDuActif}
              placeholder={`ex: ${Math.round(resteDuActif / 2)}`}
              style={inputStyle as any}
              value={montantSaisiPaiement}
              onChange={e => setMontantSaisiPaiement(e.target.value)}
            />
            {isAchatRmb && ciblePaiement === 'marchandise' && Number(montantSaisiPaiement) > 0 && (
              <div style={{ fontSize: 11.5, color: '#0369A1', marginTop: 4, fontWeight: 600 }}>
                🔄 Équivalent fournisseur : {((Number(montantSaisiPaiement) || 0) / tauxPaiement).toFixed(2)} ¥
              </div>
            )}
            <div style={{ fontSize: 11, color: '#736B5E', marginTop: 2 }}>
              Nouveau reste dû : {Math.max(0, resteDuActif - (Number(montantSaisiPaiement) || 0)).toLocaleString('fr-FR')} Ar
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
          typeOperation="debit"
          activeComptes={activeComptes}
          deviseOrigine={ciblePaiement === 'fret' ? 'Ar' : c.deviseOrigine}
          tauxRmb={tauxPaiement}
        />

        {/* Encadré de conversion directe automatique */}
        {isAchatRmb && !isCompteRmb && ciblePaiement === 'marchandise' && (
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
              background: isRmbInsuffisant ? '#DC2626' : (ciblePaiement === 'fret' ? '#3D5A6C' : '#2C5E43'),
            }}
          >
            Valider le règlement ({montantPayerAr.toLocaleString('fr-FR')} Ar)
          </button>
        </div>
      </div>
    </Modal>
  );
}
