import React, { memo } from 'react';
import {
  TrendingUp,
  Percent,
  Wallet,
  DollarSign,
  Receipt,
  Package,
  AlertTriangle,
  Coins,
  CreditCard,
  AlertCircle,
  Boxes,
  Ship,
  ShoppingCart,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { THEME } from '../colors';
import { FONTS } from '../fonts';
import { RADIUS, SHADOWS } from '../ui';
import { DashboardKpisConfig } from './dashboardConfig';

interface DashboardKpiGridProps {
  kpisConfig: DashboardKpisConfig;
  onNavigateTab?: (tab: string) => void;
  metrics: {
    caTotal: number;
    ventesCount: number;
    margeTotale: number;
    beneficeNet: number;
    tauxRoi: number;
    tauxRecuperation: number;
    baseInvestissement: number;
    capitalInvesti: number;
    tresorerieDispo: number;
    soldesParCompte?: Record<string, number>;
    soldeRmbInfo: { soldeRmbDispo: number; totalRmbAchete: number };
    creancesClients: number;
    dettesFournisseurs: number;
    chargesOperationnelles: number;
    statsPertes: { totalPertesAr: number; quantitePerdue: number };
    enTransit: number;
    commandesCount: number;
    valeurStockLocal: number;
    totalArticlesEnRayon: number;
    stockAlertesCount: number;
    articlesVendusTotal: number;
    panierMoyen: number;
  };
}

const DashboardKpiGrid = memo(function DashboardKpiGrid({
  kpisConfig: k,
  metrics,
  onNavigateTab,
}: DashboardKpiGridProps) {
  const margeRatio = metrics.caTotal > 0 ? (metrics.margeTotale / metrics.caTotal) * 100 : 0;
  const soldeNetTiers = metrics.creancesClients - metrics.dettesFournisseurs;

  const hasHeroFinance = k.ca || k.benefice;
  const hasTreasury = k.tresorerie || k.reserve_rmb || k.creances || k.dettes;
  const hasRoiOrMarge = k.marge || k.roi || k.capital;
  const hasStockStats = k.stock_valeur || k.stock_alerte;
  const hasTransitStats = k.transit;

  // Secondary metrics for compact pill / ticker display
  const secondaryKpis = [
    k.charges && {
      label: "Charges fixes & opér.",
      val: `${metrics.chargesOperationnelles.toLocaleString('fr-FR')} Ar`,
      sub: "Frais généraux récurrents",
      icon: Boxes,
      color: THEME.brand.amber,
    },
    k.pertes_stock && {
      label: "Pertes & Casse",
      val: `${metrics.statsPertes.totalPertesAr > 0 ? '-' : ''}${metrics.statsPertes.totalPertesAr.toLocaleString('fr-FR')} Ar`,
      sub: metrics.statsPertes.quantitePerdue > 0 ? `${metrics.statsPertes.quantitePerdue} pcs déclassées` : 'Zéro perte déclarée',
      icon: AlertTriangle,
      color: metrics.statsPertes.totalPertesAr > 0 ? THEME.accent.danger : THEME.brand.emerald,
    },
    k.articles_vendus && {
      label: "Articles écoulés",
      val: `${metrics.articlesVendusTotal.toLocaleString('fr-FR')} pcs`,
      sub: "Volume total vendu",
      icon: ShoppingCart,
      color: THEME.brand.blue,
    },
    k.panier_moyen && {
      label: "Panier moyen",
      val: `${metrics.panierMoyen.toLocaleString('fr-FR')} Ar`,
      sub: "Moyenne par transaction",
      icon: PiggyBank,
      color: THEME.brand.emerald,
    },
  ].filter(Boolean) as Array<{ label: string; val: string; sub: string; icon: any; color: string }>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* NIVEAU 1 : HERO BENTO DYNAMIQUE (Grand Cockpit Finance 62% + Hub Trésorerie & Liquidités 38%) */}
      {(hasHeroFinance || hasTreasury) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: hasHeroFinance && hasTreasury ? 'minmax(0, 1.55fr) minmax(0, 1fr)' : '1fr',
            gap: 14,
          }}
        >
          {/* CARTE HERO #1 : RÉSULTATS COMMERCIAUX & BÉNÉFICE MAÎTRE */}
          {hasHeroFinance && (
            <div
              style={{
                background: THEME.bg.card,
                border: `1px solid ${THEME.border.base}`,
                borderRadius: RADIUS.card,
                padding: '20px 22px',
                boxShadow: SHADOWS.card,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                gap: 16,
              }}
            >
              {/* Badge d'en-tête subtil */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: THEME.text.secondary, fontWeight: 600, letterSpacing: '-0.01em' }}>
                    <div style={{ width: 22, height: 22, borderRadius: RADIUS.micro, background: `${THEME.brand.emerald}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.brand.emerald }}>
                      <TrendingUp size={13} strokeWidth={2.4} />
                    </div>
                    <span>Performance Commerciale Globale</span>
                  </div>
                  <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 3 }}>
                    Flux réels consolidés depuis le lancement
                  </div>
                </div>

                {k.benefice && (
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: RADIUS.pill,
                      background: metrics.beneficeNet >= 0 ? `${THEME.brand.emerald}14` : `${THEME.accent.danger}14`,
                      color: metrics.beneficeNet >= 0 ? THEME.brand.emerald : THEME.accent.danger,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {metrics.beneficeNet >= 0 ? <ArrowUpRight size={13} strokeWidth={2.4} /> : <ArrowDownRight size={13} strokeWidth={2.4} />}
                    {metrics.beneficeNet >= 0 ? 'Exploitation Bénéficiaire' : 'Déficit d’Exploitation'}
                  </span>
                )}
              </div>

              {/* GRANDS INDICATEURS MAÎTRES EN DUALITÉ ASYMÉTRIQUE */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: (k.ca && k.benefice) ? '1.25fr 1fr' : '1fr',
                  gap: 16,
                  alignItems: 'center',
                  background: THEME.bg.surface,
                  padding: '16px 18px',
                  borderRadius: RADIUS.item,
                  border: `1px solid ${THEME.border.base}`,
                }}
              >
                {k.ca && (
                  <div>
                    <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500, letterSpacing: '-0.01em' }}>
                      Chiffre d'Affaires Brut
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontSize: 'clamp(24px, 3.2vw, 32px)', fontWeight: 800, color: THEME.text.primary, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.03em' }}>
                      {metrics.caTotal.toLocaleString('fr-FR')} <span style={{ fontSize: 14, fontWeight: 600, color: THEME.text.secondary }}>Ar</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: THEME.text.muted, marginTop: 4 }}>
                      <strong>{metrics.ventesCount}</strong> transaction(s) enregistrée(s)
                    </div>
                  </div>
                )}

                {k.benefice && (
                  <div style={{ borderLeft: (k.ca && k.benefice) ? `1px solid ${THEME.border.base}` : 'none', paddingLeft: (k.ca && k.benefice) ? 16 : 0 }}>
                    <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500, letterSpacing: '-0.01em' }}>
                      Bénéfice Net Réel
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontSize: 'clamp(22px, 2.9vw, 28px)', fontWeight: 800, color: metrics.beneficeNet >= 0 ? THEME.brand.emerald : THEME.accent.danger, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.03em' }}>
                      {metrics.beneficeNet >= 0 ? '+' : ''}{metrics.beneficeNet.toLocaleString('fr-FR')} <span style={{ fontSize: 13, fontWeight: 600 }}>Ar</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: THEME.text.muted, marginTop: 4 }}>
                      Après sourcing, fret & charges
                    </div>
                  </div>
                )}
              </div>

              {/* MINI BARRE DE RENDEMENT EN PIED DE CARTE */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: THEME.text.secondary, paddingTop: 2 }}>
                <span>Rentabilité globale de l'activité</span>
                <span style={{ fontWeight: 600, color: metrics.beneficeNet >= 0 ? THEME.brand.emerald : THEME.accent.danger }}>
                  {metrics.caTotal > 0 ? `${((metrics.beneficeNet / metrics.caTotal) * 100).toFixed(1)}% de marge nette` : '0%'}
                </span>
              </div>
            </div>
          )}

          {/* CARTE HERO #2 : TRÉSORERIE DISPONIBLE & SOLVABILITÉ TIERS */}
          {hasTreasury && (
            <div
              style={{
                background: THEME.bg.card,
                border: `1px solid ${THEME.border.base}`,
                borderRadius: RADIUS.card,
                padding: '20px 22px',
                boxShadow: SHADOWS.card,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
              }}
            >
              {/* Entête Trésorerie */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: THEME.text.secondary, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  <div style={{ width: 22, height: 22, borderRadius: RADIUS.micro, background: `${THEME.brand.blue}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.brand.blue }}>
                    <Coins size={13} strokeWidth={2.4} />
                  </div>
                  <span>Liquidités & Solvabilité</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: THEME.brand.blue, padding: '2px 8px', background: `${THEME.brand.blue}10`, borderRadius: RADIUS.pill }}>
                  Position Réelle
                </span>
              </div>

              {/* Bloc Liquidités : Ariary + Yuan RMB */}
              <div style={{ display: 'grid', gridTemplateColumns: (k.tresorerie && k.reserve_rmb) ? '1.1fr 1fr' : '1fr', gap: 10 }}>
                {k.tresorerie && (
                  <div
                    onClick={() => onNavigateTab && onNavigateTab('tresorerie')}
                    style={{
                      background: THEME.bg.surface,
                      padding: '12px 14px',
                      borderRadius: RADIUS.item,
                      border: `1px solid ${THEME.border.base}`,
                      cursor: onNavigateTab ? 'pointer' : 'default',
                      transition: 'border-color 0.15s ease',
                    }}
                    title={onNavigateTab ? 'Cliquer pour ouvrir le journal de Trésorerie' : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500 }}>
                        Trésorerie Dispo (Ar)
                      </div>
                      <Wallet size={13} style={{ color: metrics.tresorerieDispo >= 0 ? THEME.brand.emerald : THEME.accent.danger }} />
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 800, color: metrics.tresorerieDispo >= 0 ? THEME.brand.emerald : THEME.accent.danger, marginTop: 3, letterSpacing: '-0.02em' }}>
                      {metrics.tresorerieDispo.toLocaleString('fr-FR')} <span style={{ fontSize: 12, fontWeight: 600 }}>Ar</span>
                    </div>
                    <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Caisse & banques (MGA)</span>
                      {onNavigateTab && <span style={{ fontSize: 10, color: THEME.brand.blue, fontWeight: 600 }}>Gérer →</span>}
                    </div>
                  </div>
                )}

                {k.reserve_rmb && (
                  <div
                    onClick={() => onNavigateTab && onNavigateTab('change')}
                    style={{
                      background: THEME.bg.surface,
                      padding: '12px 14px',
                      borderRadius: RADIUS.item,
                      border: `1px solid ${THEME.border.base}`,
                      cursor: onNavigateTab ? 'pointer' : 'default',
                      transition: 'border-color 0.15s ease',
                    }}
                    title={onNavigateTab ? 'Cliquer pour ouvrir le module Change RMB' : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500 }}>
                        Réserve Chine (¥)
                      </div>
                      <Coins size={13} style={{ color: THEME.brand.amber }} />
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 800, color: THEME.brand.amber, marginTop: 3, letterSpacing: '-0.02em' }}>
                      {metrics.soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} <span style={{ fontSize: 12, fontWeight: 600 }}>¥</span>
                    </div>
                    <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Achats : {metrics.soldeRmbInfo.totalRmbAchete.toFixed(0)} ¥</span>
                      {onNavigateTab && <span style={{ fontSize: 10, color: THEME.brand.amber, fontWeight: 600 }}>Change →</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Balance Postes Tiers */}
              {(k.creances || k.dettes) && (
                <div style={{ background: THEME.bg.surface, padding: '10px 12px', borderRadius: RADIUS.item, border: `1px solid ${THEME.border.base}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: THEME.text.secondary }}>
                      <Scale size={13} color={THEME.text.muted} />
                      <span>Balance Postes Tiers</span>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: soldeNetTiers >= 0 ? THEME.brand.emerald : THEME.accent.danger }}>
                      Net : {soldeNetTiers >= 0 ? '+' : ''}{soldeNetTiers.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: (k.creances && k.dettes) ? '1fr 1fr' : '1fr', gap: 8, fontSize: 11.5 }}>
                    {k.creances && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: THEME.bg.card, borderRadius: RADIUS.micro, border: `1px solid ${THEME.border.base}` }}>
                        <span style={{ color: THEME.text.muted, fontSize: 11 }}>Créances :</span>
                        <strong style={{ color: metrics.creancesClients > 0 ? THEME.brand.amber : THEME.brand.emerald }}>
                          {metrics.creancesClients.toLocaleString('fr-FR')} Ar
                        </strong>
                      </div>
                    )}
                    {k.dettes && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: THEME.bg.card, borderRadius: RADIUS.micro, border: `1px solid ${THEME.border.base}` }}>
                        <span style={{ color: THEME.text.muted, fontSize: 11 }}>Dettes :</span>
                        <strong style={{ color: metrics.dettesFournisseurs > 0 ? THEME.brand.amber : THEME.brand.emerald }}>
                          {metrics.dettesFournisseurs.toLocaleString('fr-FR')} Ar
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* NIVEAU 2 : BENTO INTERMÉDIAIRE ASYMÉTRIQUE (Rentabilité / Stock d'Inventaire / Fret Maritime) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 14,
        }}
      >
        {/* CARTE HERO-STYLE #1 : RENTABILITÉ & TAUX DE MARGE (ROI) */}
        {hasRoiOrMarge && (
          <div
            style={{
              background: THEME.bg.card,
              border: `1px solid ${THEME.border.base}`,
              borderRadius: RADIUS.card,
              padding: '20px 22px',
              boxShadow: SHADOWS.card,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            {/* Header avec Icon Box & Pill Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: THEME.text.secondary, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  <div style={{ width: 22, height: 22, borderRadius: RADIUS.micro, background: `${THEME.brand.emerald}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.brand.emerald }}>
                    <Percent size={13} strokeWidth={2.4} />
                  </div>
                  <span>Rentabilité & Rendement (ROI)</span>
                </div>
                <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 3 }}>
                  Marges réelles & retour sur investissement
                </div>
              </div>

              {k.marge && (
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: RADIUS.pill,
                    background: `${THEME.brand.emerald}14`,
                    color: THEME.brand.emerald,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Sparkles size={12} strokeWidth={2.4} />
                  {margeRatio.toFixed(1)}% Marge
                </span>
              )}
            </div>

            {/* Inset Container avec Grands Chiffres Dual-Metric */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: (k.marge && k.roi) ? '1.2fr 1fr' : '1fr',
                gap: 14,
                alignItems: 'center',
                background: THEME.bg.surface,
                padding: '16px 18px',
                borderRadius: RADIUS.item,
                border: `1px solid ${THEME.border.base}`,
              }}
            >
              {k.marge && (
                <div>
                  <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500, letterSpacing: '-0.01em' }}>
                    Marge Brute Réalisée
                  </div>
                  <div style={{ fontFamily: FONTS.display, fontSize: 'clamp(22px, 2.6vw, 26px)', fontWeight: 800, color: THEME.text.primary, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.03em' }}>
                    {metrics.margeTotale.toLocaleString('fr-FR')} <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text.secondary }}>Ar</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: THEME.border.base, borderRadius: RADIUS.pill, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, margeRatio))}%`, height: '100%', background: THEME.brand.emerald }} />
                  </div>
                </div>
              )}

              {k.roi && (
                <div style={{ borderLeft: (k.marge && k.roi) ? `1px solid ${THEME.border.base}` : 'none', paddingLeft: (k.marge && k.roi) ? 14 : 0 }}>
                  <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500, letterSpacing: '-0.01em' }}>
                    Taux ROI Global
                  </div>
                  <div style={{ fontFamily: FONTS.display, fontSize: 'clamp(20px, 2.3vw, 24px)', fontWeight: 800, color: metrics.tauxRoi >= 0 ? THEME.brand.emerald : THEME.accent.danger, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.03em' }}>
                    {metrics.tauxRoi >= 0 ? '+' : ''}{metrics.tauxRoi.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
                    Recouvrement : <strong>{metrics.tauxRecuperation.toFixed(0)}%</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Mini Footer informatif */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: THEME.text.secondary, paddingTop: 2 }}>
              <span>Capital engagé : <strong style={{ color: THEME.text.primary }}>{metrics.baseInvestissement.toLocaleString('fr-FR')} Ar</strong></span>
              <span style={{ fontWeight: 600, color: metrics.tauxRecuperation >= 100 ? THEME.brand.emerald : THEME.brand.amber }}>
                {metrics.tauxRecuperation >= 100 ? 'Seuil de rentabilité atteint' : `${(100 - metrics.tauxRecuperation).toFixed(0)}% restants`}
              </span>
            </div>
          </div>
        )}

        {/* CARTE HERO-STYLE #2 : STOCK & NIVEAUX D'INVENTAIRE */}
        {hasStockStats && (
          <div
            style={{
              background: THEME.bg.card,
              border: `1px solid ${THEME.border.base}`,
              borderRadius: RADIUS.card,
              padding: '20px 22px',
              boxShadow: SHADOWS.card,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            {/* Header avec Icon Box & Pill Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: THEME.text.secondary, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  <div style={{ width: 22, height: 22, borderRadius: RADIUS.micro, background: `${THEME.brand.amber}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.brand.amber }}>
                    <Package size={13} strokeWidth={2.4} />
                  </div>
                  <span>Stock & Inventaire Local</span>
                </div>
                <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 3 }}>
                  Disponibilité immédiate en rayon
                </div>
              </div>

              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: RADIUS.pill,
                  background: `${THEME.brand.amber}14`,
                  color: THEME.brand.amber,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Boxes size={12} strokeWidth={2.4} />
                {metrics.totalArticlesEnRayon} pcs en rayon
              </span>
            </div>

            {/* Inset Container avec Grands Chiffres Dual-Metric */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 14,
                alignItems: 'center',
                background: THEME.bg.surface,
                padding: '16px 18px',
                borderRadius: RADIUS.item,
                border: `1px solid ${THEME.border.base}`,
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  Valeur Marchande Totale
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 'clamp(22px, 2.6vw, 26px)', fontWeight: 800, color: THEME.text.primary, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.03em' }}>
                  {metrics.valeurStockLocal.toLocaleString('fr-FR')} <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text.secondary }}>Ar</span>
                </div>
                <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
                  Au coût de revient moyen pondéré
                </div>
              </div>

              <div style={{ borderLeft: `1px solid ${THEME.border.base}`, paddingLeft: 14 }}>
                <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  Santé Réappro
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 'clamp(20px, 2.3vw, 24px)', fontWeight: 800, color: metrics.stockAlertesCount > 0 ? THEME.accent.danger : THEME.brand.emerald, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.03em' }}>
                  {metrics.stockAlertesCount > 0 ? `${metrics.stockAlertesCount} alerte(s)` : 'Optimal'}
                </div>
                <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
                  {metrics.stockAlertesCount > 0 ? 'Réapprovisionnement requis' : 'Zéro rupture critique'}
                </div>
              </div>
            </div>

            {/* Mini Footer informatif */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: THEME.text.secondary, paddingTop: 2 }}>
              <span>Rotation des stocks</span>
              <span style={{ fontWeight: 600, color: metrics.stockAlertesCount > 0 ? THEME.accent.danger : THEME.brand.emerald }}>
                {metrics.stockAlertesCount > 0 ? 'Attention seuil minimal atteint' : 'Flux d’inventaire fluide'}
              </span>
            </div>
          </div>
        )}

        {/* CARTE HERO-STYLE #3 : FRET & EXPÉDITIONS MARITIMES */}
        {hasTransitStats && (
          <div
            style={{
              background: THEME.bg.card,
              border: `1px solid ${THEME.border.base}`,
              borderRadius: RADIUS.card,
              padding: '20px 22px',
              boxShadow: SHADOWS.card,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            {/* Header avec Icon Box & Pill Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: THEME.text.secondary, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  <div style={{ width: 22, height: 22, borderRadius: RADIUS.micro, background: `${THEME.brand.navy}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.brand.navy }}>
                    <Ship size={13} strokeWidth={2.4} />
                  </div>
                  <span>Logistique & Acheminement</span>
                </div>
                <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 3 }}>
                  Suivi Chine-Mada & douane
                </div>
              </div>

              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: RADIUS.pill,
                  background: `${THEME.brand.navy}14`,
                  color: THEME.brand.navy,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Compass size={12} strokeWidth={2.4} />
                {metrics.enTransit} colis en route
              </span>
            </div>

            {/* Inset Container avec Grands Chiffres Dual-Metric */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 14,
                alignItems: 'center',
                background: THEME.bg.surface,
                padding: '16px 18px',
                borderRadius: RADIUS.item,
                border: `1px solid ${THEME.border.base}`,
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  Expéditions Actives
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 'clamp(22px, 2.6vw, 26px)', fontWeight: 800, color: THEME.brand.navy, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.03em' }}>
                  {metrics.enTransit} <span style={{ fontSize: 13, fontWeight: 600 }}>colis</span>
                </div>
                <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
                  {metrics.commandesCount} commande(s) maritimes/aériennes
                </div>
              </div>

              <div style={{ borderLeft: `1px solid ${THEME.border.base}`, paddingLeft: 14 }}>
                <div style={{ fontSize: 11.5, color: THEME.text.secondary, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  Mode de Transport
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 'clamp(18px, 2.1vw, 22px)', fontWeight: 800, color: THEME.text.primary, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.02em' }}>
                  Fret Maritime
                </div>
                <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
                  Transitaires & consolidation
                </div>
              </div>
            </div>

            {/* Mini Footer informatif */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: THEME.text.secondary, paddingTop: 2 }}>
              <span>Statut d'acheminement</span>
              <span style={{ fontWeight: 600, color: metrics.enTransit > 0 ? THEME.brand.navy : THEME.brand.emerald }}>
                {metrics.enTransit > 0 ? 'En mer / transit portuaire' : 'Toutes expéditions reçues'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* NIVEAU 3 : RUBAN TÉLÉMÉTRIQUE COMPACT EN PASTILLES SQUIRCLE */}
      {secondaryKpis.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
            gap: 10,
          }}
        >
          {secondaryKpis.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  background: THEME.bg.card,
                  border: `1px solid ${THEME.border.base}`,
                  borderRadius: RADIUS.item,
                  padding: '12px 14px',
                  boxShadow: SHADOWS.subtle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'background-color 0.15s ease, transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: RADIUS.micro,
                    background: `${item.color}14`,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, color: THEME.text.secondary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 700, color: THEME.text.primary, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.val}
                  </div>
                  <div style={{ fontSize: 10.5, color: THEME.text.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default DashboardKpiGrid;


