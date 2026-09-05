import { ArticleAnalysisItem, SourceAnalysisItem, AnalysisGlobalKpis, PeriodeFiltre } from './types';
import { Product } from '../stock/types';
import { Commande } from '../achat/types';
import { Vente } from '../ventes/types';
import { SOURCES } from '../constants';

/**
 * Vérifie si une date tombe dans la période sélectionnée
 */
export function isDateInPeriode(
  dateStr: string | undefined | null,
  periode: PeriodeFiltre,
  dateDebut?: string,
  dateFin?: string
): boolean {
  if (periode === 'all' || !dateStr) return true;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;

  const now = new Date();

  if (periode === '30j') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return d >= thirtyDaysAgo && d <= now;
  }

  if (periode === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  if (periode === 'quarter') {
    const currentQ = Math.floor(now.getMonth() / 3);
    const dateQ = Math.floor(d.getMonth() / 3);
    return d.getFullYear() === now.getFullYear() && currentQ === dateQ;
  }

  if (periode === 'year') {
    return d.getFullYear() === now.getFullYear();
  }

  if (periode === 'custom') {
    if (dateDebut) {
      const start = new Date(dateDebut);
      if (!isNaN(start.getTime()) && d < start) return false;
    }
    if (dateFin) {
      const end = new Date(dateFin);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
    }
    return true;
  }

  return true;
}

/**
 * Normalise le nom de la source d'achat
 */
export function normaliserSource(sourceRaw?: string | null): string {
  if (!sourceRaw || !sourceRaw.trim()) return 'Autre / Non spécifié';
  const clean = sourceRaw.trim();
  const foundStandard = SOURCES.find(s => s.toLowerCase() === clean.toLowerCase());
  return foundStandard || clean;
}

/**
 * Calcule l'analyse détaillée par article (Vente selon Achat)
 */
export function computeArticlesAnalysis(
  products: Product[] = [],
  commandes: Commande[] = [],
  ventes: Vente[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 },
  periode: PeriodeFiltre = 'all',
  dateDebut?: string,
  dateFin?: string
): ArticleAnalysisItem[] {
  const tauxRmbDefaut = devises?.rmb || 680;

  // Filtrage préliminaire des ventes et commandes par période
  const filteredCommandes = commandes.filter(c => {
    const d = c.dateCommande || c.dateAchat || c.date || (c as any).dateCreation;
    return isDateInPeriode(d, periode, dateDebut, dateFin);
  });

  const filteredVentes = ventes.filter(v => {
    const d = v.date || v.dateEncaissement || (v as any).dateCreation;
    return isDateInPeriode(d, periode, dateDebut, dateFin);
  });

  // Regroupement rapide par productId
  const cmdsByProduct = new Map<string, Commande[]>();
  filteredCommandes.forEach(c => {
    if (!c.productId) return;
    if (!cmdsByProduct.has(c.productId)) cmdsByProduct.set(c.productId, []);
    cmdsByProduct.get(c.productId)!.push(c);
  });

  const ventesByProduct = new Map<string, Vente[]>();
  filteredVentes.forEach(v => {
    if (!v.productId) return;
    if (!ventesByProduct.has(v.productId)) ventesByProduct.set(v.productId, []);
    ventesByProduct.get(v.productId)!.push(v);
  });

  return products.map(p => {
    const pCmds = cmdsByProduct.get(p.id) || [];
    const pVentes = ventesByProduct.get(p.id) || [];

    // --- ANALYSE DES ACHATS ---
    let qtyAchetee = 0;
    let totalDepenseAchatAr = 0;
    let totalDepenseAchatRmb = 0;
    let totalFraisChineAr = 0;
    let totalFretAr = 0;

    const sourceMap = new Map<string, { qty: number; montantAr: number }>();

    pCmds.forEach(c => {
      const qty = Math.max(1, Number(c.qty) || 1);
      qtyAchetee += Number(c.qty) || 0;

      const taux = Number(c.tauxRmb) || (c.tauxRmbPondereApplique) || tauxRmbDefaut;

      // Prix unitaire d'achat
      let puAr = 0;
      let puRmbVal = 0;
      if (c.pu !== undefined && c.pu !== null && Number(c.pu) > 0) {
        puAr = Number(c.pu);
        puRmbVal = puAr / taux;
      } else if (c.puDevise !== undefined && c.puDevise !== null && Number(c.puDevise) > 0) {
        puRmbVal = Number(c.puDevise);
        puAr = Math.round(puRmbVal * taux);
      } else if ((c as any).puRmb !== undefined && Number((c as any).puRmb) > 0) {
        puRmbVal = Number((c as any).puRmb);
        puAr = Math.round(puRmbVal * taux);
      } else if (c.total !== undefined && Number(c.total) > 0) {
        puAr = Math.round(Number(c.total) / qty);
        puRmbVal = puAr / taux;
      }

      // Frais internes Chine
      let fraisChine = 0;
      if (c.fraisLivraisonChine && Number(c.fraisLivraisonChine) > 0) {
        fraisChine = Number(c.fraisLivraisonChine);
      } else if (c.fraisLivraisonChineDevise && Number(c.fraisLivraisonChineDevise) > 0) {
        fraisChine = Math.round(Number(c.fraisLivraisonChineDevise) * taux);
      } else if (c.fraisLivraison && Number(c.fraisLivraison) > 0) {
        fraisChine = Number(c.fraisLivraison);
      }

      const totalCmdMarchandise = (puAr * qty) + fraisChine;
      const fretCmd = Number(c.fraisTransport || c.fretEstimeAr) || 0;
      const transportLocal = Number(c.fraisTransportLocal) || 0;

      const totalCmdAr = totalCmdMarchandise + fretCmd + transportLocal;
      totalDepenseAchatAr += totalCmdAr;
      totalDepenseAchatRmb += (puRmbVal * qty) + (fraisChine / taux);
      totalFraisChineAr += fraisChine;
      totalFretAr += (fretCmd + transportLocal);

      // Sources
      const srcName = normaliserSource(c.source);
      if (!sourceMap.has(srcName)) {
        sourceMap.set(srcName, { qty: 0, montantAr: 0 });
      }
      const sItem = sourceMap.get(srcName)!;
      sItem.qty += Number(c.qty) || 0;
      sItem.montantAr += totalCmdAr;
    });

    // Fallbacks si aucune commande passée pour ce produit
    let prixAchatUnitaireMoyenAr = 0;
    let fraisChineUnitaireMoyenAr = 0;
    let fretUnitaireMoyenAr = 0;
    let coutRevientUnitaireAr = 0;

    if (qtyAchetee > 0) {
      prixAchatUnitaireMoyenAr = Math.round((totalDepenseAchatAr - totalFraisChineAr - totalFretAr) / qtyAchetee);
      fraisChineUnitaireMoyenAr = Math.round(totalFraisChineAr / qtyAchetee);
      fretUnitaireMoyenAr = Math.round(totalFretAr / qtyAchetee);
      coutRevientUnitaireAr = Math.round(totalDepenseAchatAr / qtyAchetee);
    } else {
      const fallbackAchat = Number(p.prixAchatAr) || Number(p.prixAchat) || (Number(p.puRmb || 0) * tauxRmbDefaut) || 0;
      const fallbackCoutRendu = Number(p.coutTotalRenduAr) || 0;
      prixAchatUnitaireMoyenAr = Math.round(fallbackAchat);
      coutRevientUnitaireAr = fallbackCoutRendu > 0 ? Math.round(fallbackCoutRendu) : prixAchatUnitaireMoyenAr;
      fretUnitaireMoyenAr = coutRevientUnitaireAr > prixAchatUnitaireMoyenAr ? (coutRevientUnitaireAr - prixAchatUnitaireMoyenAr) : 0;
    }

    // --- ANALYSE DES VENTES ---
    const nbVentes = pVentes.length;
    let qtyVendue = 0;
    let caTotalAr = 0;

    pVentes.forEach(v => {
      const q = Number(v.qty) || 0;
      qtyVendue += q;
      const pu = Number(v.pu) || (v.total && q > 0 ? Number(v.total) / q : Number(p.prixVente) || 0);
      caTotalAr += (pu * q);
    });

    const prixVenteUnitaireMoyenAr = qtyVendue > 0 ? Math.round(caTotalAr / qtyVendue) : (Number(p.prixVente) || 0);

    // --- MARGE & COGS ---
    const cogsAr = Math.round(qtyVendue * coutRevientUnitaireAr);
    const margeBruteAr = Math.round(caTotalAr - cogsAr);
    const tauxMargePct = caTotalAr > 0 ? Math.round((margeBruteAr / caTotalAr) * 1000) / 10 : 0;
    const tauxMarquePct = cogsAr > 0 ? Math.round((margeBruteAr / cogsAr) * 1000) / 10 : 0;
    const coefficientMultiplicateur = coutRevientUnitaireAr > 0 ? Math.round((prixVenteUnitaireMoyenAr / coutRevientUnitaireAr) * 100) / 100 : 0;

    // --- STOCK & ÉCOULEMENT ---
    const stockActuel = Number(p.stock) || 0;
    const baseEcoulement = qtyAchetee > 0 ? qtyAchetee : (qtyVendue + stockActuel);
    const tauxEcoulementPct = baseEcoulement > 0 ? Math.min(100, Math.round((qtyVendue / baseEcoulement) * 1000) / 10) : 0;
    const valeurStockCoutAr = Math.round(stockActuel * coutRevientUnitaireAr);
    const margePotentielleStockAr = Math.round(stockActuel * (prixVenteUnitaireMoyenAr - coutRevientUnitaireAr));

    // Statut rentabilité
    let statutRentabilite: ArticleAnalysisItem['statutRentabilite'] = 'sans_vente';
    if (qtyVendue > 0) {
      if (margeBruteAr < 0) statutRentabilite = 'negative';
      else if (tauxMargePct < 20) statutRentabilite = 'faible';
      else if (tauxMargePct < 35) statutRentabilite = 'moyenne';
      else if (tauxMargePct < 55) statutRentabilite = 'bonne';
      else statutRentabilite = 'excellente';
    }

    const sourcesUtilisees = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      qty: data.qty,
      montantAr: Math.round(data.montantAr)
    })).sort((a, b) => b.montantAr - a.montantAr);

    return {
      id: p.id,
      nom: p.nom || 'Sans nom',
      reference: p.reference,
      categorie: p.categorie || 'Autre',
      couleur: p.couleur,
      image: (p.images && p.images[0]) ? p.images[0] : (p as any).image,
      nbCommandesAchat: pCmds.length,
      qtyAchetee,
      totalDepenseAchatAr: Math.round(totalDepenseAchatAr),
      totalDepenseAchatRmb: Math.round(totalDepenseAchatRmb * 100) / 100,
      prixAchatUnitaireMoyenAr,
      fraisChineUnitaireMoyenAr,
      fretUnitaireMoyenAr,
      coutRevientUnitaireAr,
      nbVentes,
      qtyVendue,
      caTotalAr: Math.round(caTotalAr),
      prixVenteUnitaireMoyenAr,
      cogsAr,
      margeBruteAr,
      tauxMargePct,
      tauxMarquePct,
      coefficientMultiplicateur,
      stockActuel,
      tauxEcoulementPct,
      valeurStockCoutAr,
      margePotentielleStockAr,
      statutRentabilite,
      sourcesUtilisees,
    };
  });
}

/**
 * Calcule l'analyse par Source d'Achat (1688, Taobao, PDD, etc.)
 * Exigence explicite : "combien de commande par source et combien d'argent par source d'achat"
 */
export function computeSourcesAnalysis(
  commandes: Commande[] = [],
  products: Product[] = [],
  ventes: Vente[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 },
  periode: PeriodeFiltre = 'all',
  dateDebut?: string,
  dateFin?: string
): SourceAnalysisItem[] {
  const tauxRmbDefaut = devises?.rmb || 680;

  // Filtrer commandes par période
  const filteredCommandes = commandes.filter(c => {
    const d = c.dateCommande || c.dateAchat || c.date || (c as any).dateCreation;
    return isDateInPeriode(d, periode, dateDebut, dateFin);
  });

  const totalCommandesAll = filteredCommandes.length;

  // Regroupement par source
  const sourceGroups = new Map<string, Commande[]>();
  filteredCommandes.forEach(c => {
    const s = normaliserSource(c.source);
    if (!sourceGroups.has(s)) sourceGroups.set(s, []);
    sourceGroups.get(s)!.push(c);
  });

  // Map des produits pour calculer les performances aval
  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.id, p));

  // Map des ventes par produit
  const filteredVentes = ventes.filter(v => {
    const d = v.date || v.dateEncaissement || (v as any).dateCreation;
    return isDateInPeriode(d, periode, dateDebut, dateFin);
  });

  const ventesByProduct = new Map<string, Vente[]>();
  filteredVentes.forEach(v => {
    if (!v.productId) return;
    if (!ventesByProduct.has(v.productId)) ventesByProduct.set(v.productId, []);
    ventesByProduct.get(v.productId)!.push(v);
  });

  // Calcul du montant total global pour calculer la part en % de chaque source
  let grandTotalDepenseAr = 0;

  const preCalculated = Array.from(sourceGroups.entries()).map(([source, cmds]) => {
    const nbCommandes = cmds.length;
    let montantTotalAr = 0;
    let montantTotalRmb = 0;
    let qtyTotalePieces = 0;
    const statutsBreakdown: Record<string, number> = {};
    const productCountMap = new Map<string, { nom: string; qty: number; montantAr: number }>();

    cmds.forEach(c => {
      const qty = Math.max(1, Number(c.qty) || 1);
      qtyTotalePieces += Number(c.qty) || 0;

      // Décompte des statuts
      const st = c.statut || 'Commandé';
      statutsBreakdown[st] = (statutsBreakdown[st] || 0) + 1;

      const taux = Number(c.tauxRmb) || (c.tauxRmbPondereApplique) || tauxRmbDefaut;

      // Calcul coût
      let puAr = 0;
      let puRmbVal = 0;
      if (c.pu !== undefined && c.pu !== null && Number(c.pu) > 0) {
        puAr = Number(c.pu);
        puRmbVal = puAr / taux;
      } else if (c.puDevise !== undefined && c.puDevise !== null && Number(c.puDevise) > 0) {
        puRmbVal = Number(c.puDevise);
        puAr = Math.round(puRmbVal * taux);
      } else if ((c as any).puRmb !== undefined && Number((c as any).puRmb) > 0) {
        puRmbVal = Number((c as any).puRmb);
        puAr = Math.round(puRmbVal * taux);
      } else if (c.total !== undefined && Number(c.total) > 0) {
        puAr = Math.round(Number(c.total) / qty);
        puRmbVal = puAr / taux;
      }

      let fraisChine = 0;
      if (c.fraisLivraisonChine && Number(c.fraisLivraisonChine) > 0) {
        fraisChine = Number(c.fraisLivraisonChine);
      } else if (c.fraisLivraisonChineDevise && Number(c.fraisLivraisonChineDevise) > 0) {
        fraisChine = Math.round(Number(c.fraisLivraisonChineDevise) * taux);
      } else if (c.fraisLivraison && Number(c.fraisLivraison) > 0) {
        fraisChine = Number(c.fraisLivraison);
      }

      const totalCmdMarchandise = (puAr * qty) + fraisChine;
      const fretCmd = Number(c.fraisTransport || c.fretEstimeAr) || 0;
      const transportLocal = Number(c.fraisTransportLocal) || 0;

      const totalCmdAr = totalCmdMarchandise + fretCmd + transportLocal;
      montantTotalAr += totalCmdAr;
      montantTotalRmb += (puRmbVal * qty) + (fraisChine / taux);

      // Regroupement des articles sur cette source
      const pId = c.productId || 'inconnu';
      const pObj = productMap.get(pId);
      const nomP = c.productNom || pObj?.nom || 'Article';
      if (!productCountMap.has(pId)) {
        productCountMap.set(pId, { nom: nomP, qty: 0, montantAr: 0 });
      }
      const pr = productCountMap.get(pId)!;
      pr.qty += Number(c.qty) || 0;
      pr.montantAr += totalCmdAr;
    });

    grandTotalDepenseAr += montantTotalAr;

    // Performance aval (CA et Marge des articles achetés sur cette source)
    let caVentesGeneresAr = 0;
    let cogsVentesGeneresAr = 0;

    productCountMap.forEach((data, pId) => {
      const pVentes = ventesByProduct.get(pId) || [];
      const prod = productMap.get(pId);
      const coutUnit = data.qty > 0 ? (data.montantAr / data.qty) : (Number(prod?.prixAchat) || 0);

      pVentes.forEach(v => {
        const qV = Number(v.qty) || 0;
        const puV = Number(v.pu) || (v.total && qV > 0 ? Number(v.total) / qV : Number(prod?.prixVente) || 0);
        caVentesGeneresAr += (puV * qV);
        cogsVentesGeneresAr += (coutUnit * qV);
      });
    });

    const margeBruteGeneresAr = caVentesGeneresAr - cogsVentesGeneresAr;
    const tauxMargeMoyenPct = caVentesGeneresAr > 0 ? Math.round((margeBruteGeneresAr / caVentesGeneresAr) * 1000) / 10 : 0;

    const articlesTop = Array.from(productCountMap.entries()).map(([id, d]) => ({
      id,
      nom: d.nom,
      qty: d.qty,
      montantAr: Math.round(d.montantAr),
    })).sort((a, b) => b.montantAr - a.montantAr);

    return {
      source,
      nbCommandes,
      montantTotalAr: Math.round(montantTotalAr),
      montantTotalRmb: Math.round(montantTotalRmb * 100) / 100,
      panierMoyenAr: nbCommandes > 0 ? Math.round(montantTotalAr / nbCommandes) : 0,
      qtyTotalePieces,
      coutMoyenParPieceAr: qtyTotalePieces > 0 ? Math.round(montantTotalAr / qtyTotalePieces) : 0,
      statutsBreakdown,
      nbArticlesDifferents: productCountMap.size,
      articlesTop,
      caVentesGeneresAr: Math.round(caVentesGeneresAr),
      cogsVentesGeneresAr: Math.round(cogsVentesGeneresAr),
      margeBruteGeneresAr: Math.round(margeBruteGeneresAr),
      tauxMargeMoyenPct,
    };
  });

  // Calcul des pourcentages de parts de marché
  return preCalculated.map(item => ({
    ...item,
    partNbCommandesPct: totalCommandesAll > 0 ? Math.round((item.nbCommandes / totalCommandesAll) * 1000) / 10 : 0,
    partBudgetPct: grandTotalDepenseAr > 0 ? Math.round((item.montantTotalAr / grandTotalDepenseAr) * 1000) / 10 : 0,
  })).sort((a, b) => b.montantTotalAr - a.montantTotalAr);
}

/**
 * Calcule les indicateurs clés de performance globaux
 */
export function computeGlobalKpis(
  articles: ArticleAnalysisItem[],
  sources: SourceAnalysisItem[]
): AnalysisGlobalKpis {
  let totalAchatsAr = 0;
  let totalAchatsRmb = 0;
  let totalVentesAr = 0;
  let totalPiecesVendues = 0;
  let totalCogsAr = 0;
  let totalCommandesAchat = 0;

  sources.forEach(s => {
    totalAchatsAr += s.montantTotalAr;
    totalAchatsRmb += s.montantTotalRmb;
    totalCommandesAchat += s.nbCommandes;
  });

  let maxMarge = -Infinity;
  let articleTopMarge: AnalysisGlobalKpis['articleTopMarge'] = null;
  let maxCA = -Infinity;
  let articleTopCA: AnalysisGlobalKpis['articleTopCA'] = null;

  let sumTauxEcoulement = 0;
  let nbArticlesWithStock = 0;

  articles.forEach(a => {
    totalVentesAr += a.caTotalAr;
    totalPiecesVendues += a.qtyVendue;
    totalCogsAr += a.cogsAr;

    if (a.margeBruteAr > maxMarge && a.qtyVendue > 0) {
      maxMarge = a.margeBruteAr;
      articleTopMarge = { id: a.id, nom: a.nom, margeAr: a.margeBruteAr };
    }

    if (a.caTotalAr > maxCA && a.qtyVendue > 0) {
      maxCA = a.caTotalAr;
      articleTopCA = { id: a.id, nom: a.nom, caAr: a.caTotalAr };
    }

    if (a.qtyAchetee > 0 || a.qtyVendue > 0) {
      sumTauxEcoulement += a.tauxEcoulementPct;
      nbArticlesWithStock++;
    }
  });

  const margeBruteTotaleAr = totalVentesAr - totalCogsAr;
  const tauxMargeMoyenPct = totalVentesAr > 0 ? Math.round((margeBruteTotaleAr / totalVentesAr) * 1000) / 10 : 0;
  const tauxEcoulementGlobalPct = nbArticlesWithStock > 0 ? Math.round((sumTauxEcoulement / nbArticlesWithStock) * 10) / 10 : 0;

  // Source top budget
  let sourceTopBudget: AnalysisGlobalKpis['sourceTopBudget'] = null;
  if (sources.length > 0) {
    const topS = sources[0];
    sourceTopBudget = {
      source: topS.source,
      montantAr: topS.montantTotalAr,
      pct: topS.partBudgetPct
    };
  }

  // Source top volume
  let sourceTopVolume: AnalysisGlobalKpis['sourceTopVolume'] = null;
  if (sources.length > 0) {
    const topVol = [...sources].sort((a, b) => b.nbCommandes - a.nbCommandes)[0];
    sourceTopVolume = {
      source: topVol.source,
      nbCommandes: topVol.nbCommandes,
      pct: topVol.partNbCommandesPct
    };
  }

  return {
    totalAchatsAr: Math.round(totalAchatsAr),
    totalAchatsRmb: Math.round(totalAchatsRmb * 100) / 100,
    totalCommandesAchat,
    totalVentesAr: Math.round(totalVentesAr),
    totalPiecesVendues,
    totalCogsAr: Math.round(totalCogsAr),
    margeBruteTotaleAr: Math.round(margeBruteTotaleAr),
    tauxMargeMoyenPct,
    tauxEcoulementGlobalPct,
    sourceTopBudget,
    sourceTopVolume,
    articleTopMarge,
    articleTopCA,
  };
}

/**
 * Formatage monétaire convivial
 */
export function formatAr(val: number = 0): string {
  return `${Math.round(val).toLocaleString('fr-FR')} Ar`;
}

export function formatRmb(val: number = 0): string {
  return `${(Math.round(val * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ¥`;
}

export function formatPct(val: number = 0): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}
