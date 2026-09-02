import {
  getMontantPayeMarchandise,
  getMontantPayeFret,
  getMontantPayeVente,
} from '../paymentUtils';

export function getMontantAchat(c: any, products: any[]) {
  if (c.total !== undefined && c.total !== null && Number(c.total) > 0) return Number(c.total);
  if (c.pu !== undefined && c.pu !== null && Number(c.pu) > 0) return Number(c.pu) * (Number(c.qty) || 1);
  const p = products.find((pr: any) => pr.id === c.productId);
  return p ? (Number(p.prixAchat) || 0) * (Number(c.qty) || 1) : 0;
}

/**
 * Calcul du montant réellement payé pour une vente à partir des paiements et des mouvements
 */
export function calcPayeTotalVente(vId: string, paiements: any[] = [], mouvements: any[] = []): number {
  let total = 0;
  if (Array.isArray(paiements)) {
    for (const p of paiements) {
      if (Array.isArray(p.lignes)) {
        for (const l of p.lignes) {
          if (l.cibleType === 'vente' && l.cibleId === vId) {
            total += Number(l.montantAlloue) || 0;
          }
        }
      }
    }
  }
  if (Array.isArray(mouvements)) {
    for (const m of mouvements) {
      if (m.venteId === vId && !m.paiementId) {
        total += Number(m.montant) || 0;
      }
    }
  }
  return total;
}

/**
 * Calcul du montant réellement payé pour la marchandise d'une commande à partir des paiements et mouvements
 */
export function calcPayeTotalMarchandise(cId: string, paiements: any[] = [], mouvements: any[] = []): number {
  let total = 0;
  if (Array.isArray(paiements)) {
    for (const p of paiements) {
      if (Array.isArray(p.lignes)) {
        for (const l of p.lignes) {
          if (l.cibleType === 'marchandise' && l.cibleId === cId) {
            total += Number(l.montantAlloue) || 0;
          }
        }
      }
    }
  }
  if (Array.isArray(mouvements)) {
    for (const m of mouvements) {
      if (m.commandeId === cId && !m.paiementId && (m.categorie === 'achat' || m.tag === '#stock-chine')) {
        total += Number(m.montant) || 0;
      }
    }
  }
  return total;
}

/**
 * Calcul du montant réellement payé pour le fret d'une commande à partir des paiements et mouvements
 */
export function calcPayeTotalFret(cId: string, paiements: any[] = [], mouvements: any[] = []): number {
  let total = 0;
  if (Array.isArray(paiements)) {
    for (const p of paiements) {
      if (Array.isArray(p.lignes)) {
        for (const l of p.lignes) {
          if (l.cibleType === 'fret' && l.cibleId === cId) {
            total += Number(l.montantAlloue) || 0;
          }
        }
      }
    }
  }
  if (Array.isArray(mouvements)) {
    for (const m of mouvements) {
      if (m.commandeId === cId && !m.paiementId && (m.categorie === 'fret' || m.tag === '#fret-logistique')) {
        total += Number(m.montant) || 0;
      }
    }
  }
  return total;
}

/**
 * Construit la liste unifiée de toutes les transactions de trésorerie
 */
export function buildToutesTransactions({
  ventes = [],
  commandes = [],
  mouvements = [],
  paiements = [],
  products = [],
  fournisseurs = [],
}: {
  ventes: any[];
  commandes: any[];
  mouvements: any[];
  paiements: any[];
  products: any[];
  fournisseurs: any[];
}) {
  const items: any[] = [];

  // 1. Ventes (comptoir ou directes) sans mouvement ou paiement explicite
  ventes.forEach((v: any) => {
    const vIdStr = String(v.id);
    const hasMvtPaiement =
      mouvements.some((m: any) =>
        String(m.venteId) === vIdStr ||
        (m.paiementId && paiements?.some((p: any) => String(p.id) === String(m.paiementId) && p.lignes?.some((l: any) => String(l.cibleId) === vIdStr)))
      ) ||
      (paiements && paiements.some((p: any) => p.lignes?.some((l: any) => String(l.cibleId) === vIdStr)));

    if (hasMvtPaiement) {
      return;
    }

    const paye = getMontantPayeVente(v, paiements);
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
        venteId: v.id,
      });
    }
  });

  // 2. Commandes (Achats & Fret) sans mouvement ou paiement explicite
  commandes.forEach((c: any) => {
    const cIdStr = String(c.id);

    // Achats Marchandise
    const hasMvtAchat =
      mouvements.some((m: any) =>
        (m.commandeId && String(m.commandeId) === cIdStr && (m.categorie === 'achat' || m.tag === '#stock-chine' || !m.categorie)) ||
        (m.paiementId && paiements?.some((p: any) => String(p.id) === String(m.paiementId) && p.lignes?.some((l: any) => String(l.cibleId) === cIdStr)))
      ) ||
      (paiements && paiements.some((p: any) => p.lignes?.some((l: any) => String(l.cibleId) === cIdStr)));

    if (!hasMvtAchat) {
      const payeMarchandise = getMontantPayeMarchandise(c, paiements);
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
          commandeId: c.id,
        });
      }
    }

    // Fret Logistique
    const hasMvtFret =
      mouvements.some((m: any) =>
        (m.commandeId && String(m.commandeId) === cIdStr && (m.categorie === 'fret' || m.tag === '#fret-logistique')) ||
        (m.paiementId && paiements?.some((p: any) => String(p.id) === String(m.paiementId) && p.lignes?.some((l: any) => String(l.cibleId) === cIdStr && l.cibleType === 'fret')))
      ) ||
      (paiements && paiements.some((p: any) => p.lignes?.some((l: any) => String(l.cibleId) === cIdStr && l.cibleType === 'fret')));

    if (!hasMvtFret) {
      const payeFret = getMontantPayeFret(c, paiements);
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
          commandeId: c.id,
        });
      }
    }
  });

  // 3. Tous les Mouvements réels de trésorerie
  mouvements.forEach((m: any) => {
    const isInvest = Boolean(m.isInvestissement || m.tag === '#investissement' || m.tag === '#capital');
    const isTrans = Boolean(m.isTransfert || m.tag === '#transfert' || m.categorie === 'transfert');

    const defaultTag = isTrans ? '#transfert' : (isInvest ? '#investissement' : '#manuel');
    const defaultCat = isTrans ? 'transfert' : (isInvest ? 'investissement' : 'manuel');

    const pObj = paiements && paiements.find((p: any) =>
      (m.paiementId && String(p.id) === String(m.paiementId)) ||
      (p.date === m.date && p.montantTotal === m.montant && p.compte === m.compte)
    );

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
      paiementId: m.paiementId,
      paiementObj: pObj,
      venteId: m.venteId,
      commandeId: m.commandeId,
    });
  });

  // 4. Règlements de factures / encaissements directs dans `paiements` (sans doublon de mouvement)
  (paiements || []).forEach((p: any) => {
    const dejaDansMouvements = mouvements.some((m: any) =>
      (m.paiementId && String(m.paiementId) === String(p.id)) ||
      (m.date === p.date && Number(m.montant) === Number(p.montantTotal) && m.compte === p.compte)
    );

    if (!dejaDansMouvements) {
      const isVente = p.nature === 'vente';
      const isFret = p.nature === 'fret';
      items.push({
        id: p.id || 'pmt-' + Math.random(),
        type: isVente ? 'entrée' : 'sortie',
        categorie: isVente ? 'vente' : (isFret ? 'fret' : 'achat'),
        compte: p.compte || 'Caisse / Espèces',
        tag: isVente ? '#vente' : (isFret ? '#fret-logistique' : '#stock-chine'),
        reference: p.reference || p.beneficiaire || '',
        montant: Number(p.montantTotal) || 0,
        description: p.description || (isVente ? 'Encaissement Vente' : (isFret ? 'Règlement Fret' : 'Règlement Marchandise')),
        date: p.date || new Date().toISOString(),
        isManuel: false,
        paiementId: p.id,
        paiementObj: p,
      });
    }
  });

  return items.sort((a, b) => {
    const tA = new Date(a.date).getTime() || 0;
    const tB = new Date(b.date).getTime() || 0;
    return tB - tA;
  });
}

/**
 * Supprime n'importe quelle transaction (mouvement, paiement groupé, vente/commande réglée)
 * et recalcule en toute sécurité les soldes et statuts.
 */
export function supprimerTransaction(
  item: any,
  {
    mouvements = [],
    paiements = [],
    ventes = [],
    commandes = [],
    updateData,
  }: {
    mouvements: any[];
    paiements: any[];
    ventes: any[];
    commandes: any[];
    updateData: (patch: any) => void;
  }
) {
  if (!item) return;

  let nextPaiements = [...paiements];
  let nextMouvements = [...mouvements];
  let nextVentes = [...ventes];
  let nextCommandes = [...commandes];

  let hasChangedPaiements = false;
  let hasChangedMouvements = false;
  let hasChangedVentes = false;
  let hasChangedCommandes = false;

  const impactedVenteIds = new Set<string>();
  const impactedCommandeIds = new Set<string>();

  // 1. Transaction liée à un Règlement Groupé ou Paiement (paiements)
  const targetPaiementId = item.paiementId || item.paiementObj?.id || (
    nextPaiements.some((p: any) => p.id === item.id) ? item.id : undefined
  );

  if (targetPaiementId) {
    const pObj = nextPaiements.find((p: any) => p.id === targetPaiementId);
    if (pObj) {
      // Collecter les cibles impactées par ce paiement
      if (Array.isArray(pObj.lignes)) {
        pObj.lignes.forEach((l: any) => {
          if (l.cibleType === 'vente') impactedVenteIds.add(l.cibleId);
          else if (l.cibleType === 'marchandise' || l.cibleType === 'fret') impactedCommandeIds.add(l.cibleId);
        });
      }

      // Supprimer le paiement de l'état `paiements`
      nextPaiements = nextPaiements.filter((p: any) => p.id !== targetPaiementId);
      hasChangedPaiements = true;

      // Supprimer les mouvements associés
      const initMvtLen = nextMouvements.length;
      nextMouvements = nextMouvements.filter((m: any) => m.paiementId !== targetPaiementId && m.id !== item.id);
      if (nextMouvements.length !== initMvtLen) hasChangedMouvements = true;
    }
  }

  // 2. Mouvement standard présent dans la liste `mouvements`
  const isMvt = nextMouvements.some((m: any) => m.id === item.id);
  if (isMvt) {
    const mvt = nextMouvements.find((m: any) => m.id === item.id);
    nextMouvements = nextMouvements.filter((m: any) => m.id !== item.id);
    hasChangedMouvements = true;

    if (mvt?.venteId) impactedVenteIds.add(mvt.venteId);
    if (mvt?.commandeId) impactedCommandeIds.add(mvt.commandeId);
  }

  // 3. Transaction synthétique dérivée directe d'une Vente (ex: 'vente-...')
  if (item.id && String(item.id).startsWith('vente-')) {
    const vId = item.venteId || String(item.id).replace('vente-', '');
    impactedVenteIds.add(vId);
  }

  // 4. Transaction synthétique dérivée directe d'un Achat / Fret (ex: 'achat-...', 'fret-...')
  if (item.id && (String(item.id).startsWith('achat-') || String(item.id).startsWith('fret-'))) {
    const cId = item.commandeId || String(item.id).replace('achat-', '').replace('fret-', '');
    impactedCommandeIds.add(cId);
  }

  if (item.venteId) impactedVenteIds.add(item.venteId);
  if (item.commandeId) impactedCommandeIds.add(item.commandeId);

  // Recalculer les ventes impactées
  impactedVenteIds.forEach(vId => {
    const vIndex = nextVentes.findIndex((v: any) => v.id === vId);
    if (vIndex !== -1) {
      const v = nextVentes[vIndex];
      const nouveauPaye = calcPayeTotalVente(v.id, nextPaiements, nextMouvements);
      const totalVente = Number(v.total) || ((Number(v.pu || 0) * Number(v.qty || 1)) + (Number(v.fraisLivraison) || 0));
      const st = nouveauPaye <= 0 ? 'Non payé' : (nouveauPaye >= totalVente ? 'Payé' : 'Partiel');

      nextVentes[vIndex] = {
        ...v,
        montantPaye: nouveauPaye,
        statutPaiement: st,
        dateEncaissement: nouveauPaye > 0 ? v.dateEncaissement : undefined,
      };
      hasChangedVentes = true;
    }
  });

  // Recalculer les commandes impactées (Achats / Fret)
  impactedCommandeIds.forEach(cId => {
    const cIndex = nextCommandes.findIndex((c: any) => c.id === cId);
    if (cIndex !== -1) {
      const c = nextCommandes[cIndex];

      const nouveauPayeMarchandise = calcPayeTotalMarchandise(c.id, nextPaiements, nextMouvements);
      const totalAchat = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
      const stMarchandise = nouveauPayeMarchandise <= 0 ? 'Non payé' : (nouveauPayeMarchandise >= totalAchat ? 'Payé' : 'Partiel');

      const nouveauPayeFret = calcPayeTotalFret(c.id, nextPaiements, nextMouvements);
      const totalFret = Number(c.fraisTransport) || 0;
      const stFret = nouveauPayeFret <= 0 ? 'Non payé' : (nouveauPayeFret >= totalFret ? 'Payé' : 'Partiel');

      nextCommandes[cIndex] = {
        ...c,
        montantPayeMarchandise: nouveauPayeMarchandise,
        statutPaiementMarchandise: stMarchandise,
        datePaiementMarchandise: nouveauPayeMarchandise > 0 ? c.datePaiementMarchandise : undefined,
        montantPayeFret: nouveauPayeFret,
        statutPaiementFret: stFret,
        datePaiementFret: nouveauPayeFret > 0 ? c.datePaiementFret : undefined,
      };
      hasChangedCommandes = true;
    }
  });

  const patch: any = {};
  if (hasChangedMouvements) patch.mouvements = nextMouvements;
  if (hasChangedPaiements) patch.paiements = nextPaiements;
  if (hasChangedVentes) patch.ventes = nextVentes;
  if (hasChangedCommandes) patch.commandes = nextCommandes;

  if (Object.keys(patch).length > 0) {
    updateData(patch);
  }
}

/**
 * Calcule les soldes disponibles en temps réel pour chaque compte / portefeuille
 */
export function calculerSoldesComptes({
  ventes = [],
  commandes = [],
  mouvements = [],
  paiements = [],
  products = [],
  fournisseurs = [],
  comptes = [],
}: {
  ventes?: any[];
  commandes?: any[];
  mouvements?: any[];
  paiements?: any[];
  products?: any[];
  fournisseurs?: any[];
  comptes?: string[];
}): Record<string, number> {
  const COMPTES_PAR_DEFAUT = ['Caisse / Espèces', 'MVola', 'Orange Money', 'Airtel Money', 'Banque (BOA/BNI)', 'Réserve RMB (¥)'];
  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_PAR_DEFAUT;
  const res: Record<string, number> = {};
  activeComptes.forEach((compte: string) => { res[compte] = 0; });

  const toutesTransactions = buildToutesTransactions({
    ventes,
    commandes,
    mouvements,
    paiements,
    products,
    fournisseurs,
  });

  toutesTransactions.forEach((t: any) => {
    const c = t.compte || 'Caisse / Espèces';
    if (res[c] === undefined) res[c] = 0;
    if (t.type === 'entrée') {
      res[c] += Number(t.montant) || 0;
    } else {
      res[c] -= Number(t.montant) || 0;
    }
  });

  return res;
}
