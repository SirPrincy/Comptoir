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
} from 'lucide-react';
import { THEME } from '../colors';
import { Stat } from '../ui';
import { DashboardKpisConfig } from './dashboardConfig';

interface DashboardKpiGridProps {
  kpisConfig: DashboardKpisConfig;
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
}: DashboardKpiGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10,
      }}
    >
      {/* Finance KPIs */}
      {k.ca && (
        <Stat
          label="Chiffre d'affaires"
          value={`${metrics.caTotal.toLocaleString('fr-FR')} Ar`}
          subvalue={`${metrics.ventesCount} vente(s) enregistrée(s)`}
          icon={TrendingUp}
          accent={THEME.accent.primary}
        />
      )}

      {k.marge && (
        <Stat
          label="Marge brute réelle"
          value={`${metrics.margeTotale.toLocaleString('fr-FR')} Ar`}
          subvalue={metrics.caTotal > 0 ? `${((metrics.margeTotale / metrics.caTotal) * 100).toFixed(1)}% du CA` : undefined}
          icon={TrendingUp}
          accent={THEME.accent.green}
        />
      )}

      {k.benefice && (
        <Stat
          label="Bénéfice Net"
          value={`${metrics.beneficeNet >= 0 ? '+' : ''}${metrics.beneficeNet.toLocaleString('fr-FR')} Ar`}
          subvalue="Marge nette d'exploitation"
          icon={DollarSign}
          accent={metrics.beneficeNet >= 0 ? THEME.accent.green : THEME.accent.danger}
        />
      )}

      {k.roi && (
        <Stat
          label="ROI estimé"
          value={`${metrics.tauxRoi >= 0 ? '+' : ''}${metrics.tauxRoi.toFixed(1)} %`}
          subvalue={`Récupération: ${metrics.tauxRecuperation.toFixed(0)}%`}
          icon={Percent}
          accent={metrics.tauxRoi >= 0 ? THEME.accent.green : THEME.accent.danger}
        />
      )}

      {k.capital && (
        <Stat
          label="Capital investi"
          value={`${metrics.baseInvestissement.toLocaleString('fr-FR')} Ar`}
          subvalue={metrics.capitalInvesti > 0 ? 'Apports déclarés' : 'Dépenses globales'}
          icon={Wallet}
          accent={THEME.accent.orange}
        />
      )}

      {k.tresorerie && (
        <Stat
          label="Trésorerie dispo"
          value={`${metrics.tresorerieDispo.toLocaleString('fr-FR')} Ar`}
          subvalue="Solde net caisse & banques"
          icon={Coins}
          accent={metrics.tresorerieDispo >= 0 ? THEME.accent.green : THEME.accent.danger}
        />
      )}

      {k.reserve_rmb && (
        <Stat
          label="Réserve RMB (¥)"
          value={`${metrics.soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} ¥`}
          subvalue={`Achats: ${metrics.soldeRmbInfo.totalRmbAchete.toFixed(1)} ¥`}
          icon={Receipt}
          accent="#D97706"
        />
      )}

      {k.creances && (
        <Stat
          label="Créances clients"
          value={`${metrics.creancesClients.toLocaleString('fr-FR')} Ar`}
          subvalue="Restes à recouvrer"
          icon={CreditCard}
          accent={metrics.creancesClients > 0 ? THEME.accent.orange : THEME.accent.green}
        />
      )}

      {k.dettes && (
        <Stat
          label="Dettes fournisseurs"
          value={`${metrics.dettesFournisseurs.toLocaleString('fr-FR')} Ar`}
          subvalue="Marchandises & fret dus"
          icon={AlertCircle}
          accent={metrics.dettesFournisseurs > 0 ? THEME.accent.danger : THEME.accent.green}
        />
      )}

      {k.charges && (
        <Stat
          label="Charges d'exploitation"
          value={`${metrics.chargesOperationnelles.toLocaleString('fr-FR')} Ar`}
          subvalue="Frais fixes et courants"
          icon={Boxes}
          accent={THEME.accent.orange}
        />
      )}

      {k.pertes_stock && (
        <Stat
          label="Pertes & Casse Stock"
          value={`${metrics.statsPertes.totalPertesAr > 0 ? '-' : ''}${metrics.statsPertes.totalPertesAr.toLocaleString('fr-FR')} Ar`}
          subvalue={metrics.statsPertes.quantitePerdue > 0 ? `${metrics.statsPertes.quantitePerdue} pièce(s) perdue(s)/cassée(s)` : 'Aucune perte constatée'}
          icon={AlertTriangle}
          accent={metrics.statsPertes.totalPertesAr > 0 ? THEME.accent.danger : THEME.accent.green}
        />
      )}

      {/* Logistique & Stock KPIs */}
      {k.transit && (
        <Stat
          label="Colis en transit"
          value={metrics.enTransit}
          subvalue={`${metrics.commandesCount} commande(s) totale(s)`}
          icon={Ship}
          accent={THEME.accent.primary}
        />
      )}

      {k.stock_valeur && (
        <Stat
          label="Valeur stock local"
          value={`${metrics.valeurStockLocal.toLocaleString('fr-FR')} Ar`}
          subvalue={`${metrics.totalArticlesEnRayon} articles en rayon`}
          icon={Package}
          accent={THEME.accent.green}
        />
      )}

      {k.stock_alerte && (
        <Stat
          label="Alertes stock"
          value={`${metrics.stockAlertesCount} produit(s)`}
          subvalue={metrics.stockAlertesCount > 0 ? 'Stock bas ou rupture' : 'Tous stocks OK'}
          icon={AlertTriangle}
          accent={metrics.stockAlertesCount > 0 ? THEME.accent.danger : THEME.accent.green}
        />
      )}

      {k.articles_vendus && (
        <Stat
          label="Articles vendus"
          value={`${metrics.articlesVendusTotal} pcs`}
          subvalue="Volume total de pièces"
          icon={ShoppingCart}
          accent={THEME.accent.primary}
        />
      )}

      {k.panier_moyen && (
        <Stat
          label="Panier moyen"
          value={`${metrics.panierMoyen.toLocaleString('fr-FR')} Ar`}
          subvalue="Par transaction client"
          icon={PiggyBank}
          accent={THEME.accent.green}
        />
      )}
    </div>
  );
});

export default DashboardKpiGrid;
