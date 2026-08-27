import React, { useState, useMemo } from 'react';
import { Search, User, Calendar, AlertTriangle, CheckCircle2, DollarSign, Filter, Users, ArrowRight, Phone, Clock, FileText } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { inputStyle, selectStyle } from '../ui';
import { getMontantPayeVente, getRestePayeVente } from '../paymentUtils';

interface CreancesClientsProps {
  ventes?: any[];
  clients?: any[];
  products?: any[];
  paiements?: any[];
  onEncaisserVente?: (venteId: string) => void;
  onEncaisserClient?: (clientId: string, venteIds: string[]) => void;
}

export default function CreancesClients({
  ventes = [],
  clients = [],
  products = [],
  paiements = [],
  onEncaisserVente,
  onEncaisserClient,
}: CreancesClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnciennete, setFilterAnciennete] = useState<'all' | 'recent' | 'moyen' | 'retard'>('all');
  const [viewMode, setViewMode] = useState<'vente' | 'client'>('vente');

  // Today
  const now = new Date();

  // 1. Liste enrichie de toutes les ventes avec créance (resteDu > 0)
  const creancesVentes = useMemo(() => {
    return ventes
      .map((v: any) => {
        const total = Number(v.total) || ((Number(v.pu || 0) * Number(v.qty || 1)) + (Number(v.fraisLivraison) || 0));
        const paye = getMontantPayeVente(v, paiements);
        const resteDu = getRestePayeVente(v, paiements);

        if (resteDu <= 0) return null;

        const client = clients.find((c: any) => c.id === v.clientId);
        const product = products.find((p: any) => p.id === v.productId);

        const vDate = v.date ? new Date(v.date) : now;
        const diffMs = now.getTime() - vDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        let statutAnciennete: 'recent' | 'moyen' | 'retard' = 'recent';
        if (diffDays > 30) statutAnciennete = 'retard';
        else if (diffDays >= 15) statutAnciennete = 'moyen';

        return {
          ...v,
          totalCalculated: total,
          payeCalculated: paye,
          resteDu,
          clientNom: client?.nom || v.description || 'Client occasionnel',
          clientContact: client?.contact || '',
          clientCategorie: client?.categorie || '',
          productNom: product ? `${product.nom}${product.couleur ? ` (${product.couleur})` : ''}` : 'Article',
          diffDays,
          statutAnciennete,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.diffDays - a.diffDays); // Les plus anciennes en premier (urgence)
  }, [ventes, clients, products, paiements]);

  // 2. Regroupement par client
  const creancesParClient = useMemo(() => {
    const map: Record<string, {
      clientId: string;
      clientNom: string;
      clientContact: string;
      clientCategorie: string;
      totalDu: number;
      totalAchat: number;
      totalPaye: number;
      nbVentes: number;
      maxDiffDays: number;
      ventes: any[];
    }> = {};

    creancesVentes.forEach((item: any) => {
      const cKey = item.clientId || `guest_${item.clientNom}`;
      if (!map[cKey]) {
        map[cKey] = {
          clientId: item.clientId || '',
          clientNom: item.clientNom,
          clientContact: item.clientContact,
          clientCategorie: item.clientCategorie,
          totalDu: 0,
          totalAchat: 0,
          totalPaye: 0,
          nbVentes: 0,
          maxDiffDays: 0,
          ventes: [],
        };
      }

      map[cKey].totalDu += item.resteDu;
      map[cKey].totalAchat += item.totalCalculated;
      map[cKey].totalPaye += item.payeCalculated;
      map[cKey].nbVentes += 1;
      if (item.diffDays > map[cKey].maxDiffDays) {
        map[cKey].maxDiffDays = item.diffDays;
      }
      map[cKey].ventes.push(item);
    });

    return Object.values(map).sort((a, b) => b.totalDu - a.totalDu);
  }, [creancesVentes]);

  // 3. Stats KPIs globales
  const stats = useMemo(() => {
    let totalDuGlobal = 0;
    let totalPayeAcomptes = 0;
    let totalInitial = 0;
    let nbClientsDebiteurs = creancesParClient.length;
    let nbVentesImpayees = creancesVentes.length;
    let totalRetard30j = 0;
    let nbRetard30j = 0;

    creancesVentes.forEach((item: any) => {
      totalDuGlobal += item.resteDu;
      totalPayeAcomptes += item.payeCalculated;
      totalInitial += item.totalCalculated;
      if (item.diffDays > 30) {
        totalRetard30j += item.resteDu;
        nbRetard30j += 1;
      }
    });

    return {
      totalDuGlobal,
      totalPayeAcomptes,
      totalInitial,
      nbClientsDebiteurs,
      nbVentesImpayees,
      totalRetard30j,
      nbRetard30j,
    };
  }, [creancesVentes, creancesParClient]);

  // 4. Filtrage dynamique (Recherche + Ancienneté)
  const filteredVentes = useMemo(() => {
    return creancesVentes.filter((item: any) => {
      // Filtre ancienneté
      if (filterAnciennete !== 'all' && item.statutAnciennete !== filterAnciennete) {
        return false;
      }

      // Recherche
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchClient = item.clientNom?.toLowerCase().includes(q);
        const matchProduct = item.productNom?.toLowerCase().includes(q);
        const matchContact = item.clientContact?.toLowerCase().includes(q);
        if (!matchClient && !matchProduct && !matchContact) return false;
      }

      return true;
    });
  }, [creancesVentes, filterAnciennete, searchQuery]);

  const filteredClientsList = useMemo(() => {
    return creancesParClient.filter((item) => {
      if (filterAnciennete === 'retard' && item.maxDiffDays <= 30) return false;
      if (filterAnciennete === 'moyen' && (item.maxDiffDays < 15 || item.maxDiffDays > 30)) return false;
      if (filterAnciennete === 'recent' && item.maxDiffDays >= 15) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchNom = item.clientNom.toLowerCase().includes(q);
        const matchContact = item.clientContact.toLowerCase().includes(q);
        if (!matchNom && !matchContact) return false;
      }

      return true;
    });
  }, [creancesParClient, filterAnciennete, searchQuery]);

  // Helper badge d'ancienneté
  const renderAgeBadge = (days: number) => {
    if (days > 30) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 4,
            background: 'rgba(239, 68, 68, 0.12)',
            color: THEME.accent.danger,
            border: `1px solid rgba(239, 68, 68, 0.25)`,
          }}
        >
          <AlertTriangle size={12} />
          {days} jours (Retard &gt; 30j)
        </span>
      );
    }
    if (days >= 15) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 4,
            background: 'rgba(245, 158, 11, 0.12)',
            color: THEME.accent.orange,
            border: `1px solid rgba(245, 158, 11, 0.25)`,
          }}
        >
          <Clock size={12} />
          {days} jours (À surveiller)
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 4,
          background: 'rgba(34, 197, 94, 0.12)',
          color: THEME.accent.green,
          border: `1px solid rgba(34, 197, 94, 0.25)`,
        }}
      >
        <Clock size={12} />
        {days === 0 ? "Aujourd'hui" : `${days} jours`}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. KPIs Synthèse des Créances */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {/* Total Reste Dû */}
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 11.5, fontWeight: 500 }}>
            <DollarSign size={14} style={{ color: THEME.accent.danger }} />
            <span>Total Créances Dues</span>
          </div>
          <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.danger, marginTop: 2 }}>
            {stats.totalDuGlobal.toLocaleString('fr-FR')} Ar
          </div>
          <div style={{ fontSize: 10.5, color: THEME.text.muted, marginTop: 2 }}>
            Sur {stats.totalInitial.toLocaleString('fr-FR')} Ar vendus ({stats.totalPayeAcomptes.toLocaleString('fr-FR')} Ar encaissés)
          </div>
        </div>

        {/* Clients débiteurs */}
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 11.5, fontWeight: 500 }}>
            <Users size={14} style={{ color: THEME.accent.primary }} />
            <span>Clients Débiteurs</span>
          </div>
          <div style={{ ...TYPOGRAPHY.statValue, color: THEME.text.primary, marginTop: 2 }}>
            {stats.nbClientsDebiteurs}
          </div>
          <div style={{ fontSize: 10.5, color: THEME.text.muted, marginTop: 2 }}>
            Pour {stats.nbVentesImpayees} facture{stats.nbVentesImpayees > 1 ? 's' : ''} non soldée{stats.nbVentesImpayees > 1 ? 's' : ''}
          </div>
        </div>

        {/* Retards de plus de 30j */}
        <div style={{
          background: stats.nbRetard30j > 0 ? 'rgba(239, 68, 68, 0.05)' : THEME.bg.card,
          border: `1px solid ${stats.nbRetard30j > 0 ? 'rgba(239, 68, 68, 0.3)' : THEME.border.base}`,
          borderRadius: 10,
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: stats.nbRetard30j > 0 ? THEME.accent.danger : THEME.text.muted, fontSize: 11.5, fontWeight: 600 }}>
            <AlertTriangle size={14} style={{ color: stats.nbRetard30j > 0 ? THEME.accent.danger : THEME.text.muted }} />
            <span>Retards &gt; 30 Jours</span>
          </div>
          <div style={{ ...TYPOGRAPHY.statValue, color: stats.nbRetard30j > 0 ? THEME.accent.danger : THEME.text.primary, marginTop: 2 }}>
            {stats.totalRetard30j.toLocaleString('fr-FR')} Ar
          </div>
          <div style={{ fontSize: 10.5, color: stats.nbRetard30j > 0 ? THEME.accent.danger : THEME.text.muted, marginTop: 2, fontWeight: 500 }}>
            {stats.nbRetard30j} facture{stats.nbRetard30j > 1 ? 's' : ''} nécessite{stats.nbRetard30j > 1 ? 'nt' : ''} une relance
          </div>
        </div>
      </div>

      {/* 2. Barre de Contrôles (Recherche + Mode Vue + Filtres) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          {/* Recherche */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={14} color={THEME.text.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              style={{ ...inputStyle, paddingLeft: 30, fontSize: 12 } as any}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par client, article, téléphone..."
            />
          </div>

          {/* Mode de Vue (Par Vente vs Par Client) */}
          <div style={{ display: 'flex', background: THEME.bg.soft, padding: 2, borderRadius: 6, border: `1px solid ${THEME.border.base}` }}>
            <button
              onClick={() => setViewMode('vente')}
              style={{
                padding: '5px 10px',
                fontSize: 11.5,
                fontWeight: viewMode === 'vente' ? 700 : 500,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'vente' ? THEME.bg.card : 'transparent',
                color: viewMode === 'vente' ? THEME.accent.primary : THEME.text.secondary,
                boxShadow: viewMode === 'vente' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Par Factures ({creancesVentes.length})
            </button>
            <button
              onClick={() => setViewMode('client')}
              style={{
                padding: '5px 10px',
                fontSize: 11.5,
                fontWeight: viewMode === 'client' ? 700 : 500,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'client' ? THEME.bg.card : 'transparent',
                color: viewMode === 'client' ? THEME.accent.primary : THEME.text.secondary,
                boxShadow: viewMode === 'client' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Par Clients ({creancesParClient.length})
            </button>
          </div>
        </div>

        {/* Filtres par Ancienneté */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: THEME.text.muted, marginRight: 2 }}>Filtrer par ancienneté :</span>
          <button
            onClick={() => setFilterAnciennete('all')}
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: filterAnciennete === 'all' ? 700 : 500,
              cursor: 'pointer',
              border: `1px solid ${filterAnciennete === 'all' ? THEME.accent.primary : THEME.border.base}`,
              background: filterAnciennete === 'all' ? THEME.accent.primary : THEME.bg.card,
              color: filterAnciennete === 'all' ? '#FFFFFF' : THEME.text.secondary,
            }}
          >
            Toutes les créances
          </button>

          <button
            onClick={() => setFilterAnciennete('retard')}
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: filterAnciennete === 'retard' ? 700 : 500,
              cursor: 'pointer',
              border: `1px solid ${filterAnciennete === 'retard' ? THEME.accent.danger : 'rgba(239, 68, 68, 0.3)'}`,
              background: filterAnciennete === 'retard' ? THEME.accent.danger : 'rgba(239, 68, 68, 0.08)',
              color: filterAnciennete === 'retard' ? '#FFFFFF' : THEME.accent.danger,
            }}
          >
            ⚠️ En retard (&gt; 30j) ({creancesVentes.filter((v: any) => v.diffDays > 30).length})
          </button>

          <button
            onClick={() => setFilterAnciennete('moyen')}
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: filterAnciennete === 'moyen' ? 700 : 500,
              cursor: 'pointer',
              border: `1px solid ${filterAnciennete === 'moyen' ? THEME.accent.orange : 'rgba(245, 158, 11, 0.3)'}`,
              background: filterAnciennete === 'moyen' ? THEME.accent.orange : 'rgba(245, 158, 11, 0.08)',
              color: filterAnciennete === 'moyen' ? '#FFFFFF' : THEME.accent.orange,
            }}
          >
            À surveiller (15-30j) ({creancesVentes.filter((v: any) => v.diffDays >= 15 && v.diffDays <= 30).length})
          </button>

          <button
            onClick={() => setFilterAnciennete('recent')}
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: filterAnciennete === 'recent' ? 700 : 500,
              cursor: 'pointer',
              border: `1px solid ${filterAnciennete === 'recent' ? THEME.accent.green : 'rgba(34, 197, 94, 0.3)'}`,
              background: filterAnciennete === 'recent' ? THEME.accent.green : 'rgba(34, 197, 94, 0.08)',
              color: filterAnciennete === 'recent' ? '#FFFFFF' : THEME.accent.green,
            }}
          >
            Récents (&lt; 15j) ({creancesVentes.filter((v: any) => v.diffDays < 15).length})
          </button>
        </div>
      </div>

      {/* 3. Contenu selon le mode de vue */}
      {creancesVentes.length === 0 ? (
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '24px 16px', textAlign: 'center' }}>
          <CheckCircle2 size={28} style={{ color: THEME.accent.green, margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text.primary }}>
            Aucune créance client en cours !
          </div>
          <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 4 }}>
            Toutes les ventes réalisées sont intégralement réglées.
          </div>
        </div>
      ) : viewMode === 'vente' ? (
        /* VUE PAR VENTE / FACTURE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredVentes.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
              Aucune créance ne correspond à ce filtre.
            </div>
          ) : (
            filteredVentes.map((item: any) => {
              const dateFormatted = item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

              return (
                <div
                  key={item.id}
                  style={{
                    background: THEME.bg.card,
                    border: `1px solid ${item.diffDays > 30 ? 'rgba(239, 68, 68, 0.3)' : THEME.border.base}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: item.diffDays > 30 ? '0 1px 4px rgba(239,68,68,0.06)' : 'none',
                  }}
                >
                  {/* En-tête de carte */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: THEME.text.primary }}>
                          {item.clientNom}
                        </span>
                        {item.clientContact && (
                          <span style={{ fontSize: 11.5, color: THEME.text.muted, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Phone size={11} /> {item.clientContact}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: THEME.text.secondary, marginTop: 2 }}>
                        Produit : <strong>{item.productNom}</strong> (x{item.qty || 1})
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {renderAgeBadge(item.diffDays)}
                      {dateFormatted && (
                        <span style={{ fontSize: 11, color: THEME.text.muted }}>
                          du {dateFormatted}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ligne financière & Action */}
                  <div style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    background: THEME.bg.soft,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${THEME.border.base}`,
                    flexWrap: 'wrap',
                    gap: 10,
                  }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 10.5, color: THEME.text.muted }}>Reste Dû</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: THEME.accent.danger }}>
                          {item.resteDu.toLocaleString('fr-FR')} Ar
                        </div>
                      </div>

                      <div style={{ borderLeft: `1px solid ${THEME.border.base}`, paddingLeft: 12 }}>
                        <div style={{ fontSize: 10.5, color: THEME.text.muted }}>Total Vente</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>
                          {item.totalCalculated.toLocaleString('fr-FR')} Ar
                        </div>
                      </div>

                      {item.payeCalculated > 0 && (
                        <div style={{ borderLeft: `1px solid ${THEME.border.base}`, paddingLeft: 12 }}>
                          <div style={{ fontSize: 10.5, color: THEME.text.muted }}>Acompte encaissé</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: THEME.accent.green }}>
                            {item.payeCalculated.toLocaleString('fr-FR')} Ar
                          </div>
                        </div>
                      )}
                    </div>

                    {onEncaisserVente && (
                      <button
                        onClick={() => onEncaisserVente(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          background: THEME.accent.green,
                          color: '#FFFFFF',
                          boxShadow: '0 1px 3px rgba(34,197,94,0.2)',
                        }}
                      >
                        <DollarSign size={13} />
                        Encaisser le solde
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VUE PAR CLIENT */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredClientsList.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
              Aucun client ne correspond à ce filtre.
            </div>
          ) : (
            filteredClientsList.map((clientGroup) => {
              const ids = clientGroup.ventes.map((v: any) => v.id);

              return (
                <div
                  key={clientGroup.clientId || clientGroup.clientNom}
                  style={{
                    background: THEME.bg.card,
                    border: `1px solid ${clientGroup.maxDiffDays > 30 ? 'rgba(239, 68, 68, 0.3)' : THEME.border.base}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={15} style={{ color: THEME.accent.primary }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: THEME.text.primary }}>
                          {clientGroup.clientNom}
                        </span>
                        {clientGroup.clientContact && (
                          <span style={{ fontSize: 11.5, color: THEME.text.muted, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Phone size={11} /> {clientGroup.clientContact}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: THEME.text.muted, marginTop: 3 }}>
                        {clientGroup.nbVentes} facture{clientGroup.nbVentes > 1 ? 's' : ''} en attente de règlement · Ancienneté max : {renderAgeBadge(clientGroup.maxDiffDays)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10.5, color: THEME.text.muted }}>Solde Dû Cumulé</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: THEME.accent.danger }}>
                          {clientGroup.totalDu.toLocaleString('fr-FR')} Ar
                        </div>
                      </div>

                      {onEncaisserClient && (
                        <button
                          onClick={() => onEncaisserClient(clientGroup.clientId, ids)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '7px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: THEME.accent.green,
                            color: '#FFFFFF',
                          }}
                        >
                          <DollarSign size={13} />
                          Encaisser
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sous-liste des factures du client */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: THEME.bg.soft, padding: 8, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Détail des factures non soldées :
                    </div>
                    {clientGroup.ventes.map((v: any) => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0', borderBottom: `1px dashed ${THEME.border.base}` }}>
                        <div>
                          <strong style={{ color: THEME.text.primary }}>{v.productNom}</strong> (x{v.qty || 1})
                          {v.date && <span style={{ color: THEME.text.muted, fontSize: 11, marginLeft: 6 }}>· {new Date(v.date).toLocaleDateString('fr-FR')}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 700, color: THEME.accent.danger }}>
                            {v.resteDu.toLocaleString('fr-FR')} Ar
                          </span>
                          {onEncaisserVente && (
                            <button
                              onClick={() => onEncaisserVente(v.id)}
                              style={{
                                background: 'transparent',
                                border: `1px solid ${THEME.border.base}`,
                                borderRadius: 4,
                                padding: '2px 6px',
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: THEME.accent.primary,
                                cursor: 'pointer',
                              }}
                            >
                              Encaisser
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
