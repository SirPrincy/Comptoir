const CACHE_NAME = 'comptoir-erp-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Helpers de gestion IndexedDB directement depuis le Service Worker
function readSwIndexedDb() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('erp-backup-db', 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('erp-store')) {
          resolve(null);
          return;
        }
        const tx = db.transaction('erp-store', 'readonly');
        const storeReq = tx.objectStore('erp-store').get('erp-data');
        storeReq.onsuccess = () => resolve(storeReq.result || null);
        storeReq.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

function writeSwIndexedDb(data) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('erp-backup-db', 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('erp-store')) {
          resolve(false);
          return;
        }
        const tx = db.transaction('erp-store', 'readwrite');
        const storeReq = tx.objectStore('erp-store').put(data, 'erp-data');
        storeReq.onsuccess = () => resolve(true);
        storeReq.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

// Handler des routes API Offline (/api/v1/*)
async function handleOfflineApiRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Provider': 'ServiceWorker-IndexedDB',
      },
    });
  };

  const dbData = (await readSwIndexedDb()) || {
    products: [],
    ventes: [],
    commandes: [],
    fournisseurs: [],
    clients: [],
    sourcing: [],
    mouvements: [],
    changes: [],
    devises: { rmb: 680, usd: 4600 },
    comptes: [],
    immobilisations: [],
    emprunts: [],
    frais: [],
    chargesFixes: [],
    paiements: [],
  };

  if (path === '/api/v1/health' || path === '/api/v1/ping') {
    return jsonResponse({
      status: 'ok',
      mode: 'offline_service_worker',
      timestamp: new Date().toISOString(),
      counts: {
        products: dbData.products.length,
        ventes: dbData.ventes.length,
        commandes: dbData.commandes.length,
      },
    });
  }

  if (path === '/api/v1/products') {
    if (method === 'GET') {
      return jsonResponse(dbData.products);
    }
    if (method === 'POST') {
      try {
        const body = await request.json();
        const newProd = {
          id: body.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          nom: body.nom || 'Nouveau Produit',
          couleur: body.couleur || '',
          stock: Number(body.stock) || 0,
          prixAchat: Number(body.prixAchat) || 0,
          prixVente: Number(body.prixVente) || 0,
          categorie: body.categorie || 'Bois',
          createdAt: new Date().toISOString(),
          ...body,
        };
        dbData.products.push(newProd);
        await writeSwIndexedDb(dbData);
        return jsonResponse(newProd, 201);
      } catch (err) {
        return jsonResponse({ error: 'Body JSON invalide' }, 400);
      }
    }
  }

  if (path === '/api/v1/ventes') {
    if (method === 'GET') {
      return jsonResponse(dbData.ventes);
    }
    if (method === 'POST') {
      try {
        const body = await request.json();
        const newVente = {
          id: body.id || `vte_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          date: body.date || new Date().toISOString().split('T')[0],
          productId: body.productId,
          qty: Number(body.qty) || 1,
          pu: Number(body.pu) || 0,
          total: Number(body.total) || (Number(body.qty || 1) * Number(body.pu || 0)),
          client: body.client || 'Client Passager',
          statutPaiement: body.statutPaiement || 'Reglé',
          modePaiement: body.modePaiement || 'Caisse',
          createdAt: new Date().toISOString(),
          ...body,
        };

        if (newVente.productId) {
          const pIdx = dbData.products.findIndex((p) => p.id === newVente.productId);
          if (pIdx !== -1) {
            dbData.products[pIdx].stock = Math.max(0, (Number(dbData.products[pIdx].stock) || 0) - newVente.qty);
          }
        }

        dbData.ventes.push(newVente);
        await writeSwIndexedDb(dbData);
        return jsonResponse(newVente, 201);
      } catch (err) {
        return jsonResponse({ error: 'Body JSON invalide' }, 400);
      }
    }
  }

  if (path === '/api/v1/commandes') {
    if (method === 'GET') return jsonResponse(dbData.commandes);
  }

  if (path === '/api/v1/stats') {
    const caTotal = dbData.ventes.reduce((s, v) => s + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1))), 0);
    const stockValeur = dbData.products.reduce((s, p) => s + ((Number(p.stock) || 0) * (Number(p.prixAchat) || 0)), 0);
    return jsonResponse({
      caTotal: Math.round(caTotal),
      stockValeur: Math.round(stockValeur),
      nbAchats: dbData.commandes.length,
      nbVentes: dbData.ventes.length,
      nbProduits: dbData.products.length,
      timestamp: new Date().toISOString(),
    });
  }

  if (path === '/api/v1/backup') {
    return jsonResponse(dbData);
  }

  return jsonResponse({ error: 'Endpoint API local non trouvé' }, 404);
}

// Installation : Mise en cache du Shell de l'application
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pré-mise en cache des ressources statiques');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Suppression ancien cache :', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes Réseau
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Interception spéciale des requêtes API local /api/v1/*
  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(handleOfflineApiRequest(request));
    return;
  }

  // Ignorer les requêtes non-GET ou de schémas non supportés
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Requêtes de navigation HTML (Navigation SPA) -> Network First, fallback sur index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Mode hors-ligne : chargement depuis le cache HTML');
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Pour les ressources statiques -> Cache First avec revalidation arrière-plan
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
