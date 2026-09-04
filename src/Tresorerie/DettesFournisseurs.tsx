import React, { useState, useMemo } from 'react';
import { Search, Truck, ShoppingCart, Calendar, CheckCircle2, Clock, Filter, Users, ArrowRight, ShieldCheck, Box, Package } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { inputStyle, selectStyle, ghostBtn, primaryBtn } from '../ui';
import { getMontantPayeMarchandise, getRestePayeMarchandise, getMontantPayeFret, getRestePayeFret } from '../paymentUtils';
import { formatDateJMA } from '../achat/components/AchatListe';

interface DettesFournisseursProps {
  commandes?: any[];
  fournisseurs?: any[];
  products?: any[];
  paiements?: any[];
  onPayerFret?: (commandeId: string) => void;
  onPayerTransitaireGroup?: (transitaireId: string, commandeIds: string[]) => void;
  onPayerAchat?: (commandeId: string) => void;
  onPayerFournisseurGroup?: (fournisseurId: string, commandeIds: string[]) => void;
}

export default function DettesFournisseurs({
  commandes = [],
  fournisseurs = [],
  products = [],
  paiements = [],
  onPayerFret,
  onPayerTransitaireGroup,
  onPayerAchat,
  onPayerFournisseurGroup,
}: DettesFournisseursProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fret' | 'marchandise'>('all');
  const [viewMode, setViewMode] = useState<'commande' | 'tiers'>('commande');

  const now = new Date();

  // 1. Liste de toutes les lignes avec impayé de Fret ou Marchandise
  const facturesImpayees = useMemo(() => {
    return commandes
      .map((c: any) => {
        const p = products.find((pr: any) => pr.id === c.productId);
        const fourn = fournisseurs.find((f: any) => f.id === c.fournisseurId);
        const trans = fournisseurs.find((f: any) => f.id === c.transitaireId);

        const totalMarchandise = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
        const payeMarchandise = getMontantPayeMarchandise(c, paiements);
        const resteMarchandise = getRestePayeMarchandise(c, paiements);

        const totalFret = Number(c.fraisTransport) || 0;
        const payeFret = getMontantPayeFret(c, paiements);
        const resteFret = getRestePayeFret(c, paiements);

        if (resteMarchandise <= 0 && resteFret <= 0) return null;

        const cDate = c.dateAchat || c.datePaiement || c.date ? new Date(c.dateAchat || c.datePaiement || c.date) : now;
        const diffMs = now.getTime() - cDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        return {
          ...c,
          productNom: p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Article',
          fournisseurNom: fourn?.nom || c.source || 'Fournisseur Chine',
          transitaireNom: trans?.nom || c.modeExpedition || 'Transitaire non assigné',
          totalMarchandise,
          payeMarchandise,
          resteMarchandise,
          totalFret,
          payeFret,
          resteFret,
          diffDays,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.diffDays - a.diffDays);
  }, [commandes, fournisseurs, products, paiements]);

  // 2. Regroupement par Transitaire / Fournisseur
  const dettesParTiers = useMemo(() => {
    const map: Record<string, {
      id: string;
      nom: string;
      type: 'transitaire' | 'fournisseur';
      totalFretDu: number;
      totalMarchandiseDu: number;
      totalDu: number;
      nbCommandes: number;
      commandeIds: string[];
    }> = {};

    facturesImpayees.forEach((item: any) => {
      // Transitaire pour le fret
      if (item.resteFret > 0) {
        const tKey = `trans_${item.transitaireId || item.transitaireNom}`;
        if (!map[tKey]) {
          map[tKey] = {
            id: item.transitaireId || tKey,
            nom: item.transitaireNom,
            type: 'transitaire',
            totalFretDu: 0,
            totalMarchandiseDu: 0,
            totalDu: 0,
            nbCommandes: 0,
            commandeIds: [],
          };
        }
        map[tKey].totalFretDu += item.resteFret;
        map[tKey].totalDu += item.resteFret;
        map[tKey].nbCommandes += 1;
        if (!map[tKey].commandeIds.includes(item.id)) {
          map[tKey].commandeIds.push(item.id);
        }
      }

      // Fournisseur pour la marchandise
      if (item.resteMarchandise > 0) {
        const fKey = `fourn_${item.fournisseurId || item.fournisseurNom}`;
        if (!map[fKey]) {
          map[fKey] = {
            id: item.fournisseurId || fKey,
            nom: item.fournisseurNom,
            type: 'fournisseur',
            totalFretDu: 0,
            totalMarchandiseDu: 0,
            totalDu: 0,
            nbCommandes: 0,
            commandeIds: [],
          };
        }
        map[fKey].totalMarchandiseDu += item.resteMarchandise;
        map[fKey].totalDu += item.resteMarchandise;
        map[fKey].nbCommandes += 1;
        if (!map[fKey].commandeIds.includes(item.id)) {
          map[fKey].commandeIds.push(item.id);
        }
      }
    });

    return Object.values(map).sort((a, b) => b.totalDu - a.totalDu);
  }, [facturesImpayees]);

  // 3. Stats Globales
  const stats = useMemo(() => {
    let totalFretDu = 0;
    let totalMarchandiseDu = 0;
    let nbFretImpayes = 0;
    let nbMarchandiseImpayes = 0;

    facturesImpayees.forEach((item: any) => {
      if (item.resteFret > 0) {
        totalFretDu += item.resteFret;
        nbFretImpayes += 1;
      }
      if (item.resteMarchandise > 0) {
        totalMarchandiseDu += item.resteMarchandise;
        nbMarchandiseImpayes += 1;
      }
    });

    return {
      totalFretDu,
      totalMarchandiseDu,
      totalGlobalDu: totalFretDu + totalMarchandiseDu,
      nbFretImpayes,
      nbMarchandiseImpayes,
      nbTotal: facturesImpayees.length,
    };
  }, [facturesImpayees]);

  // 4. Filtrage dynamique
  const facturesFiltrees = useMemo(() => {
    return facturesImpayees.filter((item: any) => {
      if (filterType === 'fret' && item.resteFret <= 0) return false;
      if (filterType === 'marchandise' && item.resteMarchandise <= 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchProd = item.productNom?.toLowerCase().includes(q);
        const matchFourn = item.fournisseurNom?.toLowerCase().includes(q);
        const matchTrans = item.transitaireNom?.toLowerCase().includes(q);
        const matchTrack = (item.tracking || '').toLowerCase().includes(q);
        if (!matchProd && !matchFourn && !matchTrans && !matchTrack) return false;
      }

      return true;
    });
  }, [facturesImpayees, filterType, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 3 Cartes KPI Supérieures */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {/* Fret Transitaire */}
        <div style={{
          background: THEME.bg.card,
          border: '1.5px solid #E8985E',
          borderRadius: 10,
          padding: '12px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#E8985E', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Truck size={14} />
              FRET TRANSITAIRE DÛ
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, background: '#FEF3EB', color: '#E8985E', padding: '1px 6px', borderRadius: 4 }}>
              {stats.nbFretImpayes} facture{stats.nbFretImpayes > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: stats.totalFretDu > 0 ? '#E8985E' : '#3F7A5C' }}>
            {stats.totalFretDu.toLocaleString('fr-FR')} Ar
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            Frais de transport maritime / aérien à régler
          </div>
        </div>

        {/* Achats Chine */}
        <div style={{
          background: THEME.bg.card,
          border: '1px solid #EAE2D4',
          borderRadius: 10,
          padding: '12px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3D5A6C', display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShoppingCart size={14} />
              ACHATS CHINE RESTANTS
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, background: '#F5EFE6', color: '#3D5A6C', padding: '1px 6px', borderRadius: 4 }}>
              {stats.nbMarchandiseImpayes} achat{stats.nbMarchandiseImpayes > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: stats.totalMarchandiseDu > 0 ? '#3D5A6C' : '#3F7A5C' }}>
            {stats.totalMarchandiseDu.toLocaleString('fr-FR')} Ar
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            Soldes restant dus aux fournisseurs Chine
          </div>
        </div>

        {/* Total Dettes Fournisseurs & Fret */}
        <div style={{
          background: THEME.bg.card,
          border: '1px solid #EAE2D4',
          borderRadius: 10,
          padding: '12px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#B5532A', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={14} />
              TOTAL DETTES FOURNISSEURS & FRET
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: stats.totalGlobalDu > 0 ? '#B5532A' : '#3F7A5C' }}>
            {stats.totalGlobalDu.toLocaleString('fr-FR')} Ar
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            {stats.nbTotal} colis / commande{stats.nbTotal > 1 ? 's' : ''} en attente de règlement
          </div>
        </div>
      </div>

      {/* Barre d'outils (Recherche, Filtres, Mode d'affichage) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.base}`,
        borderRadius: 10,
        padding: '10px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 260 }}>
          <div className="relative" style={{ width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: THEME.text.muted }} />
            <input
              type="text"
              placeholder="Rechercher produit, transitaire, tracking…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 28, height: 32, fontSize: 12 } as any}
            />
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                fontSize: 11.5,
                fontWeight: filterType === 'all' ? 700 : 500,
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${filterType === 'all' ? '#3D5A6C' : '#EAE2D4'}`,
                background: filterType === 'all' ? '#F5EFE6' : '#FFFFFF',
                color: filterType === 'all' ? '#3D5A6C' : '#5E584E',
                cursor: 'pointer',
              }}
            >
              Tous ({stats.nbTotal})
            </button>
            <button
              onClick={() => setFilterType('fret')}
              style={{
                fontSize: 11.5,
                fontWeight: filterType === 'fret' ? 700 : 500,
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${filterType === 'fret' ? '#E8985E' : '#EAE2D4'}`,
                background: filterType === 'fret' ? '#FEF3EB' : '#FFFFFF',
                color: filterType === 'fret' ? '#E8985E' : '#5E584E',
                cursor: 'pointer',
              }}
            >
              🚢 Fret Transitaire ({stats.nbFretImpayes})
            </button>
            <button
              onClick={() => setFilterType('marchandise')}
              style={{
                fontSize: 11.5,
                fontWeight: filterType === 'marchandise' ? 700 : 500,
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${filterType === 'marchandise' ? '#3D5A6C' : '#EAE2D4'}`,
                background: filterType === 'marchandise' ? '#F5EFE6' : '#FFFFFF',
                color: filterType === 'marchandise' ? '#3D5A6C' : '#5E584E',
                cursor: 'pointer',
              }}
            >
              🛒 Achat Chine ({stats.nbMarchandiseImpayes})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setViewMode('commande')}
            style={{
              fontSize: 11.5,
              fontWeight: viewMode === 'commande' ? 700 : 500,
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${viewMode === 'commande' ? '#3D5A6C' : '#EAE2D4'}`,
              background: viewMode === 'commande' ? '#3D5A6C' : '#FFFFFF',
              color: viewMode === 'commande' ? '#FFFFFF' : '#5E584E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Package size={13} />
            <span>Par Facture / Colis</span>
          </button>
          <button
            onClick={() => setViewMode('tiers')}
            style={{
              fontSize: 11.5,
              fontWeight: viewMode === 'tiers' ? 700 : 500,
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${viewMode === 'tiers' ? '#3D5A6C' : '#EAE2D4'}`,
              background: viewMode === 'tiers' ? '#3D5A6C' : '#FFFFFF',
              color: viewMode === 'tiers' ? '#FFFFFF' : '#5E584E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Users size={13} />
            <span>Par Transitaire / Fournisseur</span>
          </button>
        </div>
      </div>

      {/* Vue 1 : Liste par Facture / Colis */}
      {viewMode === 'commande' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {facturesFiltrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', background: '#FFFFFF', borderRadius: 10, border: '1px solid #EAE2D4', color: '#3F7A5C' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#3F7A5C' }} />
              <div style={{ fontWeight: 700, fontSize: 14 }}>Toutes les factures sélectionnées sont à jour et entièrement réglées !</div>
            </div>
          ) : (
            facturesFiltrees.map((item: any) => {
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE2D4',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#26333D' }}>
                          {item.productNom}
                        </span>
                        <span style={{ fontSize: 11, background: '#F5EFE6', color: '#3D5A6C', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                          x{item.qty} pcs
                        </span>
                        <span style={{ fontSize: 10.5, color: '#8A8375', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Calendar size={11} />
                          {formatDateJMA(item.dateAchat || item.date)}
                        </span>
                        {item.tracking && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#FAF7F2', color: '#5E584E', border: '1px solid #EAE2D4' }}>
                            📦 {item.tracking}
                          </span>
                        )}
                        {item.transitaireNom && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#FEF3EB', color: '#E8985E', border: '1px solid #FADCC8' }}>
                            🚛 {item.transitaireNom} ({item.modeExpedition || 'Transport'})
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 11.5, color: '#8A8375', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span>Fournisseur: <strong>{item.fournisseurNom}</strong></span>
                        {item.dateEnEntrepot && <span>· Entrepôt Chine : <strong>{formatDateJMA(item.dateEnEntrepot)}</strong></span>}
                      </div>
                    </div>

                    {/* Bloc Montants & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Section Fret */}
                      {item.totalFret > 0 && (
                        <div style={{
                          background: item.resteFret > 0 ? '#FEF3EB' : '#EBF4EC',
                          border: `1px solid ${item.resteFret > 0 ? '#FADCC8' : '#C4DEC0'}`,
                          borderRadius: 8,
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: item.resteFret > 0 ? '#E8985E' : '#3F7A5C' }}>
                              🚢 FRET TRANSITAIRE
                            </div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: item.resteFret > 0 ? '#B5532A' : '#1B6A3E' }}>
                              {item.resteFret > 0 ? `Reste : ${item.resteFret.toLocaleString('fr-FR')} Ar` : 'Fret Réglé ✅'}
                            </div>
                            <div style={{ fontSize: 10, color: '#8A8375' }}>
                              Total: {item.totalFret.toLocaleString('fr-FR')} Ar
                            </div>
                          </div>

                          {item.resteFret > 0 && onPayerFret && (
                            <button
                              onClick={() => onPayerFret(item.id)}
                              style={{
                                ...primaryBtn,
                                height: 30,
                                fontSize: 11.5,
                                padding: '0 10px',
                                background: '#E8985E',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer',
                              }}
                              title="Régler le fret dû pour cette facture"
                            >
                              <Truck size={13} />
                              <span>Payer Fret</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Section Marchandise */}
                      {item.totalMarchandise > 0 && (
                        <div style={{
                          background: item.resteMarchandise > 0 ? '#F5EFE6' : '#EBF4EC',
                          border: `1px solid ${item.resteMarchandise > 0 ? '#EAE2D4' : '#C4DEC0'}`,
                          borderRadius: 8,
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: item.resteMarchandise > 0 ? '#3D5A6C' : '#3F7A5C' }}>
                              🛒 ACHAT CHINE
                            </div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: item.resteMarchandise > 0 ? '#3D5A6C' : '#1B6A3E' }}>
                              {item.resteMarchandise > 0 ? `Reste : ${item.resteMarchandise.toLocaleString('fr-FR')} Ar` : 'Marchandise Réglée ✅'}
                            </div>
                            <div style={{ fontSize: 10, color: '#8A8375' }}>
                              Total: {item.totalMarchandise.toLocaleString('fr-FR')} Ar
                            </div>
                          </div>

                          {item.resteMarchandise > 0 && onPayerAchat && (
                            <button
                              onClick={() => onPayerAchat(item.id)}
                              style={{
                                ...primaryBtn,
                                height: 30,
                                fontSize: 11.5,
                                padding: '0 10px',
                                background: '#3D5A6C',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer',
                              }}
                              title="Régler la marchandise Chine"
                            >
                              <ShoppingCart size={13} />
                              <span>Payer Achat</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vue 2 : Regroupement par Transitaire / Fournisseur */}
      {viewMode === 'tiers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {dettesParTiers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px 10px', background: '#FFFFFF', borderRadius: 10, border: '1px solid #EAE2D4', color: '#3F7A5C' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#3F7A5C' }} />
              <div style={{ fontWeight: 700, fontSize: 14 }}>Aucun solde restant dû aux transitaires et fournisseurs !</div>
            </div>
          ) : (
            dettesParTiers.map((tiers) => {
              const isTrans = tiers.type === 'transitaire';
              return (
                <div
                  key={tiers.id}
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${isTrans ? '#FADCC8' : '#EAE2D4'}`,
                    borderRadius: 10,
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isTrans ? '#E8985E' : '#3D5A6C', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {isTrans ? <Truck size={14} /> : <ShoppingCart size={14} />}
                        {isTrans ? 'TRANSITAIRE / FRET' : 'FOURNISSEUR CHINE'}
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, background: '#F8F6F0', color: '#5E584E', padding: '1px 6px', borderRadius: 4 }}>
                        {tiers.nbCommandes} facture{tiers.nbCommandes > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 800, color: '#26333D', margin: '2px 0 6px 0' }}>
                      {tiers.nom}
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800, color: isTrans ? '#E8985E' : '#3D5A6C' }}>
                      {tiers.totalDu.toLocaleString('fr-FR')} Ar
                    </div>
                    <div style={{ fontSize: 11, color: '#8A8375' }}>
                      Solde total restant à payer
                    </div>
                  </div>

                  <div>
                    {isTrans && onPayerTransitaireGroup && (
                      <button
                        onClick={() => onPayerTransitaireGroup(tiers.id, tiers.commandeIds)}
                        style={{
                          ...primaryBtn,
                          width: '100%',
                          height: 34,
                          fontSize: 12,
                          background: '#E8985E',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <Truck size={14} />
                        <span>Régler le Fret ({tiers.totalDu.toLocaleString('fr-FR')} Ar)</span>
                      </button>
                    )}

                    {!isTrans && onPayerFournisseurGroup && (
                      <button
                        onClick={() => onPayerFournisseurGroup(tiers.id, tiers.commandeIds)}
                        style={{
                          ...primaryBtn,
                          width: '100%',
                          height: 34,
                          fontSize: 12,
                          background: '#3D5A6C',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <ShoppingCart size={14} />
                        <span>Régler les Achats ({tiers.totalDu.toLocaleString('fr-FR')} Ar)</span>
                      </button>
                    )}
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
