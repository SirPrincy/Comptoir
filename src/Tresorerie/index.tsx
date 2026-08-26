import React, { useState, useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { primaryBtn } from '../ui';
import { uid, COMPTES_FINANCIERS, TAGS_TRANSACTION } from '../constants';
import {
  getMontantPayeMarchandise,
  getRestePayeMarchandise,
  getMontantPayeFret,
  getRestePayeFret,
  getMontantPayeVente,
  getRestePayeVente,
} from '../paymentUtils';

import TresorerieStats from './TresorerieStats';
import ComptesFinanciers from './ComptesFinanciers';
import ModalPaiementFacture from './ModalPaiementFacture';
import ModalMouvementManuel from './ModalMouvementManuel';
import ModalTransfertComptes from './ModalTransfertComptes';
import JournalTransactions from './JournalTransactions';

interface TresorerieProps {
  ventes: any[];
  commandes: any[];
  products: any[];
  fournisseurs?: any[];
  clients?: any[];
  mouvements: any[];
  changes?: any[];
  devises?: any;
  comptes?: string[];
  updateData: (patch: any) => void;
}

export default function Tresorerie({
  ventes = [],
  commandes = [],
  products = [],
  fournisseurs = [],
  clients = [],
  mouvements = [],
  changes = [],
  devises,
  comptes,
  updateData,
}: TresorerieProps) {
  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;
  const [showForm, setShowForm] = useState(false);
  const [showTransfertModal, setShowTransfertModal] = useState(false);
  const [showPaiementFactureModal, setShowPaiementFactureModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtres
  const [filtreType, setFiltreType] = useState<'all' | 'entrée' | 'sortie' | 'investissement'>('all');
  const [filtreDomaine, setFiltreDomaine] = useState<'all' | 'business' | 'perso'>('all');
  const [filtreCompte, setFiltreCompte] = useState<string>('all');
  const [filtreTag, setFiltreTag] = useState<string>('all');

  const today = new Date().toISOString().slice(0, 10);

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
    return ventes.filter((v: any) => getRestePayeVente(v) > 0);
  }, [ventes]);

  const commandesUnpaidMarchandise = useMemo(() => {
    return commandes.filter((c: any) => getRestePayeMarchandise(c) > 0);
  }, [commandes]);

  const commandesUnpaidFret = useMemo(() => {
    return commandes.filter((c: any) => getRestePayeFret(c) > 0);
  }, [commandes]);

  const ouvrirModalRèglementFacture = () => {
    let defaultNature = 'vente';
    if (ventesUnpaid.length > 0) {
      defaultNature = 'vente';
    } else if (commandesUnpaidMarchandise.length > 0) {
      defaultNature = 'marchandise';
    } else if (commandesUnpaidFret.length > 0) {
      defaultNature = 'fret';
    }

    const list = defaultNature === 'vente' ? ventesUnpaid : (defaultNature === 'marchandise' ? commandesUnpaidMarchandise : commandesUnpaidFret);
    const firstItem = list[0];

    if (firstItem) {
      autoFillFacture(defaultNature, firstItem.id, list);
    } else {
      setFactureForm({
        nature: 'vente',
        selectedId: '',
        compte: 'Caisse / Espèces',
        montant: '',
        frais: '',
        beneficiaire: '',
        description: '',
        reference: '',
        date: today,
      });
    }
    setShowPaiementFactureModal(true);
  };

  const autoFillFacture = (nature: string, targetId: string, listOverride?: any[]) => {
    if (nature === 'vente') {
      const list = listOverride || ventesUnpaid;
      const v = list.find((item: any) => item.id === targetId) || list[0];
      if (!v) {
        setFactureForm(prev => ({ ...prev, nature, selectedId: '', montant: '', frais: '', beneficiaire: '', description: '', reference: '' }));
        return;
      }
      const p = products.find((pr: any) => pr.id === v.productId);
      const nomProd = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Produit';
      const cl = clients.find((c: any) => c.id === v.clientId);
      const nomClient = cl?.nom || (v.description ? v.description : 'Client');
      const reste = getRestePayeVente(v);
      const dejaPaye = getMontantPayeVente(v);
      const isAcompte = dejaPaye > 0;

      setFactureForm({
        nature: 'vente',
        selectedId: v.id,
        compte: v.modePaiement || 'Caisse / Espèces',
        montant: reste ? String(reste) : '',
        frais: '',
        beneficiaire: nomClient,
        description: isAcompte
          ? `Solde / Règlement Vente — ${nomProd} (x${v.qty || 1}) de ${nomClient}`
          : `Encaissement / Acompte Vente — ${nomProd} (x${v.qty || 1}) de ${nomClient}`,
        reference: v.reference || '',
        date: today,
      });
    } else {
      const list = listOverride || (nature === 'marchandise' ? commandesUnpaidMarchandise : commandesUnpaidFret);
      const c = list.find((item: any) => item.id === targetId) || list[0];
      if (!c) {
        setFactureForm(prev => ({ ...prev, nature, selectedId: '', montant: '', frais: '', beneficiaire: '', description: '', reference: '' }));
        return;
      }

      const p = products.find((pr: any) => pr.id === c.productId);
      const nomProd = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Article';

      if (nature === 'marchandise') {
        const reste = getRestePayeMarchandise(c);
        const dejaPaye = getMontantPayeMarchandise(c);
        const four = fournisseurs.find((f: any) => f.id === c.fournisseurId);
        const nomFour = four?.nom || c.source || 'Fournisseur Chine';
        const isAcompte = dejaPaye > 0;

        setFactureForm({
          nature: 'marchandise',
          selectedId: c.id,
          compte: c.comptePayeur || 'MVola',
          montant: reste ? String(reste) : '',
          frais: '',
          beneficiaire: nomFour,
          description: isAcompte
            ? `Solde Achat Marchandise — ${nomProd} (x${c.qty || 1}) chez ${nomFour}`
            : `Paiement / Acompte Marchandise — ${nomProd} (x${c.qty || 1}) chez ${nomFour}`,
          reference: c.source || '',
          date: today,
        });
      } else {
        const reste = getRestePayeFret(c);
        const dejaPaye = getMontantPayeFret(c);
        const trans = fournisseurs.find((f: any) => f.id === c.transitaireId);
        const nomTrans = trans?.nom || 'Transitaire / Fret';
        const isAcompte = dejaPaye > 0;

        setFactureForm({
          nature: 'fret',
          selectedId: c.id,
          compte: c.compteFret || 'MVola',
          montant: reste ? String(reste) : '',
          frais: '',
          beneficiaire: nomTrans,
          description: isAcompte
            ? `Solde Fret ${c.modeExpedition || 'Logistique'} — ${nomProd} à ${nomTrans}`
            : `Paiement / Acompte Fret ${c.modeExpedition || 'Logistique'} — ${nomProd} à ${nomTrans}`,
          reference: c.tracking || trans?.nom || '',
          date: today,
        });
      }
    }
  };

  const handleNatureChange = (newNature: string) => {
    const list = newNature === 'vente' ? ventesUnpaid : (newNature === 'marchandise' ? commandesUnpaidMarchandise : commandesUnpaidFret);
    const firstItem = list[0];
    if (firstItem) {
      autoFillFacture(newNature, firstItem.id, list);
    } else {
      setFactureForm(prev => ({
        ...prev,
        nature: newNature,
        selectedId: '',
        montant: '',
        beneficiaire: '',
        description: '',
        reference: '',
      }));
    }
  };

  const handleCommandeChange = (targetId: string) => {
    autoFillFacture(factureForm.nature, targetId);
  };

  const enregistrerPaiementFacture = () => {
    const montantNum = Number(factureForm.montant);
    if (!montantNum || montantNum <= 0 || !factureForm.selectedId) return;

    const dateIso = factureForm.date ? new Date(factureForm.date).toISOString() : new Date().toISOString();
    const nextMvs = [];

    if (factureForm.nature === 'vente') {
      const v = ventes.find((item: any) => item.id === factureForm.selectedId);
      const totalVente = v ? (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1))) : montantNum;
      const ancienPaye = v ? getMontantPayeVente(v) : 0;
      const nouveauPaye = ancienPaye + montantNum;
      const isComplete = nouveauPaye >= totalVente;
      const nouveauStatut = isComplete ? 'Payé' : 'Partiel';

      const mvt = {
        id: uid(),
        type: 'entrée',
        categorie: 'vente',
        montant: montantNum,
        compte: factureForm.compte || 'Caisse / Espèces',
        tag: '#vente',
        reference: factureForm.reference.trim() || factureForm.beneficiaire,
        description: factureForm.description.trim(),
        date: dateIso,
        venteId: factureForm.selectedId,
      };
      nextMvs.push(mvt);

      const updatedVentes = ventes.map((item: any) => {
        if (item.id !== factureForm.selectedId) return item;
        return {
          ...item,
          montantPaye: nouveauPaye,
          statutPaiement: nouveauStatut,
          dateEncaissement: isComplete ? dateIso : item.dateEncaissement,
          modePaiement: factureForm.compte,
        };
      });

      const fraisNum = Number(factureForm.frais);
      if (fraisNum > 0) {
        const mfrais = {
          id: uid(),
          type: 'sortie',
          montant: fraisNum,
          compte: factureForm.compte,
          tag: '#frais-bancaires',
          reference: factureForm.reference.trim() ? `Frais ${factureForm.reference.trim()}` : '',
          description: `Frais transaction sur règlement : ${factureForm.description.trim()}`,
          date: dateIso,
        };
        nextMvs.push(mfrais);
      }

      updateData({
        mouvements: [...nextMvs, ...mouvements],
        ventes: updatedVentes,
      });
    } else {
      const isMarchandise = factureForm.nature === 'marchandise';
      const mvt = {
        id: uid(),
        type: 'sortie',
        categorie: isMarchandise ? 'achat' : 'fret',
        montant: montantNum,
        compte: factureForm.compte || 'MVola',
        tag: isMarchandise ? '#stock-chine' : '#fret-logistique',
        reference: factureForm.reference.trim() || factureForm.beneficiaire,
        description: factureForm.description.trim(),
        date: dateIso,
        commandeId: factureForm.selectedId,
      };
      nextMvs.push(mvt);

      const updatedCommandes = commandes.map((item: any) => {
        if (item.id !== factureForm.selectedId) return item;
        if (isMarchandise) {
          const totalAchat = item.total !== undefined ? Number(item.total) : (Number(item.pu || 0) * Number(item.qty || 1));
          const ancienPaye = getMontantPayeMarchandise(item);
          const nouveauPaye = ancienPaye + montantNum;
          const isComplete = nouveauPaye >= totalAchat;
          const nouveauStatut = isComplete ? 'Payé' : 'Partiel';

          return {
            ...item,
            montantPayeMarchandise: nouveauPaye,
            statutPaiementMarchandise: nouveauStatut,
            datePaiementMarchandise: isComplete ? dateIso : item.datePaiementMarchandise,
            datePaiement: item.datePaiement || dateIso,
            statut: (item.statut === 'Commandé' && nouveauPaye > 0) ? 'En livraison' : item.statut,
            dateEnLivraison: item.dateEnLivraison || dateIso,
            comptePayeur: factureForm.compte,
          };
        } else {
          const totalFret = Number(item.fraisTransport) || 0;
          const ancienPaye = getMontantPayeFret(item);
          const nouveauPaye = ancienPaye + montantNum;
          const isComplete = nouveauPaye >= totalFret;
          const nouveauStatut = isComplete ? 'Payé' : 'Partiel';

          return {
            ...item,
            montantPayeFret: nouveauPaye,
            statutPaiementFret: nouveauStatut,
            datePaiementFret: isComplete ? dateIso : item.datePaiementFret,
            compteFret: factureForm.compte,
          };
        }
      });

      const fraisNum = Number(factureForm.frais);
      if (fraisNum > 0) {
        const mfrais = {
          id: uid(),
          type: 'sortie',
          montant: fraisNum,
          compte: factureForm.compte,
          tag: '#frais-bancaires',
          reference: factureForm.reference.trim() ? `Frais ${factureForm.reference.trim()}` : '',
          description: `Frais transaction sur règlement : ${factureForm.description.trim()}`,
          date: dateIso,
        };
        nextMvs.push(mfrais);
      }

      updateData({
        mouvements: [...nextMvs, ...mouvements],
        commandes: updatedCommandes,
      });
    }

    setShowPaiementFactureModal(false);
  };

  const ajouterMouvement = () => {
    const montantNum = Number(form.montant);
    if (!montantNum || montantNum <= 0 || !form.description.trim()) return;

    const isInvest = form.type === 'investissement';
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
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
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
        date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
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

    const dateIso = transfertForm.date ? new Date(transfertForm.date).toISOString() : new Date().toISOString();
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

  const supprimerMouvement = (id: string) => {
    const mvt = mouvements.find((m: any) => m.id === id);
    const nextMouvements = mouvements.filter((m: any) => m.id !== id);

    // Si le mouvement supprimé était lié à une commande (paiement achat ou fret),
    // on recalcule les montants payés restants pour cette commande en retirant
    // uniquement la contribution de ce mouvement (sans remettre à zéro les autres paiements).
    if (mvt && mvt.commandeId) {
      const mouvementsRestants = nextMouvements.filter((m: any) => m.commandeId === mvt.commandeId);

      const updatedCommandes = commandes.map((c: any) => {
        if (c.id !== mvt.commandeId) return c;

        const isAchat = mvt.categorie === 'achat' || mvt.tag === '#stock-chine';
        const isFret = mvt.categorie === 'fret' || mvt.tag === '#fret-logistique';

        if (isAchat) {
          const nouveauPayeMarchandise = mouvementsRestants
            .filter((m: any) => m.categorie === 'achat' || m.tag === '#stock-chine')
            .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
          const totalAchat = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
            ? Number(c.total)
            : (Number(c.pu) || 0) * (Number(c.qty) || 1);
          const nouveauStatut = nouveauPayeMarchandise <= 0 ? 'Commandé'
            : nouveauPayeMarchandise >= totalAchat ? 'Payé' : 'Partiel';
          return {
            ...c,
            montantPayeMarchandise: nouveauPayeMarchandise,
            statutPaiementMarchandise: nouveauStatut,
            datePaiementMarchandise: nouveauStatut === 'Payé' ? c.datePaiementMarchandise : undefined,
          };
        } else if (isFret) {
          const nouveauPayeFret = mouvementsRestants
            .filter((m: any) => m.categorie === 'fret' || m.tag === '#fret-logistique')
            .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
          const totalFret = Number(c.fraisTransport) || 0;
          const nouveauStatutFret = nouveauPayeFret <= 0 ? 'Non payé'
            : nouveauPayeFret >= totalFret ? 'Payé' : 'Partiel';
          return {
            ...c,
            montantPayeFret: nouveauPayeFret,
            statutPaiementFret: nouveauStatutFret,
            datePaiementFret: nouveauStatutFret === 'Payé' ? c.datePaiementFret : undefined,
          };
        }
        return c;
      });

      updateData({ mouvements: nextMouvements, commandes: updatedCommandes });
    } else if (mvt && mvt.venteId) {
      // Si lié à une vente : recalculer le montant payé sur cette vente
      const mouvementsVenteRestants = nextMouvements.filter((m: any) => m.venteId === mvt.venteId);
      const updatedVentes = ventes.map((v: any) => {
        if (v.id !== mvt.venteId) return v;
        const nouveauPaye = mouvementsVenteRestants.reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
        return { ...v, montantPaye: nouveauPaye };
      });
      updateData({ mouvements: nextMouvements, ventes: updatedVentes });
    } else {
      updateData({ mouvements: nextMouvements });
    }
  };

  const getMontantAchat = (c: any) => {
    if (c.total !== undefined && c.total !== null && Number(c.total) > 0) return Number(c.total);
    if (c.pu !== undefined && c.pu !== null && Number(c.pu) > 0) return Number(c.pu) * (Number(c.qty) || 1);
    const p = products.find((pr: any) => pr.id === c.productId);
    return p ? (Number(p.prixAchat) || 0) * (Number(c.qty) || 1) : 0;
  };

  const toutesTransactions = useMemo(() => {
    const items: any[] = [];

    // 1. Ventes (comptoir ou directes) sans mouvement de paiement explicite
    ventes.forEach((v: any) => {
      const hasMvtPaiement = mouvements.some((m: any) => m.venteId === v.id);
      if (hasMvtPaiement) {
        // Les paiements réels de cette vente sont déjà enregistrés dans la liste des mouvements
        return;
      }

      const paye = getMontantPayeVente(v);
      if (paye > 0) {
        const p = products.find((pr: any) => pr.id === v.productId);
        const nomProd = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Produit';
        items.push({
          id: 'vente-' + (v.id || Math.random()),
          type: 'entrée',
          categorie: 'vente',
          compte: v.modePaiement || v.compte || 'Caisse / Espèces',
          tag: '#vente',
          reference: v.reference || '',
          montant: paye,
          description: `Vente Comptoir — ${nomProd} ×${v.qty || 1}${v.description ? ` (${v.description})` : ''}`,
          date: v.dateEncaissement || v.date || new Date().toISOString(),
          isManuel: false,
        });
      }
    });

    // 2. Commandes (Achats & Fret) sans mouvement de paiement explicite
    commandes.forEach((c: any) => {
      // Achats Marchandise
      const hasMvtAchat = mouvements.some((m: any) => m.commandeId === c.id && (m.categorie === 'achat' || m.tag === '#stock-chine'));
      if (!hasMvtAchat) {
        const payeMarchandise = getMontantPayeMarchandise(c);
        if (payeMarchandise > 0) {
          const p = products.find((pr: any) => pr.id === c.productId);
          const nomProd = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Article commandé';
          const sourceLabel = c.source ? `[${c.source}]` : '';
          const statutLabel = c.statut ? ` • ${c.statut}` : '';

          items.push({
            id: 'achat-' + (c.id || Math.random()),
            type: 'sortie',
            categorie: 'achat',
            compte: c.comptePayeur || 'MVola',
            tag: '#stock-chine',
            reference: sourceLabel,
            montant: payeMarchandise,
            description: `Achat Chine — ${nomProd} ×${c.qty || 1}${statutLabel}`,
            date: c.datePaiementMarchandise || c.datePaiement || c.dateAchat || c.dateCreation || new Date().toISOString(),
            isManuel: false,
          });
        }
      }

      // Fret Logistique
      const hasMvtFret = mouvements.some((m: any) => m.commandeId === c.id && (m.categorie === 'fret' || m.tag === '#fret-logistique'));
      if (!hasMvtFret) {
        const payeFret = getMontantPayeFret(c);
        if (payeFret > 0) {
          const p = products.find((pr: any) => pr.id === c.productId);
          const nomProd = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Article commandé';
          const transitaire = fournisseurs.find((f: any) => f.id === c.transitaireId);
          const mode = c.modeExpedition || 'Transport';

          items.push({
            id: 'fret-' + (c.id || Math.random()),
            type: 'sortie',
            categorie: 'fret',
            compte: c.compteFret || 'MVola',
            tag: '#fret-logistique',
            reference: transitaire?.nom || '',
            montant: payeFret,
            description: `Fret ${mode} — ${nomProd} ×${c.qty || 1}${transitaire ? ` (${transitaire.nom})` : ''}`,
            date: c.datePaiementFret || c.dateArrivee || c.dateEnExpedition || c.datePaiement || c.dateAchat || new Date().toISOString(),
            isManuel: false,
          });
        }
      }
    });

    // 3. Tous les Mouvements réels de trésorerie (saisies manuels, règlements de factures, transferts)
    mouvements.forEach((m: any) => {
      const isInvest = Boolean(m.isInvestissement || m.tag === '#investissement' || m.tag === '#capital');
      const isTrans = Boolean(m.isTransfert || m.tag === '#transfert' || m.categorie === 'transfert');

      const defaultTag = isTrans ? '#transfert' : (isInvest ? '#investissement' : '#manuel');
      const defaultCat = isTrans ? 'transfert' : (isInvest ? 'investissement' : 'manuel');

      items.push({
        id: m.id || 'mvt-' + Math.random(),
        type: m.type === 'entrée' ? 'entrée' : 'sortie',
        isInvestissement: isInvest,
        isTransfert: isTrans,
        categorie: m.categorie || defaultCat,
        compte: m.compte || 'Caisse / Espèces',
        tag: m.tag || defaultTag,
        reference: m.reference || '',
        montant: Number(m.montant) || 0,
        description: m.description || (isTrans ? 'Transfert de fonds' : (isInvest ? 'Apport / Investissement initial' : 'Opération manuelle')),
        date: m.date || new Date().toISOString(),
        isManuel: true,
      });
    });

    return items.sort((a, b) => {
      const tA = new Date(a.date).getTime() || 0;
      const tB = new Date(b.date).getTime() || 0;
      return tB - tA;
    });
  }, [ventes, commandes, mouvements, products, fournisseurs]);

  const caBusiness = useMemo(() => {
    return toutesTransactions
      .filter((t: any) => 
        t.type === 'entrée' && 
        !t.isInvestissement && 
        !t.isTransfert && 
        t.tag !== '#investissement' && 
        t.tag !== '#capital' && 
        t.tag !== '#transfert' && 
        t.categorie !== 'transfert'
      )
      .reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0);
  }, [toutesTransactions]);

  const depensesBusiness = useMemo(() => {
    return toutesTransactions
      .filter((t: any) => 
        t.type === 'sortie' && 
        !t.isTransfert && 
        t.tag !== '#retrait-perso' && 
        t.tag !== '#transfert' && 
        t.categorie !== 'transfert'
      )
      .reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0);
  }, [toutesTransactions]);

  const resultatBusiness = caBusiness - depensesBusiness;

  const apportsPerso = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'entrée' && (m.isInvestissement || m.tag === '#investissement' || m.tag === '#capital'))
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  const prelevementsPerso = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'sortie' && m.tag === '#retrait-perso')
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  // Calcul de la Réserve RMB (Yuan)
  const statsRmb = useMemo(() => {
    let totalRmbAchete = 0;
    let totalMgaChange = 0;

    (changes || []).forEach((c: any) => {
      const rmb = Number(c.montantRmb) || 0;
      const mga = Number(c.montantMga) || 0;
      const frais = Number(c.fraisMga) || 0;
      totalRmbAchete += rmb;
      totalMgaChange += mga + frais;
    });

    mouvements.forEach((m: any) => {
      if (m.compte === 'Réserve RMB (¥)' || m.compte?.toLowerCase().includes('rmb')) {
        const val = Number(m.montant) || 0;
        if (m.type === 'entrée') totalRmbAchete += val;
        else if (m.type === 'sortie') totalRmbAchete -= val;
      }
    });

    let totalRmbDepense = 0;

    (commandes || []).forEach((c: any) => {
      const puRmb = Number(c.puDevise || c.puRmb || 0);
      const qty = Number(c.qty || 1);
      const fraisChineRmb = Number(c.fraisLivraisonChineDevise || 0);
      const costRmb = (puRmb * qty) + fraisChineRmb;

      if (costRmb > 0) {
        const totalAr = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * qty + Number(c.fraisLivraisonChine || 0));
        const payeAr = getMontantPayeMarchandise(c);

        if (c.statutPaiementMarchandise === 'Payé' || (totalAr > 0 && payeAr >= totalAr)) {
          totalRmbDepense += costRmb;
        } else if (payeAr > 0 && totalAr > 0) {
          const ratio = Math.min(1, payeAr / totalAr);
          totalRmbDepense += costRmb * ratio;
        }
      }
    });

    const soldeRmbDispo = Math.round((totalRmbAchete - totalRmbDepense) * 100) / 100;
    const tauxActuel = Number(devises?.rmb) || (totalRmbAchete > 0 ? totalMgaChange / totalRmbAchete : 680);
    const valeurRmbAr = Math.round(soldeRmbDispo * tauxActuel);

    return {
      totalRmbAchete,
      totalRmbDepense,
      soldeRmbDispo,
      tauxActuel,
      valeurRmbAr,
    };
  }, [changes, mouvements, commandes, devises]);

  const soldesParCompte = useMemo(() => {
    const res: Record<string, number> = {};
    activeComptes.forEach(compte => { res[compte] = 0; });

    toutesTransactions.forEach(t => {
      const c = t.compte || 'Caisse / Espèces';
      if (res[c] === undefined) res[c] = 0;
      if (t.type === 'entrée') {
        res[c] += Number(t.montant) || 0;
      } else {
        res[c] -= Number(t.montant) || 0;
      }
    });

    return res;
  }, [toutesTransactions, activeComptes]);

  const soldeGlobal = useMemo(() => {
    return Object.values(soldesParCompte).reduce((s: number, v: number) => s + v, 0);
  }, [soldesParCompte]);

  const tagsDisponibles = useMemo(() => {
    const set = new Set<string>(TAGS_TRANSACTION);
    toutesTransactions.forEach(t => {
      if (t.tag) set.add(t.tag);
    });
    return Array.from(set);
  }, [toutesTransactions]);

  const transactionsFiltrees = useMemo(() => {
    return toutesTransactions.filter(item => {
      const isPerso = item.isInvestissement || item.tag === '#retrait-perso' || item.tag === '#investissement' || item.tag === '#capital';
      const isTrans = item.isTransfert || item.tag === '#transfert' || item.categorie === 'transfert';

      if (filtreDomaine === 'business' && (isPerso || isTrans)) return false;
      if (filtreDomaine === 'perso' && !isPerso) return false;

      if (filtreType === 'entrée' && item.type !== 'entrée') return false;
      if (filtreType === 'sortie' && item.type !== 'sortie') return false;
      if (filtreType === 'investissement' && !isPerso) return false;
      
      if (filtreCompte !== 'all' && item.compte !== filtreCompte) return false;
      if (filtreTag !== 'all' && item.tag !== filtreTag) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = item.description?.toLowerCase().includes(q);
        const refMatch = item.reference?.toLowerCase().includes(q);
        const tagMatch = item.tag?.toLowerCase().includes(q);
        const compteMatch = item.compte?.toLowerCase().includes(q);
        if (!descMatch && !refMatch && !tagMatch && !compteMatch) return false;
      }

      return true;
    });
  }, [toutesTransactions, filtreDomaine, filtreType, filtreCompte, filtreTag, searchQuery]);

  return (
    <div>
      {/* KPI Stats */}
      <TresorerieStats
        soldeGlobal={soldeGlobal}
        caBusiness={caBusiness}
        depensesBusiness={depensesBusiness}
        resultatBusiness={resultatBusiness}
        apportsPerso={apportsPerso}
        prelevementsPerso={prelevementsPerso}
        soldeRmb={statsRmb.soldeRmbDispo}
        valeurRmbAr={statsRmb.valeurRmbAr}
      />

      {/* Soldes par Compte */}
      <ComptesFinanciers
        soldesParCompte={soldesParCompte}
        filtreCompte={filtreCompte}
        setFiltreCompte={setFiltreCompte}
        onOpenTransfert={() => setShowTransfertModal(true)}
        soldeRmb={statsRmb.soldeRmbDispo}
        valeurRmbAr={statsRmb.valeurRmbAr}
        comptes={activeComptes}
        updateData={updateData}
      />

      {/* Boutons d'action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#26333D' }}>
          Journal des Transactions ({toutesTransactions.length})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={ouvrirModalRèglementFacture}
            style={{
              ...primaryBtn,
              background: '#3D5A6C',
              height: 36,
              padding: '0 12px',
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Receipt size={15} />
            + Régler une Facture (Achat / Fret)
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            style={{
              ...primaryBtn,
              height: 36,
              padding: '0 12px',
              fontSize: 12.5,
            }}
          >
            {showForm ? 'Fermer la saisie' : '+ Entrée / Sortie / Investissement'}
          </button>
        </div>
      </div>

      {/* Formulaire Manuel */}
      {showForm && (
        <ModalMouvementManuel
          form={form}
          setForm={setForm}
          ajouterMouvement={ajouterMouvement}
          today={today}
          comptes={activeComptes}
        />
      )}

      {/* Modal Règlement Facture */}
      <ModalPaiementFacture
        show={showPaiementFactureModal}
        onClose={() => setShowPaiementFactureModal(false)}
        factureForm={factureForm}
        setFactureForm={setFactureForm}
        handleNatureChange={handleNatureChange}
        handleCommandeChange={handleCommandeChange}
        enregistrerPaiementFacture={enregistrerPaiementFacture}
        ventesUnpaid={ventesUnpaid}
        commandesUnpaidMarchandise={commandesUnpaidMarchandise}
        commandesUnpaidFret={commandesUnpaidFret}
        products={products}
        clients={clients}
        fournisseurs={fournisseurs}
        today={today}
        comptes={activeComptes}
      />

      {/* Modal Transfert Inter-Comptes */}
      <ModalTransfertComptes
        show={showTransfertModal}
        onClose={() => setShowTransfertModal(false)}
        transfertForm={transfertForm}
        setTransfertForm={setTransfertForm}
        executerTransfert={executerTransfert}
        soldesParCompte={soldesParCompte}
        comptes={activeComptes}
      />

      {/* Journal & Filtres */}
      <JournalTransactions
        transactionsFiltrees={transactionsFiltrees}
        toutesTransactions={toutesTransactions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtreDomaine={filtreDomaine}
        setFiltreDomaine={setFiltreDomaine}
        filtreType={filtreType}
        setFiltreType={setFiltreType}
        filtreCompte={filtreCompte}
        setFiltreCompte={setFiltreCompte}
        filtreTag={filtreTag}
        setFiltreTag={setFiltreTag}
        tagsDisponibles={tagsDisponibles}
        supprimerMouvement={supprimerMouvement}
        comptes={activeComptes}
      />
    </div>
  );
}
