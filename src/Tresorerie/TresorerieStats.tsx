import React from 'react';
import { Stat } from '../ui';
import { Wallet, Briefcase, UserCheck, TrendingUp, ArrowDownCircle, ArrowUpCircle, Coins } from 'lucide-react';

interface TresorerieStatsProps {
  soldeGlobal: number;
  caBusiness: number;
  depensesBusiness: number;
  resultatBusiness: number;
  apportsPerso: number;
  prelevementsPerso: number;
  soldeRmb?: number;
  valeurRmbAr?: number;
}

export default function TresorerieStats({
  soldeGlobal,
  caBusiness,
  depensesBusiness,
  resultatBusiness,
  apportsPerso,
  prelevementsPerso,
  soldeRmb = 0,
  valeurRmbAr = 0,
}: TresorerieStatsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
        marginBottom: 14,
      }}
    >
      <Stat
        label="Solde Cash MGA"
        value={`${soldeGlobal.toLocaleString('fr-FR')} Ar`}
        icon={Wallet}
        accent={soldeGlobal >= 0 ? '#3D5A6C' : '#C24A3F'}
      />

      <Stat
        label="Réserve Cash RMB (¥)"
        value={`${soldeRmb.toLocaleString('fr-FR')} ¥`}
        subvalue={`≈ ${valeurRmbAr.toLocaleString('fr-FR')} Ar`}
        icon={Coins}
        accent="#B78103"
      />

      <Stat
        label="Résultat Net Business"
        value={`${resultatBusiness >= 0 ? '+' : ''}${resultatBusiness.toLocaleString('fr-FR')} Ar`}
        icon={Briefcase}
        accent={resultatBusiness >= 0 ? '#3F7A5C' : '#C24A3F'}
      />

      <Stat
        label="CA & Recettes Business"
        value={`${caBusiness.toLocaleString('fr-FR')} Ar`}
        icon={ArrowDownCircle}
        accent="#3F7A5C"
      />

      <Stat
        label="Dépenses Exploitation"
        value={`${depensesBusiness.toLocaleString('fr-FR')} Ar`}
        icon={ArrowUpCircle}
        accent="#C24A3F"
      />

      <Stat
        label="Apports / Capital Perso"
        value={`${apportsPerso.toLocaleString('fr-FR')} Ar`}
        icon={TrendingUp}
        accent="#E8985E"
      />
    </div>
  );
}
