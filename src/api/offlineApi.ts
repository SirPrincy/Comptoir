// src/api/offlineApi.ts
// Service d'API local pour l'accès aux données de l'ERP en mode hors-ligne.
// Accessible directement en TypeScript/JavaScript et via window.ComptoirAPI.

import { idbGet, idbSet } from '../backup/indexedDbStore';

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
 * Récupère le state complet depuis IndexedDB avec fallback sur localStorage
 */
export async function getLocalErpData(): Promise<ErpData> {
  let data = await idbGet<ErpData>(STORAGE_KEY);
  if (!data) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      console.warn('[Offline API] Erreur de lecture localStorage:', e);
    }
  }

  return {
    products: data?.products || [],
    ventes: data?.ventes || [],
    commandes: data?.commandes || [],
    fournisseurs: data?.fournisseurs || [],
    clients: data?.clients || [],
    sourcing: data?.sourcing || [],
    mouvements: data?.mouvements || [],
    changes: data?.changes || [],
    devises: data?.devises || { rmb: 680, usd: 4600 },
    comptes: data?.comptes || [],
    immobilisations: data?.immobilisations || [],
    emprunts: data?.emprunts || [],
    frais: data?.frais || [],
    chargesFixes: data?.chargesFixes || [],
    paiements: data?.paiements || [],
  };
}

/**
 * Persiste le state complet dans IndexedDB & localStorage
 */
export async function saveLocalErpData(data: ErpData): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Offline API] localStorage saturé:', e);
  }
  await idbSet(STORAGE_KEY, data);
  // Notifier l'application des changements de données
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comptoir-data-updated', { detail: data }));
  }
}

export const offlineApi = {
  /**
   * Diagnostic de santé de l'API locale
   */
  async ping() {
    const data = await getLocalErpData();
    return {
      status: 'online_local',
      mode: 'offline-indexeddb',
      timestamp: new Date().toISOString(),
      counts: {
        products: data.products.length,
        ventes: data.ventes.length,
        commandes: data.commandes.length,
        clients: data.clients.length,
        fournisseurs: data.fournisseurs.length,
      },
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
  },

  /**
   * API Ventes
   */
  ventes: {
    async getAll() {
      const data = await getLocalErpData();
      return data.ventes;
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

      // Mettre à jour le stock du produit en local
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
        nom: client.nom || client,
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
        nom: fournisseur.nom || fournisseur,
        createdAt: new Date().toISOString(),
      };
      data.fournisseurs.push(newF);
      await saveLocalErpData(data);
      return newF;
    },
  },

  /**
   * API Synthèse Tableau de Bord
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
   * API Import / Export complet
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

// Injection sur l'objet global window pour les tests et scripts tiers
if (typeof window !== 'undefined') {
  (window as any).ComptoirAPI = offlineApi;
}
