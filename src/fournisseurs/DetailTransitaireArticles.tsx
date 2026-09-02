import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Ship, 
  Plane, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  Award,
  Filter,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { THEME } from '../colors';
import { formatDateJMA } from '../achat/components/AchatListe';
import { parseTarifNumber } from '../logistique/logistiqueUtils';

export interface DetailTransitaireArticlesProps {
  transitaire: any;
  commandes: any[];
  products: any[];
  initialMode?: 'all' | 'Aérien' | 'Maritime';
  isModal?: boolean;
  onClose?: () => void;
  onNavigateToLogistique?: (commandeId?: string) => void;
}

export interface ArticleTransitItem {
  commandeId: string;
  productId: string;
  productNom: string;
  photo?: string;
  qty: number;
  mode: 'Aérien' | 'Maritime';
  typeEnvoi: string;
  tracking: string;
  statut: string;
  dateEnvoiStr?: string;
  dateArriveeStr?: string;
  dateEtaStr?: string;
  dureeReelleJours: number | null;
  dureeTheoriqueJours: number;
  sourceTheorique: string;
  ecartJours: number | null;
  statutTransit: 'arrive' | 'en_cours' | 'en_attente';
  labelEcart: string;
  colorEcart: 'green' | 'orange' | 'red' | 'blue' | 'gray';
  poidsKg?: number;
  volumeM3?: number;
  fraisTransport?: number;
  commandeRaw: any;
}

export default function DetailTransitaireArticles({
  transitaire,
  commandes = [],
  products = [],
  initialMode = 'all',
  isModal = false,
  onClose,
  onNavigateToLogistique,
}: DetailTransitaireArticlesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<'all' | 'Aérien' | 'Maritime'>(initialMode);
  const [selectedStatutFilter, setSelectedStatutFilter] = useState<'all' | 'arrives' | 'en_cours' | 'retards'>('all');

  // 1. Filtrage des commandes assignées à ce transitaire
  const rawArticles = useMemo<ArticleTransitItem[]>(() => {
    if (!transitaire?.id) return [];

    const matchedCmds = (commandes || []).filter((c: any) => {
      return (
        c.transitaireId === transitaire.id ||
        (c.fournisseurId === transitaire.id && transitaire.plateforme === 'Transitaire / Fret')
      );
    });

    return matchedCmds.map((c: any) => {
      const product = products.find((p: any) => p.id === c.productId);
      const productNom = product?.nom || c.productNom || `Article #${(c.productId || c.id).slice(0, 6)}`;
      const photo = product?.photo || product?.image;
      const qty = Number(c.qty || 1);
      const mode: 'Aérien' | 'Maritime' = c.modeExpedition === 'Aérien' ? 'Aérien' : 'Maritime';
      const typeEnvoi = c.typeEnvoi || 'Normal';
      const tracking = c.numeroTracking || c.trackingNumber || c.id;
      const statut = c.statut || (c.dateArrivee ? 'Arrivé' : 'En expédition');

      const dateEnvoiStr = c.dateEnExpedition || c.dateAchat || c.dateCommande;
      const dateArriveeStr = c.dateArrivee;
      const dateEtaStr = c.dateEtaArrivee;

      const hasEnvoi = Boolean(c.dateEnExpedition);
      const startTs = dateEnvoiStr ? new Date(dateEnvoiStr).getTime() : NaN;
      const hasArrivee = Boolean(c.dateArrivee);
      const endTs = hasArrivee ? new Date(c.dateArrivee).getTime() : NaN;

      // Calcul Délai Réel
      let dureeReelleJours: number | null = null;
      let statutTransit: 'arrive' | 'en_cours' | 'en_attente' = 'en_attente';

      if (hasArrivee && !isNaN(endTs) && !isNaN(startTs) && endTs >= startTs) {
        dureeReelleJours = Math.max(1, Math.round((endTs - startTs) / (1000 * 3600 * 24)));
        statutTransit = 'arrive';
      } else if (hasEnvoi && !hasArrivee && !isNaN(startTs)) {
        dureeReelleJours = Math.max(0, Math.round((Date.now() - startTs) / (1000 * 3600 * 24)));
        statutTransit = 'en_cours';
      } else if (c.statut === 'Arrivé' && !isNaN(endTs) && !isNaN(startTs) && endTs >= startTs) {
        dureeReelleJours = Math.max(1, Math.round((endTs - startTs) / (1000 * 3600 * 24)));
        statutTransit = 'arrive';
      } else {
        statutTransit = 'en_attente';
      }

      // Calcul Délai Théorique
      let dureeTheoriqueJours: number = mode === 'Aérien' ? 15 : 60;
      let sourceTheorique = `Standard ${mode} (${dureeTheoriqueJours}j)`;

      if (c.dateEtaArrivee && !isNaN(startTs)) {
        const etaTs = new Date(c.dateEtaArrivee).getTime();
        if (!isNaN(etaTs) && etaTs > startTs) {
          dureeTheoriqueJours = Math.max(1, Math.round((etaTs - startTs) / (1000 * 3600 * 24)));
          sourceTheorique = 'ETA estimée';
        }
      } else {
        const matchingTarif = (transitaire.tarifs || []).find(
          (t: any) => t.mode === mode && (!c.typeEnvoi || t.typeEnvoi?.toLowerCase() === c.typeEnvoi?.toLowerCase())
        );
        if (matchingTarif?.delai) {
          const parsed = parseTarifNumber(matchingTarif.delai);
          if (parsed && parsed > 0) {
            dureeTheoriqueJours = Math.round(parsed);
            sourceTheorique = `Tarif (${matchingTarif.delai})`;
          }
        }
      }

      // Comparaison Réel vs Théorique
      let ecartJours: number | null = null;
      let labelEcart = '—';
      let colorEcart: 'green' | 'orange' | 'red' | 'blue' | 'gray' = 'gray';

      if (statutTransit === 'arrive' && dureeReelleJours !== null) {
        ecartJours = dureeReelleJours - dureeTheoriqueJours;
        if (ecartJours < 0) {
          labelEcart = `${Math.abs(ecartJours)}j d'avance`;
          colorEcart = 'green';
        } else if (ecartJours === 0) {
          labelEcart = 'Ponctuel (délai respecté)';
          colorEcart = 'green';
        } else if (ecartJours <= 3) {
          labelEcart = `+${ecartJours}j de retard`;
          colorEcart = 'orange';
        } else {
          labelEcart = `+${ecartJours}j de retard`;
          colorEcart = 'red';
        }
      } else if (statutTransit === 'en_cours' && dureeReelleJours !== null) {
        ecartJours = dureeReelleJours - dureeTheoriqueJours;
        if (dureeReelleJours > dureeTheoriqueJours) {
          labelEcart = `Dépassé (+${dureeReelleJours - dureeTheoriqueJours}j)`;
          colorEcart = 'orange';
        } else {
          const reste = dureeTheoriqueJours - dureeReelleJours;
          labelEcart = `En transit (J+${dureeReelleJours} · reste ~${reste}j)`;
          colorEcart = 'blue';
        }
      } else {
        labelEcart = 'En attente d’envoi';
        colorEcart = 'gray';
      }

      return {
        commandeId: c.id,
        productId: c.productId,
        productNom,
        photo,
        qty,
        mode,
        typeEnvoi,
        tracking,
        statut,
        dateEnvoiStr,
        dateArriveeStr,
        dateEtaStr,
        dureeReelleJours,
        dureeTheoriqueJours,
        sourceTheorique,
        ecartJours,
        statutTransit,
        labelEcart,
        colorEcart,
        poidsKg: c.poidsKg ? Number(c.poidsKg) : undefined,
        volumeM3: c.volumeM3 ? Number(c.volumeM3) : undefined,
        fraisTransport: c.fraisTransport ? Number(c.fraisTransport) : undefined,
        commandeRaw: c,
      };
    });
  }, [transitaire, commandes, products]);

  // 2. Filtrage interactif (Recherche, Mode, Statut)
  const filteredArticles = useMemo(() => {
    return rawArticles.filter(item => {
      // Filtre mode
      if (selectedModeFilter !== 'all' && item.mode !== selectedModeFilter) {
        return false;
      }

      // Filtre statut
      if (selectedStatutFilter === 'arrives' && item.statutTransit !== 'arrive') {
        return false;
      }
      if (selectedStatutFilter === 'en_cours' && item.statutTransit !== 'en_cours') {
        return false;
      }
      if (selectedStatutFilter === 'retards') {
        const isLate = (item.statutTransit === 'arrive' && (item.ecartJours || 0) > 0) ||
                       (item.statutTransit === 'en_cours' && (item.ecartJours || 0) > 0);
        if (!isLate) return false;
      }

      // Recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNom = item.productNom.toLowerCase().includes(q);
        const matchTracking = item.tracking.toLowerCase().includes(q);
        const matchType = item.typeEnvoi.toLowerCase().includes(q);
        if (!matchNom && !matchTracking && !matchType) return false;
      }

      return true;
    });
  }, [rawArticles, selectedModeFilter, selectedStatutFilter, searchQuery]);

  // 3. Synthèse globale pour ce transitaire
  const stats = useMemo(() => {
    const totalCmds = rawArticles.length;
    const totalPieces = rawArticles.reduce((acc, a) => acc + a.qty, 0);

    const arrives = rawArticles.filter(a => a.statutTransit === 'arrive' && a.dureeReelleJours !== null);
    const enCours = rawArticles.filter(a => a.statutTransit === 'en_cours');

    let delaiReelMoyen = 0;
    let delaiTheoriqueMoyen = 0;
    let ponctuels = 0;

    if (arrives.length > 0) {
      const sumReel = arrives.reduce((acc, a) => acc + (a.dureeReelleJours || 0), 0);
      const sumTheo = arrives.reduce((acc, a) => acc + a.dureeTheoriqueJours, 0);
      delaiReelMoyen = Math.round(sumReel / arrives.length);
      delaiTheoriqueMoyen = Math.round(sumTheo / arrives.length);
      ponctuels = arrives.filter(a => (a.ecartJours || 0) <= 0).length;
    }

    const ecartMoyen = arrives.length > 0 ? delaiReelMoyen - delaiTheoriqueMoyen : 0;
    const tauxPonctualite = arrives.length > 0 ? Math.round((ponctuels / arrives.length) * 100) : null;

    return {
      totalCmds,
      totalPieces,
      nbArrives: arrives.length,
      nbEnCours: enCours.length,
      delaiReelMoyen,
      delaiTheoriqueMoyen,
      ecartMoyen,
      tauxPonctualite,
    };
  }, [rawArticles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Bandeau En-tête Transitaire & KPIs comparatifs Réel vs Théorique */}
      <div
        style={{
          background: '#FAF7F2',
          border: '1px solid #EAE2D4',
          borderRadius: 10,
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#26333D' }}>
                {transitaire.nom}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, background: '#E0EFE6', color: '#2C5E43', padding: '2px 8px', borderRadius: 6 }}>
                Transitaire Fret
              </span>
              {transitaire.contact && (
                <span style={{ fontSize: 11.5, color: '#8A8375' }}>
                  · {transitaire.contact}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: '#736B5E', marginTop: 2 }}>
              Détail par article acheminé : calcul précis du temps écoulé entre la date de départ (Chine) et la date d'arrivée effective (Madagascar).
            </div>
          </div>

          {/* Grille des tarifs résumée */}
          {transitaire.tarifs && transitaire.tarifs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 420 }}>
              {transitaire.tarifs.map((t: any) => (
                <span
                  key={t.id}
                  style={{
                    fontSize: 10.5,
                    background: '#FFFFFF',
                    border: '1px solid #D8E6DE',
                    borderRadius: 4,
                    padding: '2px 6px',
                    color: '#2C5E43',
                    fontWeight: 600,
                  }}
                >
                  {t.mode === 'Aérien' ? '✈️' : '🚢'} {t.typeEnvoi}: {t.prix} {t.delai ? `(${t.delai})` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 4 Cartes d'indicateurs de performance (KPIs) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {/* KPI 1 : Volume articles */}
          <div style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#8A8375', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Package size={13} color="#5E584E" />
              <span>Articles & Colis</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#26333D', marginTop: 2 }}>
              {stats.totalPieces} <span style={{ fontSize: 11, fontWeight: 500, color: '#736B5E' }}>pcs</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#736B5E', marginTop: 1 }}>
              {stats.totalCmds} colis ({stats.nbArrives} arrivés · {stats.nbEnCours} en mer/vol)
            </div>
          </div>

          {/* KPI 2 : Temps Réel Moyen */}
          <div style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#8A8375', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color="#2C5E43" />
              <span>Temps Réel Moyen</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2C5E43', marginTop: 2 }}>
              {stats.nbArrives > 0 ? `${stats.delaiReelMoyen} jours` : '—'}
            </div>
            <div style={{ fontSize: 10.5, color: '#736B5E', marginTop: 1 }}>
              {stats.nbArrives > 0 ? `Constaté sur ${stats.nbArrives} livraison(s)` : 'Aucune livraison terminée'}
            </div>
          </div>

          {/* KPI 3 : Temps Théorique Prévu */}
          <div style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#8A8375', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} color="#3D5A6C" />
              <span>Temps Théorique Moyen</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#3D5A6C', marginTop: 2 }}>
              {stats.nbArrives > 0 ? `${stats.delaiTheoriqueMoyen} jours` : '—'}
            </div>
            <div style={{ fontSize: 10.5, color: '#736B5E', marginTop: 1 }}>
              Contrats & estimations ETA
            </div>
          </div>

          {/* KPI 4 : Écart Réel vs Théorique & Ponctualité */}
          <div
            style={{
              background: stats.nbArrives > 0 && stats.ecartMoyen > 2 ? '#FFF5F2' : '#F2FAF5',
              border: `1px solid ${stats.nbArrives > 0 && stats.ecartMoyen > 2 ? '#FACFC2' : '#C2E0D1'}`,
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: 11, color: stats.nbArrives > 0 && stats.ecartMoyen > 2 ? '#B5532A' : '#1B6A3E', display: 'flex', alignItems: 'center', gap: 4 }}>
              {stats.nbArrives > 0 && stats.ecartMoyen > 2 ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
              <span>Écart Moyen / Fiabilité</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: stats.nbArrives > 0 && stats.ecartMoyen > 2 ? '#B5532A' : '#1B6A3E', marginTop: 2 }}>
              {stats.nbArrives > 0 ? (
                stats.ecartMoyen > 0 ? `+${stats.ecartMoyen}j retard` : stats.ecartMoyen < 0 ? `${Math.abs(stats.ecartMoyen)}j avance` : 'Ponctuel'
              ) : 'En attente'}
            </div>
            <div style={{ fontSize: 10.5, color: '#736B5E', marginTop: 1 }}>
              {stats.tauxPonctualite !== null ? `${stats.tauxPonctualite}% respect des délais` : 'Données en cours'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barre de Filtres & Recherche rapide */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        {/* Recherche textuelle */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={14} color="#8A8375" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Filtrer par article, tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 32,
              paddingLeft: 30,
              paddingRight: 10,
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid #EAE2D4',
              background: '#FFFFFF',
              color: '#26333D',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Filtre par Mode (Aérien / Maritime) */}
        <div style={{ display: 'flex', gap: 4, background: '#F4EFE6', padding: 2, borderRadius: 6 }}>
          <button
            type="button"
            onClick={() => setSelectedModeFilter('all')}
            style={{
              fontSize: 11,
              fontWeight: selectedModeFilter === 'all' ? 700 : 500,
              padding: '3px 8px',
              borderRadius: 4,
              border: 'none',
              background: selectedModeFilter === 'all' ? '#FFFFFF' : 'transparent',
              color: selectedModeFilter === 'all' ? '#2C5E43' : '#736B5E',
              cursor: 'pointer',
              boxShadow: selectedModeFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Tous les modes
          </button>
          <button
            type="button"
            onClick={() => setSelectedModeFilter('Aérien')}
            style={{
              fontSize: 11,
              fontWeight: selectedModeFilter === 'Aérien' ? 700 : 500,
              padding: '3px 8px',
              borderRadius: 4,
              border: 'none',
              background: selectedModeFilter === 'Aérien' ? '#FFFFFF' : 'transparent',
              color: selectedModeFilter === 'Aérien' ? '#2C5E43' : '#736B5E',
              cursor: 'pointer',
              boxShadow: selectedModeFilter === 'Aérien' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            ✈️ Aérien
          </button>
          <button
            type="button"
            onClick={() => setSelectedModeFilter('Maritime')}
            style={{
              fontSize: 11,
              fontWeight: selectedModeFilter === 'Maritime' ? 700 : 500,
              padding: '3px 8px',
              borderRadius: 4,
              border: 'none',
              background: selectedModeFilter === 'Maritime' ? '#FFFFFF' : 'transparent',
              color: selectedModeFilter === 'Maritime' ? '#2C5E43' : '#736B5E',
              cursor: 'pointer',
              boxShadow: selectedModeFilter === 'Maritime' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            🚢 Maritime
          </button>
        </div>

        {/* Filtre par Statut (Arrivés, En cours, Retards) */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'all', label: 'Tous les colis' },
            { id: 'arrives', label: '✅ Arrivés' },
            { id: 'en_cours', label: '⏳ En mer/vol' },
            { id: 'retards', label: '⚠️ Retards' },
          ].map((st) => {
            const active = selectedStatutFilter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatutFilter(st.id as any)}
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  padding: '3px 9px',
                  borderRadius: 14,
                  border: `1px solid ${active ? '#2C5E43' : '#EAE2D4'}`,
                  background: active ? '#2C5E43' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#5E584E',
                  cursor: 'pointer',
                }}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tableau des Articles et comparaison des Délais (Réel vs Théorique) */}
      {filteredArticles.length === 0 ? (
        <div
          style={{
            background: '#FAF7F2',
            border: '1px dashed #D8CFC0',
            borderRadius: 8,
            padding: '24px 16px',
            textAlign: 'center',
            color: '#8A8375',
            fontSize: 12.5,
          }}
        >
          <Package size={28} color="#B0A898" style={{ margin: '0 auto 8px auto', display: 'block' }} />
          <div style={{ fontWeight: 600, color: '#5E584E' }}>
            Aucun article ne correspond aux filtres actuels.
          </div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            {rawArticles.length === 0
              ? `Aucune commande n'a encore été confiée à ${transitaire.nom}. Dès qu'un colis lui est attribué dans le module logistique, son historique d'acheminement apparaîtra ici.`
              : 'Essayez de réinitialiser la recherche ou les filtres de statut.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #EAE2D4', borderRadius: 8, background: '#FFFFFF' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #EAE2D4', color: '#5E584E' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700, minWidth: 150 }}>Article / Produit</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, minWidth: 100 }}>Colis / Tracking</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, minWidth: 90 }}>Mode & Type</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, minWidth: 130 }}>Envoi ➔ Arrivée</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, minWidth: 110, background: '#F2F8F4', color: '#1B4D33' }}>
                  ⏱️ Temps Réel
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, minWidth: 110 }}>
                  🎯 Temps Théorique
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, minWidth: 180, borderLeft: '1px solid #EAE2D4' }}>
                  Écart Réel vs Théorique
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((item, idx) => {
                const isArrived = item.statutTransit === 'arrive';
                const isInFlight = item.statutTransit === 'en_cours';

                // Calcul jauge visuelle comparant le réel au théorique
                const maxRef = Math.max(item.dureeTheoriqueJours, item.dureeReelleJours || 0, 1) * 1.25;
                const percentTheo = Math.min(100, Math.round((item.dureeTheoriqueJours / maxRef) * 100));
                const percentReel = item.dureeReelleJours !== null ? Math.min(100, Math.round((item.dureeReelleJours / maxRef) * 100)) : 0;

                let barColor = '#2C5E43'; // Vert par défaut
                if (item.colorEcart === 'orange') barColor = '#D97706';
                if (item.colorEcart === 'red') barColor = '#DC2626';
                if (item.colorEcart === 'blue') barColor = '#2563EB';

                return (
                  <tr
                    key={item.commandeId}
                    style={{
                      borderBottom: idx === filteredArticles.length - 1 ? 'none' : '1px solid #F0ECE1',
                      background: idx % 2 === 0 ? '#FFFFFF' : '#FDFAF5',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    {/* 1. Article & Quantité */}
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt=""
                            style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', border: '1px solid #EAE2D4', flexShrink: 0 }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 4,
                              background: '#F0ECE1',
                              color: '#736B5E',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Package size={14} />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#26333D', wordBreak: 'break-word', lineHeight: 1.2 }}>
                            {item.productNom}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#8A8375', marginTop: 2 }}>
                            <strong style={{ color: '#5E584E' }}>{item.qty} pcs</strong>
                            {item.poidsKg ? ` · ${item.poidsKg} kg` : ''}
                            {item.volumeM3 ? ` · ${item.volumeM3} m³` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Colis / Tracking */}
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'monospace',
                          background: '#F4EFE6',
                          color: '#5E584E',
                          padding: '2px 5px',
                          borderRadius: 4,
                          fontWeight: 600,
                          display: 'inline-block',
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.tracking}
                      >
                        {item.tracking}
                      </span>
                      <div style={{ fontSize: 10, color: '#8A8375', marginTop: 2 }}>
                        Statut : <strong>{item.statut}</strong>
                      </div>
                    </td>

                    {/* 3. Mode & Type */}
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12 }}>{item.mode === 'Aérien' ? '✈️' : '🚢'}</span>
                        <span style={{ fontWeight: 600, color: '#26333D' }}>{item.mode}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#736B5E' }}>
                        {item.typeEnvoi}
                      </div>
                    </td>

                    {/* 4. Envoi ➔ Arrivée */}
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 11, color: '#5E584E' }}>
                        <span>Départ : </span>
                        <strong>{formatDateJMA(item.dateEnvoiStr)}</strong>
                      </div>
                      <div style={{ fontSize: 11, marginTop: 2, color: isArrived ? '#1B6A3E' : '#2B5A84' }}>
                        <span>{isArrived ? 'Arrivé : ' : 'ETA : '}</span>
                        <strong>{formatDateJMA(isArrived ? item.dateArriveeStr : item.dateEtaStr)}</strong>
                      </div>
                    </td>

                    {/* 5. Temps Réel */}
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle', background: '#F8FAF9' }}>
                      {item.dureeReelleJours !== null ? (
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: isArrived ? '#1B6A3E' : '#2B5A84',
                            }}
                          >
                            {item.dureeReelleJours} {item.dureeReelleJours > 1 ? 'jours' : 'jour'}
                          </div>
                          <div style={{ fontSize: 10, color: '#736B5E' }}>
                            {isArrived ? 'Réel constaté' : `J+${item.dureeReelleJours} en cours`}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#8A8375', fontStyle: 'italic' }}>
                          Attente envoi
                        </span>
                      )}
                    </td>

                    {/* 6. Temps Théorique */}
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#3D5A6C' }}>
                        {item.dureeTheoriqueJours} jours
                      </div>
                      <div style={{ fontSize: 10, color: '#8A8375' }}>
                        {item.sourceTheorique}
                      </div>
                    </td>

                    {/* 7. Écart Réel vs Théorique & Jauge Visuelle */}
                    <td style={{ padding: '8px 10px', verticalAlign: 'middle', borderLeft: '1px solid #F0ECE1' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Pastille de statut de ponctualité */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 12,
                              background:
                                item.colorEcart === 'green' ? '#E9F5ED' :
                                item.colorEcart === 'orange' ? '#FFF3E8' :
                                item.colorEcart === 'red' ? '#FEECEB' :
                                item.colorEcart === 'blue' ? '#EBF3FA' : '#F4EFE6',
                              color:
                                item.colorEcart === 'green' ? '#1B6A3E' :
                                item.colorEcart === 'orange' ? '#B5532A' :
                                item.colorEcart === 'red' ? '#C24A3F' :
                                item.colorEcart === 'blue' ? '#2B5A84' : '#736B5E',
                              border: `1px solid ${
                                item.colorEcart === 'green' ? '#C2E0D1' :
                                item.colorEcart === 'orange' ? '#FAD1B5' :
                                item.colorEcart === 'red' ? '#F7BEBA' :
                                item.colorEcart === 'blue' ? '#C5DDF2' : '#E0D8CA'
                              }`,
                            }}
                          >
                            {item.labelEcart}
                          </span>

                          {onNavigateToLogistique && (
                            <button
                              type="button"
                              onClick={() => onNavigateToLogistique(item.commandeId)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#5E584E',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Ouvrir le suivi logistique de ce colis"
                            >
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>

                        {/* Barre visuelle comparative : Temps Réel (barre) vs Temps Théorique (curseur vertical) */}
                        {item.dureeReelleJours !== null && (
                          <div style={{ marginTop: 2 }}>
                            <div
                              style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: 180,
                                height: 8,
                                background: '#EAE6DC',
                                borderRadius: 4,
                                overflow: 'visible',
                              }}
                              title={`Temps Réel: ${item.dureeReelleJours}j / Théorique: ${item.dureeTheoriqueJours}j`}
                            >
                              {/* Remplissage temps réel */}
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${percentReel}%`,
                                  background: barColor,
                                  borderRadius: 4,
                                  transition: 'width 0.3s ease',
                                }}
                              />

                              {/* Repère vertical pour le temps théorique */}
                              <div
                                style={{
                                  position: 'absolute',
                                  left: `${percentTheo}%`,
                                  top: -2,
                                  bottom: -2,
                                  width: 2,
                                  background: '#26333D',
                                  boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                                  zIndex: 2,
                                }}
                                title={`Cible théorique : ${item.dureeTheoriqueJours} jours`}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#8A8375', width: '100%', maxWidth: 180, marginTop: 2 }}>
                              <span>0j</span>
                              <span style={{ fontWeight: 600, color: '#3D5A6C' }}>Cible : {item.dureeTheoriqueJours}j</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
