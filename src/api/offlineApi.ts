// src/api/offlineApi.ts
// Service d'API local universel (Android WebView, Capacitor, PWA & Web).
// Accessible directement via import TS, via window.ComptoirAPI et via fetch('/api/v1/...')

import { idbGet, idbSet } from '../backup/indexedDbStore';
import { installAndroidFetchInterceptor } from './httpInterceptor';
import { isAndroidDevice, isAndroidNative, getAndroidDeviceInfo } from './androidBridge';

export interface ErpData {
  products: any[];
  ventes: any[];
  commandes: any[];
  fournisseurs: any[];
  clients: any[];
  sourcing: any[];
  mouvements: any[];
  changes: any[];
  devises: { rmb: number; usd: number };
  comptes: string[];
  immobilisations: any[];
  emprunts: any[];
  frais: any[];
  chargesFixes: any[];
  paiements: any[];
}

const STORAGE_KEY = 'erp-data';

/**
 * Récupère le state complet depuis IndexedDB avec fallback résilient sur localStorage
 */
export async function getLocalErpData(): Promise<ErpData> {
  let data: ErpData | null = null;
  try {
    data = await idbGet<ErpData>(STORAGE_KEY);
  } catch (e) {
    console.warn('[Offline API] IndexedDB indisponible, utilisation du cache mémoire/localStorage:', e);
  }

  if (!data) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      console.warn('[Offline API] Erreur de lecture localStorage:', e);
    }
  }

  return {
    products: Array.isArray(data?.products) ? data!.products : [],
    ventes: Array.isArray(data?.ventes) ? data!.ventes : [],
    commandes: Array.isArray(data?.commandes) ? data!.commandes : [],
    fournisseurs: Array.isArray(data?.fournisseurs) ? data!.fournisseurs : [],
    clients: Array.isArray(data?.clients) ? data!.clients : [],
    sourcing: Array.isArray(data?.sourcing) ? data!.sourcing : [],
    mouvements: Array.isArray(data?.mouvements) ? data!.mouvements : [],
    changes: Array.isArray(data?.changes) ? data!.changes : [],
    devises: data?.devises || { rmb: 680, usd: 4600 },
    comptes: Array.isArray(data?.comptes) ? data!.comptes : ['Caisse Principale', 'Banque BNI', 'Mobile Money'],
    immobilisations: Array.isArray(data?.immobilisations) ? data!.immobilisations : [],
    emprunts: Array.isArray(data?.emprunts) ? data!.emprunts : [],
    frais: Array.isArray(data?.frais) ? data!.frais : [],
    chargesFixes: Array.isArray(data?.chargesFixes) ? data!.chargesFixes : [],
    paiements: Array.isArray(data?.paiements) ? data!.paiements : [],
  };
}

/**
 * Persiste le state complet dans IndexedDB & localStorage en miroir
 */
export async function saveLocalErpData(data: ErpData): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Offline API] localStorage saturé ou inaccessible:', e);
  }
  try {
    await idbSet(STORAGE_KEY, data);
  } catch (e) {
    console.warn('[Offline API] Échec idbSet:', e);
  }

  // Notifier l'application des changements de données
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comptoir-data-updated', { detail: data }));
  }
}

export const offlineApi = {
  /**
   * Diagnostic de santé de l'API locale & compatibilité Android
   */
  async ping() {
    const data = await getLocalErpData();
    const androidInfo = getAndroidDeviceInfo();
    return {
      status: 'online_local',
      engine: 'Comptoir-Universal-API-v2',
      android: {
        isNative: androidInfo.isNative,
        isAndroid: androidInfo.isAndroid,
        platform: androidInfo.platform,
        storageEngine: androidInfo.storageStatus,
      },
      timestamp: new Date().toISOString(),
      counts: {
        products: data.products.length,
        ventes: data.ventes.length,
        commandes: data.commandes.length,
        clients: data.clients.length,
        fournisseurs: data.fournisseurs.length,
        sourcing: data.sourcing.length,
        mouvements: data.mouvements.length,
      },
    };
  },

  /**
   * Informations sur l'environnement d'exécution
   */
  async getSystemInfo() {
    return {
      device: getAndroidDeviceInfo(),
      offlineEngineReady: true,
      apiCapabilities: ['REST_INTERCEPTOR', 'NATIVE_BRIDGE', 'INDEXEDDB_PERSISTENCE', 'HARDWARE_BACK_BUTTON'],
    };
  },

  /**
   * API Produits
   */
  products: {
    async getAll() {
      const data = await getLocalErpData();
      return data.products;
    },
    async getById(id: string) {
      const data = await getLocalErpData();
      return data.products.find((p) => p.id === id) || null;
    },
    async create(product: any) {
      const data = await getLocalErpData();
      const newProduct = {
        id: product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        nom: product.nom || 'Nouveau Produit',
        couleur: product.couleur || '',
        stock: Number(product.stock) || 0,
        prixAchat: Number(product.prixAchat) || 0,
        prixVente: Number(product.prixVente) || 0,
        categorie: product.categorie || 'Bois',
        fournisseur: product.fournisseur || '',
        seuilAlerte: Number(product.seuilAlerte) || 5,
        masque: product.masque === true,
        createdAt: new Date().toISOString(),
        ...product,
      };
      data.products.push(newProduct);
      await saveLocalErpData(data);
      return newProduct;
    },
    async update(id: string, patch: any) {
      const data = await getLocalErpData();
      const idx = data.products.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Produit ${id} introuvable`);
      data.products[idx] = { ...data.products[idx], ...patch, updatedAt: new Date().toISOString() };
      await saveLocalErpData(data);
      return data.products[idx];
    },
    async delete(id: string) {
      const data = await getLocalErpData();
      data.products = data.products.filter((p) => p.id !== id);
      await saveLocalErpData(data);
      return { success: true, deletedId: id };
    },
    async adjustStock(id: string, delta: number, motif = 'Ajustement API Android') {
      const data = await getLocalErpData();
      const idx = data.products.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Produit ${id} introuvable`);
      const oldStock = Number(data.products[idx].stock) || 0;
      const newStock = Math.max(0, oldStock + delta);
      data.products[idx].stock = newStock;
      data.products[idx].updatedAt = new Date().toISOString();

      // Enregistrer le mouvement
      data.mouvements.push({
        id: `mvt_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        productId: id,
        type: delta >= 0 ? 'ENTREE' : 'SORTIE',
        qty: Math.abs(delta),
        motif,
      });

      await saveLocalErpData(data);
      return data.products[idx];
    },
  },

  /**
   * API Ventes
   */
  ventes: {
    async getAll() {
      const data = await getLocalErpData();
      return data.ventes;
    },
    async getById(id: string) {
      const data = await getLocalErpData();
      return data.ventes.find((v) => v.id === id) || null;
    },
    async create(vente: any) {
      const data = await getLocalErpData();
      const newVente = {
        id: vente.id || `vte_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: vente.date || new Date().toISOString().split('T')[0],
        productId: vente.productId,
        qty: Number(vente.qty) || 1,
        pu: Number(vente.pu) || 0,
        total: Number(vente.total) || (Number(vente.qty || 1) * Number(vente.pu || 0)),
        client: vente.client || 'Client Passager',
        statutPaiement: vente.statutPaiement || 'Reglé',
        modePaiement: vente.modePaiement || 'Caisse',
        createdAt: new Date().toISOString(),
        ...vente,
      };

      // Décrémenter le stock
      if (newVente.productId) {
        const pIdx = data.products.findIndex((p) => p.id === newVente.productId);
        if (pIdx !== -1) {
          data.products[pIdx].stock = Math.max(0, (Number(data.products[pIdx].stock) || 0) - newVente.qty);
        }
      }

      data.ventes.push(newVente);
      await saveLocalErpData(data);
      return newVente;
    },
    async delete(id: string) {
      const data = await getLocalErpData();
      data.ventes = data.ventes.filter((v) => v.id !== id);
      await saveLocalErpData(data);
      return { success: true, deletedId: id };
    },
  },

  /**
   * API Commandes Logistique & Importation
   */
  commandes: {
    async getAll() {
      const data = await getLocalErpData();
      return data.commandes;
    },
    async getById(id: string) {
      const data = await getLocalErpData();
      return data.commandes.find((c) => c.id === id) || null;
    },
    async create(commande: any) {
      const data = await getLocalErpData();
      const newCmd = {
        id: commande.id || `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: commande.date || new Date().toISOString().split('T')[0],
        productId: commande.productId,
        qty: Number(commande.qty) || 1,
        pu: Number(commande.pu) || 0,
        total: Number(commande.total) || (Number(commande.qty || 1) * Number(commande.pu || 0)),
        statutLogistique: commande.statutLogistique || 'Commande Chine Validée',
        fournisseur: commande.fournisseur || '',
        createdAt: new Date().toISOString(),
        ...commande,
      };
      data.commandes.push(newCmd);
      await saveLocalErpData(data);
      return newCmd;
    },
    async updateStatus(id: string, statutLogistique: string) {
      const data = await getLocalErpData();
      const idx = data.commandes.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error(`Commande ${id} introuvable`);
      data.commandes[idx].statutLogistique = statutLogistique;
      data.commandes[idx].updatedAt = new Date().toISOString();
      await saveLocalErpData(data);
      return data.commandes[idx];
    },
    async delete(id: string) {
      const data = await getLocalErpData();
      data.commandes = data.commandes.filter((c) => c.id !== id);
      await saveLocalErpData(data);
      return { success: true, deletedId: id };
    },
  },

  /**
   * API Tiers (Clients & Fournisseurs)
   */
  tiers: {
    async getClients() {
      const data = await getLocalErpData();
      return data.clients;
    },
    async addClient(client: any) {
      const data = await getLocalErpData();
      const newClient = {
        id: client.id || `cli_${Date.now()}`,
        nom: client.nom || (typeof client === 'string' ? client : 'Nouveau Client'),
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        createdAt: new Date().toISOString(),
      };
      data.clients.push(newClient);
      await saveLocalErpData(data);
      return newClient;
    },
    async getFournisseurs() {
      const data = await getLocalErpData();
      return data.fournisseurs;
    },
    async addFournisseur(fournisseur: any) {
      const data = await getLocalErpData();
      const newF = {
        id: fournisseur.id || `fourn_${Date.now()}`,
        nom: fournisseur.nom || (typeof fournisseur === 'string' ? fournisseur : 'Nouveau Fournisseur'),
        contact: fournisseur.contact || '',
        pays: fournisseur.pays || 'Chine',
        createdAt: new Date().toISOString(),
      };
      data.fournisseurs.push(newF);
      await saveLocalErpData(data);
      return newF;
    },
  },

  /**
   * API Sourcing
   */
  sourcing: {
    async getAll() {
      const data = await getLocalErpData();
      return data.sourcing;
    },
    async create(item: any) {
      const data = await getLocalErpData();
      const newItem = {
        id: item.id || `src_${Date.now()}`,
        article: item.article || 'Article Sourcing',
        fournisseur: item.fournisseur || '',
        prixRMB: Number(item.prixRMB) || 0,
        prixAr: Number(item.prixAr) || 0,
        statut: item.statut || 'En recherche',
        createdAt: new Date().toISOString(),
        ...item,
      };
      data.sourcing.push(newItem);
      await saveLocalErpData(data);
      return newItem;
    },
  },

  /**
   * API Devises & Taux de Change
   */
  devises: {
    async get() {
      const data = await getLocalErpData();
      return data.devises;
    },
    async update(devisesPatch: { rmb?: number; usd?: number }) {
      const data = await getLocalErpData();
      data.devises = { ...data.devises, ...devisesPatch };
      await saveLocalErpData(data);
      return data.devises;
    },
  },

  /**
   * API Synthèse Métriques / Dashboard
   */
  stats: {
    async getOverview() {
      const data = await getLocalErpData();
      const caTotal = data.ventes.reduce((s, v) => s + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1))), 0);
      const stockValeur = data.products.reduce((s, p) => s + ((Number(p.stock) || 0) * (Number(p.prixAchat) || 0)), 0);
      const nbAchats = data.commandes.length;
      const nbVentes = data.ventes.length;

      return {
        caTotal: Math.round(caTotal),
        stockValeur: Math.round(stockValeur),
        nbAchats,
        nbVentes,
        nbProduits: data.products.length,
        deviseRef: 'Ar',
        timestamp: new Date().toISOString(),
      };
    },
  },

  /**
   * API Backup & Migration
   */
  backup: {
    async exportAll() {
      return await getLocalErpData();
    },
    async importAll(newData: ErpData) {
      await saveLocalErpData(newData);
      return { success: true, timestamp: new Date().toISOString() };
    },
  },
};

// Initialisation immédiate de l'intercepteur fetch pour Android
if (typeof window !== 'undefined') {
  installAndroidFetchInterceptor();
  (window as any).ComptoirAPI = offlineApi;
}
