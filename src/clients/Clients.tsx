import React, {  useState, useMemo , memo } from 'react';
import { Search, ArrowUpDown, Users, AlertCircle, Sparkles, Filter, CreditCard } from 'lucide-react';
import { SectionHeader, Empty, inputStyle, selectStyle } from '../ui';
import { Client, ClientStat, ClientCategory, ClientSortOption, CLIENT_CATEGORIES } from './types';
import ClientItem from './ClientItem';
import ClientForm from './ClientForm';
import ModalEditClient from './ModalEditClient';
import ModalDeleteClient from './ModalDeleteClient';
import ModalHistoriqueClient from './ModalHistoriqueClient';
import { getMontantPayeVente, getRestePayeVente } from '../paymentUtils';

interface ClientsProps {
  clients?: Client[];
  ventes?: any[];
  products?: any[];
  updateData: (data: any) => void;
  initialSearch?: string;
  paiements?: any[];
}

const Clients = memo(function Clients({
  clients = [],
  ventes = [],
  products = [],
  updateData,
  initialSearch = '',
  paiements = [],
}: ClientsProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  React.useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<ClientSortOption>('ca_desc');
  const [clientEnEdition, setClientEnEdition] = useState<Client | null>(null);
  const [clientASupprimer, setClientASupprimer] = useState<Client | null>(null);
  const [clientHistorique, setClientHistorique] = useState<Client | null>(null);

  // 1. Calcul optimisé O(Ventes + Clients) des statistiques complètes (CA, Crédit dû, Fréquence, Dernier achat)
  const clientStats = useMemo(() => {
    const stats: Record<string, ClientStat> = {};

    clients.forEach(c => {
      stats[c.id] = { total: 0, paye: 0, du: 0, count: 0 };
    });

    ventes.forEach((v: any) => {
      if (v.clientId) {
        if (!stats[v.clientId]) {
          stats[v.clientId] = { total: 0, paye: 0, du: 0, count: 0 };
        }
        const totalVente = Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0;
        const payeVente = getMontantPayeVente(v, paiements);
        const resteVente = getRestePayeVente(v, paiements);

        stats[v.clientId].total += totalVente;
        stats[v.clientId].paye += payeVente;
        stats[v.clientId].du += resteVente;
        stats[v.clientId].count += 1;

        if (v.date) {
          if (!stats[v.clientId].dernierAchat || new Date(v.date) > new Date(stats[v.clientId].dernierAchat!)) {
            stats[v.clientId].dernierAchat = v.date;
          }
          if (!stats[v.clientId].premierAchat || new Date(v.date) < new Date(stats[v.clientId].premierAchat!)) {
            stats[v.clientId].premierAchat = v.date;
          }
        }
      }
    });

    return stats;
  }, [clients, ventes]);

  // 2. Filtrage combiné (Recherche + Catégories / Filtres rapides)
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const stats = clientStats[c.id] || { total: 0, paye: 0, du: 0, count: 0 };

      // Filtre catégorie
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'credit') {
          if (stats.du <= 0) return false;
        } else if (selectedCategory === 'nouveaux') {
          if (stats.count > 0) return false;
        } else if (c.categorie !== selectedCategory) {
          return false;
        }
      }

      // Filtre recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchNom = c.nom?.toLowerCase().includes(q);
        const matchContact = c.contact?.toLowerCase().includes(q);
        const matchNotes = c.notes?.toLowerCase().includes(q);
        if (!matchNom && !matchContact && !matchNotes) return false;
      }

      return true;
    });
  }, [clients, clientStats, selectedCategory, searchQuery]);

  // 3. Tri des clients
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      const statsA = clientStats[a.id] || { total: 0, paye: 0, du: 0, count: 0 };
      const statsB = clientStats[b.id] || { total: 0, paye: 0, du: 0, count: 0 };

      switch (sortBy) {
        case 'ca_desc':
          return statsB.total - statsA.total;
        case 'ca_asc':
          return statsA.total - statsB.total;
        case 'du_desc':
          return statsB.du - statsA.du;
        case 'dernier_achat_desc': {
          const tA = statsA.dernierAchat ? new Date(statsA.dernierAchat).getTime() : 0;
          const tB = statsB.dernierAchat ? new Date(statsB.dernierAchat).getTime() : 0;
          return tB - tA;
        }
        case 'dernier_achat_asc': {
          const tA = statsA.dernierAchat ? new Date(statsA.dernierAchat).getTime() : Infinity;
          const tB = statsB.dernierAchat ? new Date(statsB.dernierAchat).getTime() : Infinity;
          return tA - tB;
        }
        case 'achats_desc':
          return statsB.count - statsA.count;
        case 'nom_asc':
          return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
        case 'nom_desc':
          return b.nom.localeCompare(a.nom, 'fr', { sensitivity: 'base' });
        case 'recents':
          if (a.dateCreation && b.dateCreation) {
            return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
          }
          return 0;
        default:
          return statsB.total - statsA.total;
      }
    });
  }, [filteredClients, clientStats, sortBy]);

  // Synthèse globale du portefeuille clients
  const globalSummary = useMemo(() => {
    let totalCA = 0;
    let totalCreditDu = 0;
    let nbClientsAvecCredit = 0;
    let nbNouveaux = 0;

    clients.forEach(c => {
      const st = clientStats[c.id];
      if (st) {
        totalCA += st.total;
        totalCreditDu += st.du;
        if (st.du > 0) nbClientsAvecCredit++;
        if (st.count === 0) nbNouveaux++;
      }
    });

    return { totalCA, totalCreditDu, nbClientsAvecCredit, nbNouveaux };
  }, [clients, clientStats]);

  // Actions CRUD
  const handleAddClient = (nouveauClient: Client) => {
    updateData({ clients: [...clients, nouveauClient] });
    setShowForm(false);
  };

  const handleSaveEdit = (clientModifie: Client) => {
    updateData({
      clients: clients.map(c => (c.id === clientModifie.id ? clientModifie : c)),
    });
    setClientEnEdition(null);
  };

  const handleConfirmDelete = () => {
    if (!clientASupprimer) return;
    updateData({ clients: clients.filter(c => c.id !== clientASupprimer.id) });
    setClientASupprimer(null);
  };

  return (
    <div>
      <SectionHeader
        title="Clients"
        action={() => setShowForm(s => !s)}
        actionLabel={showForm ? 'Fermer' : '+ Client'}
      />

      {/* Formulaire d'ajout rapide */}
      {showForm && <ClientForm onAdd={handleAddClient} />}

      {/* Cartes KPI Synthèse */}
      {clients.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #EAE2D4',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: 11.5, color: '#8A8375', fontWeight: 500 }}>Total Clients</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#26333D', marginTop: 2 }}>
              {clients.length}
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #EAE2D4',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: 11.5, color: '#8A8375', fontWeight: 500 }}>Chiffre d'Affaires</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#245269', marginTop: 2 }}>
              {globalSummary.totalCA.toLocaleString('fr-FR')} Ar
            </div>
          </div>

          <div
            style={{
              background: globalSummary.totalCreditDu > 0 ? '#FEF2F2' : '#FFFFFF',
              border: `1px solid ${globalSummary.totalCreditDu > 0 ? '#FECACA' : '#EAE2D4'}`,
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: 11.5, color: globalSummary.totalCreditDu > 0 ? '#991B1B' : '#8A8375', fontWeight: 500 }}>
              {globalSummary.totalCreditDu > 0 ? '⚠️ Total Crédit Dû' : 'Crédit / Dettes clients'}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: globalSummary.totalCreditDu > 0 ? '#DC2626' : '#16A34A',
                marginTop: 2,
              }}
            >
              {globalSummary.totalCreditDu > 0
                ? `${globalSummary.totalCreditDu.toLocaleString('fr-FR')} Ar`
                : '0 Ar (À jour)'}
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #EAE2D4',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: 11.5, color: '#8A8375', fontWeight: 500 }}>Nouveaux (sans achat)</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B45309', marginTop: 2 }}>
              {globalSummary.nbNouveaux}
            </div>
          </div>
        </div>
      )}

      {/* Barre de Recherche et Tri */}
      {clients.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Recherche */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
              <Search
                size={15}
                color="#8A8375"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                style={{ ...inputStyle, paddingLeft: 32 } as any}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un client (nom, contact, notes)..."
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#8A8375',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sélecteur de Tri */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <ArrowUpDown size={14} color="#5B7B88" />
              <select
                style={{ ...(selectStyle as any), width: 'auto', minWidth: 200 }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value as ClientSortOption)}
              >
                <option value="ca_desc">Tri : CA Décroissant (Top clients)</option>
                <option value="du_desc">Tri : Solde dû / Crédit décroissant</option>
                <option value="dernier_achat_desc">Tri : Dernier achat (Plus récent)</option>
                <option value="dernier_achat_asc">Tri : Dernier achat (Plus ancien / Inactif)</option>
                <option value="achats_desc">Tri : Nombre d'achats</option>
                <option value="nom_asc">Tri : Nom (A → Z)</option>
                <option value="nom_desc">Tri : Nom (Z → A)</option>
                <option value="recents">Tri : Date d'ajout du client</option>
              </select>
            </div>
          </div>

          {/* Filtres par Catégories / Statuts (Pills cliquables) */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 2,
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                fontSize: 12,
                fontWeight: selectedCategory === 'all' ? 700 : 500,
                padding: '4px 10px',
                borderRadius: 20,
                border: `1px solid ${selectedCategory === 'all' ? '#3D5A6C' : '#EAE2D4'}`,
                background: selectedCategory === 'all' ? '#3D5A6C' : '#FFFFFF',
                color: selectedCategory === 'all' ? '#FFFFFF' : '#4B5563',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Tous ({clients.length})
            </button>

            {globalSummary.totalCreditDu > 0 && (
              <button
                onClick={() => setSelectedCategory('credit')}
                style={{
                  fontSize: 12,
                  fontWeight: selectedCategory === 'credit' ? 700 : 500,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1px solid ${selectedCategory === 'credit' ? '#DC2626' : '#FECACA'}`,
                  background: selectedCategory === 'credit' ? '#DC2626' : '#FEF2F2',
                  color: selectedCategory === 'credit' ? '#FFFFFF' : '#DC2626',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ⚠️ Crédits en cours ({globalSummary.nbClientsAvecCredit})
              </button>
            )}

            {globalSummary.nbNouveaux > 0 && (
              <button
                onClick={() => setSelectedCategory('nouveaux')}
                style={{
                  fontSize: 12,
                  fontWeight: selectedCategory === 'nouveaux' ? 700 : 500,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1px solid ${selectedCategory === 'nouveaux' ? '#D97706' : '#FDE68A'}`,
                  background: selectedCategory === 'nouveaux' ? '#D97706' : '#FEF3C7',
                  color: selectedCategory === 'nouveaux' ? '#FFFFFF' : '#92400E',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Nouveaux ({globalSummary.nbNouveaux})
              </button>
            )}

            {CLIENT_CATEGORIES.map(cat => {
              const count = clients.filter(c => c.categorie === cat.id).length;
              if (count === 0 && selectedCategory !== cat.id) return null;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: `1px solid ${isSelected ? cat.color : cat.border}`,
                    background: isSelected ? cat.color : cat.bg,
                    color: isSelected ? '#FFFFFF' : cat.color,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modale Historique d'achats détaillée */}
      <ModalHistoriqueClient
        client={clientHistorique}
        stats={clientHistorique ? clientStats[clientHistorique.id] || { total: 0, paye: 0, du: 0, count: 0 } : { total: 0, paye: 0, du: 0, count: 0 }}
        ventes={ventes}
        products={products}
        onClose={() => setClientHistorique(null)}
        onEditClient={setClientEnEdition}
      />

      {/* Modale d'édition */}
      <ModalEditClient
        client={clientEnEdition}
        onClose={() => setClientEnEdition(null)}
        onSave={handleSaveEdit}
      />

      {/* Modale de confirmation de suppression */}
      <ModalDeleteClient
        client={clientASupprimer}
        stats={clientASupprimer ? clientStats[clientASupprimer.id] || { total: 0, paye: 0, du: 0, count: 0 } : { total: 0, paye: 0, du: 0, count: 0 }}
        onClose={() => setClientASupprimer(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Liste des clients */}
      {clients.length === 0 ? (
        <Empty text="Aucun client enregistré pour l'instant. Cliquez sur '+ Client' pour ajouter votre premier contact." />
      ) : sortedClients.length === 0 ? (
        <Empty text={`Aucun client ne correspond aux critères sélectionnés.`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sortedClients.map(c => (
            <ClientItem
              key={c.id}
              client={c}
              stats={clientStats[c.id] || { total: 0, paye: 0, du: 0, count: 0 }}
              onViewHistory={setClientHistorique}
              onEdit={setClientEnEdition}
              onDelete={setClientASupprimer}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default Clients;
