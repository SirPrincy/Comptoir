import { PnlPeriode, PnlData, FilteredPnlData } from './types';
import { Product } from '../stock/types';
import { Vente } from '../ventes/types';
import { Commande } from '../achat/types';
import { Mouvement } from '../Tresorerie/types';
import { isRetraitCapitalOuPerso } from '../Tresorerie/tresorerieUtils';
import { NoteDeFrais } from '../frais/NotesDeFrais';
import { Immobilisation } from '../immobilisations/types';
import { calculerPlanAmortissementMensuel } from '../immobilisations/immoUtils';

// Calcul du coût de revient d'un produit (Achat unitaire moyen + Transport Chine + Fret moyen)
export function getProductCostBreakdown(
  productId: string,
  products: Product[] = [],
  commandes: Commande[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 }
): {
  basePu: number;
  articlesPu: number;
  fraisChinePu: number;
  fretPu: number;
  transportLocalPu: number;
  coutRevient: number;
} {
  const productCmds = commandes.filter((c) => c.productId === productId && c.statut !== 'À explorer');

  let basePu = 0;
  let articlesPu = 0;
  let fraisChinePu = 0;
  let fretPu = 0;
  let transportLocalPu = 0;
  let coutRevient = 0;

  if (productCmds.length > 0) {
    let totalArticles = 0;
    let totalFraisChine = 0;
    let totalMarchandise = 0;
    let totalQty = 0;
    let totalFret = 0;
    let totalTransportLocal = 0;

    productCmds.forEach((c: any) => {
      const qty = Math.max(1, Number(c.qty) || 1);
      const taux = Number(c.tauxRmb) || (devises?.rmb) || 680;

      // 1. Prix unitaire des articles en Ariary
      let puAr = 0;
      if (c.pu !== undefined && c.pu !== null && !isNaN(Number(c.pu)) && Number(c.pu) > 0) {
        puAr = Number(c.pu);
      } else if (c.puDevise !== undefined && c.puDevise !== null && !isNaN(Number(c.puDevise)) && Number(c.puDevise) > 0) {
        puAr = Math.round(Number(c.puDevise) * taux);
      } else if (c.puRmb !== undefined && c.puRmb !== null && !isNaN(Number(c.puRmb)) && Number(c.puRmb) > 0) {
        puAr = Math.round(Number(c.puRmb) * taux);
      }

      // 2. Frais transport fournisseur Chine vers entrepôt Chine (livraison locale interne Chine)
      let fraisChine = 0;
      if (c.fraisLivraisonChine !== undefined && c.fraisLivraisonChine !== null && !isNaN(Number(c.fraisLivraisonChine)) && Number(c.fraisLivraisonChine) > 0) {
        fraisChine = Number(c.fraisLivraisonChine);
      } else if (c.fraisLivraisonChineDevise !== undefined && c.fraisLivraisonChineDevise !== null && !isNaN(Number(c.fraisLivraisonChineDevise)) && Number(c.fraisLivraisonChineDevise) > 0) {
        fraisChine = Math.round(Number(c.fraisLivraisonChineDevise) * taux);
      } else if (c.fraisLivraison !== undefined && c.fraisLivraison !== null && !isNaN(Number(c.fraisLivraison)) && Number(c.fraisLivraison) > 0) {
        fraisChine = Number(c.fraisLivraison);
      }

      // 3. Montant total payé au fournisseur pour la marchandise (articles + transport interne Chine)
      let cmdTotalMarchandise = 0;
      if (c.total !== undefined && c.total !== null && !isNaN(Number(c.total)) && Number(c.total) > 0) {
        cmdTotalMarchandise = Number(c.total);
      } else {
        cmdTotalMarchandise = (puAr * qty) + fraisChine;
      }

      // Si le total renseigné dépasse les articles purs et que fraisChine n'était pas séparé
      if (fraisChine === 0 && cmdTotalMarchandise > (puAr * qty) && (puAr * qty) > 0) {
        fraisChine = cmdTotalMarchandise - (puAr * qty);
      }
      const cmdArticles = Math.max(0, cmdTotalMarchandise - fraisChine);

      const fret = Number(c.fraisTransport || c.fretEstimeAr) || 0;
      const transportLocal = Number(c.fraisTransportLocal) || 0;

      totalArticles += cmdArticles;
      totalFraisChine += fraisChine;
      totalMarchandise += cmdTotalMarchandise;
      totalQty += qty;
      totalFret += fret;
      totalTransportLocal += transportLocal;
    });

    articlesPu = totalQty > 0 ? totalArticles / totalQty : 0;
    fraisChinePu = totalQty > 0 ? totalFraisChine / totalQty : 0;
    basePu = totalQty > 0 ? totalMarchandise / totalQty : 0;
    fretPu = totalQty > 0 ? totalFret / totalQty : 0;
    transportLocalPu = totalQty > 0 ? totalTransportLocal / totalQty : 0;
    coutRevient = basePu + fretPu + transportLocalPu;
  } else {
    const p = products.find((pr) => pr.id === productId);
    const prixAchat = Number(p?.prixAchatAr) || Number(p?.prixAchat) || (Number(p?.puRmb || 0) * (devises?.rmb || 680)) || 0;
    const coutRendu = Number(p?.coutTotalRenduAr) || 0;
    const fretEstime = coutRendu > prixAchat ? coutRendu - prixAchat : 0;

    articlesPu = prixAchat;
    fraisChinePu = 0;
    basePu = prixAchat;
    fretPu = fretEstime;
    transportLocalPu = 0;
    coutRevient = coutRendu > 0 ? coutRendu : prixAchat;
  }

  return {
    basePu,
    articlesPu,
    fraisChinePu,
    fretPu,
    transportLocalPu,
    coutRevient,
  };
}

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Libellé clair de la période sélectionnée
export function getPeriodeLabel(
  periode: PnlPeriode,
  dateDebut?: string,
  dateFin?: string
): string {
  const now = new Date();
  if (periode === 'month') {
    return `${MOIS_NOMS[now.getMonth()]} ${now.getFullYear()}`;
  }
  if (periode === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `T${q} ${now.getFullYear()}`;
  }
  if (periode === 'year') {
    return `Année ${now.getFullYear()}`;
  }
  if (periode === 'custom') {
    if (dateDebut && dateFin) {
      const parsed1 = new Date(dateDebut);
      const parsed2 = new Date(dateFin);
      const d1 = !isNaN(parsed1.getTime()) ? parsed1.toLocaleDateString('fr-FR') : dateDebut;
      const d2 = !isNaN(parsed2.getTime()) ? parsed2.toLocaleDateString('fr-FR') : dateFin;
      return `${d1} au ${d2}`;
    }
    return 'Période personnalisée';
  }
  return 'Toute la période';
}

// Calcul des bornes de la période précédente (M-1, T-1, N-1, plage glissante)
export function getPreviousPeriodeBounds(
  periode: PnlPeriode,
  dateDebut?: string,
  dateFin?: string
): { debut: Date | null; fin: Date | null; label: string } {
  const now = new Date();

  if (periode === 'month') {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const pYear = prevMonthDate.getFullYear();
    const pMonth = prevMonthDate.getMonth();
    const debut = new Date(pYear, pMonth, 1, 0, 0, 0, 0);
    const fin = new Date(pYear, pMonth + 1, 0, 23, 59, 59, 999);
    return {
      debut,
      fin,
      label: `M-1 (${MOIS_NOMS[pMonth]} ${pYear})`,
    };
  }

  if (periode === 'quarter') {
    const currentQ = Math.floor(now.getMonth() / 3);
    const prevQ = (currentQ + 3) % 4;
    const pYear = currentQ === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const debut = new Date(pYear, prevQ * 3, 1, 0, 0, 0, 0);
    const fin = new Date(pYear, (prevQ + 1) * 3, 0, 23, 59, 59, 999);
    return {
      debut,
      fin,
      label: `T-1 (T${prevQ + 1} ${pYear})`,
    };
  }

  if (periode === 'year') {
    const pYear = now.getFullYear() - 1;
    const debut = new Date(pYear, 0, 1, 0, 0, 0, 0);
    const fin = new Date(pYear, 11, 31, 23, 59, 59, 999);
    return {
      debut,
      fin,
      label: `N-1 (Année ${pYear})`,
    };
  }

  if (periode === 'custom' && dateDebut && dateFin) {
    const d1 = new Date(dateDebut);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(dateFin);
    d2.setHours(23, 59, 59, 999);
    const duration = d2.getTime() - d1.getTime();
    if (!isNaN(duration) && duration > 0) {
      const fin = new Date(d1.getTime() - 1);
      const debut = new Date(fin.getTime() - duration);
      const safeDateFmt = (d: Date) => d.toLocaleDateString('fr-FR');
      return {
        debut,
        fin,
        label: `Période préc. (${safeDateFmt(debut)} - ${safeDateFmt(fin)})`,
      };
    }
  }

  return { debut: null, fin: null, label: 'Période précédente' };
}

// Calcul d'évolution en % et en valeur
export function calcEvolution(
  current: number | undefined | null,
  previous: number | undefined | null,
  isCharge = false
): {
  diff: number;
  pct: number | null;
  formattedPct: string;
  trend: 'good' | 'bad' | 'neutral';
} {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  const diff = c - p;

  if (p === 0) {
    if (c === 0) {
      return { diff: 0, pct: 0, formattedPct: '0%', trend: 'neutral' };
    }
    const isGood = isCharge ? c < 0 : c > 0;
    return {
      diff,
      pct: null,
      formattedPct: isCharge ? (c > 0 ? '+Nouv.' : '-Nouv.') : (c > 0 ? '+Nouv.' : '-Nouv.'),
      trend: isGood ? 'good' : 'bad',
    };
  }

  const pct = (diff / Math.abs(p)) * 100;
  const formattedPct = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

  let trend: 'good' | 'bad' | 'neutral' = 'neutral';
  if (Math.abs(pct) < 0.05) {
    trend = 'neutral';
  } else if (isCharge) {
    trend = pct < 0 ? 'good' : 'bad'; // Pour les charges, une baisse est positive
  } else {
    trend = pct > 0 ? 'good' : 'bad'; // Pour les revenus/marges, une hausse est positive
  }

  return { diff, pct, formattedPct, trend };
}

// Calcul d'évolution en points de pourcentage (pour les marges %)
export function calcPointsEvolution(
  current: number | undefined | null,
  previous: number | undefined | null
): {
  diffPoints: number;
  formattedPoints: string;
  trend: 'good' | 'bad' | 'neutral';
} {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  const diffPoints = c - p;
  const formattedPoints = `${diffPoints >= 0 ? '+' : ''}${diffPoints.toFixed(1)} pts`;

  let trend: 'good' | 'bad' | 'neutral' = 'neutral';
  if (Math.abs(diffPoints) < 0.05) {
    trend = 'neutral';
  } else {
    trend = diffPoints > 0 ? 'good' : 'bad';
  }

  return { diffPoints, formattedPoints, trend };
}
export function getPeriodeBounds(
  periode: PnlPeriode,
  dateDebut?: string,
  dateFin?: string
): { debut: Date | null; fin: Date | null } {
  let debut: Date | null = null;
  let fin: Date | null = null;

  const now = new Date();
  if (periode === 'month') {
    debut = new Date(now.getFullYear(), now.getMonth(), 1);
    fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (periode === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    debut = new Date(now.getFullYear(), currentQuarter * 3, 1);
    fin = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
  } else if (periode === 'year') {
    debut = new Date(now.getFullYear(), 0, 1);
    fin = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (periode === 'custom') {
    if (dateDebut) {
      debut = new Date(dateDebut);
      debut.setHours(0, 0, 0, 0);
    }
    if (dateFin) {
      fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
    }
  }

  return { debut, fin };
}

// Filtrage des données par bornes de dates précises
export function filterPnlDataWithBounds(
  debut: Date | null,
  fin: Date | null,
  ventes: Vente[] = [],
  mouvements: Mouvement[] = [],
  frais: NoteDeFrais[] = []
): FilteredPnlData {
  const matchDate = (dateStr?: string) => {
    if (!debut && !fin) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (debut && d < debut) return false;
    if (fin && d > fin) return false;
    return true;
  };

  const periodVentes = (ventes || []).filter((v) => v && matchDate(v.date));
  const periodMouvements = (mouvements || []).filter((m) => m && matchDate(m.date));
  const periodFrais = (frais || []).filter((f) => f && matchDate(f.date));

  const safeDateFmt = (d: Date | null) => (d && !isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR') : '');

  return {
    ventes: periodVentes,
    mouvements: periodMouvements,
    frais: periodFrais,
    debutStr: debut ? safeDateFmt(debut) : 'Début des temps',
    finStr: fin ? safeDateFmt(fin) : 'Présent',
  };
}

// Filtrage des données par période
export function filterPnlData(
  periode: PnlPeriode,
  dateDebut: string,
  dateFin: string,
  ventes: Vente[] = [],
  mouvements: Mouvement[] = [],
  frais: NoteDeFrais[] = []
): FilteredPnlData {
  const { debut, fin } = getPeriodeBounds(periode, dateDebut, dateFin);
  return filterPnlDataWithBounds(debut, fin, ventes, mouvements, frais);
}

// 1. Calcul du Chiffre d'Affaires (CA)
export function calculerCA(ventes: Vente[] = []): number {
  return (ventes || []).reduce((sum: number, v) => {
    return sum + (Number(v?.total) || (Number(v?.pu || 0) * Number(v?.qty || 1)) || 0);
  }, 0);
}

// 2. Calcul du Coût des marchandises vendues (COGS)
export function calculerCogs(
  ventes: Vente[] = [],
  products: Product[] = [],
  commandes: Commande[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 }
): {
  costMarchandises: number;
  costArticlesSeuls: number;
  fraisTransportChineMarchandises: number;
  fretMarchandises: number;
  transportLocalMarchandises: number;
  cogs: number;
} {
  let costMarchandises = 0;
  let costArticlesSeuls = 0;
  let fraisTransportChineMarchandises = 0;
  let fretMarchandises = 0;
  let transportLocalMarchandises = 0;

  (ventes || []).forEach((v) => {
    if (!v) return;
    const { basePu, articlesPu, fraisChinePu, fretPu, transportLocalPu } = getProductCostBreakdown(v.productId, products, commandes, devises);
    const qty = Number(v.qty) || 1;
    costMarchandises += basePu * qty;
    costArticlesSeuls += articlesPu * qty;
    fraisTransportChineMarchandises += fraisChinePu * qty;
    fretMarchandises += fretPu * qty;
    transportLocalMarchandises += transportLocalPu * qty;
  });

  return {
    costMarchandises,
    costArticlesSeuls,
    fraisTransportChineMarchandises,
    fretMarchandises,
    transportLocalMarchandises,
    cogs: costMarchandises + fretMarchandises + transportLocalMarchandises,
  };
}

// 3. Calcul des Pertes et Gains de stock
export function calculerPertesEtGains(
  mouvements: Mouvement[] = [],
  products: Product[] = [],
  commandes: Commande[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 }
): {
  pertesStock: number;
  gainsInventaire: number;
  quantitePertesStock: number;
  detailsPertes: Array<{
    id: string;
    productNom: string;
    delta: number;
    motif: string;
    date: string;
    valTotale: number;
  }>;
} {
  let pertesStock = 0;
  let gainsInventaire = 0;
  let quantitePertesStock = 0;
  const detailsPertes: Array<{
    id: string;
    productNom: string;
    delta: number;
    motif: string;
    date: string;
    valTotale: number;
  }> = [];

  (mouvements || []).forEach((m) => {
    if (!m) return;
    const isAjustement = m.type === 'Ajustement Stock' || m.type === 'ajustement' || m.type === 'Ajustement' || m.type === 'perte' || m.type === 'Perte';
    const isDeltaMvt = m.productId && m.delta !== undefined && m.delta !== null;

    if (isAjustement || isDeltaMvt) {
      const delta = Number(m.delta) || 0;
      if (delta === 0) return;
      const { coutRevient } = getProductCostBreakdown(m.productId, products, commandes, devises);
      const valTotale = m.valeurTotaleAr !== undefined && m.valeurTotaleAr !== null && !isNaN(Number(m.valeurTotaleAr))
        ? Number(m.valeurTotaleAr)
        : (m.valeurUnitaireAr !== undefined && m.valeurUnitaireAr !== null && !isNaN(Number(m.valeurUnitaireAr)))
        ? Math.abs(delta) * Number(m.valeurUnitaireAr)
        : (Math.abs(delta) * (coutRevient || 0));

      const prodObj = products.find((p) => p.id === m.productId);
      const productNom = m.productNom || prodObj?.nom || 'Article';

      if (delta < 0) {
        pertesStock += valTotale;
        quantitePertesStock += Math.abs(delta);
        detailsPertes.push({
          id: m.id || `${m.productId}-${m.date}`,
          productNom,
          delta,
          motif: m.motif || 'Perte / Casse',
          date: m.date || '',
          valTotale: Math.round(valTotale),
        });
      } else if (delta > 0) {
        gainsInventaire += valTotale;
      }
    }
  });

  return {
    pertesStock,
    gainsInventaire,
    quantitePertesStock,
    detailsPertes,
  };
}

// 4. Calcul des Charges d'Exploitation (OPEX)
export function calculerOpex(
  frais: NoteDeFrais[] = [],
  mouvements: Mouvement[] = []
): {
  loyerEtCharges: number;
  marketingEtPub: number;
  fretEtLogistique: number;
  fraisGenerauxNotes: number;
  autresSorties: number;
} {
  let loyerEtCharges = 0;
  let marketingEtPub = 0;
  let fretEtLogistique = 0;
  let fraisGenerauxNotes = 0;
  let autresSorties = 0;

  // Prise en compte des Notes de Frais
  (frais || []).forEach((f) => {
    const mnt = Number(f.montant) || 0;
    const cat = f.categorie || '';

    if (cat === 'Loyer & Charges locatives') {
      loyerEtCharges += mnt;
    } else if (cat === 'Marketing & Publicité') {
      marketingEtPub += mnt;
    } else if (cat === 'Déplacements & Transport') {
      fretEtLogistique += mnt;
    } else {
      fraisGenerauxNotes += mnt;
    }
  });

  // Prise en compte des mouvements de trésorerie (sorties)
  (mouvements || []).forEach((m) => {
    if (m.type === 'sortie') {
      const montant = Number(m.montant) || 0;
      const tag = m.tag || '';

      // Exclusions : Remboursements emprunts, retraits de capital / prélèvements perso (flux de capitaux propres, PAS une charge !), stock achats, immobilisations, change devise, et notes de frais
      if (
        isRetraitCapitalOuPerso(m) ||
        tag === '#remboursement' ||
        tag === '#retrait-perso' ||
        tag === '#change-rmb' ||
        tag === '#materiel' ||
        tag === '#notes-de-frais' ||
        m.reference?.toLowerCase().includes('note de frais') ||
        m.description?.toLowerCase().includes('note de frais') ||
        m.reference?.toLowerCase().includes('immo') ||
        tag === '#stock-chine' ||
        m.reference?.toLowerCase().includes('achat stock') ||
        m.description?.toLowerCase().includes('achat de stock')
      ) {
        return;
      }

      if (tag === '#loyer-charges') {
        loyerEtCharges += montant;
      } else if (tag === '#marketing-pub') {
        marketingEtPub += montant;
      } else if (tag === '#fret-logistique') {
        fretEtLogistique += montant;
      } else if (tag === '#frais-bancaires' || tag === '#amortissement') {
        return;
      } else {
        autresSorties += montant;
      }
    }
  });

  return {
    loyerEtCharges,
    marketingEtPub,
    fretEtLogistique,
    fraisGenerauxNotes,
    autresSorties,
  };
}

// 5. Calcul de la Dotation aux amortissements
export function calculerDotationAmortissement(
  immobilisations: Immobilisation[] = [],
  periode: PnlPeriode,
  bounds: { debut: Date | null; fin: Date | null },
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 }
): number {
  let dotationAmortissement = 0;
  const { debut: debutPériode, fin: finPériode } = bounds;

  (immobilisations || []).forEach((imm: any) => {
    const prixAr = Number(imm.valeurOrigine) || Number(imm.prixAchatAr) || (Number(imm.prixAchatRmb || 0) * (devises?.rmb || 680)) || 0;
    if (isNaN(prixAr) || prixAr <= 0) return;

    const dureeAns = Number(imm.dureeAmortissement) || 5;
    const dateStr = imm.dateAchat || imm.dateAcquisition || imm.date;
    if (!dateStr) return;

    const plan = calculerPlanAmortissementMensuel(prixAr, dateStr, dureeAns);

    if (periode === 'all') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const pastRows = plan.filter(r => r.annee < currentYear || (r.annee === currentYear && r.mois <= currentMonth));
      dotationAmortissement += pastRows.reduce((sum, r) => sum + r.dotation, 0);
    } else if (debutPériode && finPériode) {
      const dYear = debutPériode.getFullYear();
      const dMonth = debutPériode.getMonth() + 1;
      const fYear = finPériode.getFullYear();
      const fMonth = finPériode.getMonth() + 1;

      const inRangeRows = plan.filter(r => {
        const afterStart = r.annee > dYear || (r.annee === dYear && r.mois >= dMonth);
        const beforeEnd = r.annee < fYear || (r.annee === fYear && r.mois <= fMonth);
        return afterStart && beforeEnd;
      });

      dotationAmortissement += inRangeRows.reduce((sum, r) => sum + r.dotation, 0);
    }
  });

  return dotationAmortissement;
}

// Orchestrateur : Calcul complet du P&L avec bornes explicites
export function computePnlWithBounds(
  filteredData: FilteredPnlData,
  periode: PnlPeriode,
  bounds: { debut: Date | null; fin: Date | null },
  products: Product[] = [],
  commandes: Commande[] = [],
  immobilisations: Immobilisation[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 }
): PnlData {
  const vts = (filteredData && filteredData.ventes) || [];
  const mvts = (filteredData && filteredData.mouvements) || [];
  const frs = (filteredData && filteredData.frais) || [];

  // 1. Chiffre d'Affaires
  const chiffreAffaires = calculerCA(vts);

  // 2. Coût des marchandises vendues (COGS)
  const {
    costMarchandises,
    costArticlesSeuls,
    fraisTransportChineMarchandises,
    fretMarchandises,
    transportLocalMarchandises,
    cogs,
  } = calculerCogs(vts, products, commandes, devises);

  // 3. Marge Brute
  const margeBrute = chiffreAffaires - cogs;
  const margeBrutePct = chiffreAffaires > 0 ? (margeBrute / chiffreAffaires) * 100 : 0;

  // 4. Pertes & Gains de stock
  const { pertesStock, gainsInventaire, quantitePertesStock, detailsPertes } = calculerPertesEtGains(mvts, products, commandes, devises);

  // 5. Charges d'Exploitation (OPEX)
  const { loyerEtCharges, marketingEtPub, fretEtLogistique, fraisGenerauxNotes, autresSorties } = calculerOpex(frs, mvts);
  const totalOpex = loyerEtCharges + marketingEtPub + fretEtLogistique + fraisGenerauxNotes + autresSorties + pertesStock - gainsInventaire;

  // 6. Dotation aux amortissements
  const dotationAmortissement = calculerDotationAmortissement(immobilisations, periode, bounds, devises);

  // 7. Résultat d'Exploitation (EBIT)
  const resultatExploitation = margeBrute - totalOpex - dotationAmortissement;

  // 8. Charges Financières
  const chargesFinancieres = mvts
    .filter((m) => m.type === 'sortie' && m.tag === '#frais-bancaires')
    .reduce((sum: number, m) => sum + (Number(m.montant) || 0), 0);

  // 9. Résultat Net & Marge Nette
  const resultatNet = resultatExploitation - chargesFinancieres;
  const margeNettePct = chiffreAffaires > 0 ? (resultatNet / chiffreAffaires) * 100 : 0;

  return {
    chiffreAffaires,
    costMarchandises,
    costArticlesSeuls,
    fraisTransportChineMarchandises,
    fretMarchandises,
    transportLocalMarchandises,
    cogs,
    margeBrute,
    margeBrutePct,
    loyerEtCharges,
    marketingEtPub,
    fretEtLogistique,
    fraisGenerauxNotes,
    autresSorties,
    pertesStock,
    gainsInventaire,
    quantitePertesStock,
    detailsPertes,
    totalOpex,
    dotationAmortissement,
    resultatExploitation,
    chargesFinancieres,
    resultatNet,
    margeNettePct,
  };
}

// Orchestrateur principal : Calcul complet du P&L
export function computePnl(
  filteredData: FilteredPnlData,
  periode: PnlPeriode,
  dateDebut: string,
  dateFin: string,
  products: Product[] = [],
  commandes: Commande[] = [],
  immobilisations: Immobilisation[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 }
): PnlData {
  const bounds = getPeriodeBounds(periode, dateDebut, dateFin);
  return computePnlWithBounds(filteredData, periode, bounds, products, commandes, immobilisations, devises);
}
