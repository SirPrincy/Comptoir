import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Play, Database, Server, RefreshCw, X, Code, ShieldCheck } from 'lucide-react';
import { THEME } from '../colors';
import { offlineApi } from '../api/offlineApi';
import { Modal } from '../ui';

interface ApiTesterModalProps {
  onClose: () => void;
}

export function ApiTesterModal({ onClose }: ApiTesterModalProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/health');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [postBody, setPostBody] = useState<string>('{\n  "nom": "Pin Sylvestre 75x225",\n  "stock": 150,\n  "prixAchat": 42000,\n  "prixVente": 65000\n}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tester' | 'doc' | 'js'>('tester');

  const handleExecute = async () => {
    setLoading(true);
    setResponse(null);
    try {
      if (selectedEndpoint === '/api/v1/health') {
        const res = await offlineApi.ping();
        setResponse({ status: 200, provider: 'IndexedDB Direct API', data: res });
      } else if (selectedEndpoint === '/api/v1/products') {
        if (method === 'GET') {
          const res = await offlineApi.products.getAll();
          setResponse({ status: 200, count: res.length, data: res });
        } else {
          const parsed = JSON.parse(postBody);
          const res = await offlineApi.products.create(parsed);
          setResponse({ status: 201, message: 'Produit créé en local (IndexedDB)', data: res });
        }
      } else if (selectedEndpoint === '/api/v1/ventes') {
        if (method === 'GET') {
          const res = await offlineApi.ventes.getAll();
          setResponse({ status: 200, count: res.length, data: res });
        } else {
          const parsed = JSON.parse(postBody);
          const res = await offlineApi.ventes.create(parsed);
          setResponse({ status: 201, message: 'Vente enregistrée en local', data: res });
        }
      } else if (selectedEndpoint === '/api/v1/commandes') {
        const res = await offlineApi.commandes.getAll();
        setResponse({ status: 200, count: res.length, data: res });
      } else if (selectedEndpoint === '/api/v1/stats') {
        const res = await offlineApi.stats.getOverview();
        setResponse({ status: 200, data: res });
      } else if (selectedEndpoint === '/api/v1/backup') {
        const res = await offlineApi.backup.exportAll();
        setResponse({ status: 200, data: res });
      }
    } catch (err: any) {
      setResponse({ status: 500, error: err.message || 'Erreur lors de l\'exécution' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleExecute();
  }, [selectedEndpoint]);

  const copyCodeSnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getJsCodeSnippet = () => {
    if (selectedEndpoint === '/api/v1/products') {
      if (method === 'GET') return `// 1. Appel HTTP Intercepté par Service Worker (100% Offline)\nconst res = await fetch('/api/v1/products');\nconst products = await res.json();\nconsole.log(products);\n\n// 2. Ou via l'objet window.ComptoirAPI\nconst productsLocal = await window.ComptoirAPI.products.getAll();`;
      return `// Création de produit sans serveur\nconst res = await fetch('/api/v1/products', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${postBody.replace(/\n/g, '\n  ')})\n});\nconst newProd = await res.json();`;
    }
    if (selectedEndpoint === '/api/v1/ventes') {
      return `// Enregistrer une vente en mode hors-ligne\nconst vente = await window.ComptoirAPI.ventes.create({\n  productId: "prod_123",\n  qty: 5,\n  pu: 65000,\n  client: "Client Express"\n});`;
    }
    return `// Tester le ping local\nconst health = await fetch('/api/v1/health').then(r => r.json());\nconsole.log(health);`;
  };

  return (
    <Modal title="🔌 API Local & Accès Hors-Ligne" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Banner Info */}
        <div style={{
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <ShieldCheck size={22} color={THEME.accent.primary} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: THEME.text.primary, lineHeight: 1.4 }}>
            <strong>API Hors-Ligne Prête (Service Worker & IndexedDB)</strong> : Toutes les requêtes HTTP vers <code style={{ background: THEME.bg.surface, padding: '2px 6px', borderRadius: 4, color: THEME.accent.primary }}>/api/v1/*</code> sont interceptées localement en 0ms sans serveur distant.
          </div>
        </div>

        {/* Navigation Onglets */}
        <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${THEME.border.base}`, paddingBottom: 8 }}>
          <button
            onClick={() => setActiveTab('tester')}
            style={{
              background: activeTab === 'tester' ? THEME.accent.primary : 'transparent',
              color: activeTab === 'tester' ? '#FFF' : THEME.text.muted,
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Play size={14} />
            <span>Console de Test</span>
          </button>
          <button
            onClick={() => setActiveTab('js')}
            style={{
              background: activeTab === 'js' ? THEME.accent.primary : 'transparent',
              color: activeTab === 'js' ? '#FFF' : THEME.text.muted,
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Code size={14} />
            <span>Exemples de Code JS</span>
          </button>
          <button
            onClick={() => setActiveTab('doc')}
            style={{
              background: activeTab === 'doc' ? THEME.accent.primary : 'transparent',
              color: activeTab === 'doc' ? '#FFF' : THEME.text.muted,
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Database size={14} />
            <span>Documentation Endpoints</span>
          </button>
        </div>

        {activeTab === 'tester' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Formulaire de test */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: 8, alignItems: 'center' }}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                style={{
                  background: THEME.bg.card,
                  border: `1px solid ${THEME.border.strong}`,
                  borderRadius: 8,
                  padding: '8px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: method === 'GET' ? THEME.accent.green : THEME.accent.primary,
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>

              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                style={{
                  background: THEME.bg.card,
                  border: `1px solid ${THEME.border.strong}`,
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: THEME.text.primary,
                }}
              >
                <option value="/api/v1/health">GET /api/v1/health (Ping & Santé Local)</option>
                <option value="/api/v1/products">/api/v1/products (Liste & Création Produits)</option>
                <option value="/api/v1/ventes">/api/v1/ventes (Registre & Enregistrement Ventes)</option>
                <option value="/api/v1/commandes">GET /api/v1/commandes (Commandes Chine/Logistique)</option>
                <option value="/api/v1/stats">GET /api/v1/stats (Synthese CA & Stock)</option>
                <option value="/api/v1/backup">GET /api/v1/backup (Export complet ERP)</option>
              </select>

              <button
                onClick={handleExecute}
                disabled={loading}
                style={{
                  background: THEME.accent.primary,
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                <span>Exécuter</span>
              </button>
            </div>

            {method === 'POST' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Corps de la requête (JSON) :</label>
                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    background: THEME.bg.surface,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: THEME.text.primary,
                  }}
                />
              </div>
            )}

            {/* Réponse JSON */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: THEME.text.secondary }}>
                  Résultat HTTP ({response?.status || 200} OK) — Temps de réponse : 0 ms (Local)
                </span>
                <button
                  onClick={() => copyCodeSnippet(JSON.stringify(response, null, 2))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: THEME.accent.primary,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {copied ? <Check size={14} color={THEME.accent.green} /> : <Copy size={14} />}
                  <span>{copied ? 'Copié !' : 'Copier JSON'}</span>
                </button>
              </div>

              <pre style={{
                background: '#0F172A',
                color: '#38BDF8',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 12,
                fontFamily: 'monospace',
                maxHeight: 220,
                overflowY: 'auto',
                border: `1px solid ${THEME.border.strong}`,
                margin: 0,
              }}>
                {loading ? 'Chargement local…' : JSON.stringify(response?.data || response, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'js' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary }}>Exemple d'Appel JavaScript / Fetch :</span>
              <button
                onClick={() => copyCodeSnippet(getJsCodeSnippet())}
                style={{
                  background: THEME.bg.surface,
                  border: `1px solid ${THEME.border.base}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 12,
                  color: THEME.text.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copied ? <Check size={14} color={THEME.accent.green} /> : <Copy size={14} />}
                <span>{copied ? 'Copié' : 'Copier Code'}</span>
              </button>
            </div>

            <pre style={{
              background: '#0F172A',
              color: '#F1F5F9',
              borderRadius: 10,
              padding: '14px 18px',
              fontSize: 12.5,
              fontFamily: 'monospace',
              border: `1px solid ${THEME.border.strong}`,
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}>
              {getJsCodeSnippet()}
            </pre>
          </div>
        )}

        {activeTab === 'doc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
            <div style={{ padding: '10px 14px', background: THEME.bg.surface, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent.primary }}>GET /api/v1/health</div>
              <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>Vérifie l'état de l'API locale et retourne les compteurs de données.</div>
            </div>
            <div style={{ padding: '10px 14px', background: THEME.bg.surface, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent.primary }}>GET & POST /api/v1/products</div>
              <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>Obtient le catalogue complet ou ajoute un nouveau produit en stock IndexedDB.</div>
            </div>
            <div style={{ padding: '10px 14px', background: THEME.bg.surface, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent.primary }}>GET & POST /api/v1/ventes</div>
              <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>Consulte l'historique des ventes ou enregistre une nouvelle transaction de vente.</div>
            </div>
            <div style={{ padding: '10px 14px', background: THEME.bg.surface, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent.primary }}>GET /api/v1/stats</div>
              <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>Retourne la synthèse financière : Chiffre d'affaires encaissé et valeur du stock.</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
