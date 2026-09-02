import React, { memo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Ship,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { THEME } from '../colors';
import { Card, ghostBtn, RADIUS } from '../ui';

interface LogistiqueAlertsWidgetProps {
  stockAlertesList: any[];
  commandesEnTransitList: any[];
  statsPertes: {
    totalPertesAr: number;
    quantitePerdue: number;
    ajustements: any[];
  };
  products: any[];
  getProductCostBreakdown: (productId: string) => { coutRevient: number };
  onNavigateTab?: (tab: string) => void;
}

const LogistiqueAlertsWidget = memo(function LogistiqueAlertsWidget({
  stockAlertesList,
  commandesEnTransitList,
  statsPertes,
  products,
  getProductCostBreakdown,
  onNavigateTab,
}: LogistiqueAlertsWidgetProps) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.accent.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: THEME.text.primary }}>Alertes Opérationnelles & Logistiques</div>
            <div style={{ fontSize: 12, color: THEME.text.muted }}>Points d'attention nécessitant une action prioritaire</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onNavigateTab && (
            <>
              <button
                type="button"
                onClick={() => onNavigateTab('stock')}
                style={{ ...ghostBtn, fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <span>Gérer le stock</span>
                <ChevronRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('achat')}
                style={{ ...ghostBtn, fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <span>Suivi Achats</span>
                <ChevronRight size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* GRILLE BENTO ASYMÉTRIQUE : Ruptures Critiques (58%) vs Suivi Transit & Pertes (42%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 14 }}>
        {/* Volet Principal (Grand) : Alertes Ruptures & Réapprovisionnements */}
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: RADIUS.item, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: RADIUS.micro, background: `${THEME.accent.danger}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.accent.danger }}>
                  <AlertTriangle size={13} strokeWidth={2.4} />
                </div>
                <span>Ruptures & Stocks Critiques</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: RADIUS.pill, background: stockAlertesList.length > 0 ? `${THEME.accent.danger}14` : `${THEME.brand.emerald}14`, color: stockAlertesList.length > 0 ? THEME.accent.danger : THEME.brand.emerald }}>
                {stockAlertesList.length} référence(s)
              </span>
            </div>

            {stockAlertesList.length === 0 ? (
              <div style={{ fontSize: 12, color: THEME.brand.emerald, display: 'flex', alignItems: 'center', gap: 8, padding: '24px 12px', background: THEME.bg.surface, borderRadius: RADIUS.micro }}>
                <CheckCircle2 size={16} />
                <span>Aucun produit en rupture. Vos stocks sont parfaitement approvisionnés.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {stockAlertesList.map((p: any) => {
                  const isRupture = (Number(p.stock) || 0) <= 0;
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: RADIUS.micro,
                        background: isRupture ? '#FEF2F2' : '#FFFBEB',
                        border: `1px solid ${isRupture ? '#FEE2E2' : '#FEF3C7'}`,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: isRupture ? '#991B1B' : '#92400E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.nom} {p.couleur ? `(${p.couleur})` : ''}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                          Stock actuel : <strong style={{ color: isRupture ? '#DC2626' : '#D97706' }}>{p.stock || 0} pcs</strong> (Seuil minimal : {p.seuilAlerte || 2})
                        </div>
                      </div>
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('achat')}
                          style={{
                            background: '#FFF',
                            border: `1px solid ${isRupture ? '#FCA5A5' : '#FCD34D'}`,
                            color: isRupture ? '#DC2626' : '#D97706',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: RADIUS.pill,
                            cursor: 'pointer',
                            marginLeft: 10,
                            flexShrink: 0,
                          }}
                        >
                          Commander
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Volet Secondaire (2 cartes empilées) : Transit + Casse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Carte 1 : Colis & Fret en Transit */}
          <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: RADIUS.item, padding: '14px 16px', flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ship size={14} color={THEME.brand.blue} />
                <span>Colis & Expéditions en Transit</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: THEME.brand.blue, background: `${THEME.brand.blue}10`, padding: '1px 7px', borderRadius: RADIUS.pill }}>
                {commandesEnTransitList.length} en route
              </span>
            </div>

            {commandesEnTransitList.length === 0 ? (
              <div style={{ fontSize: 11.5, color: THEME.text.muted, padding: '10px 0' }}>
                Aucune expédition active en cours d'acheminement.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto' }}>
                {commandesEnTransitList.slice(0, 4).map((c: any) => {
                  const pr = products.find((p: any) => p.id === c.productId);
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: RADIUS.micro,
                        background: THEME.bg.surface,
                        border: `1px solid ${THEME.border.base}`,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pr ? pr.nom : 'Article'} ({c.qty} pcs)
                        </div>
                        <div style={{ fontSize: 10, color: THEME.text.muted }}>
                          {c.transitaire || 'Transitaire'} · {c.typeFret || 'Maritime'}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: RADIUS.pill,
                          background: `${THEME.brand.blue}14`,
                          color: THEME.brand.blue,
                        }}
                      >
                        {c.statut}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Carte 2 : Pertes & Régularisations */}
          <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: RADIUS.item, padding: '14px 16px', flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} color={statsPertes.totalPertesAr > 0 ? THEME.accent.danger : THEME.brand.emerald} />
                <span>Pertes & Casse Déclassée</span>
              </div>
              {statsPertes.totalPertesAr > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: THEME.accent.danger, background: `${THEME.accent.danger}12`, padding: '1px 7px', borderRadius: RADIUS.pill }}>
                  -{statsPertes.totalPertesAr.toLocaleString('fr-FR')} Ar
                </span>
              )}
            </div>

            {statsPertes.ajustements.length === 0 ? (
              <div style={{ fontSize: 11.5, color: THEME.brand.emerald, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
                <CheckCircle2 size={13} />
                <span>Aucune perte ou casse constatée.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 100, overflowY: 'auto' }}>
                {statsPertes.ajustements.slice(0, 3).map((adj: any) => {
                  const delta = Number(adj.delta) || 0;
                  const isLoss = delta < 0;
                  return (
                    <div
                      key={adj.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        borderRadius: RADIUS.micro,
                        background: isLoss ? '#FEF2F2' : '#F0FDF4',
                        border: `1px solid ${isLoss ? '#FEE2E2' : '#DCFCE7'}`,
                        fontSize: 11,
                      }}
                    >
                      <span style={{ color: isLoss ? '#991B1B' : '#166534', fontWeight: 600 }}>
                        {adj.productNom || 'Article'} ({delta > 0 ? `+${delta}` : delta} pcs)
                      </span>
                      <span style={{ color: '#6B7280', fontSize: 10 }}>{adj.motif || 'Ajustement'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

export default LogistiqueAlertsWidget;
