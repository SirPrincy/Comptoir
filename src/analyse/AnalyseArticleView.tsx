import React, { useState, useMemo, memo } from 'react';
import {
  Package,
  Search,
  ArrowUpDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  ShoppingCart,
  Zap,
  Info,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { THEME } from '../colors';
import { RADIUS, SHADOWS, Card, inputStyle, selectStyle, ghostBtn, primaryBtn, Empty } from '../ui';
import { ArticleAnalysisItem } from './types';
import { formatAr, formatRmb, formatPct } from './analyseUtils';

interface Props {
  articles: ArticleAnalysisItem[];
  categories: string[];
  onNavigateTab?: (targetTab: string, preset?: string) => void;
}

export const AnalyseArticleView = memo(function AnalyseArticleView({
  articles,
  categories,
  onNavigateTab
}: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState('all');
  const [filtreRentabilite, setFiltreRentabilite] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('margeAr');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  // Filtrage et Tri
  const filteredArticles = useMemo(() => {
    return articles
      .filter(a => {
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNom = a.nom.toLowerCase().includes(q);
          const matchRef = a.reference ? a.reference.toLowerCase().includes(q) : false;
          const matchCat = a.categorie.toLowerCase().includes(q);
          if (!matchNom && !matchRef && !matchCat) return false;
        }

        if (selectedCategorie !== 'all' && a.categorie !== selectedCategorie) {
          return false;
        }

        if (filtreRentabilite !== 'all') {
          if (filtreRentabilite === 'negative' && a.margeBruteAr >= 0) return false;
          if (filtreRentabilite === 'faible' && (a.tauxMargePct >= 20 || a.margeBruteAr <= 0 || a.qtyVendue === 0)) return false;
          if (filtreRentabilite === 'top' && (a.tauxMargePct < 40 || a.margeBruteAr <= 0)) return false;
          if (filtreRentabilite === 'sans_vente' && a.qtyVendue > 0) return false;
          if (filtreRentabilite === 'dormant' && (a.tauxEcoulementPct > 25 || a.stockActuel === 0)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        switch (sortBy) {
          case 'margeAr':
            diff = b.margeBruteAr - a.margeBruteAr;
            break;
          case 'tauxMarge':
            diff = b.tauxMargePct - a.tauxMargePct;
            break;
          case 'ca':
            diff = b.caTotalAr - a.caTotalAr;
            break;
          case 'qtyVendue':
            diff = b.qtyVendue - a.qtyVendue;
            break;
          case 'qtyAchetee':
            diff = b.qtyAchetee - a.qtyAchetee;
            break;
          case 'coutRevient':
            diff = b.coutRevientUnitaireAr - a.coutRevientUnitaireAr;
            break;
          case 'stock':
            diff = b.stockActuel - a.stockActuel;
            break;
          case 'ecoulement':
            diff = b.tauxEcoulementPct - a.tauxEcoulementPct;
            break;
          case 'nom':
            diff = a.nom.localeCompare(b.nom);
            break;
          default:
            diff = b.margeBruteAr - a.margeBruteAr;
        }
        return sortOrder === 'asc' ? -diff : diff;
      });
  }, [articles, search, selectedCategorie, filtreRentabilite, sortBy, sortOrder]);

  // Insights rapides
  const topArticleMarge = useMemo(() => {
    const list = articles.filter(a => a.qtyVendue > 0 && a.margeBruteAr > 0);
    return list.length > 0 ? [...list].sort((a, b) => b.margeBruteAr - a.margeBruteAr)[0] : null;
  }, [articles]);

  const topArticleTaux = useMemo(() => {
    const list = articles.filter(a => a.qtyVendue > 0 && a.tauxMargePct > 0);
    return list.length > 0 ? [...list].sort((a, b) => b.tauxMargePct - a.tauxMargePct)[0] : null;
  }, [articles]);

  const articlesAlerte = useMemo(() => {
    return articles.filter(a => a.qtyVendue > 0 && (a.margeBruteAr < 0 || a.tauxMargePct < 20));
  }, [articles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* BARRE DE CONTRÔLES & RECHERCHE */}
      <Card style={{ padding: '18px 20px', background: THEME.bg.card }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: RADIUS.control,
              background: 'rgba(37, 99, 235, 0.12)',
              color: THEME.brand.blue,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={19} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text.primary, letterSpacing: '-0.01em' }}>
                Analyse de Vente selon Achat par Article
              </div>
              <div style={{ fontSize: 12, color: THEME.text.secondary }}>
                Rentabilité réelle, marge brute, PUMP d'achat, coût de revient complet et taux d'écoulement
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Recherche */}
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: THEME.text.muted }} />
              <input
                type="text"
                placeholder="Rechercher article, réf..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 30, height: 34, fontSize: 12 } as any}
              />
            </div>

            {/* Catégorie */}
            <select
              value={selectedCategorie}
              onChange={e => setSelectedCategorie(e.target.value)}
              style={{ ...selectStyle, height: 34, fontSize: 12, width: 'auto' } as any}
            >
              <option value="all">Toutes catégories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filtre Marge */}
            <select
              value={filtreRentabilite}
              onChange={e => setFiltreRentabilite(e.target.value)}
              style={{ ...selectStyle, height: 34, fontSize: 12, width: 'auto' } as any}
            >
              <option value="all">Tous les états</option>
              <option value="top">⭐ Top Marges (≥ 40%)</option>
              <option value="faible">⚠️ Marges faibles (&lt; 20%)</option>
              <option value="negative">🚨 Marge négative / perte</option>
              <option value="dormant">⏳ Stock dormant (&lt; 25% vendu)</option>
              <option value="sans_vente">📦 Non encore vendus</option>
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ ...selectStyle, height: 34, fontSize: 12, width: 'auto' } as any}
            >
              <option value="margeAr">Tri: Marge brute (Ar)</option>
              <option value="tauxMarge">Tri: Taux de marge (%)</option>
              <option value="ca">Tri: Chiffre d'Affaires</option>
              <option value="qtyVendue">Tri: Quantité vendue</option>
              <option value="qtyAchetee">Tri: Quantité achetée</option>
              <option value="coutRevient">Tri: Coût de revient (Ar)</option>
              <option value="stock">Tri: Stock disponible</option>
              <option value="ecoulement">Tri: Taux d'écoulement</option>
              <option value="nom">Tri: Nom de l'article</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              style={{
                ...ghostBtn,
                padding: '0 8px',
                height: 34,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title={sortOrder === 'desc' ? 'Ordre décroissant' : 'Ordre croissant'}
            >
              <ArrowUpDown size={14} />
              <span style={{ fontSize: 11 }}>{sortOrder.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* 3 HIGHLIGHTS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          paddingTop: 12,
          borderTop: `1px solid ${THEME.border.base}`
        }}>
          {topArticleMarge && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'rgba(16, 185, 129, 0.08)',
              borderRadius: RADIUS.item,
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <Sparkles size={18} color={THEME.brand.emerald} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: THEME.brand.emerald, fontWeight: 700 }}>N°1 Générateur de Marge</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topArticleMarge.nom}
                </div>
                <div style={{ fontSize: 11, color: THEME.text.secondary }}>
                  +{formatAr(topArticleMarge.margeBruteAr)} ({topArticleMarge.tauxMargePct}% marge)
                </div>
              </div>
            </div>
          )}

          {topArticleTaux && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'rgba(37, 99, 235, 0.08)',
              borderRadius: RADIUS.item,
              border: '1px solid rgba(37, 99, 235, 0.2)'
            }}>
              <TrendingUp size={18} color={THEME.brand.blue} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: THEME.brand.blue, fontWeight: 700 }}>Meilleur Taux de Marge</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topArticleTaux.nom}
                </div>
                <div style={{ fontSize: 11, color: THEME.text.secondary }}>
                  Taux: {topArticleTaux.tauxMargePct}% • Coef {topArticleTaux.coefficientMultiplicateur}x
                </div>
              </div>
            </div>
          )}

          {articlesAlerte.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.08)',
              borderRadius: RADIUS.item,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <AlertTriangle size={18} color={THEME.brand.red} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: THEME.brand.red, fontWeight: 700 }}>Alertes Rentabilité ({articlesAlerte.length})</div>
                <div style={{ fontSize: 12, color: THEME.text.primary, fontWeight: 600 }}>
                  {articlesAlerte.length} article{articlesAlerte.length > 1 ? 's' : ''} à marge faible ou négative
                </div>
                <div style={{ fontSize: 10, color: THEME.text.muted }}>
                  À réajuster au niveau du prix de vente
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* TABLEAU PRINCIPAL DES ARTICLES */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${THEME.border.base}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={17} color={THEME.brand.blue} />
            <span>Tableau Analytique Produits ({filteredArticles.length})</span>
          </div>
          <span style={{ fontSize: 11, color: THEME.text.muted }}>
            Cliquez sur un article pour déplier l'analyse complète
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div style={{ padding: 32 }}>
            <Empty
              title="Aucun article correspondant"
              text="Modifiez vos critères de recherche ou de filtre pour visualiser vos articles."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: THEME.bg.surface, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Article</th>
                  <th style={{ padding: '12px 12px', fontWeight: 600, textAlign: 'right' }}>Achats (Qté & CRU)</th>
                  <th style={{ padding: '12px 12px', fontWeight: 600, textAlign: 'right' }}>Ventes (Qté & PV)</th>
                  <th style={{ padding: '12px 12px', fontWeight: 600, textAlign: 'right' }}>Chiffre d'Affaires</th>
                  <th style={{ padding: '12px 12px', fontWeight: 600, textAlign: 'right' }}>Marge Brute (Ar)</th>
                  <th style={{ padding: '12px 12px', fontWeight: 600, textAlign: 'center' }}>Taux Marge (%)</th>
                  <th style={{ padding: '12px 12px', fontWeight: 600, textAlign: 'center' }}>Écoulement Stock</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map(art => {
                  const isExpanded = expandedArticleId === art.id;
                  const isPositive = art.margeBruteAr >= 0;

                  return (
                    <React.Fragment key={art.id}>
                      <tr
                        onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                        style={{
                          borderBottom: `1px solid ${THEME.border.base}`,
                          background: isExpanded ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Article Info */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {art.image ? (
                              <img
                                src={art.image}
                                alt={art.nom}
                                style={{ width: 34, height: 34, borderRadius: RADIUS.control, objectFit: 'cover', border: `1px solid ${THEME.border.base}` }}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: RADIUS.control,
                                background: THEME.bg.surface,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: THEME.text.muted
                              }}>
                                <Package size={16} />
                              </div>
                            )}

                            <div>
                              <div style={{ fontWeight: 700, color: THEME.text.primary, fontSize: 13 }}>
                                {art.nom}
                              </div>
                              <div style={{ fontSize: 11, color: THEME.text.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{art.categorie}</span>
                                {art.reference && (
                                  <>
                                    <span>•</span>
                                    <span>Réf: {art.reference}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Achats : Qté + CRU */}
                        <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: THEME.brand.amber }}>
                            {art.qtyAchetee} pcs achetées
                          </div>
                          <div style={{ fontSize: 11, color: THEME.text.muted }}>
                            CRU: {formatAr(art.coutRevientUnitaireAr)}
                          </div>
                        </td>

                        {/* Ventes : Qté + PV moyen */}
                        <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: THEME.brand.blue }}>
                            {art.qtyVendue} pcs vendues
                          </div>
                          <div style={{ fontSize: 11, color: THEME.text.muted }}>
                            PV: {formatAr(art.prixVenteUnitaireMoyenAr)}
                          </div>
                        </td>

                        {/* Chiffre d'Affaires */}
                        <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: THEME.text.primary }}>
                            {formatAr(art.caTotalAr)}
                          </div>
                          <div style={{ fontSize: 10, color: THEME.text.muted }}>
                            {art.nbVentes} transaction{art.nbVentes > 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* Marge Brute en Ar */}
                        <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                          <div style={{
                            fontWeight: 800,
                            color: isPositive ? THEME.brand.emerald : THEME.brand.red,
                            fontSize: 13
                          }}>
                            {formatAr(art.margeBruteAr)}
                          </div>
                          <div style={{ fontSize: 10, color: THEME.text.muted }}>
                            Coef {art.coefficientMultiplicateur}x
                          </div>
                        </td>

                        {/* Taux de marge (%) */}
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          {art.qtyVendue > 0 ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: RADIUS.tag,
                              fontSize: 11,
                              fontWeight: 700,
                              background: art.tauxMargePct >= 35
                                ? 'rgba(16, 185, 129, 0.12)'
                                : art.tauxMargePct >= 20
                                ? 'rgba(217, 119, 6, 0.12)'
                                : 'rgba(239, 68, 68, 0.12)',
                              color: art.tauxMargePct >= 35
                                ? THEME.brand.emerald
                                : art.tauxMargePct >= 20
                                ? THEME.brand.amber
                                : THEME.brand.red
                            }}>
                              {formatPct(art.tauxMargePct)}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: THEME.text.muted }}>Non vendu</span>
                          )}
                        </td>

                        {/* Stock & Taux d'écoulement */}
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text.primary }}>
                              {art.stockActuel} en stock ({art.tauxEcoulementPct}%)
                            </div>
                            <div style={{ width: 64, height: 4, background: THEME.bg.surface, borderRadius: RADIUS.pill, overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.min(100, art.tauxEcoulementPct)}%`,
                                height: '100%',
                                background: art.tauxEcoulementPct >= 70 ? THEME.brand.emerald : THEME.brand.blue
                              }} />
                            </div>
                          </div>
                        </td>

                        {/* Déplier / Replier */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedArticleId(isExpanded ? null : art.id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: THEME.text.secondary
                            }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* VOLET DÉPLIÉ DÉTAILS DE L'ARTICLE */}
                      {isExpanded && (
                        <tr style={{ background: THEME.bg.surface, borderBottom: `1px solid ${THEME.border.base}` }}>
                          <td colSpan={8} style={{ padding: '16px 20px' }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                              gap: 16
                            }}>
                              {/* Colonne 1 : Décomposition du Coût d'Achat */}
                              <div style={{
                                padding: 14,
                                background: THEME.bg.card,
                                borderRadius: RADIUS.item,
                                border: `1px solid ${THEME.border.base}`
                              }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: THEME.brand.amber, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <ShoppingCart size={14} />
                                  <span>Décomposition Coût de Revient (CRU)</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Prix d'achat moyen (PUMP) :</span>
                                    <span style={{ fontWeight: 600 }}>{formatAr(art.prixAchatUnitaireMoyenAr)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Livraison interne Chine :</span>
                                    <span style={{ fontWeight: 600 }}>{formatAr(art.fraisChineUnitaireMoyenAr)}/u</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Fret international & transit :</span>
                                    <span style={{ fontWeight: 600 }}>{formatAr(art.fretUnitaireMoyenAr)}/u</span>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: 5,
                                    borderTop: `1px solid ${THEME.border.base}`,
                                    fontWeight: 700
                                  }}>
                                    <span style={{ color: THEME.text.primary }}>Coût de Revient Unitaire :</span>
                                    <span style={{ color: THEME.brand.amber }}>{formatAr(art.coutRevientUnitaireAr)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
                                    <span>Total argent achats engagé :</span>
                                    <span>{formatAr(art.totalDepenseAchatAr)} {art.totalDepenseAchatRmb > 0 && `(${formatRmb(art.totalDepenseAchatRmb)})`}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Colonne 2 : Analyse Ventes & Marges */}
                              <div style={{
                                padding: 14,
                                background: THEME.bg.card,
                                borderRadius: RADIUS.item,
                                border: `1px solid ${THEME.border.base}`
                              }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: THEME.brand.blue, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Zap size={14} />
                                  <span>Performance Ventes & Rentabilité</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Prix moyen de vente unitaire :</span>
                                    <span style={{ fontWeight: 600 }}>{formatAr(art.prixVenteUnitaireMoyenAr)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Coût des marchandises vendues (COGS) :</span>
                                    <span style={{ fontWeight: 600 }}>{formatAr(art.cogsAr)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Marge unitaire nette :</span>
                                    <span style={{ fontWeight: 600, color: THEME.brand.emerald }}>
                                      {formatAr(art.prixVenteUnitaireMoyenAr - art.coutRevientUnitaireAr)}/u
                                    </span>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: 5,
                                    borderTop: `1px solid ${THEME.border.base}`,
                                    fontWeight: 700
                                  }}>
                                    <span style={{ color: THEME.text.primary }}>Marge Brute Réalisée :</span>
                                    <span style={{ color: isPositive ? THEME.brand.emerald : THEME.brand.red }}>
                                      {formatAr(art.margeBruteAr)} ({art.tauxMargePct}%)
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
                                    <span>Taux de marque (marge/achat) :</span>
                                    <span>{art.tauxMarquePct}%</span>
                                  </div>
                                </div>
                              </div>

                              {/* Colonne 3 : Stock & Sources d'achat */}
                              <div style={{
                                padding: 14,
                                background: THEME.bg.card,
                                borderRadius: RADIUS.item,
                                border: `1px solid ${THEME.border.base}`
                              }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: THEME.brand.emerald, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Package size={14} />
                                  <span>Stock & Plateformes Fournisseurs</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Stock actuel disponible :</span>
                                    <span style={{ fontWeight: 700, color: THEME.text.primary }}>{art.stockActuel} pièces</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Valeur du stock restant au coût :</span>
                                    <span style={{ fontWeight: 600 }}>{formatAr(art.valeurStockCoutAr)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: THEME.text.muted }}>Marge potentielle restante :</span>
                                    <span style={{ fontWeight: 600, color: THEME.brand.emerald }}>{formatAr(art.margePotentielleStockAr)}</span>
                                  </div>

                                  {/* Sources d'achat de cet article */}
                                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${THEME.border.base}` }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: THEME.text.secondary, marginBottom: 4 }}>
                                      Sources d'achat utilisées :
                                    </div>
                                    {art.sourcesUtilisees.length > 0 ? (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {art.sourcesUtilisees.map(src => (
                                          <span
                                            key={src.source}
                                            style={{
                                              padding: '2px 8px',
                                              borderRadius: RADIUS.tag,
                                              background: THEME.bg.surface,
                                              border: `1px solid ${THEME.border.base}`,
                                              fontSize: 11,
                                              fontWeight: 600
                                            }}
                                          >
                                            {src.source}: {src.qty} pcs ({formatAr(src.montantAr)})
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: 11, color: THEME.text.muted }}>Aucune commande spécifique</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
});
