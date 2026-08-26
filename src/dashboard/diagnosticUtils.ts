/**
 * Utilitaire de diagnostic d'intégrité des données ERP
 * Analyse croisée des Achats, Immobilisations, Mouvements, Ventes et Emprunts
 */

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface DiagnosticIssue {
  id: string;
  module: 'achats' | 'immobilisations' | 'mouvements' | 'ventes' | 'emprunts';
  moduleLabel: string;
  itemId: string;
  itemLabel: string;
  severity: DiagnosticSeverity;
  category: 'reference_manquante' | 'montant_invalide' | 'date_invalide' | 'incoherence';
  categoryLabel: string;
  title: string;
  description: string;
  targetTab: string;
}

export interface DiagnosticReportData {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  byModule: {
    achats: number;
    immobilisations: number;
    mouvements: number;
    ventes: number;
    emprunts: number;
  };
  issues: DiagnosticIssue[];
  auditedCounts: {
    achats: number;
    immobilisations: number;
    mouvements: number;
    ventes: number;
    emprunts: number;
    total: number;
  };
  healthScore: number; // 0 à 100%
}

function isValidDate(dateStr: any): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && dateStr.trim().length >= 4;
}

export function runDataDiagnostic(data: {
  commandes?: any[];
  immobilisations?: any[];
  mouvements?: any[];
  ventes?: any[];
  emprunts?: any[];
  products?: any[];
  fournisseurs?: any[];
  clients?: any[];
}): DiagnosticReportData {
  const {
    commandes = [],
    immobilisations = [],
    mouvements = [],
    ventes = [],
    emprunts = [],
    products = [],
    fournisseurs = [],
    clients = [],
  } = data;

  const issues: DiagnosticIssue[] = [];

  const productMap = new Map<string, any>();
  products.forEach(p => {
    if (p && p.id) productMap.set(p.id, p);
  });

  const fournisseurMap = new Map<string, any>();
  fournisseurs.forEach(f => {
    if (f && f.id) fournisseurMap.set(f.id, f);
  });

  const clientMap = new Map<string, any>();
  clients.forEach(c => {
    if (c && c.id) clientMap.set(c.id, c);
  });

  // ==========================================
  // 1. AUDIT DES ACHATS (Commandes)
  // ==========================================
  commandes.forEach((c: any, index: number) => {
    const cid = c.id || `cmd-${index}`;
    const product = c.productId ? productMap.get(c.productId) : null;
    const label = c.ref || (product ? product.nom : `Achat #${index + 1}`);

    // A. Référence Produit
    if (!c.productId) {
      issues.push({
        id: `cmd-no-prod-${cid}`,
        module: 'achats',
        moduleLabel: 'Achats & Commandes',
        itemId: cid,
        itemLabel: label,
        severity: 'error',
        category: 'reference_manquante',
        categoryLabel: 'Référence manquante',
        title: 'Produit non rattaché',
        description: 'La commande n\'est liée à aucun produit du catalogue.',
        targetTab: 'achat',
      });
    } else if (!product) {
      issues.push({
        id: `cmd-orphan-prod-${cid}`,
        module: 'achats',
        moduleLabel: 'Achats & Commandes',
        itemId: cid,
        itemLabel: label,
        severity: 'error',
        category: 'reference_manquante',
        categoryLabel: 'Référence manquante',
        title: 'Produit introuvable (ID orphelin)',
        description: `L'identifiant produit "${c.productId}" n'existe plus dans votre catalogue.`,
        targetTab: 'achat',
      });
    }

    // B. Référence Fournisseur
    if (c.fournisseurId && !fournisseurMap.has(c.fournisseurId)) {
      issues.push({
        id: `cmd-orphan-fourn-${cid}`,
        module: 'achats',
        moduleLabel: 'Achats & Commandes',
        itemId: cid,
        itemLabel: label,
        severity: 'warning',
        category: 'reference_manquante',
        categoryLabel: 'Référence manquante',
        title: 'Fournisseur introuvable',
        description: `Le fournisseur associé (ID: ${c.fournisseurId}) est manquant dans l'annuaire.`,
        targetTab: 'fournisseurs',
      });
    }

    // C. Date invalide
    if (!isValidDate(c.date)) {
      issues.push({
        id: `cmd-bad-date-${cid}`,
        module: 'achats',
        moduleLabel: 'Achats & Commandes',
        itemId: cid,
        itemLabel: label,
        severity: 'error',
        category: 'date_invalide',
        categoryLabel: 'Date invalide',
        title: 'Date d\'achat absente ou invalide',
        description: `Date renseignée : "${c.date || 'vide'}".`,
        targetTab: 'achat',
      });
    }

    // D. Quantité & Montant
    const qty = Number(c.qty);
    if (isNaN(qty) || qty <= 0) {
      issues.push({
        id: `cmd-bad-qty-${cid}`,
        module: 'achats',
        moduleLabel: 'Achats & Commandes',
        itemId: cid,
        itemLabel: label,
        severity: 'error',
        category: 'montant_invalide',
        categoryLabel: 'Quantité nulle ou négative',
        title: 'Quantité commandée invalide',
        description: `Quantité enregistrée : ${c.qty}.`,
        targetTab: 'achat',
      });
    }

    const pu = Number(c.pu) || 0;
    const puRmb = Number(c.puRmb) || 0;
    const total = Number(c.total) || 0;
    if (pu <= 0 && puRmb <= 0 && total <= 0) {
      issues.push({
        id: `cmd-bad-amount-${cid}`,
        module: 'achats',
        moduleLabel: 'Achats & Commandes',
        itemId: cid,
        itemLabel: label,
        severity: 'warning',
        category: 'montant_invalide',
        categoryLabel: 'Montant nul',
        title: 'Montant d\'achat nul (0 Ar)',
        description: 'La commande n\'a aucun prix unitaire ni montant total configuré.',
        targetTab: 'achat',
      });
    }

    // E. Cohérence paiement
    const paye = Number(c.montantPayeMarchandise || c.montantPaye || 0);
    const totalTheorique = total > 0 ? total : (pu * (qty || 1));
    if (paye < 0) {
      issues.push({
        id: `cmd-neg-paye-${cid}`,
        module: 'achats',
        moduleLabel: 'Achats & Commandes',
        itemId: cid,
        itemLabel: label,
        severity: 'error',
        category: 'montant_invalide',
        categoryLabel: 'Montant négatif',
        title: 'Montant payé négatif',
        description: `Le montant payé enregistré est négatif (${paye} Ar).`,
        targetTab: 'achat',
      });
    } else if (totalTheorique > 0 && paye > (totalTheorique * 1.05)) {
      issues.push({
        id: `cmd-overpay-${cid}`,
        module: 'achats',
        moduleLabel: 'Achats & Commandes',
        itemId: cid,
        itemLabel: label,
        severity: 'warning',
        category: 'incoherence',
        categoryLabel: 'Surpaiement',
        title: 'Surpaiement marchandise détecté',
        description: `Payé (${paye.toLocaleString('fr-FR')} Ar) supérieur au total (${totalTheorique.toLocaleString('fr-FR')} Ar).`,
        targetTab: 'achat',
      });
    }
  });

  // ==========================================
  // 2. AUDIT DES IMMOBILISATIONS
  // ==========================================
  immobilisations.forEach((imm: any, index: number) => {
    const imId = imm.id || `immo-${index}`;
    const label = imm.nom || `Immobilisation #${index + 1}`;

    // A. Date d'acquisition
    const dateStr = imm.dateAchat || imm.dateAcquisition || imm.date;
    if (!isValidDate(dateStr)) {
      issues.push({
        id: `immo-bad-date-${imId}`,
        module: 'immobilisations',
        moduleLabel: 'Immobilisations',
        itemId: imId,
        itemLabel: label,
        severity: 'error',
        category: 'date_invalide',
        categoryLabel: 'Date invalide',
        title: 'Date d\'acquisition manquante ou invalide',
        description: `Date renseignée : "${dateStr || 'vide'}".`,
        targetTab: 'immobilisations',
      });
    }

    // B. Valeur d'origine (prix d'achat)
    const valeur = Number(imm.valeurOrigine) || Number(imm.prixAchatAr) || (Number(imm.prixAchatRmb || 0) * 680) || 0;
    if (isNaN(valeur) || valeur <= 0) {
      issues.push({
        id: `immo-bad-valeur-${imId}`,
        module: 'immobilisations',
        moduleLabel: 'Immobilisations',
        itemId: imId,
        itemLabel: label,
        severity: 'error',
        category: 'montant_invalide',
        categoryLabel: 'Montant nul ou négatif',
        title: 'Valeur d\'origine nulle ou non numérique',
        description: `Valeur enregistrée : ${imm.valeurOrigine || 0} Ar.`,
        targetTab: 'immobilisations',
      });
    }

    // C. Durée d'amortissement
    const duree = Number(imm.dureeAmortissement);
    if (isNaN(duree) || duree <= 0 || duree > 100) {
      issues.push({
        id: `immo-bad-duree-${imId}`,
        module: 'immobilisations',
        moduleLabel: 'Immobilisations',
        itemId: imId,
        itemLabel: label,
        severity: 'error',
        category: 'incoherence',
        categoryLabel: 'Durée invalide',
        title: 'Durée d\'amortissement erronée',
        description: `Durée enregistrée : ${imm.dureeAmortissement} an(s). Doit être positive.`,
        targetTab: 'immobilisations',
      });
    }
  });

  // ==========================================
  // 3. AUDIT DES MOUVEMENTS DE TRÉSORERIE
  // ==========================================
  mouvements.forEach((m: any, index: number) => {
    const mId = m.id || `mvt-${index}`;
    const label = m.description || m.reference || `Mouvement #${index + 1}`;

    // A. Date
    if (!isValidDate(m.date)) {
      issues.push({
        id: `mvt-bad-date-${mId}`,
        module: 'mouvements',
        moduleLabel: 'Trésorerie & Mouvements',
        itemId: mId,
        itemLabel: label,
        severity: 'error',
        category: 'date_invalide',
        categoryLabel: 'Date invalide',
        title: 'Date de flux manquante ou invalide',
        description: `Date renseignée : "${m.date || 'vide'}".`,
        targetTab: 'tresorerie',
      });
    }

    // B. Montant
    const montant = Number(m.montant);
    if (isNaN(montant) || montant <= 0) {
      issues.push({
        id: `mvt-bad-montant-${mId}`,
        module: 'mouvements',
        moduleLabel: 'Trésorerie & Mouvements',
        itemId: mId,
        itemLabel: label,
        severity: 'error',
        category: 'montant_invalide',
        categoryLabel: 'Montant nul ou négatif',
        title: 'Montant du flux nul ou invalide',
        description: `Montant enregistré : ${m.montant || 0} Ar.`,
        targetTab: 'tresorerie',
      });
    }

    // C. Type de mouvement
    const validTypes = ['entrée', 'entree', 'sortie', 'investissement'];
    if (!m.type || !validTypes.includes(m.type.toLowerCase())) {
      issues.push({
        id: `mvt-bad-type-${mId}`,
        module: 'mouvements',
        moduleLabel: 'Trésorerie & Mouvements',
        itemId: mId,
        itemLabel: label,
        severity: 'warning',
        category: 'incoherence',
        categoryLabel: 'Type non conforme',
        title: 'Sens du mouvement non reconnu',
        description: `Type : "${m.type || 'non défini'}". Devrait être "entrée", "sortie" ou "investissement".`,
        targetTab: 'tresorerie',
      });
    }

    // D. Compte financier
    if (!m.compte || String(m.compte).trim() === '') {
      issues.push({
        id: `mvt-no-compte-${mId}`,
        module: 'mouvements',
        moduleLabel: 'Trésorerie & Mouvements',
        itemId: mId,
        itemLabel: label,
        severity: 'warning',
        category: 'reference_manquante',
        categoryLabel: 'Compte manquant',
        title: 'Compte financier non affecté',
        description: 'Le mouvement n\'est relié à aucun compte bancaire ou caisse.',
        targetTab: 'tresorerie',
      });
    }
  });

  // ==========================================
  // 4. AUDIT DES VENTES
  // ==========================================
  ventes.forEach((v: any, index: number) => {
    const vId = v.id || `vte-${index}`;
    const product = v.productId ? productMap.get(v.productId) : null;
    const client = v.clientId ? clientMap.get(v.clientId) : null;
    const label = v.ref || (product ? `${product.nom} (x${v.qty || 1})` : `Vente #${index + 1}`);

    // A. Référence Produit
    if (!v.productId) {
      issues.push({
        id: `vte-no-prod-${vId}`,
        module: 'ventes',
        moduleLabel: 'Ventes',
        itemId: vId,
        itemLabel: label,
        severity: 'error',
        category: 'reference_manquante',
        categoryLabel: 'Référence manquante',
        title: 'Article vendu non spécifié',
        description: 'La ligne de vente ne contient aucun identifiant de produit.',
        targetTab: 'vente',
      });
    } else if (!product) {
      issues.push({
        id: `vte-orphan-prod-${vId}`,
        module: 'ventes',
        moduleLabel: 'Ventes',
        itemId: vId,
        itemLabel: label,
        severity: 'error',
        category: 'reference_manquante',
        categoryLabel: 'Référence manquante',
        title: 'Produit vendu introuvable (ID orphelin)',
        description: `L'article "${v.productId}" n'existe pas ou a été supprimé du stock.`,
        targetTab: 'vente',
      });
    }

    // B. Référence Client
    if (v.clientId && !client) {
      issues.push({
        id: `vte-orphan-client-${vId}`,
        module: 'ventes',
        moduleLabel: 'Ventes',
        itemId: vId,
        itemLabel: label,
        severity: 'info',
        category: 'reference_manquante',
        categoryLabel: 'Référence manquante',
        title: 'Client introuvable dans l\'annuaire',
        description: `Client ID "${v.clientId}" non référencé.`,
        targetTab: 'clients',
      });
    }

    // C. Date
    if (!isValidDate(v.date)) {
      issues.push({
        id: `vte-bad-date-${vId}`,
        module: 'ventes',
        moduleLabel: 'Ventes',
        itemId: vId,
        itemLabel: label,
        severity: 'error',
        category: 'date_invalide',
        categoryLabel: 'Date invalide',
        title: 'Date de vente invalide',
        description: `Date renseignée : "${v.date || 'vide'}".`,
        targetTab: 'vente',
      });
    }

    // D. Quantité & Prix
    const qty = Number(v.qty);
    if (isNaN(qty) || qty <= 0) {
      issues.push({
        id: `vte-bad-qty-${vId}`,
        module: 'ventes',
        moduleLabel: 'Ventes',
        itemId: vId,
        itemLabel: label,
        severity: 'error',
        category: 'montant_invalide',
        categoryLabel: 'Quantité nulle ou négative',
        title: 'Quantité vendue invalide',
        description: `Quantité : ${v.qty}.`,
        targetTab: 'vente',
      });
    }

    const pu = Number(v.pu) || 0;
    const total = Number(v.total) || 0;
    if (pu <= 0 && total <= 0) {
      issues.push({
        id: `vte-zero-amount-${vId}`,
        module: 'ventes',
        moduleLabel: 'Ventes',
        itemId: vId,
        itemLabel: label,
        severity: 'warning',
        category: 'montant_invalide',
        categoryLabel: 'Montant nul (0 Ar)',
        title: 'Prix de vente nul (Gratuité)',
        description: 'La vente a été enregistrée à 0 Ar. À vérifier si intentionnel.',
        targetTab: 'vente',
      });
    }

    // E. Cohérence paiement
    const paye = Number(v.montantPaye || 0);
    const totalCalcule = total > 0 ? total : (pu * (qty || 1));
    if (paye < 0) {
      issues.push({
        id: `vte-neg-paye-${vId}`,
        module: 'ventes',
        moduleLabel: 'Ventes',
        itemId: vId,
        itemLabel: label,
        severity: 'error',
        category: 'montant_invalide',
        categoryLabel: 'Montant négatif',
        title: 'Encaissement négatif',
        description: `Le montant payé saisi est négatif (${paye} Ar).`,
        targetTab: 'vente',
      });
    } else if (totalCalcule > 0 && paye > (totalCalcule * 1.05)) {
      issues.push({
        id: `vte-overpay-${vId}`,
        module: 'ventes',
        moduleLabel: 'Ventes',
        itemId: vId,
        itemLabel: label,
        severity: 'warning',
        category: 'incoherence',
        categoryLabel: 'Surpaiement',
        title: 'Encaissement supérieur au total',
        description: `Encaissé (${paye.toLocaleString('fr-FR')} Ar) supérieur au total facturé (${totalCalcule.toLocaleString('fr-FR')} Ar).`,
        targetTab: 'vente',
      });
    }
  });

  // ==========================================
  // 5. AUDIT DES EMPRUNTS
  // ==========================================
  emprunts.forEach((emp: any, index: number) => {
    const eId = emp.id || `emp-${index}`;
    const label = emp.nom || emp.organisme || `Emprunt #${index + 1}`;

    // A. Date début
    if (!isValidDate(emp.dateDebut)) {
      issues.push({
        id: `emp-bad-date-${eId}`,
        module: 'emprunts',
        moduleLabel: 'Emprunts & Dettes',
        itemId: eId,
        itemLabel: label,
        severity: 'error',
        category: 'date_invalide',
        categoryLabel: 'Date invalide',
        title: 'Date d\'emprunt manquante ou erronée',
        description: `Date renseignée : "${emp.dateDebut || 'vide'}".`,
        targetTab: 'emprunts',
      });
    }

    // B. Montant capital
    const montant = Number(emp.montant);
    if (isNaN(montant) || montant <= 0) {
      issues.push({
        id: `emp-bad-montant-${eId}`,
        module: 'emprunts',
        moduleLabel: 'Emprunts & Dettes',
        itemId: eId,
        itemLabel: label,
        severity: 'error',
        category: 'montant_invalide',
        categoryLabel: 'Montant nul ou négatif',
        title: 'Capital emprunté nul ou invalide',
        description: `Montant emprunt : ${emp.montant || 0} Ar.`,
        targetTab: 'emprunts',
      });
    }

    // C. Durée en mois
    const duree = Number(emp.dureeMois);
    if (isNaN(duree) || duree <= 0) {
      issues.push({
        id: `emp-bad-duree-${eId}`,
        module: 'emprunts',
        moduleLabel: 'Emprunts & Dettes',
        itemId: eId,
        itemLabel: label,
        severity: 'error',
        category: 'incoherence',
        categoryLabel: 'Durée invalide',
        title: 'Durée de l\'emprunt non configurée',
        description: `Durée enregistrée : ${emp.dureeMois} mois.`,
        targetTab: 'emprunts',
      });
    }

    // D. Taux d'intérêt
    const taux = Number(emp.tauxInteretAnnuel);
    if (isNaN(taux) || taux < 0) {
      issues.push({
        id: `emp-bad-taux-${eId}`,
        module: 'emprunts',
        moduleLabel: 'Emprunts & Dettes',
        itemId: eId,
        itemLabel: label,
        severity: 'warning',
        category: 'incoherence',
        categoryLabel: 'Taux invalide',
        title: 'Taux d\'intérêt négatif ou invalide',
        description: `Taux enregistré : ${emp.tauxInteretAnnuel}%.`,
        targetTab: 'emprunts',
      });
    }

    // E. Historique des remboursements
    if (Array.isArray(emp.remboursements)) {
      let cumulCapitalRembourse = 0;
      emp.remboursements.forEach((r: any, rIdx: number) => {
        if (!isValidDate(r.date)) {
          issues.push({
            id: `emp-remb-date-${eId}-${rIdx}`,
            module: 'emprunts',
            moduleLabel: 'Emprunts & Dettes',
            itemId: eId,
            itemLabel: `${label} (Échéance ${rIdx + 1})`,
            severity: 'error',
            category: 'date_invalide',
            categoryLabel: 'Date invalide',
            title: 'Date de remboursement invalide',
            description: `Date d'échéance "${r.date || 'vide'}".`,
            targetTab: 'emprunts',
          });
        }
        const mCapital = Number(r.montantPrincipal || r.montant || 0);
        if (mCapital <= 0) {
          issues.push({
            id: `emp-remb-amount-${eId}-${rIdx}`,
            module: 'emprunts',
            moduleLabel: 'Emprunts & Dettes',
            itemId: eId,
            itemLabel: `${label} (Échéance ${rIdx + 1})`,
            severity: 'warning',
            category: 'montant_invalide',
            categoryLabel: 'Montant nul',
            title: 'Mensualité de remboursement nulle',
            description: `Montant principal : ${mCapital} Ar.`,
            targetTab: 'emprunts',
          });
        } else {
          cumulCapitalRembourse += mCapital;
        }
      });

      if (montant > 0 && cumulCapitalRembourse > (montant * 1.02)) {
        issues.push({
          id: `emp-over-remb-${eId}`,
          module: 'emprunts',
          moduleLabel: 'Emprunts & Dettes',
          itemId: eId,
          itemLabel: label,
          severity: 'warning',
          category: 'incoherence',
          categoryLabel: 'Sur-remboursement',
          title: 'Capital remboursé supérieur au capital emprunté',
          description: `Total remboursé (${cumulCapitalRembourse.toLocaleString('fr-FR')} Ar) > Capital initial (${montant.toLocaleString('fr-FR')} Ar).`,
          targetTab: 'emprunts',
        });
      }
    }
  });

  // Calcul du score de santé (Health score)
  const auditedCounts = {
    achats: commandes.length,
    immobilisations: immobilisations.length,
    mouvements: mouvements.length,
    ventes: ventes.length,
    emprunts: emprunts.length,
    total: commandes.length + immobilisations.length + mouvements.length + ventes.length + emprunts.length,
  };

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  // Calcul de score : 100 - (erreurs * 15 + warnings * 5) plafonné entre 0 et 100
  const penalty = (errorCount * 15) + (warningCount * 5);
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  return {
    totalIssues: issues.length,
    errorCount,
    warningCount,
    infoCount,
    byModule: {
      achats: issues.filter(i => i.module === 'achats').length,
      immobilisations: issues.filter(i => i.module === 'immobilisations').length,
      mouvements: issues.filter(i => i.module === 'mouvements').length,
      ventes: issues.filter(i => i.module === 'ventes').length,
      emprunts: issues.filter(i => i.module === 'emprunts').length,
    },
    issues,
    auditedCounts,
    healthScore,
  };
}
