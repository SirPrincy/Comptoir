export interface QCSummary {
  taux: number; // 0 à 100 %
  nbLitiges: number; // Nombre de commandes avec non-conformité
  nbCommandesEvaluees: number; // Nombre de commandes inspectées
  totalQty: number; // Total d'articles inspectés
  totalConforme: number; // Total d'articles conformes
  totalDefectueuse: number; // Total d'articles défectueux/cassés
  historique: Array<{
    commandeId: string;
    date: string;
    produitNom: string;
    qtyTotal: number;
    qtyConforme: number;
    qtyDefectueuse: number;
    statut: string;
    notes: string;
  }>;
}

/**
 * Calcule le score de qualité/conformité d'un fournisseur ou transitaire
 * sur la base des contrôles qualité (Step 5 QC) déjà effectués.
 */
export function calculerScoreFournisseur(
  fournisseurId: string,
  commandes: any[] = [],
  products: any[] = []
): QCSummary | null {
  if (!fournisseurId || !commandes || commandes.length === 0) return null;

  // Filtrer les commandes de ce fournisseur qui ont un contrôle qualité entamé ou finalisé
  const commandesEvaluees = commandes.filter((c: any) => {
    const isMine = c.fournisseurId === fournisseurId || c.transitaireId === fournisseurId;
    const hasQC = Boolean(c.qualityCheck?.isCompleted || c.qualityCheck?.statut);
    return isMine && hasQC;
  });

  if (commandesEvaluees.length === 0) return null;

  let totalQty = 0;
  let totalConforme = 0;
  let totalDefectueuse = 0;
  let nbLitiges = 0;
  const historique: QCSummary['historique'] = [];

  commandesEvaluees.forEach((c: any) => {
    const qc = c.qualityCheck || {};
    const qtyTotalCmd = Number(c.qty) || 1;
    const statutQC = qc.statut || 'Conforme';

    let qtyConf = qc.qtyConforme !== undefined && qc.qtyConforme !== null
      ? Number(qc.qtyConforme)
      : (statutQC === 'Conforme' ? qtyTotalCmd : 0);

    let qtyDef = qc.qtyDefectueuse !== undefined && qc.qtyDefectueuse !== null
      ? Number(qc.qtyDefectueuse)
      : Math.max(0, qtyTotalCmd - qtyConf);

    if (qtyConf > qtyTotalCmd) qtyConf = qtyTotalCmd;
    if (qtyDef < 0) qtyDef = 0;

    totalQty += qtyTotalCmd;
    totalConforme += qtyConf;
    totalDefectueuse += qtyDef;

    const isLitige = statutQC !== 'Conforme' || qtyDef > 0;
    if (isLitige) {
      nbLitiges += 1;

      const p = products.find((pr: any) => pr.id === c.productId);
      const prodNom = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Article';

      historique.push({
        commandeId: c.id,
        date: qc.date || c.dateArrivee || c.dateAchat || new Date().toISOString(),
        produitNom: prodNom,
        qtyTotal: qtyTotalCmd,
        qtyConforme: qtyConf,
        qtyDefectueuse: qtyDef,
        statut: statutQC,
        notes: qc.notes || 'Articles non conformes ou défectueux détectés lors du QC.',
      });
    }
  });

  if (totalQty === 0) return null;

  const taux = Math.round((totalConforme / totalQty) * 100);

  // Tri chronologique décroissant (litiges les plus récents en premier)
  historique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    taux,
    nbLitiges,
    nbCommandesEvaluees: commandesEvaluees.length,
    totalQty,
    totalConforme,
    totalDefectueuse,
    historique,
  };
}

/**
 * Retourne la configuration visuelle du badge QC selon la logique de seuils :
 * - score === null -> pas de badge
 * - taux >= 95% et nbLitiges === 0 -> ✅ Discret / Conforme
 * - taux >= 85% -> ⚠️ Attentif
 * - taux < 85% ou nbLitiges >= 2 -> ❌ Alerte litige
 */
export function getQCBadgeInfo(score: QCSummary | null) {
  if (!score) return null;

  if (score.taux >= 95 && score.nbLitiges === 0) {
    return {
      type: 'excellent',
      label: `✅ ${score.taux}% conforme`,
      shortLabel: `✅ ${score.taux}%`,
      bg: '#EBF4EC',
      color: '#2C5E43',
      border: '#C4DEC0',
    };
  }

  if (score.taux >= 85 && score.nbLitiges < 2) {
    return {
      type: 'moyen',
      label: `⚠️ ${score.taux}% (${score.nbLitiges} litige)`,
      shortLabel: `⚠️ ${score.taux}% (${score.nbLitiges} litige)`,
      bg: '#FFF8E1',
      color: '#B78103',
      border: '#FFE082',
    };
  }

  return {
    type: 'mauvais',
    label: `❌ ${score.taux}% (${score.nbLitiges} litige${score.nbLitiges > 1 ? 's' : ''})`,
    shortLabel: `❌ ${score.taux}% (${score.nbLitiges} litige${score.nbLitiges > 1 ? 's' : ''})`,
    bg: '#FBEFEF',
    color: '#C24A3F',
    border: '#F5C6C6',
  };
}
