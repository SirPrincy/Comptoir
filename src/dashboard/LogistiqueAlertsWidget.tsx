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
import { Card, ghostBtn } from '../ui';

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {/* Colonne 1 : Alertes Stock Faible */}
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={15} color={THEME.accent.danger} />
            <span>Ruptures & Stocks Critiques ({stockAlertesList.length})</span>
          </div>
          {stockAlertesList.length === 0 ? (
            <div style={{ fontSize: 12, color: THEME.accent.green, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
              <CheckCircle2 size={15} />
              <span>Aucun produit en rupture. Vos stocks sont à niveau.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
              {stockAlertesList.slice(0, 5).map((p: any) => {
                const isRupture = (Number(p.stock) || 0) <= 0;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: isRupture ? '#FEF2F2' : '#FFFBEB',
                      border: `1px solid ${isRupture ? '#FEE2E2' : '#FEF3C7'}`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isRupture ? '#991B1B' : '#92400E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.nom} {p.couleur ? `(${p.couleur})` : ''}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#6B7280' }}>
                        Stock actuel : <strong>{p.stock || 0} pcs</strong> (Seuil : {p.seuilAlerte || 2})
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
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '3px 7px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        Commander
                      </button>
                    )}
                  </div>
                );
              })}
              {stockAlertesList.length > 5 && (
                <div style={{ fontSize: 11, color: THEME.text.muted, textAlign: 'center', paddingTop: 4 }}>
                  + {stockAlertesList.length - 5} autre(s) article(s) à réapprovisionner
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colonne 2 : Suivi Colis en Transit */}
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ship size={15} color={THEME.accent.primary} />
            <span>Colis & Fret en Transit ({commandesEnTransitList.length})</span>
          </div>
          {commandesEnTransitList.length === 0 ? (
            <div style={{ fontSize: 12, color: THEME.text.muted, padding: '8px 0' }}>
              Aucune expédition active en cours d'acheminement.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
              {commandesEnTransitList.slice(0, 5).map((c: any) => {
                const pr = products.find((p: any) => p.id === c.productId);
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: THEME.bg.base,
                      border: `1px solid ${THEME.border.base}`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pr ? pr.nom : 'Article'} ({c.qty} pcs)
                      </div>
                      <div style={{ fontSize: 10.5, color: THEME.text.muted }}>
                        {c.transitaire || 'Transitaire'} · {c.typeFret || 'Maritime'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: THEME.bg.soft,
                        color: THEME.accent.primary,
                      }}
                    >
                      {c.statut}
                    </span>
                  </div>
                );
              })}
              {commandesEnTransitList.length > 5 && (
                <div style={{ fontSize: 11, color: THEME.text.muted, textAlign: 'center', paddingTop: 4 }}>
                  + {commandesEnTransitList.length - 5} autre(s) colis en route
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colonne 3 : Pertes & Régularisations de Stock */}
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={15} color={statsPertes.totalPertesAr > 0 ? THEME.accent.danger : THEME.accent.green} />
              <span>Pertes & Casse ({statsPertes.quantitePerdue} pcs)</span>
            </div>
            {statsPertes.totalPertesAr > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, color: THEME.accent.danger }}>
                -{statsPertes.totalPertesAr.toLocaleString('fr-FR')} Ar
              </span>
            )}
          </div>

          {statsPertes.ajustements.length === 0 ? (
            <div style={{ fontSize: 12, color: THEME.accent.green, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
              <CheckCircle2 size={15} />
              <span>Aucune perte ou casse enregistrée sur le stock.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
              {statsPertes.ajustements.slice(0, 5).map((adj: any) => {
                const delta = Number(adj.delta) || 0;
                const isLoss = delta < 0;
                const pCost = getProductCostBreakdown(adj.productId).coutRevient;
                const valTotale = adj.valeurTotaleAr !== undefined && adj.valeurTotaleAr !== null && !isNaN(Number(adj.valeurTotaleAr))
                  ? Number(adj.valeurTotaleAr)
                  : (adj.valeurUnitaireAr !== undefined && adj.valeurUnitaireAr !== null && !isNaN(Number(adj.valeurUnitaireAr)))
                  ? Math.abs(delta) * Number(adj.valeurUnitaireAr)
                  : (Math.abs(delta) * (pCost || 0));

                return (
                  <div
                    key={adj.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: isLoss ? '#FEF2F2' : '#F0FDF4',
                      border: `1px solid ${isLoss ? '#FEE2E2' : '#DCFCE7'}`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isLoss ? '#991B1B' : '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {adj.productNom || 'Article'} ({delta > 0 ? `+${delta}` : delta} pcs)
                      </div>
                      <div style={{ fontSize: 10.5, color: '#6B7280' }}>
                        {adj.motif || 'Ajustement'} · {adj.date && !isNaN(new Date(adj.date).getTime()) ? new Date(adj.date).toLocaleDateString('fr-FR') : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: isLoss ? '#DC2626' : '#16A34A',
                        }}
                      >
                        {isLoss ? '-' : '+'}{valTotale.toLocaleString('fr-FR')} Ar
                      </span>
                    </div>
                  </div>
                );
              })}
              {statsPertes.ajustements.length > 5 && (
                <div style={{ fontSize: 11, color: THEME.text.muted, textAlign: 'center', paddingTop: 4 }}>
                  + {statsPertes.ajustements.length - 5} autre(s) ajustement(s)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

export default LogistiqueAlertsWidget;
