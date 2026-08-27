import { getRestePayeVente, getRestePayeMarchandise, getRestePayeFret, getMontantPayeVente } from '../paymentUtils';
import { buildToutesTransactions } from '../Tresorerie/tresorerieUtils';

export interface MoisProjection {
  moisIndex: number; // 1, 2, 3
  moisNom: string;
  moisCourt: string;
  soldeInitial: number;
  encaissements: {
    ventesPrevues: number;
    creancesRecouvrables: number;
    total: number;
  };
  decaissements: {
    commandesEnCours: number;
    dettesFournisseurs: number;
    chargesRegulieres: number;
    reapprovisionnementPrevu: number;
    total: number;
  };
  fluxNet: number;
  soldeFinal: number;
}

export interface TresorerieProjectionResult {
  soldeActuel: number;
  moyenneVentesMensuelle: number;
  moyenneChargesMensuelle: number;
  creancesClientsTotal: number;
  dettesFournisseursTotal: number;
  commandesEngageesTotal: number;
  projections: MoisProjection[];
  soldeM3: number;
  statutM3: 'positif' | 'alerte' | 'critique';
  conseil: string;
}

/**
 * Calcule la projection de trésorerie sur les 3 prochains mois (M+1, M+2, M+3)
 * selon la méthode de trésorerie prévisionnelle :
 * - Solde initial actuel (caisse + comptes bancaires/mobiles)
 * - Encaissements : Récupération échelonnée des créances clients + rythme moyen des ventes
 * - Décaissements : Règlements des commandes en cours & dettes fournisseurs + charges fixes/courantes + besoin réappro
 */
export function calculerProjectionTresorerie(
  mouvements: any[] = [],
  ventes: any[] = [],
  commandes: any[] = [],
  chargesFixes: any[] = [],
  tauxCroissanceVentesPct: number = 0,
  paiements: any[] = [],
  products: any[] = [],
  fournisseurs: any[] = []
): TresorerieProjectionResult {
  // 1. Solde réel actuel de trésorerie (toutes transactions unifiées)
  const toutesTransactions = buildToutesTransactions({
    ventes,
    commandes,
    mouvements,
    paiements,
    products,
    fournisseurs,
  });

  const totalEntrees = toutesTransactions
    .filter((t: any) => t.type === 'entrée')
    .reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0);

  const totalSorties = toutesTransactions
    .filter((t: any) => t.type === 'sortie')
    .reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0);

  const soldeActuel = totalEntrees - totalSorties;

  // 2. Analyse historique du chiffre d'affaires / rythme moyen de ventes
  const now = new Date();
  const troisMoisPasse = new Date();
  troisMoisPasse.setMonth(now.getMonth() - 3);

  // Total des ventes réalisées
  const totalToutesVentes = ventes.reduce((s: number, v: any) => {
    const totalVal = v.total !== undefined
      ? Number(v.total)
      : (Number(v.pu || 0) * Number(v.qty || 1) + (Number(v.fraisLivraison) || 0));
    return s + (Number.isFinite(totalVal) ? totalVal : 0);
  }, 0);

  // Ventes récentes (sur les 3 derniers mois) si datées
  const ventesRecentes = ventes.filter((v: any) => {
    if (!v.date) return true;
    const d = new Date(v.date);
    return !isNaN(d.getTime()) ? d >= troisMoisPasse : true;
  });

  const totalVentesRecentes = ventesRecentes.reduce((s: number, v: any) => {
    const totalVal = v.total !== undefined
      ? Number(v.total)
      : (Number(v.pu || 0) * Number(v.qty || 1) + (Number(v.fraisLivraison) || 0));
    return s + (Number.isFinite(totalVal) ? totalVal : 0);
  }, 0);

  // Moyenne mensuelle réaliste des ventes
  let moyenneVentesMensuelle = 0;
  if (totalVentesRecentes > 0) {
    moyenneVentesMensuelle = Math.round(totalVentesRecentes / 3);
  } else if (totalToutesVentes > 0) {
    moyenneVentesMensuelle = Math.round(totalToutesVentes / Math.max(1, Math.min(3, ventes.length)));
  }

  // 3. Charges récurrentes mensuelles
  const chargesFixesTotal = (chargesFixes || []).reduce(
    (s: number, c: any) => s + (Number(c.montant) || Number(c.montantMensuel) || 0),
    0
  );

  const mouvementsCharges = mouvements.filter((m: any) => {
    if (m.type !== 'sortie' || m.isTransfert) return false;
    const tag = m.tag || '';
    return tag !== '#stock-chine' && tag !== '#fret-logistique' && !tag.includes('achat');
  });

  const totalChargesHistorique = mouvementsCharges.reduce(
    (s: number, m: any) => s + (Number(m.montant) || 0),
    0
  );
  const moyenneChargesMouvements = totalChargesHistorique > 0 ? Math.round(totalChargesHistorique / 3) : 0;
  const moyenneChargesMensuelle = Math.max(chargesFixesTotal, moyenneChargesMouvements);

  // 4. Créances clients actuelles
  const creancesClientsTotal = ventes.reduce((s: number, v: any) => s + getRestePayeVente(v, paiements), 0);

  // 5. Dettes fournisseurs actuelles & Commandes en cours
  let dettesFournisseursTotal = 0;
  let commandesEngageesTotal = 0;

  commandes.forEach((c: any) => {
    const resteMarchandise = getRestePayeMarchandise(c, paiements);
    const resteFret = getRestePayeFret(c, paiements);
    const resteTotal = resteMarchandise + resteFret;
    dettesFournisseursTotal += resteTotal;

    if (c.statut !== 'Arrivé' && c.statut !== 'Livré') {
      commandesEngageesTotal += resteTotal;
    }
  });

  // 6. Construction de la projection M+1, M+2, M+3
  const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

  const projections: MoisProjection[] = [];
  let soldeCourant = soldeActuel;

  const facteurCroissance = 1 + ((Number(tauxCroissanceVentesPct) || 0) / 100);

  for (let i = 1; i <= 3; i++) {
    const targetDate = new Date();
    targetDate.setMonth(now.getMonth() + i);
    const mIndex = targetDate.getMonth();
    const moisNom = `${moisNoms[mIndex]} ${targetDate.getFullYear()}`;
    const moisCourt = `${moisCourts[mIndex]} ${targetDate.getFullYear().toString().slice(-2)}`;

    // A. Encaissements prévisionnels
    const ventesPrevues = Math.round(moyenneVentesMensuelle * Math.pow(facteurCroissance, i));

    let creancesRecouvrables = 0;
    if (i === 1) creancesRecouvrables = Math.round(creancesClientsTotal * 0.50);
    else if (i === 2) creancesRecouvrables = Math.round(creancesClientsTotal * 0.30);
    else if (i === 3) creancesRecouvrables = Math.round(creancesClientsTotal * 0.20);

    const totalEncaissements = ventesPrevues + creancesRecouvrables;

    // B. Décaissements prévisionnels
    let dettesAPayer = 0;
    if (i === 1) dettesAPayer = Math.round(dettesFournisseursTotal * 0.60);
    else if (i === 2) dettesAPayer = Math.round(dettesFournisseursTotal * 0.30);
    else if (i === 3) dettesAPayer = Math.round(dettesFournisseursTotal * 0.10);

    let cmdEnCoursMois = 0;
    if (i === 1) cmdEnCoursMois = Math.round(commandesEngageesTotal * 0.70);
    else if (i === 2) cmdEnCoursMois = Math.round(commandesEngageesTotal * 0.30);

    const chargesRegulieres = moyenneChargesMensuelle;
    const reapprovisionnementPrevu = i === 1 ? 0 : Math.round(ventesPrevues * 0.35);

    const totalDecaissements = dettesAPayer + chargesRegulieres + reapprovisionnementPrevu;

    const fluxNet = totalEncaissements - totalDecaissements;
    const soldeInitial = soldeCourant;
    const soldeFinal = soldeInitial + fluxNet;

    projections.push({
      moisIndex: i,
      moisNom,
      moisCourt,
      soldeInitial,
      encaissements: {
        ventesPrevues,
        creancesRecouvrables,
        total: totalEncaissements,
      },
      decaissements: {
        commandesEnCours: cmdEnCoursMois,
        dettesFournisseurs: dettesAPayer,
        chargesRegulieres,
        reapprovisionnementPrevu,
        total: totalDecaissements,
      },
      fluxNet,
      soldeFinal,
    });

    soldeCourant = soldeFinal;
  }

  const soldeM3 = projections[2]?.soldeFinal ?? soldeActuel;
  let statutM3: 'positif' | 'alerte' | 'critique' = 'positif';
  let conseil = '';

  if (soldeM3 < 0) {
    statutM3 = 'critique';
    conseil = `Risque d'impasse de trésorerie à 3 mois (${soldeM3.toLocaleString('fr-FR')} Ar). Accélérez le recouvrement des créances (${creancesClientsTotal.toLocaleString('fr-FR')} Ar) et reportez les nouvelles commandes non prioritaires.`;
  } else if (soldeM3 < moyenneChargesMensuelle) {
    statutM3 = 'alerte';
    conseil = `Trésorerie tendue à 3 mois (${soldeM3.toLocaleString('fr-FR')} Ar, inférieur à 1 mois de charges). Veillez à maintenir le rythme de vente et sécurisez vos délais de paiement fournisseurs.`;
  } else {
    statutM3 = 'positif';
    conseil = `Trésorerie saine et résiliente (${soldeM3.toLocaleString('fr-FR')} Ar projeté à 3 mois). Capacité d'autofinancement suffisante pour de nouveaux réapprovisionnements en Chine.`;
  }

  return {
    soldeActuel,
    moyenneVentesMensuelle,
    moyenneChargesMensuelle,
    creancesClientsTotal,
    dettesFournisseursTotal,
    commandesEngageesTotal,
    projections,
    soldeM3,
    statutM3,
    conseil,
  };
}
