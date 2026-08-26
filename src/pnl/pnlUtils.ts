import { PnlPeriode, PnlData, FilteredPnlData } from './types';
import { calculerPlanAmortissementMensuel } from '../immobilisations/immoUtils';

// Calcul du coût de revient d'un produit (Achat unitaire moyen + Fret moyen)
export function getProductCostBreakdown(productId: string, products: any[] = [], commandes: any[] = []) {
  const productCmds = commandes.filter((c: any) => c.productId === productId && c.statut !== 'À explorer');

  let basePu = 0;
  let fretPu = 0;

  if (productCmds.length > 0) {
    let totalValue = 0;
    let totalQty = 0;
    let totalFret = 0;
    productCmds.forEach((c: any) => {
      const qty = Number(c.qty) || 1;
      const total = c.pu ? Number(c.pu) * qty : Number(c.total) || 0;
      totalValue += total;
      totalQty += qty;
      totalFret += Number(c.fraisTransport) || 0;
    });
    basePu = totalQty > 0 ? totalValue / totalQty : 0;
    fretPu = totalQty > 0 ? totalFret / totalQty : 0;
  } else {
    const p = products.find((pr: any) => pr.id === productId);
    basePu = Number(p?.prixAchatAr) || Number(p?.coutTotalRenduAr) || Number(p?.prixAchat) || (Number(p?.puRmb || 0) * 680) || 0;
  }

  return { basePu, fretPu, coutRevient: basePu + fretPu };
}

// Filtrage des données par période
export function filterPnlData(
  periode: PnlPeriode,
  dateDebut: string,
  dateFin: string,
  ventes: any[] = [],
  mouvements: any[] = [],
  frais: any[] = []
): FilteredPnlData {
  let debut: Date | null = null;
  let fin: Date | null = null;

  const now = new Date();
  if (periode === 'month') {
    debut = new Date(now.getFullYear(), now.getMonth(), 1);
    fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (periode === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    debut = new Date(now.getFullYear(), currentQuarter * 3, 1);
    fin = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
  } else if (periode === 'year') {
    debut = new Date(now.getFullYear(), 0, 1);
    fin = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
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

  const matchDate = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (debut && d < debut) return false;
    if (fin && d > fin) return false;
    return true;
  };

  const periodVentes = ventes.filter((v: any) => matchDate(v.date));
  const periodMouvements = mouvements.filter((m: any) => matchDate(m.date));
  const periodFrais = frais.filter((f: any) => matchDate(f.date));

  return {
    ventes: periodVentes,
    mouvements: periodMouvements,
    frais: periodFrais,
    debutStr: debut ? debut.toLocaleDateString('fr-FR') : 'Début des temps',
    finStr: fin ? fin.toLocaleDateString('fr-FR') : 'Présent',
  };
}

// Calcul complet du P&L
export function computePnl(
  filteredData: FilteredPnlData,
  periode: PnlPeriode,
  dateDebut: string,
  dateFin: string,
  products: any[] = [],
  commandes: any[] = [],
  immobilisations: any[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 }
): PnlData {
  const vts = filteredData.ventes;
  const mvts = filteredData.mouvements;
  const frs = filteredData.frais || [];

  // 1. Chiffre d'Affaires (CA)
  const chiffreAffaires = vts.reduce((sum: number, v: any) => {
    return sum + (Number(v.total) || 0);
  }, 0);

  // 2. Coût des marchandises vendues (COGS)
  let costMarchandises = 0;
  let fretMarchandises = 0;

  vts.forEach((v: any) => {
    const { basePu, fretPu } = getProductCostBreakdown(v.productId, products, commandes);
    const qty = Number(v.qty) || 1;
    costMarchandises += basePu * qty;
    fretMarchandises += fretPu * qty;
  });

  const cogs = costMarchandises + fretMarchandises;

  // 3. Marge Brute
  const margeBrute = Math.max(0, chiffreAffaires - cogs);
  const margeBrutePct = chiffreAffaires > 0 ? (margeBrute / chiffreAffaires) * 100 : 0;

  // 4. Charges d'Exploitation (OPEX)
  let loyerEtCharges = 0;
  let marketingEtPub = 0;
  let fretEtLogistique = 0;
  let fraisGenerauxNotes = 0;
  let autresSorties = 0;

  // Prise en compte des Notes de Frais de la période
  frs.forEach((f: any) => {
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

  mvts.forEach((m: any) => {
    if (m.type === 'sortie') {
      const montant = Number(m.montant) || 0;
      const tag = m.tag || '';

      // Exclusions : Remboursements emprunts, stock achats (déjà dans COGS), immobilisations (déjà amorties en dotations), retraits perso, change devise, et notes de frais (déjà comptées ci-dessus)
      if (
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
      } else if (tag === '#frais-bancaires') {
        return;
      } else {
        autresSorties += montant;
      }
    }
  });

  const totalOpex = loyerEtCharges + marketingEtPub + fretEtLogistique + fraisGenerauxNotes + autresSorties;

  // Dotation aux amortissements
  let dotationAmortissement = 0;
  let debutPériode: Date | null = null;
  let finPériode: Date | null = null;

  const now = new Date();
  if (periode === 'month') {
    debutPériode = new Date(now.getFullYear(), now.getMonth(), 1);
    finPériode = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (periode === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    debutPériode = new Date(now.getFullYear(), currentQuarter * 3, 1);
    finPériode = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
  } else if (periode === 'year') {
    debutPériode = new Date(now.getFullYear(), 0, 1);
    finPériode = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else if (periode === 'custom') {
    if (dateDebut) debutPériode = new Date(dateDebut);
    if (dateFin) finPériode = new Date(dateFin);
  }

  immobilisations.forEach((imm: any) => {
    const prixAr = Number(imm.valeurOrigine) || Number(imm.prixAchatAr) || (Number(imm.prixAchatRmb || 0) * (devises?.rmb || 680)) || 0;
    if (isNaN(prixAr) || prixAr <= 0) return;

    const dureeAns = Number(imm.dureeAmortissement) || 5;
    const dateStr = imm.dateAchat || imm.dateAcquisition || imm.date;
    if (!dateStr) return;

    const plan = calculerPlanAmortissementMensuel(prixAr, dateStr, dureeAns);

    if (periode === 'all') {
      // Jusqu'à la fin du mois courant
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const pastRows = plan.filter(r => r.annee < currentYear || (r.annee === currentYear && r.mois <= currentMonth));
      const totalDotation = pastRows.reduce((sum, r) => sum + r.dotation, 0);
      dotationAmortissement += totalDotation;
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

      const totalDotation = inRangeRows.reduce((sum, r) => sum + r.dotation, 0);
      dotationAmortissement += totalDotation;
    }
  });

  // 5. Résultat d'Exploitation (EBIT)
  const resultatExploitation = margeBrute - totalOpex - dotationAmortissement;

  // 6. Charges Financières
  const chargesFinancieres = mvts
    .filter((m: any) => m.type === 'sortie' && m.tag === '#frais-bancaires')
    .reduce((sum: number, m: any) => sum + (Number(m.montant) || 0), 0);

  // 7. Résultat Net
  const resultatNet = resultatExploitation - chargesFinancieres;
  const margeNettePct = chiffreAffaires > 0 ? (resultatNet / chiffreAffaires) * 100 : 0;

  return {
    chiffreAffaires,
    costMarchandises,
    fretMarchandises,
    cogs,
    margeBrute,
    margeBrutePct,
    loyerEtCharges,
    marketingEtPub,
    fretEtLogistique,
    fraisGenerauxNotes,
    autresSorties,
    totalOpex,
    dotationAmortissement,
    resultatExploitation,
    chargesFinancieres,
    resultatNet,
    margeNettePct,
  };
}
