// backupUtils.ts
// Gère : l'export JSON, le suivi de sauvegarde, les snapshots automatiques,
// le versionnage/migration de schéma et le diagnostic de santé des données.

const LAST_BACKUP_KEY = 'erp-last-backup-date';
const VENTES_DEPUIS_BACKUP_KEY = 'erp-ventes-depuis-backup';
const AUTO_SNAPSHOT_KEY = 'erp-auto-snapshot-latest';

export const CURRENT_SCHEMA_VERSION = 1.1;

/** Date de la dernière sauvegarde, ou null si jamais faite. */
export function getLastBackupDate(): Date | null {
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  return raw ? new Date(raw) : null;
}

/** Nombre de jours écoulés depuis la dernière sauvegarde (Infinity si jamais faite). */
export function joursDepuisBackup(): number {
  const last = getLastBackupDate();
  if (!last) return Infinity;
  const diffMs = Date.now() - last.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** À appeler juste après un export réussi. */
export function marquerBackupFait() {
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  localStorage.setItem(VENTES_DEPUIS_BACKUP_KEY, '0');
}

/** Crée un snapshot automatique silencieux dans le navigateur */
export function enregistrerAutoSnapshot(data: any) {
  try {
    const snapshot = {
      timestamp: new Date().toISOString(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      data,
    };
    localStorage.setItem(AUTO_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('Impossible de sauvegarder le snapshot auto :', e);
  }
}

/** Récupère le dernier snapshot automatique */
export function getDernierAutoSnapshot(): { timestamp: string; schemaVersion: number; data: any } | null {
  try {
    const raw = localStorage.getItem(AUTO_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Migration automatique de schéma de données
 * Garantit que les données anciennes s'adaptent sans erreur à l'application.
 */
export function migrateDataSchema(rawData: any): any {
  if (!rawData || typeof rawData !== 'object') {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      products: [],
      ventes: [],
      commandes: [],
      fournisseurs: [],
      clients: [],
      sourcing: [],
      mouvements: [],
      changes: [],
      immobilisations: [],
      emprunts: [],
      frais: [],
      chargesFixes: [],
      paiements: [],
      comptes: ['Caisse / Espèces', 'MVola', 'Orange Money', 'BMOI Banque'],
      devises: { rmb: 680, usd: 4600 },
    };
  }

  const migrated = {
    schemaVersion: rawData.schemaVersion || 1.0,
    products: Array.isArray(rawData.products) ? rawData.products : [],
    ventes: Array.isArray(rawData.ventes) ? rawData.ventes : [],
    commandes: Array.isArray(rawData.commandes) ? rawData.commandes : [],
    fournisseurs: Array.isArray(rawData.fournisseurs) ? rawData.fournisseurs : [],
    clients: Array.isArray(rawData.clients) ? rawData.clients : [],
    sourcing: Array.isArray(rawData.sourcing) ? rawData.sourcing : [],
    mouvements: Array.isArray(rawData.mouvements) ? rawData.mouvements : [],
    changes: Array.isArray(rawData.changes) ? rawData.changes : [],
    immobilisations: Array.isArray(rawData.immobilisations) ? rawData.immobilisations : [],
    emprunts: Array.isArray(rawData.emprunts) ? rawData.emprunts : [],
    frais: Array.isArray(rawData.frais) ? rawData.frais : (Array.isArray(rawData.notesDeFrais) ? rawData.notesDeFrais : []),
    chargesFixes: Array.isArray(rawData.chargesFixes) ? rawData.chargesFixes : [],
    paiements: Array.isArray(rawData.paiements) ? rawData.paiements : [],
    comptes: Array.isArray(rawData.comptes) && rawData.comptes.length > 0 ? rawData.comptes : ['Caisse / Espèces', 'MVola', 'Orange Money', 'BMOI Banque'],
    devises: rawData.devises && typeof rawData.devises === 'object' ? rawData.devises : { rmb: 680, usd: 4600 },
  };

  // Normalisation douce des champs numériques et conservation rigoureuse des images
  migrated.products = migrated.products.map((p: any) => {
    let images: string[] = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      images = p.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    } else if (typeof p.image === 'string' && p.image.trim().length > 0) {
      images = [p.image.trim()];
    }

    return {
      ...p,
      images,
      prixAchat: Number(p.prixAchat) || 0,
      prixVente: Number(p.prixVente) || 0,
      stock: Number(p.stock) || 0,
    };
  });

  migrated.ventes = migrated.ventes.map((v: any) => ({
    ...v,
    prixTotal: Number(v.prixTotal) || 0,
    paye: Number(v.paye) || 0,
    reste: Number(v.reste) || 0,
  }));

  migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
  return migrated;
}

/**
 * Diagnostic de santé et d'intégrité des données (Health Check)
 */
export interface DataHealthReport {
  score: number; // 0 à 100
  totalRecords: number;
  totalImages: number;
  totalImagesSizeEstimate: string;
  anomalies: string[];
  warnings: string[];
}

export function analyzeDataHealth(data: any): DataHealthReport {
  const anomalies: string[] = [];
  const warnings: string[] = [];

  const products = data?.products || [];
  const ventes = data?.ventes || [];
  const commandes = data?.commandes || [];

  const totalRecords =
    (data?.products?.length || 0) +
    (data?.ventes?.length || 0) +
    (data?.commandes?.length || 0) +
    (data?.fournisseurs?.length || 0) +
    (data?.clients?.length || 0) +
    (data?.mouvements?.length || 0) +
    (data?.paiements?.length || 0);

  // Statistiques sur les images
  let totalImages = 0;
  let totalImagesBytes = 0;
  products.forEach((p: any) => {
    const pImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    pImages.forEach((img: string) => {
      if (typeof img === 'string' && img.length > 0) {
        totalImages++;
        totalImagesBytes += img.length;
      }
    });
  });

  const totalImagesSizeEstimate =
    totalImagesBytes < 1024
      ? `${totalImagesBytes} B`
      : totalImagesBytes < 1024 * 1024
      ? `${(totalImagesBytes / 1024).toFixed(1)} KB`
      : `${(totalImagesBytes / (1024 * 1024)).toFixed(2)} MB`;

  // Vérification 1 : Prix ou montants NaN / invalides
  let nanCount = 0;
  ventes.forEach((v: any) => {
    if (isNaN(v.prixTotal) || isNaN(v.paye)) nanCount++;
  });
  products.forEach((p: any) => {
    if (isNaN(p.prixVente) || isNaN(p.prixAchat)) nanCount++;
  });
  if (nanCount > 0) {
    anomalies.push(`${nanCount} élément(s) contiennent des prix ou valeurs numériques non valides (NaN).`);
  }

  // Vérification 2 : Ventes sans produit valide
  let salesWithoutProduct = 0;
  ventes.forEach((v: any) => {
    if (!v.produitId && !v.produit) salesWithoutProduct++;
  });
  if (salesWithoutProduct > 0) {
    warnings.push(`${salesWithoutProduct} vente(s) enregistrée(s) sans identifiant de produit.`);
  }

  // Vérification 3 : Commandes sans fournisseur
  let ordersWithoutSupplier = 0;
  commandes.forEach((c: any) => {
    if (!c.fournisseurId && !c.fournisseur) ordersWithoutSupplier++;
  });
  if (ordersWithoutSupplier > 0) {
    warnings.push(`${ordersWithoutSupplier} commande(s) sans fournisseur associé.`);
  }

  let score = 100;
  score -= anomalies.length * 20;
  score -= warnings.length * 5;
  if (score < 0) score = 0;

  return { score, totalRecords, totalImages, totalImagesSizeEstimate, anomalies, warnings };
}

/**
 * Nettoie et répare les anomalies mineures
 */
export function repairDataIntegrity(data: any): any {
  const clean = migrateDataSchema(data);
  clean.ventes = clean.ventes.map((v: any) => ({
    ...v,
    prixTotal: isNaN(v.prixTotal) ? 0 : v.prixTotal,
    paye: isNaN(v.paye) ? 0 : v.paye,
    reste: isNaN(v.reste) ? 0 : v.reste,
  }));
  clean.products = clean.products.map((p: any) => ({
    ...p,
    prixAchat: isNaN(p.prixAchat) ? 0 : p.prixAchat,
    prixVente: isNaN(p.prixVente) ? 0 : p.prixVente,
    stock: isNaN(p.stock) ? 0 : p.stock,
  }));
  return clean;
}

/**
 * Déclenche le téléchargement d'un fichier .json contenant toutes les données.
 */
export function exporterJSON(data: any, silencieux = false) {
  const cleanData = migrateDataSchema(data);
  const payload = {
    app: 'Comptoir ERP',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    ...cleanData,
  };

  const contenu = JSON.stringify(payload, null, 2);
  const blob = new Blob([contenu], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const horodatage = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.download = `comptoir-erp-sauvegarde-${horodatage}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  marquerBackupFait();
  enregistrerAutoSnapshot(cleanData);

  if (!silencieux) {
    console.log('Sauvegarde exportée :', a.download);
  }
}

/**
 * À appeler à chaque fois qu'une vente est enregistrée.
 */
export function verifierAutoBackupApresVente(data: any, seuilVentes = 10) {
  enregistrerAutoSnapshot(data);
  const compteurActuel = Number(localStorage.getItem(VENTES_DEPUIS_BACKUP_KEY) || '0') + 1;
  localStorage.setItem(VENTES_DEPUIS_BACKUP_KEY, String(compteurActuel));

  if (compteurActuel >= seuilVentes) {
    exporterJSON(data, true);
  }
}

/**
 * À appeler une fois au chargement de l'app.
 */
export function verifierAutoBackupQuotidien(data: any, seuilJours = 1) {
  enregistrerAutoSnapshot(data);
  if (joursDepuisBackup() >= seuilJours) {
    exporterJSON(data, true);
  }
}

