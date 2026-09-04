import { computeStock } from '../stock/stockUtils';
import { getRestePayeVente, getRestePayeMarchandise, getRestePayeFret } from '../paymentUtils';
import { calculerPlanAmortissementMensuel } from '../immobilisations/immoUtils';
import { getProductCostBreakdown, calculerCA, calculerCogs, calculerPertesEtGains, calculerOpex } from '../pnl/pnlUtils';
import { BilanData } from './types';

export function computeBilanData(
  products: any[] = [],
  ventes: any[] = [],
  commandes: any[] = [],
  mouvements: any[] = [],
  immobilisations: any[] = [],
  emprunts: any[] = [],
  comptes: string[] = [],
  devises: { rmb: number; usd: number } = { rmb: 680, usd: 4600 },
  paiements: any[] = []
): BilanData {
  // --- ACTIF ---

  // 1. Immobilisations (Actif Immobilisé)
  let totalImmoBrut = 0;
  let totalImmoAmortissement = 0;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  (immobilisations || []).forEach((imm: any) => {
    const prixAr = Number(imm.valeurOrigine) || Number(imm.prixAchatAr) || (Number(imm.prixAchatRmb || 0) * (devises?.rmb || 680)) || 0;
    if (isNaN(prixAr) || prixAr <= 0) return;
    totalImmoBrut += prixAr;

    const dateStr = imm.dateAchat || imm.dateAcquisition || imm.date;
    if (!dateStr) return;
    const dureeAns = Number(imm.dureeAmortissement) || 5;

    const plan = calculerPlanAmortissementMensuel(prixAr, dateStr, dureeAns);
    const pastRows = plan.filter(r => r.annee < currentYear || (r.annee === currentYear && r.mois <= currentMonth));
    const lastRow = pastRows.length > 0 ? pastRows[pastRows.length - 1] : null;

    const amortissementCumule = lastRow ? lastRow.cumul : 0;
    totalImmoAmortissement += amortissementCumule;
  });

  const totalImmoNet = Math.max(0, totalImmoBrut - totalImmoAmortissement);

  // 2. Actif Circulant
  // A. Stocks physiques à leur coût de revient global (Achat + Frais Chine + Fret + Transport local)
  const stockByProduct = computeStock(products, commandes, ventes, mouvements);
  let valeurStockTotal = 0;

  (products || []).forEach((p: any) => {
    const qtyEnStock = stockByProduct[p.id] || 0;
    if (qtyEnStock <= 0) return;

    const { coutRevient } = getProductCostBreakdown(p.id, products, commandes, devises);
    valeurStockTotal += (qtyEnStock * coutRevient);
  });

  // B. Créances clients (Reste dû des ventes non annulées)
  let totalCreancesClients = 0;
  (ventes || []).filter((v: any) => v && v.statut !== 'Annulé').forEach((v: any) => {
    const reste = getRestePayeVente(v, paiements);
    totalCreancesClients += reste;
  });

  // C. Disponibilités (Trésorerie active dans les comptes financiers)
  let totalDisponibilites = 0;
  const balancesComptes: Record<string, number> = {};

  const allComptes = comptes.length > 0 ? comptes : ['Caisse / Espèces', 'MVola', 'Orange Money', 'BMOI Banque'];
  allComptes.forEach(c => {
    balancesComptes[c] = 0;
  });

  (mouvements || []).forEach((m: any) => {
    const montant = Number(m.montant) || 0;
    const compte = m.compte || 'Caisse / Espèces';
    if (!(compte in balancesComptes)) {
      balancesComptes[compte] = 0;
    }
    const isEntree = m.type === 'entree' || m.type === 'entrée' || m.type === 'investissement';
    if (isEntree) {
      balancesComptes[compte] += montant;
    } else {
      balancesComptes[compte] -= montant;
    }
  });

  Object.values(balancesComptes).forEach(b => {
    totalDisponibilites += b;
  });

  const totalActifCirculant = valeurStockTotal + totalCreancesClients + totalDisponibilites;
  const totalActif = totalImmoNet + totalActifCirculant;

  // --- PASSIF ---

  // 1. Dettes (Passif exigible)
  // A. Dettes financières (Emprunts)
  let totalDettesFinancieres = 0;
  (emprunts || []).forEach((emp: any) => {
    const remboursements = Array.isArray(emp.remboursements) ? emp.remboursements : [];
    const capitalPaye = remboursements.reduce((sum: number, r: any) => sum + (Number(r.capital) || 0), 0);
    const principal = Number(emp.montantPrincipal) || 0;
    const restantDu = Math.max(0, principal - capitalPaye);
    totalDettesFinancieres += isNaN(restantDu) ? 0 : restantDu;
  });

  // B. Dettes Fournisseurs (Commandes de marchandise et de fret non soldées)
  let totalDettesFournisseurs = 0;
  (commandes || []).filter((c: any) => c && c.statut !== 'Annulé' && c.statut !== 'À explorer').forEach((c: any) => {
    const resteMarchandise = getRestePayeMarchandise(c, paiements);
    const resteFret = getRestePayeFret(c, paiements);
    totalDettesFournisseurs += (resteMarchandise + resteFret);
  });

  const totalPassifExigible = totalDettesFinancieres + totalDettesFournisseurs;

  // 2. Capitaux Propres (Fonds Propres & Résultat Net Cumulé)
  // Utilisation exacte des méthodes PnL pour harmoniser Bilan et PnL
  const validVentes = (ventes || []).filter((v: any) => v && v.statut !== 'Annulé');
  const caHistorique = calculerCA(validVentes);
  const { cogs } = calculerCogs(validVentes, products, commandes, devises);
  const { pertesStock, gainsInventaire } = calculerPertesEtGains(mouvements, products, commandes, devises);
  const { loyerEtCharges, marketingEtPub, deplacementsEtTransport, fretEtLogistique, fraisGenerauxNotes, autresSorties } = calculerOpex([], mouvements);
  const totalOpex = loyerEtCharges + marketingEtPub + deplacementsEtTransport + fretEtLogistique + fraisGenerauxNotes + autresSorties + pertesStock - gainsInventaire;

  const chargesFinancieresHist = (mouvements || [])
    .filter((m: any) => m.type === 'sortie' && m.tag === '#frais-bancaires')
    .reduce((sum: number, m: any) => sum + (Number(m.montant) || 0), 0);

  const resultatNetCumule = caHistorique - cogs - totalOpex - totalImmoAmortissement - chargesFinancieresHist;
  const capitalSocialEquilibre = totalActif - totalPassifExigible - resultatNetCumule;
  const totalCapitauxPropres = capitalSocialEquilibre + resultatNetCumule;
  const totalPassif = totalCapitauxPropres + totalPassifExigible;

  return {
    totalImmoBrut,
    totalImmoAmortissement,
    totalImmoNet,
    valeurStockTotal,
    totalCreancesClients,
    totalDisponibilites,
    balancesComptes,
    totalActifCirculant,
    totalActif,
    totalDettesFinancieres,
    totalDettesFournisseurs,
    totalPassifExigible,
    capitalSocialEquilibre,
    resultatNetCumule,
    totalCapitauxPropres,
    totalPassif,
  };
}
