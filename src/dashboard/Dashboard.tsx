/**
 * Composant Tableau de Bord (Dashboard)
 * Vue analytique des ventes, analyse d'investissement & ROI, marges réelles, top produits et répartition par catégorie
 */

import React, { useState, useMemo, memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Zap,
  Ship,
  Percent,
  Wallet,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PiggyBank,
  ArrowUpRight,
  Receipt,
  Package,
  Award,
  ArrowUpDown,
  Search,
  Activity,
  ShieldCheck,
  Stethoscope,
  Download,
  FileSpreadsheet,
  ChevronDown,
  Check,
} from 'lucide-react';
import { THEME, CHART_COLORS as COLORS } from '../colors';
import { STATUTS_LOGISTIQUE } from '../constants';
import { Card, cardTitle, Stat, Empty, tooltipStyle, inputStyle, selectStyle, ghostBtn } from '../ui';

interface DashboardProps {
  products: any[];
  ventes: any[];
  commandes: any[];
  mouvements?: any[];
  sourcing?: any[];
  changes?: any[];
  immobilisations?: any[];
  emprunts?: any[];
  fournisseurs?: any[];
  clients?: any[];
  onNavigateTab?: (tab: string) => void;
}

const Dashboard = memo(function Dashboard({
  products = [],
  ventes = [],
  commandes = [],
  mouvements = [],
  sourcing = [],
  changes = [],
  immobilisations = [],
  emprunts = [],
  fournisseurs = [],
  clients = [],
  onNavigateTab,
}: DashboardProps) {
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [sortBy, setSortBy] = useState<'benefice' | 'margePct' | 'nom' | 'ca'>('benefice');

  // 1. Chiffre d'Affaires Encaissé
  const caTotal = useMemo(() => {
    return ventes.reduce((s: number, v: any) => s + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0), 0);
  }, [ventes]);

  // Helper pour trouver le coût unitaire réel d'un produit (achat + livraison Chine + fret + transport local)
  const getProductCostBreakdown = (productId: string) => {
    const productCmds = commandes.filter(
      (c: any) => c.productId === productId && (
        (c.pu && Number(c.pu) > 0) || (c.total && Number(c.total) > 0) || (c.qty && Number(c.qty) > 0)
      )
    );

    if (productCmds.length > 0) {
      let totalLandedCost = 0;
      let totalQty = 0;
      productCmds.forEach((c: any) => {
        const qty = Math.max(1, Number(c.qty) || 1);
        const pu = Number(c.pu) || 0;
        const fraisChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
        const totalMarchandise = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
          ? Number(c.total)
          : ((pu * qty) + fraisChine);
        const fret = Number(c.fraisTransport || c.fretEstimeAr) || 0;
        const transportLocal = Number(c.fraisTransportLocal) || 0;

        totalLandedCost += (totalMarchandise + fret + transportLocal);
        totalQty += qty;
      });
      const coutRevient = totalQty > 0 ? totalLandedCost / totalQty : 0;
      return { coutRevient };
    } else {
      const p = products.find((pr: any) => pr.id === productId);
      const coutRevient = Number(p?.prixAchat) || 0;
      return { coutRevient };
    }
  };

  // 2. Marge Commerciale Réelle des ventes
  const margeTotale = useMemo(() => {
    return ventes.reduce((s: number, v: any) => {
      const p = products.find((pr: any) => pr.id === v.productId);
      const puVente = v.pu ?? (p?.prixVente || (v.total && v.qty ? v.total / v.qty : 0));
      const { coutRevient } = getProductCostBreakdown(v.productId);
      return s + (Number(puVente) - Number(coutRevient)) * (Number(v.qty) || 1);
    }, 0);
  }, [ventes, products, commandes]);

  // 3. Capital Investi (Apports déclarés sous #investissement, #capital, etc.)
  const capitalInvesti = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'entrée' && (m.isInvestissement || m.tag === '#investissement' || m.tag === '#capital' || m.tag === '#fond-roulement'))
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  // 4. Sorties Achats Chine & Fret (incluant livraison Chine et transport local)
  const totalAchatsChine = useMemo(() => {
    return commandes.reduce((s: number, c: any) => {
      const qty = Math.max(1, Number(c.qty) || 1);
      const pu = Number(c.pu) || 0;
      const fraisChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
      const coutAchat = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
        ? Number(c.total)
        : ((pu * qty) + fraisChine);
      return s + coutAchat;
    }, 0);
  }, [commandes]);

  const totalFret = useMemo(() => {
    return commandes.reduce((s: number, c: any) => {
      const fret = Number(c.fraisTransport || c.fretEstimeAr) || 0;
      const transportLocal = Number(c.fraisTransportLocal) || 0;
      return s + fret + transportLocal;
    }, 0);
  }, [commandes]);

  // 5. Charges opérationnelles hors marchandise
  const chargesOperationnelles = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'sortie' && !m.isTransfert && m.tag !== '#stock-chine' && m.tag !== '#fret-logistique')
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  // 6. Dépenses d'exploitation globales
  const totalDepensesGlobales = totalAchatsChine + totalFret + chargesOperationnelles;

  // 7. Bénéfice Net Réalisé
  const beneficeNet = margeTotale - chargesOperationnelles;

  // 8. Base de calcul de l'investissement
  const baseInvestissement = capitalInvesti > 0 ? capitalInvesti : totalDepensesGlobales;

  // 9. ROI (%) & Taux de Récupération du Capital
  const tauxRoi = baseInvestissement > 0 ? (beneficeNet / baseInvestissement) * 100 : 0;
  const tauxRecuperation = baseInvestissement > 0 ? Math.min(100, Math.max(0, (caTotal / baseInvestissement) * 100)) : 0;
  const resteARecuperer = Math.max(0, baseInvestissement - caTotal);

  const nbVentes = ventes.length;
  const enTransit = commandes.filter(
    (c: any) => STATUTS_LOGISTIQUE.includes(c.statut) && c.statut !== 'Arrivé'
  ).length;

  // Répartition par catégorie
  const parCategorie = useMemo(() => {
    const map: Record<string, number> = {};
    ventes.forEach((v: any) => {
      const p = products.find((pr: any) => pr.id === v.productId);
      if (!p) return;
      const cat = p.categorie || 'Autre';
      map[cat] = (map[cat] || 0) + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ventes, products]);

  // Top produits par CA
  const parProduit = useMemo(() => {
    const map: Record<string, number> = {};
    ventes.forEach((v: any) => {
      const p = products.find((pr: any) => pr.id === v.productId);
      if (!p) return;
      const key = p.nom + (p.couleur ? ` (${p.couleur})` : '');
      const tot = Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0;
      map[key] = (map[key] || 0) + tot;
    });
    return Object.entries(map)
      .map(([name, ca]) => ({ name, ca }))
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 6);
  }, [ventes, products]);

  // 10. Rentabilité Détaillée par Produit (Prix moyen d'achat, Prix moyen de vente, Marge unitaire, Taux de marge %, Bénéfice total)
  const rentabiliteParProduit = useMemo(() => {
    return products.map((p: any) => {
      // Commandes d'achat pour ce produit
      const pCmds = commandes.filter((c: any) => c.productId === p.id);
      const qtyAchetee = pCmds.reduce((s: number, c: any) => s + (Number(c.qty) || 0), 0);
      const totalAchatsEtFret = pCmds.reduce((s: number, c: any) => {
        const qty = Number(c.qty) || 1;
        const pu = Number(c.pu) || 0;
        const fraisLivraisonChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
        const totalMarchandise = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
          ? Number(c.total)
          : ((pu * qty) + fraisLivraisonChine);
        const fretTransitaire = Number(c.fraisTransport || c.fretEstimeAr) || 0;
        const transportLocal = Number(c.fraisTransportLocal) || 0;
        return s + totalMarchandise + fretTransitaire + transportLocal;
      }, 0);

      const prixMoyenAchat = qtyAchetee > 0 ? totalAchatsEtFret / qtyAchetee : (Number(p.prixAchat) || 0);

      // Ventes pour ce produit
      const pVentes = ventes.filter((v: any) => v.productId === p.id);
      const qtyVendue = pVentes.reduce((s: number, v: any) => s + (Number(v.qty) || 0), 0);
      const caTotalProduit = pVentes.reduce((s: number, v: any) => {
        const pu = v.pu ?? (p.prixVente || (v.total && v.qty ? v.total / v.qty : 0));
        return s + (Number(pu) * Number(v.qty || 1));
      }, 0);

      const prixMoyenVente = qtyVendue > 0 ? caTotalProduit / qtyVendue : (Number(p.prixVente) || 0);

      const margeUnitaire = prixMoyenVente - prixMoyenAchat;
      const tauxMargePct = prixMoyenAchat > 0 ? (margeUnitaire / prixMoyenAchat) * 100 : 0;
      const beneficeTotal = margeUnitaire * qtyVendue;

      return {
        id: p.id,
        nom: p.nom,
        couleur: p.couleur,
        categorie: p.categorie || 'Autre',
        qtyAchetee,
        qtyVendue,
        prixMoyenAchat: Math.round(prixMoyenAchat),
        prixMoyenVente: Math.round(prixMoyenVente),
        margeUnitaire: Math.round(margeUnitaire),
        tauxMargePct: Number(tauxMargePct.toFixed(1)),
        beneficeTotal: Math.round(beneficeTotal),
        caTotalProduit: Math.round(caTotalProduit),
      };
    });
  }, [products, commandes, ventes]);

  // Filtrage et Tri des produits pour la rentabilité
  const produitsFitresEtTries = useMemo(() => {
    return rentabiliteParProduit
      .filter((p) => {
        if (!rechercheProduit.trim()) return true;
        const q = rechercheProduit.toLowerCase();
        return (
          p.nom.toLowerCase().includes(q) ||
          (p.couleur && p.couleur.toLowerCase().includes(q)) ||
          p.categorie.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'margePct') return b.tauxMargePct - a.tauxMargePct;
        if (sortBy === 'ca') return b.caTotalProduit - a.caTotalProduit;
        if (sortBy === 'nom') return a.nom.localeCompare(b.nom);
        return b.beneficeTotal - a.beneficeTotal; // default: benefice
      });
  }, [rentabiliteParProduit, rechercheProduit, sortBy]);

  // Insights clés sur la rentabilité des produits
  const topRentabilitePct = useMemo(() => {
    const list = rentabiliteParProduit.filter((p) => p.prixMoyenAchat > 0 && (p.qtyVendue > 0 || p.prixMoyenVente > 0));
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.tauxMargePct - a.tauxMargePct)[0];
  }, [rentabiliteParProduit]);

  const topBeneficeTotal = useMemo(() => {
    const list = rentabiliteParProduit.filter((p) => p.qtyVendue > 0 && p.beneficeTotal > 0);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.beneficeTotal - a.beneficeTotal)[0];
  }, [rentabiliteParProduit]);

  const hasAnyData = ventes.length > 0 || commandes.length > 0 || mouvements.length > 0 || products.length > 0;

  if (!hasAnyData) {
    return <Empty text="Enregistrez des ventes, commandes ou investissements pour générer vos analyses de rentabilité." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* HEADER DU DASHBOARD */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.base}`,
        borderRadius: 10,
        padding: '6px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 700,
              background: THEME.bg.surface,
              color: THEME.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <TrendingUp size={15} color={THEME.accent.orange} />
            Vue Analytique & Rentabilité
          </div>
        </div>
      </div>

      {/* SECTION 1 : CHIFFRES CLÉS PRINCIPAUX */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Stat
              label="Chiffre d'affaires"
              value={`${caTotal.toLocaleString('fr-FR')} Ar`}
              icon={TrendingUp}
              accent={THEME.accent.primary}
            />
            <Stat
              label="Marge brute réelle"
              value={`${margeTotale.toLocaleString('fr-FR')} Ar`}
              icon={TrendingUp}
              accent={THEME.accent.green}
            />
            <Stat
              label="Bénéfice Net"
              value={`${beneficeNet >= 0 ? '+' : ''}${beneficeNet.toLocaleString('fr-FR')} Ar`}
              icon={DollarSign}
              accent={beneficeNet >= 0 ? THEME.accent.green : THEME.accent.danger}
            />
            <Stat
              label="ROI estimé"
              value={`${tauxRoi >= 0 ? '+' : ''}${tauxRoi.toFixed(1)} %`}
              icon={Percent}
              accent={tauxRoi >= 0 ? THEME.accent.green : THEME.accent.danger}
            />
            <Stat
              label="Capital investi"
              value={`${baseInvestissement.toLocaleString('fr-FR')} Ar`}
              icon={Wallet}
              accent={THEME.accent.orange}
            />
            <Stat label="Colis en transit" value={enTransit} icon={Ship} accent={THEME.accent.primary} />
          </div>

      {/* SECTION 2 : CARTE COMPLÈTE « ANALYSE D'INVESTISSEMENT & ROI » */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.accent.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <PiggyBank size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: THEME.text.primary }}>Analyse d'Investissement & Rentabilité (ROI)</div>
              <div style={{ fontSize: 12, color: THEME.text.muted }}>Suivi précis du rendement sur capital et du seuil de rentabilité</div>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: THEME.bg.soft, color: THEME.accent.green }}>
            Temps Réel
          </span>
        </div>

        {/* 4 Blocs d'analyse financière */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
          <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
            <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Capital de Base</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: THEME.text.primary, marginTop: 3 }}>
              {baseInvestissement.toLocaleString('fr-FR')} Ar
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
              {capitalInvesti > 0 ? 'Apports déclarés' : 'Dépenses stock + fret'}
            </div>
          </div>

          <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
            <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Bénéfice Net Réalisé</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: beneficeNet >= 0 ? THEME.accent.green : THEME.accent.danger, marginTop: 3 }}>
              {beneficeNet >= 0 ? '+' : ''}{beneficeNet.toLocaleString('fr-FR')} Ar
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
              Marge réelle − charges fixes
            </div>
          </div>

          <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
            <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Taux de Rendement (ROI)</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: tauxRoi >= 0 ? THEME.accent.green : THEME.accent.danger, marginTop: 2 }}>
              {tauxRoi >= 0 ? '+' : ''}{tauxRoi.toFixed(1)} %
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
              Gains nets / Capital investi
            </div>
          </div>

          <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
            <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Récupération du Capital</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: THEME.accent.primary, marginTop: 3 }}>
              {tauxRecuperation.toFixed(0)} %
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3 }}>
              CA encaissé vs mise de départ
            </div>
          </div>
        </div>

        {/* Barre de progression vers le Seuil de rentabilité */}
        <div style={{ marginTop: 14, background: THEME.bg.card, padding: '12px 14px', borderRadius: 8, border: '1px solid ' + THEME.border.base }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: THEME.text.primary }}>Progression vers le Seuil de Rentabilité (Point Mort)</span>
            <span style={{ fontWeight: 800, color: THEME.accent.primary }}>
              {caTotal.toLocaleString('fr-FR')} Ar / {baseInvestissement.toLocaleString('fr-FR')} Ar
            </span>
          </div>

          <div style={{ width: '100%', height: 9, background: THEME.border.base, borderRadius: 10, overflow: 'hidden' }}>
            <div
              style={{
                width: `${tauxRecuperation}%`,
                height: '100%',
                background: tauxRecuperation >= 100 ? THEME.accent.green : THEME.accent.orange,
                borderRadius: 10,
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div style={{ fontSize: 11.5, color: THEME.text.secondary, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            {tauxRecuperation >= 100 ? (
              <>
                <CheckCircle2 size={15} style={{ color: THEME.accent.green }} />
                <span style={{ fontWeight: 600, color: THEME.accent.green }}>
                  Point mort atteint ! Votre mise initiale est amortie et chaque vente génère du pur profit net.
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={15} style={{ color: THEME.accent.orange }} />
                <span>
                  Il reste <strong style={{ color: THEME.text.primary }}>{resteARecuperer.toLocaleString('fr-FR')} Ar</strong> de chiffre d'affaires à encaisser pour atteindre le seuil de rentabilité.
                </span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 2.2 : CARTE « ANALYSE DE RENTABILITÉ PAR PRODUIT » */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.accent.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <Package size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: THEME.text.primary }}>Rentabilité par Produit</div>
              <div style={{ fontSize: 12, color: '#8A8375' }}>
                Calcul basé sur le prix moyen d'achat (achat + fret) et le prix moyen de vente réels
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 170 }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: '#8A8375' }} />
              <input
                type="text"
                placeholder="Rechercher produit..."
                value={rechercheProduit}
                onChange={(e) => setRechercheProduit(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 28, height: 32, fontSize: 12 } as any}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ ...selectStyle, height: 32, fontSize: 12, width: 'auto' } as any}
            >
              <option value="benefice">Tri : Bénéfice Total (Ar)</option>
              <option value="margePct">Tri : Taux de Marge (%)</option>
              <option value="ca">Tri : Chiffre d'Affaires (Ar)</option>
              <option value="nom">Tri : Nom de Produit</option>
            </select>
          </div>
        </div>

        {/* Insights Clés */}
        {(topRentabilitePct || topBeneficeTotal) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
            {topRentabilitePct && (
              <div style={{ background: THEME.bg.soft, padding: '10px 12px', borderRadius: 8, border: '1px solid ' + THEME.border.base, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, color: THEME.accent.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Meilleur Taux de Marge</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {topRentabilitePct.nom} {topRentabilitePct.couleur ? `(${topRentabilitePct.couleur})` : ''}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.green }}>
                    +{topRentabilitePct.tauxMargePct}% de marge ({topRentabilitePct.margeUnitaire.toLocaleString('fr-FR')} Ar/u)
                  </div>
                </div>
              </div>
            )}

            {topBeneficeTotal && (
              <div style={{ background: THEME.bg.soft, padding: '10px 12px', borderRadius: 8, border: '1px solid ' + THEME.border.base, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, color: THEME.accent.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Plus Fort Bénéfice Total</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {topBeneficeTotal.nom} {topBeneficeTotal.couleur ? `(${topBeneficeTotal.couleur})` : ''}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary }}>
                    +{topBeneficeTotal.beneficeTotal.toLocaleString('fr-FR')} Ar générés ({topBeneficeTotal.qtyVendue} vendus)
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tableau récapitulatif de rentabilité */}
        {produitsFitresEtTries.length === 0 ? (
          <Empty text="Aucun produit ne correspond aux critères." />
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid ' + THEME.border.base, borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: THEME.bg.soft, borderBottom: '1px solid ' + THEME.border.base, color: THEME.text.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <th style={{ padding: '10px 12px' }}>Produit</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Prix Achat Moy.</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Prix Vente Moy.</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Marge / Unité</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Taux Marge %</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Bénéfice Total</th>
                </tr>
              </thead>
              <tbody>
                {produitsFitresEtTries.map((p, idx) => {
                  const isPositive = p.margeUnitaire >= 0;
                  const bgBadge = p.tauxMargePct >= 50
                    ? THEME.bg.chip
                    : p.tauxMargePct >= 20
                    ? THEME.bg.soft
                    : p.tauxMargePct > 0
                    ? THEME.bg.soft
                    : THEME.bg.alert;

                  const colorBadge = p.tauxMargePct >= 50
                    ? THEME.accent.green
                    : p.tauxMargePct >= 20
                    ? THEME.accent.primary
                    : p.tauxMargePct > 0
                    ? THEME.accent.orange
                    : THEME.accent.danger;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: idx === produitsFitresEtTries.length - 1 ? 'none' : '1px solid ' + THEME.border.base,
                        background: idx % 2 === 0 ? THEME.bg.card : THEME.bg.base,
                      }}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: THEME.text.primary, fontSize: 13 }}>
                          {p.nom} {p.couleur ? `(${p.couleur})` : ''}
                        </div>
                        <div style={{ fontSize: 11, color: THEME.text.muted }}>
                          {p.categorie} · {p.qtyVendue} vendu(s) / {p.qtyAchetee} acheté(s)
                        </div>
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: THEME.text.secondary }}>
                          {p.prixMoyenAchat.toLocaleString('fr-FR')} Ar
                        </span>
                        {p.qtyAchetee > 0 && (
                          <div style={{ fontSize: 10.5, color: THEME.text.muted }}>PRU moy. (achat + livr. + fret)</div>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: THEME.text.primary }}>
                          {p.prixMoyenVente.toLocaleString('fr-FR')} Ar
                        </span>
                        {p.qtyVendue > 0 && (
                          <div style={{ fontSize: 10.5, color: THEME.text.muted }}>sur {p.qtyVendue} vente(s)</div>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: isPositive ? THEME.accent.green : THEME.accent.danger }}>
                          {isPositive ? '+' : ''}{p.margeUnitaire.toLocaleString('fr-FR')} Ar
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: bgBadge,
                            color: colorBadge,
                          }}
                        >
                          {p.tauxMargePct >= 0 ? '+' : ''}{p.tauxMargePct}%
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: p.beneficeTotal >= 0 ? THEME.accent.green : THEME.accent.danger }}>
                          {p.beneficeTotal >= 0 ? '+' : ''}{p.beneficeTotal.toLocaleString('fr-FR')} Ar
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SECTION 3 : GRAPHIQUES ET TOP PRODUITS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        <Card>
          <div style={cardTitle as any}>Top Produits par Chiffre d'Affaires</div>
          {parProduit.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
              Aucune vente enregistrée pour afficher les produits.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={parProduit} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: THEME.text.primary }}
                />
                <Tooltip
                  formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="ca" fill="#E8985E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <div style={cardTitle as any}>Répartition des Ventes par Catégorie</div>
          {parCategorie.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
              Aucune catégorie vendue pour l'instant.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={parCategorie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {parCategorie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {parCategorie.map((c, i) => (
                  <div
                    key={c.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11.5,
                      color: THEME.text.muted,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                    {c.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
});

export default Dashboard;
