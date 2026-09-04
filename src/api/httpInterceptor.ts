// src/api/httpInterceptor.ts
// Intercepteur universel fetch pour compatibilité totale Android WebView & PWA hors-ligne.
// Permet d'exécuter des appels REST standard (ex: fetch('/api/v1/products'))
// directement sur la base locale haute-performance de l'ERP sans dépendre d'un serveur HTTP distant.

import { offlineApi, getLocalErpData, saveLocalErpData } from './offlineApi';

let isInterceptorInstalled = false;

/**
 * Fonction Fetch universelle du Comptoir Central.
 * Traite les routes /api/v1/* localement et relaie le reste au fetch natif.
 */
export async function comptoirFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const originalFetch = typeof window !== 'undefined' ? (window as any).__originalFetch || window.fetch.bind(window) : fetch;
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

  // Détecter si l'URL est une route API locale du Comptoir
  const isLocalApi =
    urlStr.startsWith('/api/') ||
    urlStr.startsWith('api/') ||
    urlStr.includes('/api/v1/') ||
    urlStr.startsWith('http://localhost/api/') ||
    urlStr.startsWith('https://localhost/api/') ||
    urlStr.startsWith('capacitor://localhost/api/');

  if (!isLocalApi) {
    // Requête normale vers le réseau externe
    return originalFetch(input, init);
  }

  try {
    // Normaliser le chemin relatif (ex: /api/v1/products)
    let pathname = urlStr;
    if (urlStr.includes('://')) {
      try {
        pathname = new URL(urlStr).pathname;
      } catch {
        pathname = urlStr.replace(/^https?:\/\/[^/]+/, '');
      }
    }
    if (!pathname.startsWith('/')) {
      pathname = '/' + pathname;
    }

    const method = (init?.method || 'GET').toUpperCase();
    let bodyData: any = null;

    if (init?.body) {
      try {
        if (typeof init.body === 'string') {
          bodyData = JSON.parse(init.body);
        } else if (init.body instanceof FormData) {
          bodyData = Object.fromEntries(init.body.entries());
        }
      } catch (e) {
        bodyData = init.body;
      }
    }

    // Router les requêtes API
    const result = await handleLocalApiRequest(pathname, method, bodyData);

    // Créer une vraie réponse HTTP standard
    const responseBody = JSON.stringify(result.data);
    return new Response(responseBody, {
      status: result.status,
      statusText: result.statusText || 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-Comptoir-Engine': 'Android-Local-Bridge-v2',
        'X-Comptoir-Storage': 'IndexedDB-Persisted',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[Android Fetch Interceptor] Erreur sur ' + urlStr, err);
    return new Response(
      JSON.stringify({
        error: true,
        message: err?.message || 'Erreur interne de traitement API Android',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Installe l'accès sécurisé pour l'API Android et environnements déconnectés.
 * N'altère pas la propriété protégée native window.fetch.
 */
export function installAndroidFetchInterceptor(): void {
  if (typeof window === 'undefined' || isInterceptorInstalled) return;

  try {
    (window as any).comptoirFetch = comptoirFetch;
    isInterceptorInstalled = true;
    console.log('[Comptoir Central] Connecteur API Android & Offline initialisé.');
  } catch (err) {
    console.warn('[Comptoir Central] Note initialisation connecteur API:', err);
  }
}

/**
 * Routeur REST local pour Android
 */
async function handleLocalApiRequest(
  path: string,
  method: string,
  body: any
): Promise<{ status: number; statusText?: string; data: any }> {
  // 1. Health / Diagnostic
  if (path === '/api/v1/health' || path === '/api/v1/ping' || path === '/api/health') {
    const ping = await offlineApi.ping();
    return { status: 200, data: ping };
  }

  // 2. Info Système Android
  if (path === '/api/v1/info' || path === '/api/info') {
    const data = await getLocalErpData();
    return {
      status: 200,
      data: {
        app: 'Comptoir Central ERP',
        version: '1.0.0',
        androidCompatible: true,
        offlineFirst: true,
        counts: {
          products: data.products.length,
          ventes: data.ventes.length,
          commandes: data.commandes.length,
          clients: data.clients.length,
          fournisseurs: data.fournisseurs.length,
          mouvements: data.mouvements.length,
        },
        devises: data.devises,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 3. Synthèse Dashboard / Stats
  if (path === '/api/v1/stats' || path === '/api/v1/stats/overview') {
    const stats = await offlineApi.stats.getOverview();
    return { status: 200, data: stats };
  }

  // 4. Produits (/api/v1/products)
  if (path.startsWith('/api/v1/products') || path.startsWith('/api/products')) {
    const parts = path.split('/').filter(Boolean);
    const id = parts.length > 3 ? parts[3] : parts.length > 2 && parts[1] === 'products' ? parts[2] : null;

    if (method === 'GET') {
      if (id) {
        const item = await offlineApi.products.getById(id);
        if (!item) return { status: 404, data: { error: 'Produit introuvable' } };
        return { status: 200, data: item };
      }
      const all = await offlineApi.products.getAll();
      return { status: 200, data: all };
    }

    if (method === 'POST') {
      const created = await offlineApi.products.create(body || {});
      return { status: 201, data: created };
    }

    if (method === 'PUT' || method === 'PATCH') {
      if (!id) return { status: 400, data: { error: 'ID requis pour la mise à jour' } };
      const updated = await offlineApi.products.update(id, body || {});
      return { status: 200, data: updated };
    }

    if (method === 'DELETE') {
      if (!id) return { status: 400, data: { error: 'ID requis pour la suppression' } };
      const res = await offlineApi.products.delete(id);
      return { status: 200, data: res };
    }
  }

  // 5. Ventes (/api/v1/ventes)
  if (path.startsWith('/api/v1/ventes') || path.startsWith('/api/ventes')) {
    const parts = path.split('/').filter(Boolean);
    const id = parts.length > 3 ? parts[3] : parts.length > 2 && parts[1] === 'ventes' ? parts[2] : null;

    if (method === 'GET') {
      const all = await offlineApi.ventes.getAll();
      return { status: 200, data: all };
    }

    if (method === 'POST') {
      const created = await offlineApi.ventes.create(body || {});
      return { status: 201, data: created };
    }

    if (method === 'DELETE') {
      if (!id) return { status: 400, data: { error: 'ID requis pour la suppression' } };
      const res = await offlineApi.ventes.delete(id);
      return { status: 200, data: res };
    }
  }

  // 6. Commandes & Logistique (/api/v1/commandes)
  if (path.startsWith('/api/v1/commandes') || path.startsWith('/api/commandes')) {
    const parts = path.split('/').filter(Boolean);
    const id = parts.length > 3 ? parts[3] : parts.length > 2 && parts[1] === 'commandes' ? parts[2] : null;

    if (method === 'GET') {
      const all = await offlineApi.commandes.getAll();
      return { status: 200, data: all };
    }

    if (method === 'POST') {
      const created = await offlineApi.commandes.create(body || {});
      return { status: 201, data: created };
    }

    if (method === 'PUT' || method === 'PATCH') {
      if (!id) return { status: 400, data: { error: 'ID requis' } };
      if (body?.statutLogistique) {
        const res = await offlineApi.commandes.updateStatus(id, body.statutLogistique);
        return { status: 200, data: res };
      }
      const data = await getLocalErpData();
      const idx = data.commandes.findIndex((c) => c.id === id);
      if (idx === -1) return { status: 404, data: { error: 'Commande introuvable' } };
      data.commandes[idx] = { ...data.commandes[idx], ...body, updatedAt: new Date().toISOString() };
      await saveLocalErpData(data);
      return { status: 200, data: data.commandes[idx] };
    }

    if (method === 'DELETE') {
      if (!id) return { status: 400, data: { error: 'ID requis' } };
      const data = await getLocalErpData();
      data.commandes = data.commandes.filter((c) => c.id !== id);
      await saveLocalErpData(data);
      return { status: 200, data: { success: true, deletedId: id } };
    }
  }

  // 7. Clients (/api/v1/clients)
  if (path.startsWith('/api/v1/clients') || path.startsWith('/api/clients')) {
    const parts = path.split('/').filter(Boolean);
    const id = parts.length > 3 ? parts[3] : parts.length > 2 && parts[1] === 'clients' ? parts[2] : null;

    if (method === 'GET') {
      const all = await offlineApi.tiers.getClients();
      return { status: 200, data: all };
    }

    if (method === 'POST') {
      const created = await offlineApi.tiers.addClient(body || {});
      return { status: 201, data: created };
    }

    if (method === 'DELETE') {
      if (!id) return { status: 400, data: { error: 'ID requis' } };
      const data = await getLocalErpData();
      data.clients = data.clients.filter((c) => c.id !== id);
      await saveLocalErpData(data);
      return { status: 200, data: { success: true, deletedId: id } };
    }
  }

  // 8. Fournisseurs (/api/v1/fournisseurs)
  if (path.startsWith('/api/v1/fournisseurs') || path.startsWith('/api/fournisseurs')) {
    const parts = path.split('/').filter(Boolean);
    const id = parts.length > 3 ? parts[3] : parts.length > 2 && parts[1] === 'fournisseurs' ? parts[2] : null;

    if (method === 'GET') {
      const all = await offlineApi.tiers.getFournisseurs();
      return { status: 200, data: all };
    }

    if (method === 'POST') {
      const created = await offlineApi.tiers.addFournisseur(body || {});
      return { status: 201, data: created };
    }

    if (method === 'DELETE') {
      if (!id) return { status: 400, data: { error: 'ID requis' } };
      const data = await getLocalErpData();
      data.fournisseurs = data.fournisseurs.filter((f) => f.id !== id);
      await saveLocalErpData(data);
      return { status: 200, data: { success: true, deletedId: id } };
    }
  }

  // 9. Devises (/api/v1/devises)
  if (path.startsWith('/api/v1/devises') || path.startsWith('/api/devises')) {
    const data = await getLocalErpData();
    if (method === 'GET') {
      return { status: 200, data: data.devises };
    }
    if (method === 'POST' || method === 'PUT') {
      data.devises = { ...data.devises, ...body };
      await saveLocalErpData(data);
      return { status: 200, data: data.devises };
    }
  }

  // 10. Sauvegarde / Backup (/api/v1/backup)
  if (path.startsWith('/api/v1/backup/export')) {
    const full = await offlineApi.backup.exportAll();
    return { status: 200, data: full };
  }
  if (path.startsWith('/api/v1/backup/import') && method === 'POST') {
    const res = await offlineApi.backup.importAll(body);
    return { status: 200, data: res };
  }

  // Fallback 404 Route non trouvée
  return {
    status: 404,
    statusText: 'Not Found',
    data: {
      error: true,
      message: `Route API locale non trouvée: [${method}] ${path}`,
      availableEndpoints: [
        'GET /api/v1/health',
        'GET /api/v1/info',
        'GET /api/v1/stats/overview',
        'GET /api/v1/products',
        'POST /api/v1/products',
        'GET /api/v1/ventes',
        'POST /api/v1/ventes',
        'GET /api/v1/commandes',
        'POST /api/v1/commandes',
        'GET /api/v1/clients',
        'POST /api/v1/clients',
        'GET /api/v1/fournisseurs',
        'POST /api/v1/fournisseurs',
        'GET /api/v1/devises',
        'GET /api/v1/backup/export',
        'POST /api/v1/backup/import',
      ],
    },
  };
}
