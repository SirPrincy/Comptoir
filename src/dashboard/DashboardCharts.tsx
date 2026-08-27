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
} from 'recharts';
import { THEME, CHART_COLORS as COLORS } from '../colors';
import { Card, cardTitle, tooltipStyle } from '../ui';
import { DashboardWidgetsConfig } from './dashboardConfig';

interface DashboardChartsProps {
  widgetsConfig: DashboardWidgetsConfig;
  parProduit: Array<{ name: string; ca: number }>;
  parCategorie: Array<{ name: string; value: number }>;
}

const DashboardCharts = memo(function DashboardCharts({
  widgetsConfig: w,
  parProduit,
  parCategorie,
}: DashboardChartsProps) {
  if (!w.top_produits && !w.repartition_categories) {
    return null;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: (w.top_produits && w.repartition_categories) ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
        gap: 14,
      }}
    >
      {w.top_produits && (
        <Card>
          <div style={cardTitle as any}>Top Produits par Chiffre d'Affaires</div>
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
          <div style={cardTitle as any}>Répartition des Ventes par Catégorie</div>
          {parCategorie.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
              Aucune catégorie vendue pour l'instant.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={parCategorie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
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
  );
});

export default DashboardCharts;
