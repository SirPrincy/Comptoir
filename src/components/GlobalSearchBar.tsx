import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Package, ShoppingCart, Users, ArrowRight, CornerDownLeft, Factory } from 'lucide-react';
import { THEME } from '../colors';
import { RADIUS, SHADOWS } from '../ui';

interface GlobalSearchBarProps {
  products?: any[];
  commandes?: any[];
  clients?: any[];
  fournisseurs?: any[];
  onNavigate: (tab: string, searchPreset?: string) => void;
}

export default function GlobalSearchBar({
  products = [],
  commandes = [],
  clients = [],
  fournisseurs = [],
  onNavigate,
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'products' | 'commandes' | 'partenaires'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Raccourci clavier Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fermer la popup si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche filtrée multi-entités
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { products: [], commandes: [], clients: [], fournisseurs: [], total: 0 };
    }

    const matchedProducts = products.filter((p: any) =>
      (p.nom && p.nom.toLowerCase().includes(q)) ||
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      (p.categorie && p.categorie.toLowerCase().includes(q)) ||
      (p.couleur && p.couleur.toLowerCase().includes(q))
    ).slice(0, 6);

    const matchedCommandes = commandes.filter((c: any) =>
      (c.productName && c.productName.toLowerCase().includes(q)) ||
      (c.numeroTracking && c.numeroTracking.toLowerCase().includes(q)) ||
      (c.fournisseurName && c.fournisseurName.toLowerCase().includes(q)) ||
      (c.statut && c.statut.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q))
    ).slice(0, 6);

    const matchedClients = clients.filter((cl: any) =>
      (cl.nom && cl.nom.toLowerCase().includes(q)) ||
      (cl.telephone && cl.telephone.toLowerCase().includes(q)) ||
      (cl.ville && cl.ville.toLowerCase().includes(q)) ||
      (cl.remarques && cl.remarques.toLowerCase().includes(q))
    ).slice(0, 6);

    const matchedFournisseurs = fournisseurs.filter((f: any) =>
      (f.nom && f.nom.toLowerCase().includes(q)) ||
      (f.telephone && f.telephone.toLowerCase().includes(q)) ||
      (f.specialite && f.specialite.toLowerCase().includes(q))
    ).slice(0, 6);

    const total = matchedProducts.length + matchedCommandes.length + matchedClients.length + matchedFournisseurs.length;

    return {
      products: matchedProducts,
      commandes: matchedCommandes,
      clients: matchedClients,
      fournisseurs: matchedFournisseurs,
      total,
    };
  }, [query, products, commandes, clients, fournisseurs]);

  const handleSelect = (tab: string, searchPreset: string) => {
    setIsOpen(false);
    onNavigate(tab, searchPreset);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      // Par défaut au clavier, aller vers Stock si produits trouvés, sinon Achat, sinon Partenaires
      if (results.products.length > 0) {
        handleSelect('stock', query);
      } else if (results.commandes.length > 0) {
        handleSelect('achat', query);
      } else if (results.clients.length > 0 || results.fournisseurs.length > 0) {
        handleSelect('partenaires', query);
      } else {
        handleSelect('stock', query);
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      {/* BARRE DE RECHERCHE DANS L'EN-TÊTE */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: THEME.bg.surface,
        border: `1px solid ${isOpen ? THEME.brand.blue : THEME.border.base}`,
        borderRadius: RADIUS.pill,
        padding: '6px 14px',
        boxShadow: isOpen ? `0 0 0 3px rgba(0, 113, 227, 0.15)` : 'none',
        transition: 'all 0.18s ease',
      }}>
        <Search size={14} color={isOpen ? THEME.brand.blue : THEME.text.muted} style={{ flexShrink: 0 }} />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDownInput}
          placeholder="Rechercher partout… (⌘K)"
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            color: THEME.text.primary,
            fontFamily: 'inherit',
            fontSize: 13,
            width: '100%',
            fontWeight: 400,
          }}
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 2,
              cursor: 'pointer',
              color: THEME.text.muted,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Effacer la recherche"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd style={{
            fontSize: 11,
            fontFamily: 'inherit',
            color: THEME.text.muted,
            background: THEME.bg.card,
            border: `1px solid ${THEME.border.strong}`,
            borderRadius: RADIUS.micro,
            padding: '1px 6px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}>
            ⌘K
          </kbd>
        )}
      </div>

      {/* DROPDOWN DE RÉSULTATS INTERACTIF */}
      {isOpen && query.trim().length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          minWidth: 320,
          maxWidth: '92vw',
          background: THEME.bg.card,
          border: `1px solid ${THEME.border.base}`,
          borderRadius: RADIUS.container,
          boxShadow: SHADOWS.modal,
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* BARRE D'ONGLETS DU DROPDOWN */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            borderBottom: `1px solid ${THEME.border.base}`,
            background: THEME.bg.surface,
            overflowX: 'auto',
          }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '4px 8px',
                borderRadius: RADIUS.tag,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeCategory === 'all' ? THEME.bg.card : 'transparent',
                color: activeCategory === 'all' ? THEME.text.primary : THEME.text.muted,
                boxShadow: activeCategory === 'all' ? SHADOWS.subtle : 'none',
              }}
            >
              Tous ({results.total})
            </button>

            {results.products.length > 0 && (
              <button
                onClick={() => setActiveCategory('products')}
                style={{
                  padding: '4px 8px',
                  borderRadius: RADIUS.tag,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeCategory === 'products' ? THEME.bg.card : 'transparent',
                  color: activeCategory === 'products' ? THEME.accent.orange : THEME.text.muted,
                  boxShadow: activeCategory === 'products' ? SHADOWS.subtle : 'none',
                }}
              >
                Produits ({results.products.length})
              </button>
            )}

            {results.commandes.length > 0 && (
              <button
                onClick={() => setActiveCategory('commandes')}
                style={{
                  padding: '4px 8px',
                  borderRadius: RADIUS.tag,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeCategory === 'commandes' ? THEME.bg.card : 'transparent',
                  color: activeCategory === 'commandes' ? THEME.accent.primary : THEME.text.muted,
                  boxShadow: activeCategory === 'commandes' ? SHADOWS.subtle : 'none',
                }}
              >
                Commandes ({results.commandes.length})
              </button>
            )}

            {(results.clients.length > 0 || results.fournisseurs.length > 0) && (
              <button
                onClick={() => setActiveCategory('partenaires')}
                style={{
                  padding: '4px 8px',
                  borderRadius: RADIUS.tag,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeCategory === 'partenaires' ? THEME.bg.card : 'transparent',
                  color: activeCategory === 'partenaires' ? THEME.accent.green : THEME.text.muted,
                  boxShadow: activeCategory === 'partenaires' ? SHADOWS.subtle : 'none',
                }}
              >
                Clients ({results.clients.length + results.fournisseurs.length})
              </button>
            )}
          </div>

          {/* LISTE DES RÉSULTATS */}
          <div style={{ maxHeight: 360, overflowY: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.total === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
                Aucun résultat trouvé pour « <strong>{query}</strong> »
              </div>
            ) : (
              <>
                {/* BLOC PRODUITS */}
                {(activeCategory === 'all' || activeCategory === 'products') && results.products.length > 0 && (
                  <div>
                    {activeCategory === 'all' && (
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.text.muted, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Package size={12} color={THEME.accent.orange} />
                        Produits ({results.products.length})
                      </div>
                    )}
                    {results.products.map((p: any) => (
                      <div
                        key={`p-${p.id}`}
                        onClick={() => handleSelect('stock', p.nom)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: RADIUS.control,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          gap: 10,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = THEME.bg.surface}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: RADIUS.control, background: `${THEME.accent.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={14} color={THEME.accent.orange} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.nom}
                            </div>
                            <div style={{ fontSize: 11, color: THEME.text.muted, display: 'flex', gap: 6 }}>
                              <span>{p.categorie || 'Général'}</span>
                              {p.reference && <span>• Ref: {p.reference}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {p.prixVente && (
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.green }}>
                              {Number(p.prixVente).toLocaleString('fr-FR')} Ar
                            </span>
                          )}
                          <ArrowRight size={13} color={THEME.text.muted} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* BLOC COMMANDES */}
                {(activeCategory === 'all' || activeCategory === 'commandes') && results.commandes.length > 0 && (
                  <div>
                    {activeCategory === 'all' && (
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.text.muted, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <ShoppingCart size={12} color={THEME.accent.primary} />
                        Commandes ({results.commandes.length})
                      </div>
                    )}
                    {results.commandes.map((c: any) => (
                      <div
                        key={`c-${c.id}`}
                        onClick={() => handleSelect('achat', c.productName || c.numeroTracking || c.fournisseurName)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: RADIUS.control,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          gap: 10,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = THEME.bg.surface}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: RADIUS.control, background: `${THEME.accent.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShoppingCart size={14} color={THEME.accent.primary} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.productName || 'Commande Chine'}
                            </div>
                            <div style={{ fontSize: 11, color: THEME.text.muted, display: 'flex', gap: 6 }}>
                              {c.fournisseurName && <span>{c.fournisseurName}</span>}
                              {c.numeroTracking && <span>• Suivi: {c.numeroTracking}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: RADIUS.tag,
                            background: THEME.bg.chip,
                            color: THEME.text.secondary,
                            border: `1px solid ${THEME.border.base}`,
                          }}>
                            {c.statut || 'En cours'}
                          </span>
                          <ArrowRight size={13} color={THEME.text.muted} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* BLOC CLIENTS & PARTENAIRES */}
                {(activeCategory === 'all' || activeCategory === 'partenaires') && (results.clients.length > 0 || results.fournisseurs.length > 0) && (
                  <div>
                    {activeCategory === 'all' && (
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.text.muted, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <Users size={12} color={THEME.accent.green} />
                        Clients & Fournisseurs ({results.clients.length + results.fournisseurs.length})
                      </div>
                    )}

                    {results.clients.map((cl: any) => (
                      <div
                        key={`cl-${cl.id}`}
                        onClick={() => handleSelect('partenaires', cl.nom)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: RADIUS.control,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          gap: 10,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = THEME.bg.surface}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: RADIUS.control, background: `${THEME.accent.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Users size={14} color={THEME.accent.green} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cl.nom}
                            </div>
                            <div style={{ fontSize: 11, color: THEME.text.muted, display: 'flex', gap: 6 }}>
                              <span>Client B2B</span>
                              {cl.telephone && <span>• {cl.telephone}</span>}
                              {cl.ville && <span>• {cl.ville}</span>}
                            </div>
                          </div>
                        </div>

                        <ArrowRight size={13} color={THEME.text.muted} style={{ flexShrink: 0 }} />
                      </div>
                    ))}

                    {results.fournisseurs.map((f: any) => (
                      <div
                        key={`f-${f.id}`}
                        onClick={() => handleSelect('partenaires', f.nom)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: RADIUS.control,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          gap: 10,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = THEME.bg.surface}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: RADIUS.control, background: `${THEME.accent.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Factory size={14} color={THEME.accent.purple} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {f.nom}
                            </div>
                            <div style={{ fontSize: 11, color: THEME.text.muted, display: 'flex', gap: 6 }}>
                              <span>Fournisseur</span>
                              {f.specialite && <span>• {f.specialite}</span>}
                            </div>
                          </div>
                        </div>

                        <ArrowRight size={13} color={THEME.text.muted} style={{ flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* FOOTER INDICATEUR */}
          <div style={{
            padding: '6px 12px',
            background: THEME.bg.surface,
            borderTop: `1px solid ${THEME.border.base}`,
            fontSize: 11,
            color: THEME.text.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CornerDownLeft size={12} /> Appuyez sur Entrée pour naviguer
            </span>
            <span>Échap pour fermer</span>
          </div>
        </div>
      )}
    </div>
  );
}
