import React from 'react';
import { Compass, ShoppingCart, Truck, Package, Zap, ArrowRight, TrendingUp, Coins, CheckCircle, ShieldAlert } from 'lucide-react';
import { Card } from '../ui';
import { THEME } from '../colors';

interface FunnelPipelineProps {
  sourcing?: any[];
  commandes?: any[];
  products?: any[];
  ventes?: any[];
  changes?: any[];
  onNavigateTab?: (tab: string) => void;
}

export default function FunnelPipeline({
  sourcing = [],
  commandes = [],
  products = [],
  ventes = [],
  changes = [],
  onNavigateTab,
}: FunnelPipelineProps) {
  // 1. Sourcing
  const totalSourcing = sourcing.length;
  const sourcingValide = sourcing.filter(s => s.statut === 'Validé').length;
  const sourcingEnCours = sourcing.filter(s => s.statut === 'En cours' || s.statut === 'À explorer').length;

  // 2. Achats & Commandes
  const totalCommandes = commandes.length;
  const totalRmbCommandes = commandes.reduce((acc, c) => {
    const pu = Number(c.puDevise) || 0;
    const qty = Number(c.qty) || 1;
    const fret = Number(c.fraisLivraisonChineDevise) || 0;
    return acc + (pu * qty) + fret;
  }, 0);

  // 3. Logistique & Transit
  const enTransitCount = commandes.filter(c => ['En livraison', 'En entrepôt', 'En expédition'].includes(c.statut)).length;
  const arrivesCount = commandes.filter(c => c.statut === 'Arrivé').length;

  // 4. Stock commercialisable
  const totalPiecesStock = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const valeurStockPrixRevient = products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.prixAchat) || 0)), 0);
  const valeurStockPrixVente = products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.prixVente) || 0)), 0);

  // 5. Ventes
  const totalVentesCount = ventes.length;
  const totalPiecesVendues = ventes.reduce((acc, v) => acc + (Number(v.qty) || 1), 0);
  const totalCaEncaisse = ventes.reduce((acc, v) => acc + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0), 0);

  // Conversion calculs
  const conversionSourcingToAchat = totalSourcing > 0 ? Math.round((totalCommandes / totalSourcing) * 100) : 0;
  const conversionStockToVente = (totalPiecesStock + totalPiecesVendues) > 0
    ? Math.round((totalPiecesVendues / (totalPiecesStock + totalPiecesVendues)) * 100)
    : 0;

  const stages = [
    {
      id: 'sourcing',
      num: '1',
      title: 'Sourcing & Ideation',
      subtitle: 'Exploration 1688 / Taobao',
      icon: Compass,
      color: THEME.accent.orange,
      bgColor: THEME.bg.surface,
      borderColor: THEME.border.strong,
      metrics: [
        { label: 'Pistes en étude', val: `${totalSourcing} produit${totalSourcing > 1 ? 's' : ''}` },
        { label: 'Validés pour achat', val: `${sourcingValide} prêt${sourcingValide > 1 ? 's' : ''}` },
      ],
      detail: `${sourcingEnCours} en cours d'analyse`,
      tabName: 'sourcing',
    },
    {
      id: 'achat',
      num: '2',
      title: 'Achat & Change RMB',
      subtitle: 'Commandes & Appro RMB',
      icon: ShoppingCart,
      color: THEME.accent.green,
      bgColor: THEME.bg.soft,
      borderColor: THEME.border.strong,
      metrics: [
        { label: 'Commandes passées', val: `${totalCommandes} commande${totalCommandes > 1 ? 's' : ''}` },
        { label: 'Volume total', val: `${totalRmbCommandes.toLocaleString('fr-FR')} ¥` },
      ],
      detail: `Conversion sourcing : ${conversionSourcingToAchat}%`,
      tabName: 'achats',
    },
    {
      id: 'logistique',
      num: '3',
      title: 'Logistique & Transit',
      subtitle: 'Transport Chine ➔ Mada',
      icon: Truck,
      color: THEME.accent.primary,
      bgColor: THEME.bg.surface,
      borderColor: THEME.border.strong,
      metrics: [
        { label: 'En transit maritime/air', val: `${enTransitCount} lot${enTransitCount > 1 ? 's' : ''}` },
        { label: 'Arrivés à Tanà', val: `${arrivesCount} lot${arrivesCount > 1 ? 's' : ''}` },
      ],
      detail: enTransitCount > 0 ? `⚡ ${enTransitCount} lot(s) en route` : 'Aucun lot bloqué',
      tabName: 'logistique',
    },
    {
      id: 'stock',
      num: '4',
      title: 'Stock Prêt à Vendre',
      subtitle: 'Entrepôt & Boutique',
      icon: Package,
      color: THEME.accent.orange,
      bgColor: THEME.bg.soft,
      borderColor: THEME.border.strong,
      metrics: [
        { label: 'Pièces disponibles', val: `${totalPiecesStock} pièce${totalPiecesStock > 1 ? 's' : ''}` },
        { label: 'Valeur marchande', val: `${valeurStockPrixVente.toLocaleString('fr-FR')} Ar` },
      ],
      detail: `Cout de revient : ${valeurStockPrixRevient.toLocaleString('fr-FR')} Ar`,
      tabName: 'stock',
    },
    {
      id: 'vente',
      num: '5',
      title: 'Vente & Encaissement',
      subtitle: 'Clients & Marge Réelle',
      icon: Zap,
      color: THEME.accent.green,
      bgColor: THEME.bg.surface,
      borderColor: THEME.border.strong,
      metrics: [
        { label: 'Ventes effectuées', val: `${totalVentesCount} vente${totalVentesCount > 1 ? 's' : ''}` },
        { label: 'CA Total Encaissé', val: `${totalCaEncaisse.toLocaleString('fr-FR')} Ar` },
      ],
      detail: `Taux d'écoulement stock : ${conversionStockToVente}%`,
      tabName: 'vente',
    },
  ];

  return (
    <Card style={{ padding: 16 }}>
      {/* Entête du Funnel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: THEME.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color={THEME.accent.green} />
            <span>Funnel & Pipeline Métier : Du Sourcing à la Vente</span>
          </h3>
          <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>
            Suivi étape par étape de la transformation d'un produit depuis la Chine jusqu'à l'encaissement à Madagascar.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11.5, background: THEME.bg.base, border: '1px solid ' + THEME.border.base, padding: '4px 10px', borderRadius: 6, color: THEME.text.secondary }}>
            Taux d'écoulement stock : <strong>{conversionStockToVente}%</strong>
          </div>
        </div>
      </div>

      {/* Visualiseur de Pipeline à 5 Étapes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        {stages.map((st, idx) => {
          const IconComponent = st.icon;
          return (
            <div
              key={st.id}
              onClick={() => onNavigateTab && onNavigateTab(st.tabName)}
              style={{
                background: st.bgColor,
                border: `1.5px solid ${st.borderColor}`,
                borderRadius: 10,
                padding: 12,
                cursor: onNavigateTab ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: st.color,
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {st.num}
                  </span>
                  <IconComponent size={18} color={st.color} />
                </div>

                <div style={{ fontSize: 13.5, fontWeight: 800, color: THEME.text.primary, marginTop: 8 }}>
                  {st.title}
                </div>
                <div style={{ fontSize: 11, color: THEME.text.muted, marginBottom: 10 }}>
                  {st.subtitle}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {st.metrics.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                      <span style={{ color: THEME.text.secondary }}>{m.label} :</span>
                      <strong style={{ color: THEME.text.primary }}>{m.val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${st.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: st.color }}>
                  {st.detail}
                </span>
                {idx < stages.length - 1 && (
                  <ArrowRight size={13} color={st.color} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
