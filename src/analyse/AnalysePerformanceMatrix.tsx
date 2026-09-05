import React, { useMemo, memo } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, Layers, Package, ArrowRight, ShieldAlert, Zap, Clock } from 'lucide-react';
import { THEME } from '../colors';
import { RADIUS, SHADOWS, Card, ghostBtn, primaryBtn } from '../ui';
import { ArticleAnalysisItem } from './types';
import { formatAr, formatPct } from './analyseUtils';

interface Props {
  articles: ArticleAnalysisItem[];
  onNavigateTab?: (targetTab: string, preset?: string) => void;
}

export const AnalysePerformanceMatrix = memo(function AnalysePerformanceMatrix({
  articles,
  onNavigateTab
}: Props) {
  // Classification des articles
  const matrix = useMemo(() => {
    // Stars : Marge >= 35% et Ventes >= 5 (ou écoulement >= 50%)
    const stars = articles.filter(a => a.qtyVendue > 0 && a.tauxMargePct >= 35 && (a.qtyVendue >= 3 || a.tauxEcoulementPct >= 40));

    // Rentables mais lentes (Pépites à accélérer) : Marge >= 35% mais ventes faibles
    const pepites = articles.filter(a => a.tauxMargePct >= 35 && a.qtyVendue < 3 && a.stockActuel > 0);

    // Volume mais marge serrée : Ventes élevées mais marge < 30%
    const volumeFaibleMarge = articles.filter(a => a.qtyVendue >= 3 && a.tauxMargePct < 30 && a.margeBruteAr > 0);

    // Stock dormant / À risque : Stock > 0, qtyAchetee > 0, écoulement < 25%
    const dormants = articles.filter(a => a.stockActuel > 0 && (a.tauxEcoulementPct < 25 || a.qtyVendue === 0));

    // Marges négatives ou critiques
    const critiques = articles.filter(a => a.qtyVendue > 0 && (a.margeBruteAr < 0 || a.tauxMargePct < 15));

    // Capital immobilisé dans les dormants
    const capitalDormantAr = dormants.reduce((s, a) => s + a.valeurStockCoutAr, 0);

    return {
      stars: stars.sort((a, b) => b.margeBruteAr - a.margeBruteAr),
      pepites: pepites.sort((a, b) => b.tauxMargePct - a.tauxMargePct),
      volumeFaibleMarge: volumeFaibleMarge.sort((a, b) => b.qtyVendue - a.qtyVendue),
      dormants: dormants.sort((a, b) => b.valeurStockCoutAr - a.valeurStockCoutAr),
      critiques: critiques.sort((a, b) => a.margeBruteAr - b.margeBruteAr),
      capitalDormantAr
    };
  }, [articles]);

  // Analyse par catégorie
  const parCategorie = useMemo(() => {
    const map = new Map<string, {
      ca: number;
      cogs: number;
      achats: number;
      nbArticles: number;
      qtyVendue: number;
    }>();

    articles.forEach(a => {
      const cat = a.categorie || 'Autre';
      if (!map.has(cat)) {
        map.set(cat, { ca: 0, cogs: 0, achats: 0, nbArticles: 0, qtyVendue: 0 });
      }
      const item = map.get(cat)!;
      item.ca += a.caTotalAr;
      item.cogs += a.cogsAr;
      item.achats += a.totalDepenseAchatAr;
      item.nbArticles += 1;
      item.qtyVendue += a.qtyVendue;
    });

    return Array.from(map.entries()).map(([cat, data]) => {
      const marge = data.ca - data.cogs;
      const tauxMarge = data.ca > 0 ? Math.round((marge / data.ca) * 1000) / 10 : 0;
      return {
        categorie: cat,
        ca: data.ca,
        marge,
        tauxMarge,
        achats: data.achats,
        nbArticles: data.nbArticles,
        qtyVendue: data.qtyVendue
      };
    }).sort((a, b) => b.marge - a.marge);
  }, [articles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ALERTE CAPITAL IMMOBILISÉ */}
      {matrix.capitalDormantAr > 0 && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(217, 119, 6, 0.08)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: RADIUS.card,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={22} color={THEME.brand.amber} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text.primary }}>
                Capital Immobilisé en Stock Dormant : <strong style={{ color: THEME.brand.amber }}>{formatAr(matrix.capitalDormantAr)}</strong>
              </div>
              <div style={{ fontSize: 12, color: THEME.text.secondary }}>
                {matrix.dormants.length} article{matrix.dormants.length > 1 ? 's' : ''} ont un taux d'écoulement inférieur à 25%. Envisagez des offres bundles ou opérations flash pour libérer du cash.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUADRANT STRATÉGIQUE */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16
      }}>
        {/* 1. ARTICLES STARS */}
        <Card style={{ padding: 18, background: THEME.bg.card }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: RADIUS.control, background: 'rgba(16, 185, 129, 0.12)', color: THEME.brand.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text.primary }}>
                  Articles Stars (Top Rentabilité)
                </div>
                <div style={{ fontSize: 11, color: THEME.text.muted }}>
                  Forte marge (&ge; 35%) & bonnes rotations
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: THEME.brand.emerald }}>
              {matrix.stars.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matrix.stars.slice(0, 4).map(a => (
              <div
                key={a.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: RADIUS.control,
                  background: THEME.bg.surface,
                  border: `1px solid ${THEME.border.base}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.nom}
                  </div>
                  <div style={{ fontSize: 10, color: THEME.text.muted }}>
                    {a.qtyVendue} vendus • Stock: {a.stockActuel}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: THEME.brand.emerald }}>
                    +{formatAr(a.margeBruteAr)}
                  </div>
                  <div style={{ fontSize: 10, color: THEME.text.muted }}>
                    {a.tauxMargePct}% marge
                  </div>
                </div>
              </div>
            ))}
            {matrix.stars.length === 0 && (
              <div style={{ padding: 14, textAlign: 'center', fontSize: 12, color: THEME.text.muted }}>
                Aucun article star actuellement
              </div>
            )}
          </div>
        </Card>

        {/* 2. ALERTES MARGES CRITIQUES */}
        <Card style={{ padding: 18, background: THEME.bg.card }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: RADIUS.control, background: 'rgba(239, 68, 68, 0.12)', color: THEME.brand.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text.primary }}>
                  Marges Faibles ou Négatives
                </div>
                <div style={{ fontSize: 11, color: THEME.text.muted }}>
                  Coût de revient trop proche du prix de vente
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: THEME.brand.red }}>
              {matrix.critiques.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matrix.critiques.slice(0, 4).map(a => (
              <div
                key={a.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: RADIUS.control,
                  background: THEME.bg.surface,
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.nom}
                  </div>
                  <div style={{ fontSize: 10, color: THEME.brand.red }}>
                    CRU: {formatAr(a.coutRevientUnitaireAr)} vs PV: {formatAr(a.prixVenteUnitaireMoyenAr)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: THEME.brand.red }}>
                    {formatAr(a.margeBruteAr)}
                  </div>
                  <div style={{ fontSize: 10, color: THEME.text.muted }}>
                    {a.tauxMargePct}% marge
                  </div>
                </div>
              </div>
            ))}
            {matrix.critiques.length === 0 && (
              <div style={{ padding: 14, textAlign: 'center', fontSize: 12, color: THEME.brand.emerald }}>
                Excellente nouvelle : aucune marge négative ou critique !
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* PERFORMANCE COMPARATIVE PAR CATÉGORIE */}
      <Card style={{ padding: 20, background: THEME.bg.card }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text.primary, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={17} color={THEME.brand.blue} />
          <span>Rentabilité par Catégorie de Produits</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: THEME.bg.surface, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Catégorie</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'center' }}>Articles</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Budget Achats</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>CA Ventes</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Marge Brute</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'center' }}>Taux Marge</th>
              </tr>
            </thead>
            <tbody>
              {parCategorie.map(c => (
                <tr key={c.categorie} style={{ borderBottom: `1px solid ${THEME.border.base}` }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: THEME.text.primary }}>
                    {c.categorie}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: THEME.text.secondary }}>
                    {c.nbArticles} réfs ({c.qtyVendue} vendus)
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: THEME.brand.amber }}>
                    {formatAr(c.achats)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: THEME.brand.blue }}>
                    {formatAr(c.ca)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: c.marge >= 0 ? THEME.brand.emerald : THEME.brand.red }}>
                    {formatAr(c.marge)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: RADIUS.tag,
                      fontWeight: 700,
                      fontSize: 11,
                      background: c.tauxMarge >= 35 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                      color: c.tauxMarge >= 35 ? THEME.brand.emerald : THEME.brand.amber
                    }}>
                      {formatPct(c.tauxMarge)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
});
