import { Package, Box, Ship, FileCheck, ShieldCheck } from 'lucide-react';

export const WIZARD_STEPS = [
  { step: 1, id: 'En livraison', label: '1. Expédition Fournisseur', icon: Package, desc: 'En route vers l’entrepôt Chine' },
  { step: 2, id: 'En entrepôt', label: '2. Réception Entrepôt', icon: Box, desc: 'Pesée, transitaire & mode' },
  { step: 3, id: 'En expédition', label: '3. Fret International', icon: Ship, desc: 'En mer ou dans les airs' },
  { step: 4, id: 'Arrivé', label: '4. Arrivée Madagascar', icon: FileCheck, desc: 'Validation générale des données' },
  { step: 5, id: 'Contrôle Qualité', label: '5. Contrôle Qualité', icon: ShieldCheck, desc: 'Inspection & Entrée en stock' },
];

export function getActiveStep(commande: any): number {
  if (!commande) return 1;
  if (commande.qualityCheck?.isCompleted) return 5;
  if (commande.statut === 'Arrivé') return 4;
  if (commande.statut === 'En expédition') return 3;
  if (commande.statut === 'En entrepôt') return 2;
  return 1;
}

export function parseTarifNumber(str: string): number | null {
  if (!str) return null;
  const clean = str.replace(/\s+/g, '').replace(',', '.');
  const match = clean.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

export function calculerEtaParDefaut(mode: string): Date {
  const delai = mode === 'Aérien' ? 15 : 60;
  const eta = new Date();
  eta.setDate(eta.getDate() + delai);
  return eta;
}

export interface TransitairePerformance {
  delaiMoyenJours: number;
  retardMoyenJours: number;
  nbColisAnalyses: number;
  source: 'historique' | 'tarif' | 'defaut';
  fiabiliteLabel: string;
}

/**
 * Calcule le délai réel moyen et le retard moyen d'un transitaire
 * sur la base de son historique réel de colis livrés.
 */
export function calculerPerformanceTransitaire(
  transitaireId?: string,
  mode: string = 'Aérien',
  commandes: any[] = [],
  fournisseurs: any[] = []
): TransitairePerformance {
  const isAerien = mode === 'Aérien';
  const delaiDefaut = isAerien ? 15 : 60;

  if (!transitaireId) {
    return {
      delaiMoyenJours: delaiDefaut,
      retardMoyenJours: 0,
      nbColisAnalyses: 0,
      source: 'defaut',
      fiabiliteLabel: `Délai standard (${delaiDefaut}j)`,
    };
  }

  // Filtrer les colis livrés passés pour ce transitaire & mode
  const livraisonsPassees = commandes.filter((c: any) => {
    const matchesTrans = c.transitaireId === transitaireId || c.fournisseurId === transitaireId;
    const matchesMode = (c.modeExpedition || 'Maritime') === mode;
    const isLivred = Boolean(c.dateEnExpedition && c.dateArrivee);
    return matchesTrans && matchesMode && isLivred;
  });

  if (livraisonsPassees.length > 0) {
    let sumDuree = 0;
    let sumRetard = 0;
    let validCount = 0;

    livraisonsPassees.forEach((c: any) => {
      const start = new Date(c.dateEnExpedition).getTime();
      const end = new Date(c.dateArrivee).getTime();
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        const dureeDays = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)));
        sumDuree += dureeDays;
        validCount++;

        if (c.dateEtaArrivee) {
          const eta = new Date(c.dateEtaArrivee).getTime();
          if (!isNaN(eta)) {
            const retardDays = Math.round((end - eta) / (1000 * 3600 * 24));
            sumRetard += retardDays;
          }
        }
      }
    });

    if (validCount > 0) {
      const delaiMoyenJours = Math.round(sumDuree / validCount);
      const retardMoyenJours = Math.round(sumRetard / validCount);

      let fiabiliteLabel = `~${delaiMoyenJours}j (${validCount} colis)`;
      if (retardMoyenJours > 2) {
        fiabiliteLabel += ` ⚠️ Retard avg +${retardMoyenJours}j`;
      } else if (retardMoyenJours <= 0) {
        fiabiliteLabel += ` ✅ Ponctuel`;
      }

      return {
        delaiMoyenJours,
        retardMoyenJours,
        nbColisAnalyses: validCount,
        source: 'historique',
        fiabiliteLabel,
      };
    }
  }

  // Repli sur le tarif du transitaire si renseigné
  const transitaireObj = fournisseurs.find((f: any) => f.id === transitaireId);
  if (transitaireObj?.tarifs?.length > 0) {
    const t = transitaireObj.tarifs.find((tr: any) => tr.mode === mode && tr.delai);
    if (t?.delai) {
      const num = parseTarifNumber(t.delai);
      if (num && num > 0) {
        return {
          delaiMoyenJours: Math.round(num),
          retardMoyenJours: 0,
          nbColisAnalyses: 0,
          source: 'tarif',
          fiabiliteLabel: `Délai tarif (~${Math.round(num)}j)`,
        };
      }
    }
  }

  return {
    delaiMoyenJours: delaiDefaut,
    retardMoyenJours: 0,
    nbColisAnalyses: 0,
    source: 'defaut',
    fiabiliteLabel: `Délai standard (${delaiDefaut}j)`,
  };
}

/**
 * Calcule une date d'ETA dynamique basée sur le délai moyen réel constaté pour le transitaire.
 */
export function calculerEtaDynamique(
  mode: string,
  transitaireId?: string,
  commandes: any[] = [],
  fournisseurs: any[] = [],
  startDate?: string | Date
): { eta: Date; perf: TransitairePerformance } {
  const perf = calculerPerformanceTransitaire(transitaireId, mode, commandes, fournisseurs);
  const baseDate = startDate ? new Date(startDate) : new Date();
  const eta = new Date(baseDate);
  eta.setDate(eta.getDate() + perf.delaiMoyenJours);
  return { eta, perf };
}

export function calculerFretAuto({ mode, tarifNum, poids, volume }: { mode: string; tarifNum: number | null; poids?: any; volume?: any }) {
  const canAutoCalcAr = mode === 'Aérien' && tarifNum !== null && Number(poids) > 0;
  const autoFretAr = canAutoCalcAr ? Math.round(Number(poids) * (tarifNum as number)) : null;

  const canAutoCalcUSD = mode === 'Maritime' && tarifNum !== null && Number(volume) > 0;
  const autoFretUSD = canAutoCalcUSD ? Number((Number(volume) * (tarifNum as number)).toFixed(2)) : null;

  return { canAutoCalcAr, autoFretAr, canAutoCalcUSD, autoFretUSD };
}

export function calculerPRU({
  puAchat,
  fraisTransport,
  fraisTransportLocal = 0,
  qty,
}: {
  puAchat: number;
  fraisTransport: number;
  fraisTransportLocal?: number;
  qty?: number;
}) {
  const fretTotal = Number(fraisTransport) || 0;
  const transportLocalTotal = Number(fraisTransportLocal) || 0;
  const q = Number(qty || 1);
  const fretUnitaire = fretTotal / q;
  const transportLocalUnitaire = transportLocalTotal / q;
  const pruTotal = puAchat + fretUnitaire + transportLocalUnitaire;
  return {
    fretTotal,
    fretUnitaire,
    transportLocalTotal,
    transportLocalUnitaire,
    pruTotal,
  };
}
