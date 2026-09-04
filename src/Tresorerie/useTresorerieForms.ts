import { useState, useMemo } from 'react';
import { uid } from '../constants';
import { safeDateIso } from '../ui';
import {
  getMontantPayeMarchandise,
  getRestePayeMarchandise,
  getMontantPayeFret,
  getRestePayeFret,
  getMontantPayeVente,
  getRestePayeVente,
  repartirPaiement,
  ItemPayable,
} from '../paymentUtils';

interface UseTresorerieFormsProps {
  ventes: any[];
  commandes: any[];
  products: any[];
  fournisseurs: any[];
  clients: any[];
  mouvements: any[];
  paiements: any[];
  updateData: (patch: any) => void;
  today: string;
}

export function useTresorerieForms({
  ventes,
  commandes,
  products,
  fournisseurs,
  clients,
  mouvements,
  paiements,
  updateData,
  today,
}: UseTresorerieFormsProps) {
  const [showForm, setShowForm] = useState(false);
  const [showTransfertModal, setShowTransfertModal] = useState(false);
  const [showPaiementFactureModal, setShowPaiementFactureModal] = useState(false);

  // Formulaire Mouvement Manuel
  const [form, setForm] = useState({
    type: 'investissement',
    montant: '',
    frais: '',
    compte: 'MVola',
    tag: '#investissement',
    reference: '',
    description: '',
    date: today,
  });

  // Formulaire Transfert Inter-Comptes
  const [transfertForm, setTransfertForm] = useState({
    source: 'Caisse / Espèces',
    destination: 'MVola',
    montant: '',
    description: 'Transfert de fonds',
    date: today,
  });

  // Formulaire Régler / Encaisser une Facture
  const [factureForm, setFactureForm] = useState({
    nature: 'vente',
    selectedIds: [] as string[],
    selectedId: '',
    compte: 'Caisse / Espèces',
    montant: '',
    frais: '',
    beneficiaire: '',
    description: '',
    reference: '',
    date: today,
  });

  const ventesUnpaid = useMemo(() => {
    return ventes.filter((v: any) => getRestePayeVente(v, paiements) > 0);
  }, [ventes, paiements]);

  const commandesUnpaidMarchandise = useMemo(() => {
    return commandes.filter((c: any) => getRestePayeMarchandise(c, paiements) > 0);
  }, [commandes, paiements]);

  const commandesUnpaidFret = useMemo(() => {
    return commandes.filter((c: any) => getRestePayeFret(c, paiements) > 0);
  }, [commandes, paiements]);

  const autoFillFacture = (nature: string, targetIds: string | string[], listOverride?: any[]) => {
    const ids = Array.isArray(targetIds) ? targetIds : (targetIds ? [targetIds] : []);
    const list = listOverride || (
      nature === 'vente' ? ventesUnpaid : (nature === 'marchandise' ? commandesUnpaidMarchandise : commandesUnpaidFret)
    );

    const selectedItems = list.filter((item: any) => ids.includes(item.id));
    if (selectedItems.length === 0) {
      setFactureForm(prev => ({
        ...prev,
        nature,
        selectedIds: [],
        selectedId: '',
        montant: '',
        frais: '',
        beneficiaire: '',
        description: '',
        reference: '',
      }));
      return;
    }

    let totalReste = 0;
    const benefSet = new Set<string>();

    selectedItems.forEach((item: any) => {
      if (nature === 'vente') {
        totalReste += getRestePayeVente(item, paiements);
        const cl = clients.find((c: any) => c.id === item.clientId);
        if (cl?.nom) benefSet.add(cl.nom);
        else if (item.description) benefSet.add(item.description);
      } else if (nature === 'marchandise') {
        totalReste += getRestePayeMarchandise(item, paiements);
        const four = fournisseurs.find((f: any) => f.id === item.fournisseurId);
        if (four?.nom) benefSet.add(four.nom);
        else if (item.source) benefSet.add(item.source);
      } else {
        totalReste += getRestePayeFret(item, paiements);
        const trans = fournisseurs.find((f: any) => f.id === item.transitaireId);
        if (trans?.nom) benefSet.add(trans.nom);
      }
    });

    const benefArray = Array.from(benefSet);
    const benefStr = benefArray.length > 0 ? benefArray.join(', ') : (nature === 'vente' ? 'Client' : 'Fournisseur');

    let defaultCompte = 'Caisse / Espèces';
    if (nature === 'vente') {
      defaultCompte = selectedItems[0]?.modePaiement || 'Caisse / Espèces';
    } else if (nature === 'marchandise') {
      defaultCompte = selectedItems[0]?.comptePayeur || 'MVola';
    } else {
      defaultCompte = selectedItems[0]?.compteFret || 'MVola';
    }

    let desc = '';
    if (selectedItems.length === 1) {
      const item = selectedItems[0];
      const p = products.find((pr: any) => pr.id === item.productId);
      const nomProd = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Article';
      if (nature === 'vente') {
        const deja = getMontantPayeVente(item, paiements);
        desc = deja > 0
          ? `Solde Vente — ${nomProd} (x${item.qty || 1})`
          : `Encaissement Vente — ${nomProd} (x${item.qty || 1})`;
      } else if (nature === 'marchandise') {
        const deja = getMontantPayeMarchandise(item, paiements);
        desc = deja > 0
          ? `Solde Achat Marchandise — ${nomProd} (x${item.qty || 1})`
          : `Règlement Achat Marchandise — ${nomProd} (x${item.qty || 1})`;
      } else {
        const deja = getMontantPayeFret(item, paiements);
        desc = deja > 0
          ? `Solde Fret — ${nomProd}`
          : `Règlement Fret — ${nomProd}`;
      }
    } else {
      const labelNature = nature === 'vente' ? 'Ventes' : (nature === 'marchandise' ? 'Achats Chine' : 'Frais de Fret');
      desc = `Règlement groupé ${labelNature} (${selectedItems.length} factures)`;
    }

    setFactureForm({
      nature,
      selectedIds: ids,
      selectedId: ids[0] || '',
      compte: defaultCompte,
      montant: totalReste > 0 ? String(totalReste) : '',
      frais: '',
      beneficiaire: benefStr,
      description: desc,
      reference: selectedItems[0]?.reference || selectedItems[0]?.tracking || '',
      date: today,
    });
  };

  const ouvrirModalRèglementFacture = () => {
    let defaultNature = 'vente';
    if (ventesUnpaid.length > 0) {
      defaultNature = 'vente';
    } else if (commandesUnpaidMarchandise.length > 0) {
      defaultNature = 'marchandise';
    } else if (commandesUnpaidFret.length > 0) {
      defaultNature = 'fret';
    }

    const list = defaultNature === 'vente'
      ? ventesUnpaid
      : (defaultNature === 'marchandise' ? commandesUnpaidMarchandise : commandesUnpaidFret);

    const initialIds = list.map((item: any) => item.id);
    autoFillFacture(defaultNature, initialIds, list);
    setShowPaiementFactureModal(true);
  };

  const handleNatureChange = (newNature: string) => {
    const list = newNature === 'vente' ? ventesUnpaid : (newNature === 'marchandise' ? commandesUnpaidMarchandise : commandesUnpaidFret);
    const initialIds = list.map((item: any) => item.id);
    autoFillFacture(newNature, initialIds, list);
  };

  const handleToggleSelectId = (targetId: string) => {
    const currentIds: string[] = Array.isArray(factureForm.selectedIds) ? factureForm.selectedIds : [];
    const newIds = currentIds.includes(targetId)
      ? currentIds.filter(id => id !== targetId)
      : [...currentIds, targetId];
    autoFillFacture(factureForm.nature, newIds);
  };

  const handleToggleSelectAll = (selectAll: boolean) => {
    const list = factureForm.nature === 'vente' ? ventesUnpaid : (factureForm.nature === 'marchandise' ? commandesUnpaidMarchandise : commandesUnpaidFret);
    const newIds = selectAll ? list.map((item: any) => item.id) : [];
    autoFillFacture(factureForm.nature, newIds);
  };

  const enregistrerPaiementFacture = () => {
    const montantGlobal = Number(factureForm.montant);
    const selectedIds = Array.isArray(factureForm.selectedIds) ? factureForm.selectedIds : [];
    if (!montantGlobal || montantGlobal <= 0) return;

    const nature = factureForm.nature;
    let listSource: any[] = [];
    if (nature === 'vente') listSource = ventesUnpaid;
    else if (nature === 'marchandise') listSource = commandesUnpaidMarchandise;
    else listSource = commandesUnpaidFret;

    const itemsAEffectuer = listSource.filter((item: any) => selectedIds.includes(item.id));

    const itemsPayables: ItemPayable[] = itemsAEffectuer.map((item: any) => {
      let resteDu = 0;
      if (nature === 'vente') resteDu = getRestePayeVente(item, paiements);
      else if (nature === 'marchandise') resteDu = getRestePayeMarchandise(item, paiements);
      else resteDu = getRestePayeFret(item, paiements);

      return {
        id: item.id,
        date: item.date || item.dateAchat || item.dateCreation,
        resteDu,
        cibleType: nature as any,
      };
    });

    const result = repartirPaiement(montantGlobal, itemsPayables);

    const dateIso = safeDateIso(factureForm.date);

    const fraisNum = Number(factureForm.frais) || 0;

    const nouveauPaiement = {
      id: uid(),
      nature,
      date: dateIso,
      montantTotal: montantGlobal,
      frais: fraisNum > 0 ? fraisNum : undefined,
      compte: factureForm.compte,
      reference: factureForm.reference.trim(),
      description: factureForm.description.trim(),
      beneficiaire: factureForm.beneficiaire.trim(),
      lignes: result.lignes,
    };

    const nextMvs: any[] = [];

    if (nature === 'vente') {
      let descVente = factureForm.description.trim();
      if (!descVente) {
        if (result.lignes.length === 0) {
          descVente = `Acompte libre Vente (Non imputé)`;
        } else if (result.surplus > 0) {
          descVente = `Encaissement Ventes (${result.lignes.length} facture(s)) + Acompte (${result.surplus.toLocaleString('fr-FR')} Ar)`;
        } else {
          descVente = `Encaissement Ventes (${result.lignes.length} facture(s))`;
        }
      }

      const mvt = {
        id: uid(),
        type: 'entrée',
        categorie: 'vente',
        montant: montantGlobal,
        compte: factureForm.compte,
        tag: '#vente',
        reference: factureForm.reference.trim() || factureForm.beneficiaire.trim(),
        description: descVente,
        date: dateIso,
        paiementId: nouveauPaiement.id,
        venteId: result.lignes.length === 1 ? result.lignes[0].cibleId : undefined,
      };
      nextMvs.push(mvt);

      if (fraisNum > 0) {
        const mfrais = {
          id: uid(),
          type: 'sortie',
          categorie: 'frais',
          montant: fraisNum,
          compte: factureForm.compte,
          tag: '#frais-bancaires',
          reference: factureForm.reference.trim() ? `Frais ${factureForm.reference.trim()}` : (factureForm.beneficiaire.trim() ? `Frais ${factureForm.beneficiaire.trim()}` : ''),
          description: `Frais de transaction — ${descVente}`,
          date: dateIso,
          paiementId: nouveauPaiement.id,
        };
        nextMvs.push(mfrais);
      }

      const updatedVentes = ventes.map((v: any) => {
        const ligne = result.lignes.find((l: any) => l.cibleId === v.id);
        if (!ligne) return v;

        const totalVente = Number(v.total) || ((Number(v.pu || 0) * Number(v.qty || 1)) + (Number(v.fraisLivraison) || 0));
        const ancienPaye = getMontantPayeVente(v, paiements);
        const nouveauPaye = ancienPaye + ligne.montantAlloue;
        const isComplete = nouveauPaye >= totalVente;
        const nouveauStatut = isComplete ? 'Payé' : 'Partiel';

        return {
          ...v,
          montantPaye: nouveauPaye,
          statutPaiement: nouveauStatut,
          dateEncaissement: isComplete ? dateIso : v.dateEncaissement,
          modePaiement: factureForm.compte,
        };
      });

      updateData({
        paiements: [...paiements, nouveauPaiement],
        mouvements: [...nextMvs, ...mouvements],
        ventes: updatedVentes,
      });

    } else {
      const isMarchandise = nature === 'marchandise';
      const defaultTag = isMarchandise ? '#stock-chine' : '#fret-logistique';
      const defaultCat = isMarchandise ? 'achat' : 'fret';

      let descAchat = factureForm.description.trim();
      if (!descAchat) {
        if (result.lignes.length === 0) {
          descAchat = `Acompte libre ${isMarchandise ? 'Marchandises' : 'Fret'} (Non imputé)`;
        } else if (result.surplus > 0) {
          descAchat = `Règlement ${isMarchandise ? 'Marchandises' : 'Fret'} (${result.lignes.length} commande(s)) + Acompte (${result.surplus.toLocaleString('fr-FR')} Ar)`;
        } else {
          descAchat = `Règlement ${isMarchandise ? 'Marchandises' : 'Fret'} (${result.lignes.length} commande(s))`;
        }
      }

      const mvt = {
        id: uid(),
        type: 'sortie',
        categorie: defaultCat,
        montant: montantGlobal,
        compte: factureForm.compte,
        tag: defaultTag,
        reference: factureForm.reference.trim() || factureForm.beneficiaire.trim(),
        description: descAchat,
        date: dateIso,
        paiementId: nouveauPaiement.id,
        commandeId: result.lignes.length === 1 ? result.lignes[0].cibleId : undefined,
      };
      nextMvs.push(mvt);

      if (fraisNum > 0) {
        const mfrais = {
          id: uid(),
          type: 'sortie',
          categorie: 'frais',
          montant: fraisNum,
          compte: factureForm.compte,
          tag: '#frais-bancaires',
          reference: factureForm.reference.trim() ? `Frais ${factureForm.reference.trim()}` : (factureForm.beneficiaire.trim() ? `Frais ${factureForm.beneficiaire.trim()}` : ''),
          description: `Frais de transaction — ${descAchat}`,
          date: dateIso,
          paiementId: nouveauPaiement.id,
        };
        nextMvs.push(mfrais);
      }

      const updatedCommandes = commandes.map((c: any) => {
        const ligne = result.lignes.find((l: any) => l.cibleId === c.id);
        if (!ligne) return c;

        if (isMarchandise) {
          const totalAchat = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
          const ancienPaye = getMontantPayeMarchandise(c, paiements);
          const nouveauPaye = ancienPaye + ligne.montantAlloue;
          const isComplete = nouveauPaye >= totalAchat;
          const nouveauStatut = isComplete ? 'Payé' : 'Partiel';

          return {
            ...c,
            payeEnMgaDirect: factureForm.compte !== 'Réserve RMB (¥)' ? true : c.payeEnMgaDirect,
            modeReglement: factureForm.compte !== 'Réserve RMB (¥)' ? 'mga_direct' : 'reserve_rmb',
            montantPayeMarchandise: nouveauPaye,
            statutPaiementMarchandise: nouveauStatut,
            datePaiementMarchandise: isComplete ? dateIso : c.datePaiementMarchandise,
            datePaiement: c.datePaiement || dateIso,
            statut: (c.statut === 'Commandé' && nouveauPaye > 0) ? 'En livraison' : c.statut,
            dateEnLivraison: c.dateEnLivraison || dateIso,
            comptePayeur: factureForm.compte,
          };
        } else {
          const totalFret = Number(c.fraisTransport) || 0;
          const ancienPaye = getMontantPayeFret(c, paiements);
          const nouveauPaye = ancienPaye + ligne.montantAlloue;
          const isComplete = nouveauPaye >= totalFret;
          const nouveauStatut = isComplete ? 'Payé' : 'Partiel';

          return {
            ...c,
            montantPayeFret: nouveauPaye,
            statutPaiementFret: nouveauStatut,
            datePaiementFret: isComplete ? dateIso : c.datePaiementFret,
            compteFret: factureForm.compte,
          };
        }
      });

      updateData({
        paiements: [...paiements, nouveauPaiement],
        mouvements: [...nextMvs, ...mouvements],
        commandes: updatedCommandes,
      });
    }

    setShowPaiementFactureModal(false);
  };

  const imputerPaiementExistant = (paiementId: string, nouvellesAllocations: { cibleId: string; montantAlloue: number }[]) => {
    const targetPaiement = paiements.find((p: any) => p.id === paiementId);
    if (!targetPaiement || !nouvellesAllocations || nouvellesAllocations.length === 0) return;

    const nature = targetPaiement.nature;
    const existingLignes = Array.isArray(targetPaiement.lignes) ? [...targetPaiement.lignes] : [];

    for (const alloc of nouvellesAllocations) {
      if (alloc.montantAlloue <= 0) continue;
      const existingIdx = existingLignes.findIndex((l: any) => l.cibleId === alloc.cibleId && l.cibleType === nature);
      if (existingIdx >= 0) {
        existingLignes[existingIdx] = {
          ...existingLignes[existingIdx],
          montantAlloue: existingLignes[existingIdx].montantAlloue + alloc.montantAlloue,
        };
      } else {
        existingLignes.push({
          cibleType: nature,
          cibleId: alloc.cibleId,
          montantAlloue: alloc.montantAlloue,
        });
      }
    }

    const updatedPaiement = {
      ...targetPaiement,
      lignes: existingLignes,
    };

    const nextPaiements = paiements.map((p: any) => p.id === paiementId ? updatedPaiement : p);

    let updatedVentes = ventes;
    let updatedCommandes = commandes;

    if (nature === 'vente') {
      updatedVentes = ventes.map((v: any) => {
        const alloc = nouvellesAllocations.find(a => a.cibleId === v.id);
        if (!alloc) return v;
        const totalVente = Number(v.total) || ((Number(v.pu || 0) * Number(v.qty || 1)) + (Number(v.fraisLivraison) || 0));
        const ancienPaye = getMontantPayeVente(v, paiements);
        const nouveauPaye = ancienPaye + alloc.montantAlloue;
        const isComplete = nouveauPaye >= totalVente;
        return {
          ...v,
          montantPaye: nouveauPaye,
          statutPaiement: isComplete ? 'Payé' : 'Partiel',
        };
      });
    } else {
      updatedCommandes = commandes.map((c: any) => {
        const alloc = nouvellesAllocations.find(a => a.cibleId === c.id);
        if (!alloc) return c;
        if (nature === 'marchandise') {
          const totalAchat = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
          const ancienPaye = getMontantPayeMarchandise(c, paiements);
          const nouveauPaye = ancienPaye + alloc.montantAlloue;
          const isComplete = nouveauPaye >= totalAchat;
          return {
            ...c,
            montantPayeMarchandise: nouveauPaye,
            statutPaiementMarchandise: isComplete ? 'Payé' : 'Partiel',
          };
        } else {
          const totalFret = Number(c.fraisTransport || 0);
          const ancienPaye = getMontantPayeFret(c, paiements);
          const nouveauPaye = ancienPaye + alloc.montantAlloue;
          const isComplete = nouveauPaye >= totalFret;
          return {
            ...c,
            montantPayeFret: nouveauPaye,
            statutPaiementFret: isComplete ? 'Payé' : 'Partiel',
          };
        }
      });
    }

    updateData({
      paiements: nextPaiements,
      ventes: updatedVentes,
      commandes: updatedCommandes,
    });
  };

  const ajouterMouvement = () => {
    const montantNum = Number(form.montant);
    if (!montantNum || montantNum <= 0 || !form.description.trim()) return;

    const isInvest = form.type === 'investissement' || form.tag === '#investissement' || form.tag === '#capital' || form.natureOp === 'apport_perso';
    const finalType = isInvest ? 'entrée' : form.type;
    const finalTag = isInvest ? (form.tag || '#investissement') : form.tag;

    const m = {
      id: uid(),
      type: finalType,
      isInvestissement: isInvest,
      montant: montantNum,
      compte: form.compte || 'Caisse / Espèces',
      tag: finalTag,
      reference: form.reference.trim(),
      description: form.description.trim(),
      date: safeDateIso(form.date),
    };

    const nextMvs = [m];

    const fraisNum = Number(form.frais);
    if (fraisNum > 0) {
      const mfrais = {
        id: uid(),
        type: 'sortie',
        isInvestissement: false,
        montant: fraisNum,
        compte: form.compte || 'MVola',
        tag: '#frais-bancaires',
        reference: form.reference.trim() ? `Frais ${form.reference.trim()}` : '',
        description: `Frais de transaction : ${form.description.trim()}`,
        date: safeDateIso(form.date),
      };
      nextMvs.push(mfrais);
    }

    updateData({ mouvements: [...nextMvs, ...mouvements] });
    setForm({
      type: 'sortie',
      montant: '',
      frais: '',
      compte: 'MVola',
      tag: '#stock-chine',
      reference: '',
      description: '',
      date: today,
    });
    setShowForm(false);
  };

  const executerTransfert = () => {
    const montantNum = Number(transfertForm.montant);
    if (!montantNum || montantNum <= 0 || transfertForm.source === transfertForm.destination) return;

    const dateIso = safeDateIso(transfertForm.date);
    const refCode = 'TRF-' + Math.random().toString(36).slice(2, 6).toUpperCase();

    const sortie = {
      id: uid(),
      type: 'sortie',
      isTransfert: true,
      montant: montantNum,
      compte: transfertForm.source,
      tag: '#transfert',
      reference: refCode,
      description: `Transfert vers ${transfertForm.destination} (${transfertForm.description})`,
      date: dateIso,
    };

    const entree = {
      id: uid(),
      type: 'entrée',
      isTransfert: true,
      montant: montantNum,
      compte: transfertForm.destination,
      tag: '#transfert',
      reference: refCode,
      description: `Transfert depuis ${transfertForm.source} (${transfertForm.description})`,
      date: dateIso,
    };

    updateData({ mouvements: [entree, sortie, ...mouvements] });
    setTransfertForm({
      source: 'Caisse / Espèces',
      destination: 'MVola',
      montant: '',
      description: 'Transfert de fonds',
      date: today,
    });
    setShowTransfertModal(false);
  };

  return {
    showForm,
    setShowForm,
    showTransfertModal,
    setShowTransfertModal,
    showPaiementFactureModal,
    setShowPaiementFactureModal,
    form,
    setForm,
    transfertForm,
    setTransfertForm,
    factureForm,
    setFactureForm,
    ventesUnpaid,
    commandesUnpaidMarchandise,
    commandesUnpaidFret,
    ouvrirModalRèglementFacture,
    handleNatureChange,
    handleToggleSelectId,
    handleToggleSelectAll,
    enregistrerPaiementFacture,
    imputerPaiementExistant,
    ajouterMouvement,
    executerTransfert,
  };
}
