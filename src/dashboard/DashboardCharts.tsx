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
import { FONTS } from '../fonts';
import { Card, cardTitle, tooltipStyle, RADIUS, SHADOWS } from '../ui';
import { DashboardWidgetsConfig } from './dashboardConfig';
import { TrendingUp, PieChart as PieIcon, ArrowRight, DollarSign, Package, ShoppingCart } from 'lucide-react';

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
    { category: 'Chiffre d’Affaires', montant: financialSummary.caTotal, fill: THEME.brand.emerald, code: 'CA' },
    { category: 'Achats Chine', montant: financialSummary.totalAchatsChine, fill: THEME.brand.amber, code: 'ACHAT' },
    { category: 'Fret & Douane', montant: financialSummary.totalFret, fill: THEME.brand.navy, code: 'FRET' },
    { category: 'Charges Opér.', montant: financialSummary.chargesOperationnelles, fill: THEME.brand.terracotta, code: 'CHARGES' },
    { category: 'Bénéfice Net', montant: Math.max(0, financialSummary.beneficeNet), fill: '#15803D', code: 'NET' },
  ] : [];

  // Top 5 products for quick table breakdown
  const top5Produits = parProduit.slice(0, 5);
  const totalTopCa = parProduit.reduce((s, p) => s + p.ca, 0);

  // Total Categories volume
  const totalCatValue = parCategorie.reduce((s, c) => s + c.value, 0);

  // Prep data for Sourcing Costs
  const sourcingData = rentabiliteParProduit
    .slice(0, 6)
    .map((p) => ({
      name: p.nom,
      coutAchat: p.prixMoyenAchat,
      prixVente: p.prixMoyenVente,
      marge: p.margeUnitaire,
      tauxMarge: p.tauxMargePct,
    }));

  // Prep data for Logistics Transit
  const transitStatusMap: Record<string, number> = {};
  commandesEnTransitList.forEach((c) => {
    const st = c.statut || 'En Transit';
    transitStatusMap[st] = (transitStatusMap[st] || 0) + 1;
  });
  const logisticsData = Object.entries(transitStatusMap).map(([name, value]) => ({ name, value }));
  const totalColis = logisticsData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* MODULE 1 : FLUX FINANCIERS & GRAND LIVRE D'EXPLOITATION (Asymétrique 65% / 35%) */}
      {w.flux_finances && financialSummary && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: RADIUS.control, background: `${THEME.accent.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={15} color={THEME.accent.green} />
              </div>
              <div>
                <div style={{ ...cardTitle as any, margin: 0, fontSize: 13.5 }}>Flux Financiers & Compte de Résultat Simplifié</div>
                <div style={{ fontSize: 11, color: THEME.text.muted }}>Décomposition en cascade du chiffre d'affaires jusqu'au résultat net</div>
              </div>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: THEME.accent.green, background: THEME.bg.surface, padding: '3px 8px', borderRadius: RADIUS.tag, border: `1px solid ${THEME.border.base}` }}>
              Marge Nette: {financialSummary.caTotal > 0 ? `${((financialSummary.beneficeNet / financialSummary.caTotal) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 14, alignItems: 'center' }}>
            {/* Graphique Barres Horizontales / Verticales compactes */}
            <div style={{ minWidth: 0, height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fluxData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} vertical={false} />
                  <XAxis dataKey="code" tick={{ fontSize: 10.5, fill: THEME.text.primary, fontFamily: FONTS.mono }} />
                  <YAxis tick={{ fontSize: 10, fill: THEME.text.muted, fontFamily: FONTS.mono }} />
                  <Tooltip
                    formatter={(v: any) => [`${Number(v).toLocaleString('fr-FR')} Ar`, 'Montant']}
                    labelFormatter={(label) => fluxData.find(f => f.code === label)?.category || label}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="montant" radius={[4, 4, 0, 0]}>
                    {fluxData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Grand Livre / Tableau Synthétique Dense */}
            <div style={{ background: THEME.bg.surface, border: `1px solid ${THEME.border.base}`, borderRadius: RADIUS.item, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, textTransform: 'uppercase', color: THEME.text.muted, fontWeight: 700, letterSpacing: '0.08em', borderBottom: `1px solid ${THEME.border.base}`, paddingBottom: 4 }}>
                Ventilation des Postes Comptables
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: THEME.text.primary, fontWeight: 600 }}>(+) Chiffre d'Affaires</span>
                <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: THEME.accent.green }}>
                  {financialSummary.caTotal.toLocaleString('fr-FR')} Ar
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: THEME.text.secondary }}>(-) Sourcing Chine</span>
                <span style={{ fontFamily: FONTS.mono, color: THEME.accent.orange }}>
                  -{financialSummary.totalAchatsChine.toLocaleString('fr-FR')} Ar
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: THEME.text.secondary }}>(-) Fret & Douanes</span>
                <span style={{ fontFamily: FONTS.mono, color: THEME.accent.primary }}>
                  -{financialSummary.totalFret.toLocaleString('fr-FR')} Ar
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: THEME.text.secondary }}>(-) Charges d'Exploitation</span>
                <span style={{ fontFamily: FONTS.mono, color: THEME.accent.danger }}>
                  -{financialSummary.chargesOperationnelles.toLocaleString('fr-FR')} Ar
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, borderTop: `1px dashed ${THEME.border.strong}`, paddingTop: 6, marginTop: 2 }}>
                <strong style={{ color: THEME.text.primary }}>(=) Bénéfice Net Réel</strong>
                <strong style={{ fontFamily: FONTS.mono, color: financialSummary.beneficeNet >= 0 ? THEME.accent.green : THEME.accent.danger }}>
                  {financialSummary.beneficeNet >= 0 ? '+' : ''}{financialSummary.beneficeNet.toLocaleString('fr-FR')} Ar
                </strong>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* MODULE 2 : TOP PRODUITS (62%) & RÉPARTITION CATÉGORIES (38%) */}
      {(w.top_produits || w.repartition_categories) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: (w.top_produits && w.repartition_categories) ? 'minmax(0, 1.55fr) minmax(0, 1fr)' : '1fr',
            gap: 12,
          }}
        >
          {w.top_produits && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Package size={14} color={THEME.accent.orange} />
                  <span style={{ ...cardTitle as any, margin: 0, fontSize: 13 }}>Top 5 Produits par CA</span>
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: THEME.text.muted }}>
                  Total: {totalTopCa.toLocaleString('fr-FR')} Ar
                </span>
              </div>

              {parProduit.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: THEME.text.muted, fontSize: 12, background: THEME.bg.surface, borderRadius: RADIUS.item }}>
                  Aucune vente enregistrée pour afficher les produits.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 130 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={top5Produits} layout="vertical" margin={{ left: -15, right: 10, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={110}
                          tick={{ fontSize: 10.5, fill: THEME.text.primary }}
                        />
                        <Tooltip
                          formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                          contentStyle={tooltipStyle}
                        />
                        <Bar dataKey="ca" fill={THEME.accent.orange} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Micro-table pro de ranking */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: THEME.bg.surface, padding: '6px 8px', borderRadius: RADIUS.item, border: `1px solid ${THEME.border.base}` }}>
                    {top5Produits.slice(0, 3).map((p, idx) => {
                      const share = totalTopCa > 0 ? ((p.ca / totalTopCa) * 100).toFixed(0) : '0';
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <span style={{ fontFamily: FONTS.mono, fontSize: 9.5, fontWeight: 700, color: THEME.text.muted, width: 14 }}>#{idx + 1}</span>
                            <span style={{ color: THEME.text.primary, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: THEME.text.primary }}>{p.ca.toLocaleString('fr-FR')} Ar</span>
                            <span style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: THEME.text.muted, background: THEME.bg.card, padding: '1px 4px', borderRadius: RADIUS.tag, border: `1px solid ${THEME.border.base}` }}>{share}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {w.repartition_categories && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <PieIcon size={14} color={THEME.accent.primary} />
                  <span style={{ ...cardTitle as any, margin: 0, fontSize: 13 }}>Mix Catégories</span>
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: THEME.text.muted }}>
                  {parCategorie.length} catégories
                </span>
              </div>

              {parCategorie.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: THEME.text.muted, fontSize: 12, background: THEME.bg.surface, borderRadius: RADIUS.item }}>
                  Aucune catégorie enregistrée.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 125 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={parCategorie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={36}
                          outerRadius={58}
                          paddingAngle={3}
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
                  </div>

                  {/* Micro list data */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 85, overflowY: 'auto' }}>
                    {parCategorie.map((c, i) => {
                      const share = totalCatValue > 0 ? ((c.value / totalCatValue) * 100).toFixed(0) : '0';
                      return (
                        <div
                          key={c.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 10.5,
                            color: THEME.text.secondary,
                            padding: '2px 4px',
                            background: THEME.bg.surface,
                            borderRadius: RADIUS.micro,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                          </div>
                          <span style={{ fontFamily: FONTS.mono, fontWeight: 600, color: THEME.text.primary, flexShrink: 0 }}>{share}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* MODULE 3 : SOURCING COSTS (60%) & LOGISTICS TRANSIT (40%) */}
      {(w.sourcing_costs || w.logistics_transit) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: (w.sourcing_costs && w.logistics_transit) ? 'minmax(0, 1.5fr) minmax(0, 1fr)' : '1fr',
            gap: 12,
          }}
        >
          {w.sourcing_costs && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <ShoppingCart size={14} color={THEME.accent.green} />
                  <span style={{ ...cardTitle as any, margin: 0, fontSize: 13 }}>Sourcing : Prix d’Achat vs Prix de Vente</span>
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: THEME.text.muted }}>
                  Marge unitaire nette
                </span>
              </div>

              {sourcingData.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: THEME.text.muted, fontSize: 12 }}>
                  Aucune donnée de sourcing disponible.
                </div>
              ) : (
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourcingData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} />
                      <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: THEME.text.primary }} />
                      <YAxis tick={{ fontSize: 9.5, fill: THEME.text.muted, fontFamily: FONTS.mono }} />
                      <Tooltip
                        formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} Ar`}
                        contentStyle={tooltipStyle}
                      />
                      <Legend wrapperStyle={{ fontSize: 10.5, paddingTop: 2 }} />
                      <Bar name="Coût Revient (Achat + Fret)" dataKey="coutAchat" fill={THEME.brand.amber} radius={[3, 3, 0, 0]} />
                      <Bar name="Prix Vente Public" dataKey="prixVente" fill={THEME.brand.emerald} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          )}

          {w.logistics_transit && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Package size={14} color={THEME.accent.primary} />
                  <span style={{ ...cardTitle as any, margin: 0, fontSize: 13 }}>Transit & Logistique</span>
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, fontWeight: 700, color: totalColis > 0 ? THEME.accent.primary : THEME.accent.green }}>
                  {totalColis} colis actifs
                </span>
              </div>

              {logisticsData.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: THEME.accent.green, fontSize: 12, background: THEME.bg.surface, borderRadius: RADIUS.item }}>
                  ✨ Aucun colis bloqué en transit.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={logisticsData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={30}
                          outerRadius={52}
                          paddingAngle={3}
                        >
                          {logisticsData.map((_, i) => (
                            <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => `${v} commande(s)`} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {logisticsData.map((c, i) => (
                      <div
                        key={c.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 10.5,
                          color: THEME.text.secondary,
                          background: THEME.bg.surface,
                          padding: '3px 6px',
                          borderRadius: RADIUS.tag,
                          border: `1px solid ${THEME.border.base}`,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 2, background: COLORS[(i + 2) % COLORS.length] }} />
                        <span>{c.name}: <strong>{c.value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
});

export default DashboardCharts;


