export type ClientCategory = 'particulier' | 'fidele' | 'revendeur' | 'grossiste' | 'vip' | 'prospect';

export interface ClientCategoryMeta {
  id: ClientCategory;
  label: string;
  bg: string;
  color: string;
  border: string;
}

export const CLIENT_CATEGORIES: ClientCategoryMeta[] = [
  { id: 'particulier', label: 'Particulier', bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' },
  { id: 'fidele', label: 'Client Fidèle', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  { id: 'revendeur', label: 'Revendeur', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  { id: 'grossiste', label: 'Grossiste', bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
  { id: 'vip', label: '⭐ VIP', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  { id: 'prospect', label: 'Prospect', bg: '#FFF7ED', color: '#9A3412', border: '#FFEDD5' },
];

export interface Client {
  id: string;
  nom: string;
  contact?: string;
  notes?: string;
  categorie?: ClientCategory;
  dateCreation?: string;
}

export interface ClientStat {
  total: number;         // Chiffre d'affaires cumulé
  paye: number;          // Total réglé
  du: number;            // Solde restant dû (crédit client)
  count: number;         // Nombre d'achats
  dernierAchat?: string; // Date ISO du dernier achat
  premierAchat?: string; // Date ISO du premier achat
}

export type ClientSortOption =
  | 'ca_desc'
  | 'ca_asc'
  | 'du_desc'
  | 'dernier_achat_desc'
  | 'dernier_achat_asc'
  | 'achats_desc'
  | 'nom_asc'
  | 'nom_desc'
  | 'recents';
