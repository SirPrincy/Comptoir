// indexedDbStore.ts
// Wrapper minimal, sans dépendance externe, pour stocker les données en IndexedDB
// EN PLUS du localStorage — plus de capacité, plus robuste sur mobile.

const DB_NAME = 'erp-backup-db';
const STORE_NAME = 'erp-store';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Écrit une valeur dans IndexedDB. Ne bloque jamais l'app si ça échoue — best effort. */
export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB set a échoué (non bloquant) :', e);
  }
}

/** Lit une valeur depuis IndexedDB. Retourne null si absente ou en cas d'erreur. */
export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB get a échoué (non bloquant) :', e);
    return null;
  }
}

/**
 * Sauvegarde les données à la fois dans localStorage (rapide, lecture immédiate)
 * ET dans IndexedDB (plus de capacité, filet de sécurité).
 * À appeler à la place de ton simple `localStorage.setItem` actuel.
 */
export async function persistDouble(key: string, data: any) {
  const serialized = JSON.stringify(data);
  try {
    localStorage.setItem(key, serialized);
  } catch (e) {
    // localStorage plein ou indisponible — IndexedDB devient le seul filet
    console.warn('localStorage a échoué, IndexedDB prend le relais :', e);
  }
  await idbSet(key, data); // objet brut, pas besoin de re-sérialiser pour IndexedDB
}

/**
 * Charge les données : essaie localStorage d'abord (rapide),
 * bascule sur IndexedDB si absent ou corrompu.
 */
export async function loadWithFallback<T = any>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Lecture localStorage corrompue, tentative IndexedDB :', e);
  }
  return await idbGet<T>(key);
}
