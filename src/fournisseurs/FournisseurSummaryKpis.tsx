import React from 'react';
import { DollarSign, Clock } from 'lucide-react';

interface FournisseurSummaryKpisProps {
  totalDepenses: number;
  totalSoldeDu: number;
  topFournisseur: { nom: string; montant: number } | null;
  totalPieces: number;
  totalFournisseurs: number;
  commandesCount: number;
  filterType: string;
  onFilterSoldeDu: () => void;
}

export default function FournisseurSummaryKpis({
  totalDepenses,
  totalSoldeDu,
  topFournisseur,
  totalPieces,
  totalFournisseurs,
  commandesCount,
  filterType,
  onFilterSoldeDu,
}: FournisseurSummaryKpisProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
        marginBottom: 14,
      }}
    >
      {/* Total Dépensé */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 10,
          padding: '10px 14px',
          border: '1px solid #EAE2D4',
        }}
      >
        <div style={{ fontSize: 11, color: '#736B5E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <DollarSign size={13} />
          <span>TOTAL DÉPENSÉ</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#3D5A6C', marginTop: 3 }}>
          {totalDepenses.toLocaleString('fr-FR')} Ar
        </div>
        <div style={{ fontSize: 10.5, color: '#8A8375', marginTop: 2 }}>
          {commandesCount} commande{commandesCount > 1 ? 's' : ''} cumulée{commandesCount > 1 ? 's' : ''}
        </div>
      </div>

      {/* Solde restant dû */}
      <div
        onClick={onFilterSoldeDu}
        style={{
          background: totalSoldeDu > 0 ? '#FEFAF7' : '#FFFFFF',
          borderRadius: 10,
          padding: '10px 14px',
          border: totalSoldeDu > 0 ? '1px solid #FACFC2' : '1px solid #EAE2D4',
          cursor: 'pointer',
        }}
        title="Cliquer pour filtrer les fournisseurs avec solde dû"
      >
        <div style={{ fontSize: 11, color: '#B5532A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={13} />
          <span>SOLDE RESTANT DÛ</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#B5532A', marginTop: 3 }}>
          {totalSoldeDu.toLocaleString('fr-FR')} Ar
        </div>
        <div style={{ fontSize: 10.5, color: '#736B5E', marginTop: 2 }}>
          {totalSoldeDu > 0 ? (filterType === 'solde_du' ? '🔎 Filtre actif (cliquer pour réinitialiser)' : '⚠️ Avances en cours (filtrer)') : '✅ Tous les soldes réglés'}
        </div>
      </div>

      {/* Partenaire Principal N°1 */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 10,
          padding: '10px 14px',
          border: '1px solid #EAE2D4',
        }}
      >
        <div style={{ fontSize: 11, color: '#736B5E', fontWeight: 600 }}>
          🏆 TOP PARTENAIRE
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#26333D', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {topFournisseur ? topFournisseur.nom : '—'}
        </div>
        <div style={{ fontSize: 10.5, color: '#1B6A3E', fontWeight: 600, marginTop: 2 }}>
          {topFournisseur ? `${topFournisseur.montant.toLocaleString('fr-FR')} Ar` : '0 Ar'}
        </div>
      </div>

      {/* Total Pièces Achetées */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 10,
          padding: '10px 14px',
          border: '1px solid #EAE2D4',
        }}
      >
        <div style={{ fontSize: 11, color: '#736B5E', fontWeight: 600 }}>
          📦 VOLUME TOTAL
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#26333D', marginTop: 3 }}>
          {totalPieces.toLocaleString('fr-FR')} pcs
        </div>
        <div style={{ fontSize: 10.5, color: '#8A8375', marginTop: 2 }}>
          sur {totalFournisseurs} partenaire{totalFournisseurs > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
