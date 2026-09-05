/**
 * Utility functions for generating and ensuring persistent UIDs for:
 * - Articles (e.g. ART0001)
 * - Achats (e.g. A0001)
 * - Ventes (e.g. V0001)
 * - Importations (e.g. I0001)
 */

export function pad4(num: number): string {
  return String(num).padStart(4, '0');
}

/**
 * Extracts sequence number from a code like "ART0012", "A0005", "V0100", "I0003"
 */
export function parseUidNum(code?: string, prefix?: string): number {
  if (!code || typeof code !== 'string') return 0;
  const cleaned = code.trim().toUpperCase();
  if (prefix && cleaned.startsWith(prefix.toUpperCase())) {
    const numPart = cleaned.slice(prefix.length);
    const parsed = parseInt(numPart, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  const match = cleaned.match(/\d+/);
  if (match) {
    const parsed = parseInt(match[0], 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Ensures persistent UIDs for products array.
 */
export function ensureProductUids(products: any[]): any[] {
  if (!Array.isArray(products)) return [];

  let maxIndex = 0;
  products.forEach((p: any) => {
    const code = p.uidCode || p.codeUid || p.codeArticle;
    const num = parseUidNum(code, 'ART') || parseUidNum(code, 'P');
    if (num > maxIndex) maxIndex = num;
  });

  let counter = maxIndex;

  return products.map((p: any) => {
    const existingCode = p.uidCode || p.codeUid || p.codeArticle;
    if (existingCode && typeof existingCode === 'string' && existingCode.trim().length > 0) {
      return { ...p, uidCode: existingCode.trim().toUpperCase() };
    }
    counter++;
    const newUid = `ART${pad4(counter)}`;
    return { ...p, uidCode: newUid };
  });
}

/**
 * Ensures persistent UIDs for purchases array (Achats & Imports).
 */
export function ensureCommandeUids(commandes: any[]): any[] {
  if (!Array.isArray(commandes)) return [];

  const sorted = [...commandes].sort((a: any, b: any) => {
    const tA = new Date(a.dateAchat || a.datePaiement || a.dateCommande || a.date || 0).getTime();
    const tB = new Date(b.dateAchat || b.datePaiement || b.dateCommande || b.date || 0).getTime();
    return tA - tB;
  });

  let maxAchat = 0;
  let maxImport = 0;

  commandes.forEach((c: any) => {
    const codeA = c.codeAchat || c.uidAchat;
    const numA = parseUidNum(codeA, 'A');
    if (numA > maxAchat) maxAchat = numA;

    const codeI = c.codeImport || c.uidImport;
    const numI = parseUidNum(codeI, 'I');
    if (numI > maxImport) maxImport = numI;
  });

  let counterAchat = maxAchat;
  let counterImport = maxImport;

  const mapCodeA = new Map<string, string>();
  const mapCodeI = new Map<string, string>();

  sorted.forEach((c: any) => {
    if (!c.codeAchat && !c.uidAchat) {
      counterAchat++;
      mapCodeA.set(c.id, `A${pad4(counterAchat)}`);
    }
    if (!c.codeImport && !c.uidImport) {
      counterImport++;
      mapCodeI.set(c.id, `I${pad4(counterImport)}`);
    }
  });

  return commandes.map((c: any) => {
    const codeAchat = c.codeAchat || c.uidAchat || mapCodeA.get(c.id) || `A${pad4(1)}`;
    const codeImport = c.codeImport || c.uidImport || mapCodeI.get(c.id) || `I${pad4(1)}`;
    return {
      ...c,
      codeAchat,
      codeImport,
    };
  });
}

/**
 * Ensures persistent UIDs for sales array (Ventes).
 */
export function ensureVenteUids(ventes: any[]): any[] {
  if (!Array.isArray(ventes)) return [];

  const sorted = [...ventes].sort((a: any, b: any) => {
    const tA = new Date(a.date || 0).getTime();
    const tB = new Date(b.date || 0).getTime();
    return tA - tB;
  });

  let maxVente = 0;
  ventes.forEach((v: any) => {
    const codeV = v.codeVente || v.uidVente;
    const numV = parseUidNum(codeV, 'V');
    if (numV > maxVente) maxVente = numV;
  });

  let counterVente = maxVente;
  const mapCodeV = new Map<string, string>();

  sorted.forEach((v: any) => {
    if (!v.codeVente && !v.uidVente) {
      counterVente++;
      mapCodeV.set(v.id, `V${pad4(counterVente)}`);
    }
  });

  return ventes.map((v: any) => {
    const codeVente = v.codeVente || v.uidVente || mapCodeV.get(v.id) || `V${pad4(1)}`;
    return {
      ...v,
      codeVente,
    };
  });
}

/**
 * Gets next UID string for a new item.
 */
export function getNextProductUid(products: any[]): string {
  let max = 0;
  (products || []).forEach((p: any) => {
    const num = parseUidNum(p.uidCode || p.codeUid, 'ART') || parseUidNum(p.uidCode || p.codeUid, 'P');
    if (num > max) max = num;
  });
  return `ART${pad4(max + 1)}`;
}

export function getNextAchatUid(commandes: any[]): string {
  let max = 0;
  (commandes || []).forEach((c: any) => {
    const num = parseUidNum(c.codeAchat || c.uidAchat, 'A');
    if (num > max) max = num;
  });
  return `A${pad4(max + 1)}`;
}

export function getNextImportUid(commandes: any[]): string {
  let max = 0;
  (commandes || []).forEach((c: any) => {
    const num = parseUidNum(c.codeImport || c.uidImport, 'I');
    if (num > max) max = num;
  });
  return `I${pad4(max + 1)}`;
}

export function getNextVenteUid(ventes: any[]): string {
  let max = 0;
  (ventes || []).forEach((v: any) => {
    const num = parseUidNum(v.codeVente || v.uidVente, 'V');
    if (num > max) max = num;
  });
  return `V${pad4(max + 1)}`;
}
