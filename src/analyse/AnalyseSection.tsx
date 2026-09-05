import React, { useState, useMemo } from 'react';
import {
  Compass,
  Package,
  Sparkles,
  Calculator,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Layers
} from 'lucide-react';
import { THEME } from '../colors';
import { RADIUS, SHADOWS, Card, ghostBtn, primaryBtn, selectStyle, inputStyle } from '../ui';
import { Product } from '../stock/types';
import { Commande } from '../achat/types';
import { Vente } from '../ventes/types';
import { PeriodeFiltre } from './types';
import {
  computeArticlesAnalysis,
  computeSourcesAnalysis,
  computeGlobalKpis
} from './analyseUtils';
import { AnalyseHeaderKPIs } from './AnalyseHeaderKPIs';
import { AnalyseSourceView } from './AnalyseSourceView';
import { AnalyseArticleView } from './AnalyseArticleView';
import { AnalysePerformanceMatrix } from './AnalysePerformanceMatrix';
import { AnalyseSimulateur } from './AnalyseSimulateur';

interface Props {
  products: Product[];
  commandes: Commande[];
  ventes: Vente[];
  categories: string[];
  devises: { rmb: number; usd: number };
  onNavigateTab?: (targetTab: string, preset?: string) => void;
}

type SubTab = 'sources' | 'articles' | 'matrice' | 'simulateur';

export function AnalyseSection({
  products = [],
  commandes = [],
  ventes = [],
  categories = [],
  devises = { rmb: 680, usd: 4600 },
  onNavigateTab
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('sources');
  const [periode, setPeriode] = useState<PeriodeFiltre>('all');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');

  // Calculs mémorisés pour une réactivité optimale
  const articlesAnalysis = useMemo(() => {
    return computeArticlesAnalysis(products, commandes, ventes, devises, periode, dateDebut, dateFin);
  }, [products, commandes, ventes, devises, periode, dateDebut, dateFin]);

  const sourcesAnalysis = useMemo(() => {
    return computeSourcesAnalysis(commandes, products, ventes, devises, periode, dateDebut, dateFin);
  }, [commandes, products, ventes, devises, periode, dateDebut, dateFin]);

  const globalKpis = useMemo(() => {
    return computeGlobalKpis(articlesAnalysis, sourcesAnalysis);
  }, [articlesAnalysis, sourcesAnalysis]);

  // Export CSV
  const handleExportCSV = () => {
    if (activeSubTab === 'sources') {
      const headers = ['Source d\'achat', 'Nb Commandes', 'Total Dépensé (Ar)', 'Total Dépensé (RMB)', 'Part Budget (%)', 'Panier Moyen (Ar)', 'Pièces Achetées', 'CA Ventes Généré (Ar)', 'Marge Brute (Ar)'];
      const rows = sourcesAnalysis.map(s => [
        `"${s.source}"`,
        s.nbCommandes,
        s.montantTotalAr,
        s.montantTotalRmb,
        `${s.partBudgetPct}%`,
        s.panierMoyenAr,
        s.qtyTotalePieces,
        s.caVentesGeneresAr,
        s.margeBruteGeneresAr
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadFile(csv, `analyse_sources_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    } else {
      const headers = ['Article', 'Catégorie', 'Qté Achetée', 'PUMP Achat (Ar)', 'Fret Unitaire (Ar)', 'Coût Revient Unitaire (Ar)', 'Qté Vendue', 'CA Total (Ar)', 'Prix Vente Moyen (Ar)', 'Marge Brute (Ar)', 'Taux Marge (%)', 'Stock Actuel', 'Taux Ecoulement (%)'];
      const rows = articlesAnalysis.map(a => [
        `"${a.nom.replace(/"/g, '""')}"`,
        `"${a.categorie}"`,
        a.qtyAchetee,
        a.prixAchatUnitaireMoyenAr,
        a.fretUnitaireMoyenAr,
        a.coutRevientUnitaireAr,
        a.qtyVendue,
        a.caTotalAr,
        a.prixVenteUnitaireMoyenAr,
        a.margeBruteAr,
        `${a.tauxMargePct}%`,
        a.stockActuel,
        `${a.tauxEcoulementPct}%`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadFile(csv, `analyse_articles_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>
      {/* HEADER PRINCIPAL */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{
              fontSize: 24,
              fontWeight: 900,
              color: THEME.text.primary,
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Analyses & Insights Commerciaux
            </h1>
            <span style={{
              padding: '3px 9px',
              borderRadius: RADIUS.pill,
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(37, 99, 235, 0.1)',
              color: THEME.brand.blue
            }}>
              Nouveau
            </span>
          </div>
          <p style={{ fontSize: 13, color: THEME.text.secondary, margin: '4px 0 0' }}>
            Analyse croisée des achats Chine et des ventes locales : rentabilité par article, sourcing par plateforme et simulations
          </p>
        </div>

        {/* SÉLECTEUR DE PÉRIODE & EXPORT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: THEME.bg.card, padding: '4px 8px', borderRadius: RADIUS.control, border: `1px solid ${THEME.border.base}` }}>
            <Calendar size={14} color={THEME.text.muted} />
            <select
              value={periode}
              onChange={e => setPeriode(e.target.value as PeriodeFiltre)}
              style={{ border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, color: THEME.text.primary, cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">Toutes les périodes</option>
              <option value="30j">30 derniers jours</option>
              <option value="month">Mois en cours</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
              <option value="custom">Plage personnalisée...</option>
            </select>
          </div>

          {periode === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="date"
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
                style={{ ...inputStyle, height: 32, fontSize: 11, padding: '0 6px' } as any}
              />
              <span style={{ fontSize: 11, color: THEME.text.muted }}>à</span>
              <input
                type="date"
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
                style={{ ...inputStyle, height: 32, fontSize: 11, padding: '0 6px' } as any}
              />
            </div>
          )}

          <button
            onClick={handleExportCSV}
            style={{
              ...ghostBtn,
              height: 34,
              padding: '0 12px',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Exporter l'analyse au format CSV"
          >
            <Download size={14} />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <AnalyseHeaderKPIs kpis={globalKpis} />

      {/* NAVIGATION ONGLETS D'ANALYSE */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderBottom: `1px solid ${THEME.border.base}`,
        marginBottom: 20,
        overflowX: 'auto',
        paddingBottom: 2
      }}>
        {/* Onglet 1 : Sources d'Achat (Exigence explicite de l'utilisateur) */}
        <button
          onClick={() => setActiveSubTab('sources')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeSubTab === 'sources' ? `2px solid ${THEME.brand.amber}` : '2px solid transparent',
            color: activeSubTab === 'sources' ? THEME.text.primary : THEME.text.secondary,
            fontWeight: activeSubTab === 'sources' ? 800 : 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Compass size={16} color={activeSubTab === 'sources' ? THEME.brand.amber : undefined} />
          <span>Sources d'Achat ({sourcesAnalysis.length})</span>
          <span style={{
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: RADIUS.pill,
            background: activeSubTab === 'sources' ? 'rgba(217, 119, 6, 0.15)' : THEME.bg.surface,
            color: activeSubTab === 'sources' ? THEME.brand.amber : THEME.text.muted,
            fontWeight: 700
          }}>
            Commandes & Budget
          </span>
        </button>

        {/* Onglet 2 : Vente selon Achat par Article (Exigence explicite de l'utilisateur) */}
        <button
          onClick={() => setActiveSubTab('articles')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeSubTab === 'articles' ? `2px solid ${THEME.brand.blue}` : '2px solid transparent',
            color: activeSubTab === 'articles' ? THEME.text.primary : THEME.text.secondary,
            fontWeight: activeSubTab === 'articles' ? 800 : 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Package size={16} color={activeSubTab === 'articles' ? THEME.brand.blue : undefined} />
          <span>Vente selon Achat par Article ({articlesAnalysis.length})</span>
          <span style={{
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: RADIUS.pill,
            background: activeSubTab === 'articles' ? 'rgba(37, 99, 235, 0.15)' : THEME.bg.surface,
            color: activeSubTab === 'articles' ? THEME.brand.blue : THEME.text.muted,
            fontWeight: 700
          }}>
            Marges & CRU
          </span>
        </button>

        {/* Onglet 3 : Matrice Stratégique & Alertes */}
        <button
          onClick={() => setActiveSubTab('matrice')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeSubTab === 'matrice' ? `2px solid ${THEME.brand.emerald}` : '2px solid transparent',
            color: activeSubTab === 'matrice' ? THEME.text.primary : THEME.text.secondary,
            fontWeight: activeSubTab === 'matrice' ? 800 : 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={16} color={activeSubTab === 'matrice' ? THEME.brand.emerald : undefined} />
          <span>Matrice & Catégories</span>
        </button>

        {/* Onglet 4 : Simulateur de Prix Cible */}
        <button
          onClick={() => setActiveSubTab('simulateur')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeSubTab === 'simulateur' ? `2px solid #9333EA` : '2px solid transparent',
            color: activeSubTab === 'simulateur' ? THEME.text.primary : THEME.text.secondary,
            fontWeight: activeSubTab === 'simulateur' ? 800 : 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Calculator size={16} color={activeSubTab === 'simulateur' ? '#9333EA' : undefined} />
          <span>Simulateur de Marge</span>
        </button>
      </div>

      {/* CONTENU DE L'ONGLET ACTIF */}
      {activeSubTab === 'sources' && (
        <AnalyseSourceView
          sources={sourcesAnalysis}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeSubTab === 'articles' && (
        <AnalyseArticleView
          articles={articlesAnalysis}
          categories={categories}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeSubTab === 'matrice' && (
        <AnalysePerformanceMatrix
          articles={articlesAnalysis}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeSubTab === 'simulateur' && (
        <AnalyseSimulateur
          products={products}
          tauxRmb={devises?.rmb || 680}
        />
      )}
    </div>
  );
}
