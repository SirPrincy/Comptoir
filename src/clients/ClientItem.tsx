import React from 'react';
import { Edit2, Trash2, Phone, Sparkles, Clock, AlertCircle, Eye, History } from 'lucide-react';
import { Client, ClientStat, CLIENT_CATEGORIES } from './types';
import { rowCard, iconBtn } from '../ui';
import { formatDernierAchat } from './clientUtils';

interface ClientItemProps {
  key?: React.Key;
  client: Client;
  stats: ClientStat;
  onViewHistory: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export default function ClientItem({
  client,
  stats,
  onViewHistory,
  onEdit,
  onDelete,
}: ClientItemProps) {
  const isNouveau = stats.count === 0;
  const aDette = stats.du > 0;
  const catMeta = CLIENT_CATEGORIES.find(c => c.id === client.categorie);
  const { text: dernierAchatLabel, isAncient } = formatDernierAchat(stats.dernierAchat);

  return (
    <div
      style={{
        ...(rowCard as any),
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onClick={() => onViewHistory(client)}
    >
      <div style={{ minWidth: 0, flex: '1 1 200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#26333D' }}>{client.nom}</span>

          {/* Tag de catégorie (Particulier, Revendeur, Fidèle, VIP...) */}
          {catMeta && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 10,
                background: catMeta.bg,
                color: catMeta.color,
                border: `1px solid ${catMeta.border}`,
              }}
            >
              {catMeta.label}
            </span>
          )}

          {/* Statut d'activité */}
          {isNouveau ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10.5,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 10,
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
              }}
            >
              <Sparkles size={11} /> Nouveau client
            </span>
          ) : (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 10,
                background: '#E8F1F5',
                color: '#245269',
                border: '1px solid #D0E1EA',
              }}
            >
              {stats.count} achat{stats.count > 1 ? 's' : ''}
            </span>
          )}

          {/* Badge Crédit / Montant dû */}
          {aDette && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 10,
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
              }}
              title="Montant restant dû sur des ventes à crédit ou acomptes partiels"
            >
              <AlertCircle size={10.5} />
              Dû: {stats.du.toLocaleString('fr-FR')} Ar
            </span>
          )}
        </div>

        {/* Détails secondaires : contact, date dernier achat, notes */}
        <div
          style={{
            fontSize: 12,
            color: '#8A8375',
            marginTop: 3,
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {client.contact ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#4A5568' }}>
              <Phone size={11} color="#718096" />
              {client.contact}
            </span>
          ) : (
            <span style={{ color: '#A0AEC0', fontStyle: 'italic' }}>Sans contact</span>
          )}

          {!isNouveau && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                color: isAncient ? '#D97706' : '#64748B',
                fontWeight: isAncient ? 600 : 400,
              }}
              title={`Date du dernier achat : ${stats.dernierAchat || 'N/A'}`}
            >
              <Clock size={11} />
              Dernier : {dernierAchatLabel}
            </span>
          )}

          {client.notes && <span>· {client.notes}</span>}
        </div>
      </div>

      {/* Montants & Actions */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'right', marginRight: 4 }}>
          <div style={{ fontWeight: 700, color: '#3D5A6C', fontSize: 13.5, whiteSpace: 'nowrap' }}>
            {stats.total.toLocaleString('fr-FR')} Ar
          </div>
          {aDette && (
            <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
              Dû: {stats.du.toLocaleString('fr-FR')} Ar
            </div>
          )}
        </div>

        <button
          onClick={() => onViewHistory(client)}
          style={{ ...iconBtn, color: '#2C5E43' }}
          title="Consulter l'historique des achats"
        >
          <History size={14} />
        </button>

        <button
          onClick={() => onEdit(client)}
          style={{ ...iconBtn, color: '#5B7B88' }}
          title="Modifier le client"
        >
          <Edit2 size={14} />
        </button>

        <button
          onClick={() => onDelete(client)}
          style={iconBtn}
          title="Supprimer le client"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
