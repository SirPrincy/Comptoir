import React from 'react';
import { Package, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { Stat } from '../ui';

interface StockKpisProps {
  kpis: {
    totalUnites: number;
    valeurAchatTotale: number;
    caPotentielTotal: number;
    margePotentielle: number;
    margeGlobalPct: number;
    alertesCount: number;
  };
}

export default function StockKpis({ kpis }: StockKpisProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
      <Stat label="Total en Stock" value={`${kpis.totalUnites} unités`} icon={Package} accent="#3D5A6C" />
      <Stat label="Valeur d'Achat globale" value={`${kpis.valeurAchatTotale.toLocaleString('fr-FR')} Ar`} icon={Wallet} accent="#5E584E" />
      <Stat label="CA Cible Potentiel" value={`${kpis.caPotentielTotal.toLocaleString('fr-FR')} Ar`} icon={TrendingUp} accent="#3F7A5C" />
      <Stat
        label="Marge Potentielle"
        value={`${kpis.margePotentielle.toLocaleString('fr-FR')} Ar (${kpis.margeGlobalPct}%)`}
        icon={DollarSign}
        accent={kpis.margePotentielle > 0 ? '#3F7A5C' : '#C24A3F'}
      />
      {kpis.alertesCount > 0 && (
        <div style={{ background: '#FBEAE8', border: '1px solid #F0C6C0', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, color: '#C24A3F', fontWeight: 700, textTransform: 'uppercase' }}>⚠️ Alertes Stock</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#C24A3F', marginTop: 2 }}>{kpis.alertesCount} produit{kpis.alertesCount > 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}
