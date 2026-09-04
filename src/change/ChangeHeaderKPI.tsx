import React from 'react';
import { ArrowLeftRight, Coins, TrendingUp, Wallet, Check } from 'lucide-react';
import { Stat, primaryBtn, ghostBtn } from '../ui';

interface ChangeHeaderKPIProps {
  stats: {
    totalMga: number;
    totalRmb: number;
    totalFrais: number;
    tauxMoyenPondere: number;
    dernierTaux: number;
  };
  soldeRmbInfo: {
    totalRmbAchete: number;
    totalRmbDepense: number;
    soldeRmbDispo: number;
    tauxActuel: number;
    valeurRmbAr: number;
  };
  showForm: boolean;
  onToggleForm: () => void;
  onAppliquerTauxGlobal: () => void;
}

export default function ChangeHeaderKPI({
  stats,
  soldeRmbInfo,
  showForm,
  onToggleForm,
  onAppliquerTauxGlobal,
}: ChangeHeaderKPIProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header & Bouton Saisie */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#26333D', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeftRight size={20} color="#E8985E" />
            <span>Portefeuille & Change RMB</span>
          </h2>
          <div style={{ fontSize: 12, color: '#8A8375', marginTop: 2 }}>
            Gestion des achats de Yuan (640, 650, 655 Ar), suivi des acheteurs Chine et impact trésorerie MGA.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onToggleForm}
            style={{
              ...primaryBtn,
              background: showForm ? '#5E584E' : '#3F7A5C',
              height: 36,
              padding: '0 14px',
              fontSize: 12.5,
            }}
          >
            {showForm ? 'Fermer la saisie' : '+ Nouvelle Opération de Change'}
          </button>
        </div>
      </div>



      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <Stat
          label="Solde RMB Disponible"
          value={`${soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} ¥`}
          subvalue={`≈ ${soldeRmbInfo.valeurRmbAr.toLocaleString('fr-FR')} Ar (à ${soldeRmbInfo.tauxActuel} Ar/¥)`}
          icon={Coins}
          accent={soldeRmbInfo.soldeRmbDispo > 0 ? '#2C5E43' : '#C24A3F'}
        />
        <Stat
          label="Total RMB Acheté"
          value={`${soldeRmbInfo.totalRmbAchete.toLocaleString('fr-FR')} ¥`}
          icon={TrendingUp}
          accent="#3F7A5C"
        />
        <Stat
          label="Total RMB Dépensé (Achats)"
          value={`${soldeRmbInfo.totalRmbDepense.toLocaleString('fr-FR')} ¥`}
          icon={Wallet}
          accent="#B78103"
        />
        <Stat
          label="Taux Moyen Réel Pondéré"
          value={stats.tauxMoyenPondere > 0 ? `${stats.tauxMoyenPondere} Ar / ¥` : 'Aucun change'}
          icon={Coins}
          accent="#8D6E00"
        />
      </div>

      {/* Bannière d'Analyse du Solde RMB disponible (RMB Acheté - RMB Dépensé) */}
      <div
        style={{
          background: soldeRmbInfo.soldeRmbDispo > 0 ? '#F0F7F4' : '#FFF5F5',
          border: `1px solid ${soldeRmbInfo.soldeRmbDispo > 0 ? '#C2E0D1' : '#F2C2C2'}`,
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 12.5, color: '#26333D', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Coins size={16} color={soldeRmbInfo.soldeRmbDispo > 0 ? '#2C5E43' : '#C24A3F'} />
          <span>
            <strong>Compteur Solde RMB :</strong> {soldeRmbInfo.totalRmbAchete.toLocaleString('fr-FR')} ¥ (acheté) - {soldeRmbInfo.totalRmbDepense.toLocaleString('fr-FR')} ¥ (dépensé) = {' '}
            <strong style={{ color: soldeRmbInfo.soldeRmbDispo > 0 ? '#2C5E43' : '#C24A3F', fontSize: 13.5 }}>
              {soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} ¥ restants
            </strong>
          </span>
        </div>

        <div style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: soldeRmbInfo.soldeRmbDispo > 0 ? '#E1F0E8' : '#FCE8E8', color: soldeRmbInfo.soldeRmbDispo > 0 ? '#1E4632' : '#9E2A2B' }}>
          {soldeRmbInfo.soldeRmbDispo > 0
            ? '✅ Réserve suffisante pour passer une commande'
            : '⚠️ Réserve RMB épuisée - Pensez à recharger'}
        </div>
      </div>

      {/* Bannière de Synchronisation du Taux vers le reste de l'ERP */}
      {stats.tauxMoyenPondere > 0 && (
        <div
          style={{
            background: '#FAF7F2',
            border: '1px solid #EAE2D4',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12.5, color: '#5E584E' }}>
            <span>Taux calculé dans le module Change : <strong>{stats.tauxMoyenPondere} Ar / ¥</strong></span>
            <span style={{ marginLeft: 12, color: '#8A8375' }}>
              (Taux actuellement configuré dans l'ERP : <strong>{soldeRmbInfo.tauxActuel} Ar / ¥</strong>)
            </span>
          </div>

          {stats.tauxMoyenPondere !== soldeRmbInfo.tauxActuel && (
            <button
              type="button"
              onClick={onAppliquerTauxGlobal}
              style={{
                ...primaryBtn,
                background: '#B78103',
                height: 28,
                padding: '0 10px',
                fontSize: 11.5,
              }}
            >
              <Check size={13} />
              <span>Appliquer {stats.tauxMoyenPondere} Ar/¥ à tout l'ERP</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
