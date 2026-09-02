import React, { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { THEME, CHART_COLORS as COLORS } from '../colors';
import { Card, cardTitle, tooltipStyle } from '../ui';
import { DashboardWidgetsConfig } from './dashboardConfig';

interface DashboardChartsProps {
  widgetsConfig: DashboardWidgetsConfig;
  parProduit: Array<{ name: string; ca: number }>;
  parCategorie: Array<{ name: string; value: number }>;
  financialSummary?: {
    caTotal: number;
    totalAchatsChine: number;
    totalFret: number;
    chargesOperationnelles: number;
    beneficeNet: number;
  };
  rentabiliteParProduit?: any[];
  commandesEnTransitList?: any[];
}

const DashboardCharts = memo(function DashboardCharts({
  widgetsConfig: w,
  parProduit,
  parCategorie,
  financialSummary,
  rentabiliteParProduit = [],
  commandesEnTransitList = [],
}: DashboardChartsProps) {
  // Prep data for Flux Financiers
  const fluxData = financialSummary ? [
    { category: 'Chiffre d’Affaires', montant: financialSummary.caTotal, fill: '#10B981' },
    { category: 'Achats Chine', montant: financialSummary.totalAchatsChine, fill: '#E8985E' },
    { category: 'Fret & Douane', montant: financialSummary.totalFret, fill: '#2563EB' },
    { category: 'Charges Opér.', montant: financialSummary.chargesOperationnelles, fill: '#EF4444' },
    { category: 'Bénéfice Net', montant: Math.max(0, financialSummary.beneficeNet), fill: '#059669' },
  ] : [];

  // Prep data for Sourcing Costs
  const sourcingData = rentabiliteParProduit
    .slice(0, 6)
    .map((p) => ({
      name: p.nom,
      coutAchat: p.prixMoyenAchat,
      prixVente: p.prixMoyenVente,
      marge: p.margeUnitaire,
    }));

  // Prep data for Logistics Transit
  const transitStatusMap: Record<string, number> = {};
  commandesEnTransitList.forEach((c) => {
    const st = c.statut || 'En Transit';
    transitStatusMap[st] = (transitStatusMap[st] || 0) + 1;
  });
  const logisticsData = Object.entries(transitStatusMap).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* GRAPHIQUE 1 : FLUX FINANCIERS & TRÉSORERIE */}
      {w.flux_finances && financialSummary && (
        <Card>
          <div style={cardTitle as any}>💰 Flux Financiers & Synthèse d'Activité</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fluxData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: THEME.text.primary }} />
              <YAxis tick={{ fontSize: 11, fill: THEME.text.muted }} hide />
              <Tooltip
                formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="montant" radius={[6, 6, 0, 0]}>
                {fluxData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* RANGÉE DE DEUX GRAPHIQUES : TOP PRODUITS & CATÉGORIES */}
      {(w.top_produits || w.repartition_categories) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: (w.top_produits && w.repartition_categories) ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
            gap: 14,
          }}
        >
          {w.top_produits && (
            <Card>
              <div style={cardTitle as any}>🏆 Top Produits par Chiffre d'Affaires</div>
              {parProduit.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
                  Aucune vente enregistrée pour afficher les produits.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={parProduit} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: THEME.text.primary }}
                    />
                    <Tooltip
                      formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="ca" fill="#E8985E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          {w.repartition_categories && (
            <Card>
              <div style={cardTitle as any}>📊 Répartition des Ventes par Catégorie</div>
              {parCategorie.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
                  Aucune catégorie vendue pour l'instant.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={parCategorie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {parCategorie.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {parCategorie.map((c, i) => (
                      <div
                        key={c.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11.5,
                          color: THEME.text.muted,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                        {c.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      )}

      {/* RANGÉE DE DEUX GRAPHIQUES : SOURCING COSTS & LOGISTICS TRANSIT */}
      {(w.sourcing_costs || w.logistics_transit) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: (w.sourcing_costs && w.logistics_transit) ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
            gap: 14,
          }}
        >
          {w.sourcing_costs && (
            <Card>
              <div style={cardTitle as any}>🛒 Sourcing : Comparatif Prix d’Achat vs Prix de Vente</div>
              {sourcingData.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
                  Aucune donnée de sourcing disponible.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sourcingData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: THEME.text.primary }} />
                    <YAxis tick={{ fontSize: 10, fill: THEME.text.muted }} hide />
                    <Tooltip
                      formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                      contentStyle={tooltipStyle}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar name="Coût Achat / Revient" dataKey="coutAchat" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar name="Prix Vente Moyen" dataKey="prixVente" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          {w.logistics_transit && (
            <Card>
              <div style={cardTitle as any}>🚢 Logistique : Statut des Commandes en Transit</div>
              {logisticsData.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: THEME.accent.green, fontSize: 12 }}>
                  ✨ Aucun colis actuellement bloqué en transit !
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={logisticsData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {logisticsData.map((_, i) => (
                          <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v} commande(s)`} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {logisticsData.map((c, i) => (
                      <div
                        key={c.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11.5,
                          color: THEME.text.muted,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: COLORS[(i + 2) % COLORS.length],
                          }}
                        />
                        {c.name} ({c.value})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
});

export default DashboardCharts;

