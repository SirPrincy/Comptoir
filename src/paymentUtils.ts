/**
 * Utilitaire pour le calcul des acomptes, montants versés et restes à payer (Achats, Fret, Ventes)
 */

export function getMontantPayeMarchandise(c: any): number {
  if (c.montantPayeMarchandise !== undefined && c.montantPayeMarchandise !== null) {
    return Number(c.montantPayeMarchandise) || 0;
  }
  if (c.statutPaiementMarchandise === 'Payé') {
    return c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
  }
  return 0;
}

export function getRestePayeMarchandise(c: any): number {
  const total = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
  const paye = getMontantPayeMarchandise(c);
  return Math.max(0, total - paye);
}

export function getStatutMarchandiseLabel(c: any): { label: string; type: 'paye' | 'partiel' | 'unpaid'; paye: number; du: number; total: number } {
  const total = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
  const paye = getMontantPayeMarchandise(c);
  const du = Math.max(0, total - paye);
  
  if (paye >= total && total > 0) {
    return { label: '✅ Payé', type: 'paye', paye, du, total };
  }
  if (paye > 0) {
    return {
      label: `🟡 Acompte versé (${paye.toLocaleString('fr-FR')} Ar · Reste: ${du.toLocaleString('fr-FR')} Ar)`,
      type: 'partiel',
      paye,
      du,
      total,
    };
  }
  return { label: '⏳ Non payé', type: 'unpaid', paye, du, total };
}

export function getMontantPayeFret(c: any): number {
  if (c.montantPayeFret !== undefined && c.montantPayeFret !== null) {
    return Number(c.montantPayeFret) || 0;
  }
  if (c.statutPaiementFret === 'Payé') {
    return Number(c.fraisTransport || 0);
  }
  return 0;
}

export function getRestePayeFret(c: any): number {
  const totalFret = Number(c.fraisTransport) || 0;
  const paye = getMontantPayeFret(c);
  return Math.max(0, totalFret - paye);
}

export function getStatutFretLabel(c: any): { label: string; type: 'paye' | 'partiel' | 'unpaid' } {
  const totalFret = Number(c.fraisTransport) || 0;
  if (totalFret <= 0) return { label: 'Inclus / Offert', type: 'paye' };
  const paye = getMontantPayeFret(c);
  if (paye >= totalFret) return { label: '✅ Payé', type: 'paye' };
  if (paye > 0) return { label: `🟡 Partiel (${paye.toLocaleString('fr-FR')} / ${totalFret.toLocaleString('fr-FR')} Ar)`, type: 'partiel' };
  return { label: '⏳ Non payé', type: 'unpaid' };
}

/**
 * Calcul du Solde RMB Disponible
 * Formule : RMB Acheté Total - RMB Dépensé sur Commandes = Solde RMB Restant
 */
export function calculerSoldeRMB(changes: any[] = [], mouvements: any[] = [], secondesCommandes: any[] = [], devises?: any) {
  let totalRmbAchete = 0;
  let totalMgaChange = 0;

  // 1. Total RMB Acheté via Change RMB
  (changes || []).forEach((c: any) => {
    const rmb = Number(c.montantRmb) || 0;
    const mga = Number(c.montantMga) || 0;
    const frais = Number(c.fraisMga) || 0;
    totalRmbAchete += rmb;
    totalMgaChange += mga + frais;
  });

  // 2. Ajustements manuels dans Mouvements sur compte RMB
  (mouvements || []).forEach((m: any) => {
    if (m.compte === 'Réserve RMB (¥)' || m.compte?.toLowerCase().includes('rmb')) {
      const val = Number(m.montant) || 0;
      if (m.type === 'entrée') totalRmbAchete += val;
      else if (m.type === 'sortie') totalRmbAchete -= val;
    }
  });

  // 3. RMB Dépensé sur les Commandes
  let totalRmbDepense = 0;

  (secondesCommandes || []).forEach((c: any) => {
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
      } else if (c.statut && c.statut !== 'En attente' && c.statut !== 'Annulé') {
        totalRmbDepense += costRmb;
      }
    }
  });

  const rawSoldeRmb = Math.round((totalRmbAchete - totalRmbDepense) * 100) / 100;
  const soldeRmbDispo = Math.round(rawSoldeRmb * 100) / 100;
  const tauxActuel = Number(devises?.rmb) || (totalRmbAchete > 0 ? Math.round(totalMgaChange / totalRmbAchete) : 680);
  const valeurRmbAr = Math.round(soldeRmbDispo * tauxActuel);

  return {
    totalRmbAchete: Math.round(totalRmbAchete * 100) / 100,
    totalRmbDepense: Math.round(totalRmbDepense * 100) / 100,
    soldeRmbDispo,
    tauxActuel,
    valeurRmbAr,
  };
}

export function getMontantPayeVente(v: any): number {
  if (v.montantPaye !== undefined && v.montantPaye !== null) {
    return Number(v.montantPaye) || 0;
  }
  if (v.statutPaiement === 'Payé' || v.statutPaiement === undefined) {
    return Number(v.total) || ((Number(v.pu || 0) * Number(v.qty || 1)) + (Number(v.fraisLivraison) || 0));
  }
  return 0;
}

export function getRestePayeVente(v: any): number {
  const total = Number(v.total) || ((Number(v.pu || 0) * Number(v.qty || 1)) + (Number(v.fraisLivraison) || 0));
  const paye = getMontantPayeVente(v);
  return Math.max(0, total - paye);
}

export function getStatutVenteLabel(v: any): { label: string; type: 'paye' | 'partiel' | 'unpaid' } {
  const total = Number(v.total) || ((Number(v.pu || 0) * Number(v.qty || 1)) + (Number(v.fraisLivraison) || 0));
  const paye = getMontantPayeVente(v);
  if (paye >= total && total > 0) return { label: '✅ Payé', type: 'paye' };
  if (paye > 0) return { label: `🟡 Acompte (${paye.toLocaleString('fr-FR')} / ${total.toLocaleString('fr-FR')} Ar)`, type: 'partiel' };
  return { label: '⏳ Crédit', type: 'unpaid' };
}

/**
 * Calcul des statistiques financières d'un fournisseur (Total dépensé, Acomptes versés, Solde restant dû)
 */
export interface FournisseurStat {
  totalDepenseAr: number;
  totalPayeAr: number;
  totalDuAr: number;
  totalPieces: number;
  nbCommandes: number;
  dernierAchatDate?: string;
  premierAchatDate?: string;
}

export function calculerStatsFournisseur(fournisseurId: string, commandes: any[]): FournisseurStat {
  const cmds = (commandes || []).filter((c: any) => c.fournisseurId === fournisseurId);
  
  let totalDepenseAr = 0;
  let totalPayeAr = 0;
  let totalDuAr = 0;
  let totalPieces = 0;
  let dernierAchatDate: string | undefined;
  let premierAchatDate: string | undefined;

  cmds.forEach((c: any) => {
    const totalCmd = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
    const payeCmd = getMontantPayeMarchandise(c);
    const duCmd = getRestePayeMarchandise(c);
    const qty = Number(c.qty) || 0;

    totalDepenseAr += totalCmd;
    totalPayeAr += payeCmd;
    totalDuAr += duCmd;
    totalPieces += qty;

    const dateStr = c.dateAchat || c.date;
    if (dateStr) {
      if (!dernierAchatDate || new Date(dateStr) > new Date(dernierAchatDate)) {
        dernierAchatDate = dateStr;
      }
      if (!premierAchatDate || new Date(dateStr) < new Date(premierAchatDate)) {
        premierAchatDate = dateStr;
      }
    }
  });

  return {
    totalDepenseAr,
    totalPayeAr,
    totalDuAr,
    totalPieces,
    nbCommandes: cmds.length,
    dernierAchatDate,
    premierAchatDate,
  };
}

/**
 * Calcul de l'historique d'évolution des prix d'un produit chez un fournisseur
 */
export interface PointHistoriquePrix {
  commandeId: string;
  date: string;
  qty: number;
  puRmb: number;
  puAr: number;
  tauxRmb?: number;
  variationPct?: number; // % par rapport au prix précédent (ex: +5.2% ou -10%)
  tendance: 'hausse' | 'baisse' | 'stable' | 'initial';
}

export interface HistoriquePrixProduit {
  productId: string;
  productNom: string;
  productCouleur?: string;
  dernierPrixRmb: number;
  dernierPrixAr: number;
  minPrixAr: number;
  maxPrixAr: number;
  variationGlobalePct: number; // vs premier achat
  points: PointHistoriquePrix[];
}

export function calculerHistoriquePrixFournisseur(
  fournisseurId: string,
  commandes: any[],
  products: any[]
): HistoriquePrixProduit[] {
  const cmds = (commandes || []).filter((c: any) => c.fournisseurId === fournisseurId && c.productId);
  if (cmds.length === 0) return [];

  // Grouper par produit
  const parProduit: Record<string, any[]> = {};
  cmds.forEach((c: any) => {
    if (!parProduit[c.productId]) parProduit[c.productId] = [];
    parProduit[c.productId].push(c);
  });

  const list: HistoriquePrixProduit[] = [];

  Object.entries(parProduit).forEach(([pId, pCmds]) => {
    const product = (products || []).find((p: any) => p.id === pId);
    const pNom = product ? product.nom : 'Produit supprimé';
    const pCouleur = product?.couleur;

    // Trier chronologiquement (du plus ancien au plus récent)
    const sorted = [...pCmds].sort(
      (a: any, b: any) => new Date(a.dateAchat || 0).getTime() - new Date(b.dateAchat || 0).getTime()
    );

    const points: PointHistoriquePrix[] = [];
    let prevPuAr: number | null = null;

    sorted.forEach((c: any) => {
      const puRmb = Number(c.puDevise || c.puRmb || 0);
      const puAr = Number(c.pu || 0);
      const qty = Number(c.qty || 1);
      const date = c.dateAchat || c.date || new Date().toISOString();

      let variationPct: number | undefined;
      let tendance: 'hausse' | 'baisse' | 'stable' | 'initial' = 'initial';

      if (prevPuAr !== null && prevPuAr > 0 && puAr > 0) {
        const diff = puAr - prevPuAr;
        variationPct = Math.round((diff / prevPuAr) * 1000) / 10;
        if (variationPct > 0.5) tendance = 'hausse';
        else if (variationPct < -0.5) tendance = 'baisse';
        else tendance = 'stable';
      }

      points.push({
        commandeId: c.id,
        date,
        qty,
        puRmb,
        puAr,
        tauxRmb: c.tauxRmb,
        variationPct,
        tendance,
      });

      if (puAr > 0) prevPuAr = puAr;
    });

    const pricesAr = points.map(pt => pt.puAr).filter(p => p > 0);
    const minPrixAr = pricesAr.length > 0 ? Math.min(...pricesAr) : 0;
    const maxPrixAr = pricesAr.length > 0 ? Math.max(...pricesAr) : 0;
    const firstPuAr = points[0]?.puAr || 0;
    const lastPuAr = points[points.length - 1]?.puAr || 0;
    const lastPuRmb = points[points.length - 1]?.puRmb || 0;

    let variationGlobalePct = 0;
    if (firstPuAr > 0 && lastPuAr > 0) {
      variationGlobalePct = Math.round(((lastPuAr - firstPuAr) / firstPuAr) * 1000) / 10;
    }

    list.push({
      productId: pId,
      productNom: pNom,
      productCouleur: pCouleur,
      dernierPrixRmb: lastPuRmb,
      dernierPrixAr: lastPuAr,
      minPrixAr,
      maxPrixAr,
      variationGlobalePct,
      // On retourne les points récents d'abord pour l'affichage de l'historique
      points: [...points].reverse(),
    });
  });

  // Trier par nombre de commandes / pertinence
  return list.sort((a, b) => b.points.length - a.points.length);
}
