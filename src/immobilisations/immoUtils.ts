import { Immobilisation, AmortissementRow, AmortissementMensuelRow, ImmoCalculatedDetail, ImmoKpis } from './types';

export const CATEGORIES_IMMO = [
  'Matériel informatique',
  'Véhicule & Transport',
  'Mobilier de bureau',
  'Matériel de bureau & outillage',
  'Bâtiments & Agencements',
  'Autre',
];

export const MOIS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

// Calcul du plan d'amortissement complet mois par mois avec Prorata Temporis exact au jour près
export function calculerPlanAmortissementMensuel(
  valeurOrigine: number,
  dateAchat: string,
  dureeAnnees: number
): AmortissementMensuelRow[] {
  if (!valeurOrigine || !dateAchat || !dureeAnnees || dureeAnnees <= 0) return [];

  const purchaseDate = new Date(dateAchat);
  if (isNaN(purchaseDate.getTime())) return [];

  const totalMoisTheorique = Math.round(dureeAnnees * 12);
  const dotationMensuelleNormale = valeurOrigine / totalMoisTheorique;

  const startYear = purchaseDate.getFullYear();
  const startMonth = purchaseDate.getMonth() + 1; // 1-12
  const dayOfMonth = purchaseDate.getDate(); // 1-31

  // Nombre de jours dans le premier mois
  const daysInFirstMonth = new Date(startYear, startMonth, 0).getDate();
  const remainingDaysInFirstMonth = Math.max(1, daysInFirstMonth - dayOfMonth + 1);
  const ratioFirstMonth = dayOfMonth === 1 ? 1 : remainingDaysInFirstMonth / daysInFirstMonth;

  const rows: AmortissementMensuelRow[] = [];
  let cumul = 0;
  let currentYear = startYear;
  let currentMonth = startMonth;
  let monthIndex = 0;

  // Si achat le 1er du mois : calcul standard sans découpage de fraction de jour
  if (dayOfMonth === 1) {
    for (let i = 0; i < totalMoisTheorique; i++) {
      const isLastMonth = i === totalMoisTheorique - 1;
      const dotation = isLastMonth
        ? Math.round((valeurOrigine - cumul) * 100) / 100
        : Math.min(Math.round(dotationMensuelleNormale * 100) / 100, Math.round((valeurOrigine - cumul) * 100) / 100);

      cumul = Math.min(valeurOrigine, Math.round((cumul + dotation) * 100) / 100);
      const vnc = Math.max(0, Math.round((valeurOrigine - cumul) * 100) / 100);

      const mIdx = ((startMonth - 1 + i) % 12);
      const yOff = Math.floor((startMonth - 1 + i) / 12);

      rows.push({
        annee: startYear + yOff,
        mois: mIdx + 1,
        labelMois: `${MOIS_FR[mIdx]} ${startYear + yOff}`,
        dotation,
        cumul,
        vnc,
      });
    }
    return rows;
  }

  // Si achat en cours de mois : 1er mois proratisé au nombre de jours exacts restants
  const firstMonthDotation = Math.round(dotationMensuelleNormale * ratioFirstMonth * 100) / 100;
  cumul = Math.min(valeurOrigine, firstMonthDotation);

  rows.push({
    annee: currentYear,
    mois: currentMonth,
    labelMois: `${MOIS_FR[currentMonth - 1]} ${currentYear} (${remainingDaysInFirstMonth}/${daysInFirstMonth} j)`,
    dotation: firstMonthDotation,
    cumul: Math.round(cumul * 100) / 100,
    vnc: Math.max(0, Math.round((valeurOrigine - cumul) * 100) / 100),
  });

  // Mois pleins intermédiaires
  for (let i = 1; i < totalMoisTheorique; i++) {
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }

    const dotation = Math.min(
      Math.round(dotationMensuelleNormale * 100) / 100,
      Math.round((valeurOrigine - cumul) * 100) / 100
    );
    cumul = Math.min(valeurOrigine, Math.round((cumul + dotation) * 100) / 100);
    const vnc = Math.max(0, Math.round((valeurOrigine - cumul) * 100) / 100);

    rows.push({
      annee: currentYear,
      mois: currentMonth,
      labelMois: `${MOIS_FR[currentMonth - 1]} ${currentYear}`,
      dotation,
      cumul,
      vnc,
    });
  }

  // Dernier mois : reliquat exact du prorata temporis
  if (cumul < valeurOrigine) {
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    const reliquatDotation = Math.round((valeurOrigine - cumul) * 100) / 100;
    cumul = valeurOrigine;

    rows.push({
      annee: currentYear,
      mois: currentMonth,
      labelMois: `${MOIS_FR[currentMonth - 1]} ${currentYear} (Solde reliquat)`,
      dotation: reliquatDotation,
      cumul: valeurOrigine,
      vnc: 0,
    });
  }

  return rows;
}

// Plan d'amortissement annuel récapitulatif
export function calculerAmortissementLineaire(
  valeurOrigine: number,
  dateAchat: string,
  dureeAnnees: number
): AmortissementRow[] {
  const planMensuel = calculerPlanAmortissementMensuel(valeurOrigine, dateAchat, dureeAnnees);
  if (planMensuel.length === 0) return [];

  const groupedByYear: Record<number, AmortissementMensuelRow[]> = {};
  planMensuel.forEach(r => {
    if (!groupedByYear[r.annee]) groupedByYear[r.annee] = [];
    groupedByYear[r.annee].push(r);
  });

  const rows: AmortissementRow[] = [];
  const annees = Object.keys(groupedByYear).map(Number).sort((a, b) => a - b);

  annees.forEach(annee => {
    const moisDeLAnnee = groupedByYear[annee];
    const annuite = moisDeLAnnee.reduce((sum, m) => sum + m.dotation, 0);
    const lastRow = moisDeLAnnee[moisDeLAnnee.length - 1];

    rows.push({
      annee,
      baseCalcul: valeurOrigine,
      annuite: Math.round(annuite * 100) / 100,
      cumul: lastRow.cumul,
      vnc: lastRow.vnc,
      nbMois: moisDeLAnnee.length,
    });
  });

  return rows;
}

// Calcul des détails précis de chaque actif pour un mois donné (selectedYear, selectedMonth)
export function computeImmoDetails(
  immobilisations: Immobilisation[] = [],
  selectedYear: number,
  selectedMonth: number
): ImmoCalculatedDetail[] {
  return immobilisations.map(immo => {
    const totalMois = Math.max(1, Math.round((Number(immo.dureeAmortissement) || 5) * 12));
    const dotationMensuelle = Math.round(((Number(immo.valeurOrigine) || 0) / totalMois) * 100) / 100;
    const planAnnuel = calculerAmortissementLineaire(immo.valeurOrigine, immo.dateAchat, immo.dureeAmortissement);
    const planMensuel = calculerPlanAmortissementMensuel(immo.valeurOrigine, immo.dateAchat, immo.dureeAmortissement);

    const purchaseDate = new Date(immo.dateAchat);
    const purchaseYear = isNaN(purchaseDate.getTime()) ? selectedYear : purchaseDate.getFullYear();
    const purchaseMonth = isNaN(purchaseDate.getTime()) ? 1 : purchaseDate.getMonth() + 1; // 1-12

    // Calcul du nombre de mois actifs jusqu'au mois sélectionné inclus
    const moisCibleDiff = (selectedYear - purchaseYear) * 12 + (selectedMonth - purchaseMonth) + 1;

    // Recherche directe dans le plan mensuel calculé avec prorata temporis exact
    const activeMonthlyRow = planMensuel.find(r => r.annee === selectedYear && r.mois === selectedMonth);
    
    // Trouver le dernier mois amorti jusqu'à la date sélectionnée
    const pastRows = planMensuel.filter(r => r.annee < selectedYear || (r.annee === selectedYear && r.mois <= selectedMonth));
    const lastPastRow = pastRows.length > 0 ? pastRows[pastRows.length - 1] : null;

    let moisEcoules = pastRows.length;
    let cumulMois = lastPastRow ? lastPastRow.cumul : 0;
    let vncMois = lastPastRow ? lastPastRow.vnc : (Number(immo.valeurOrigine) || 0);
    let dotationMois = activeMonthlyRow ? activeMonthlyRow.dotation : 0;
    let etat = 'Non commencé';

    if (moisEcoules === 0) {
      etat = 'Non commencé';
    } else if (cumulMois >= (Number(immo.valeurOrigine) || 0) || vncMois === 0) {
      etat = 'Amorti';
    } else {
      etat = `En cours (${moisEcoules}/${planMensuel.length} m)`;
    }

    // Dotation sur l'ensemble de l'année sélectionnée
    const anneeRow = planAnnuel.find(r => r.annee === selectedYear);
    const dotationAnnee = anneeRow ? anneeRow.annuite : 0;

    return {
      ...immo,
      planAnnuel,
      totalMois,
      moisEcoules,
      dotationMensuelle,
      dotationMois,
      dotationAnnee,
      cumulMois,
      vncMois,
      etat,
    };
  });
}

export function computeImmoKpis(immoDetails: ImmoCalculatedDetail[]): ImmoKpis {
  let bruteTotale = 0;
  let dotationMoisTotale = 0;
  let dotationAnneeTotale = 0;
  let cumulTotale = 0;
  let vncTotale = 0;

  immoDetails.forEach(immo => {
    bruteTotale += Number(immo.valeurOrigine) || 0;
    dotationMoisTotale += Number(immo.dotationMois) || 0;
    dotationAnneeTotale += Number(immo.dotationAnnee) || 0;
    cumulTotale += Number(immo.cumulMois) || 0;
    vncTotale += Number(immo.vncMois) || 0;
  });

  return {
    bruteTotale,
    dotationMoisTotale,
    dotationAnneeTotale,
    cumulTotale,
    vncTotale,
  };
}

