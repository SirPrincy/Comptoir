import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  Layers,
  HelpCircle,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { THEME } from '../colors';
import { Card, Stat, tooltipStyle, ghostBtn } from '../ui';
import {
  calculerProjectionTresorerie,
  TresorerieProjectionResult,
} from './tresorerieProjectionUtils';

interface ProjectionTresorerieProps {
  mouvements?: any[];
  ventes?: any[];
  commandes?: any[];
  chargesFixes?: any[];
  paiements?: any[];
  products?: any[];
  fournisseurs?: any[];
}

export default function ProjectionTresorerie({
  mouvements = [],
  ventes = [],
  commandes = [],
  chargesFixes = [],
  paiements = [],
  products = [],
  fournisseurs = [],
}: ProjectionTresorerieProps) {
  const [croissanceVentes, setCroissanceVentes] = useState<number>(0); // -20% à +50%

  const dataProjection: TresorerieProjectionResult = useMemo(() => {
    return calculerProjectionTresorerie(
      mouvements,
      ventes,
      commandes,
      chargesFixes,
      croissanceVentes,
      paiements,
      products,
      fournisseurs
    );
  }, [mouvements, ventes, commandes, chargesFixes, croissanceVentes, paiements, products, fournisseurs]);

  // Données pour le graphique Recharts
  const chartData = useMemo(() => {
    return [
      {
        name: 'Actuel (M0)',
        Solde: dataProjection.soldeActuel,
        Encaissements: 0,
        Décaissements: 0,
        isInitial: true,
      },
      ...dataProjection.projections.map((p) => ({
        name: p.moisNom,
        Solde: p.soldeFinal,
        Encaissements: p.encaissements.total,
        Décaissements: p.decaissements.total,
        FluxNet: p.fluxNet,
        isInitial: false,
      })),
    ];
  }, [dataProjection]);

  const p = dataProjection;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. CARTE EN-TÊTE AVEC RÉSUMÉ ET STATUT M+3 */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: THEME.bg.chip,
                color: THEME.accent.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Coins size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: THEME.text.primary }}>
                Projection de Trésorerie à 3 Mois (M+1, M+2, M+3)
              </div>
              <div style={{ fontSize: 12, color: THEME.text.muted }}>
                Estimation prévisionnelle des flux nets basée sur les ventes passées, créances et engagements commandes
              </div>
            </div>
          </div>

          {/* Ajustement scénario de croissance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: THEME.bg.soft,
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${THEME.border.base}`,
            }}
          >
            <Sliders size={14} color={THEME.accent.primary} />
            <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.secondary }}>
              Hypothèse ventes :
            </span>
            <select
              value={croissanceVentes}
              onChange={(e) => setCroissanceVentes(Number(e.target.value))}
              style={{
                background: THEME.bg.card,
                border: `1px solid ${THEME.border.base}`,
                color: THEME.text.primary,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                padding: '3px 8px',
                cursor: 'pointer',
              }}
            >
              <option value="-20">Pessimiste (-20%)</option>
              <option value="-10">Prudent (-10%)</option>
              <option value="0">Tendance stable (0%)</option>
              <option value="10">Optimiste (+10%)</option>
              <option value="25">Forte croissance (+25%)</option>
            </select>
          </div>
        </div>

        {/* 4 Indicateurs Clés de la Projection */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 10,
          }}
        >
          <div
            style={{
              background: THEME.bg.card,
              border: `1px solid ${THEME.border.base}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>
              Trésorerie Actuelle (M0)
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: p.soldeActuel >= 0 ? THEME.accent.green : THEME.accent.danger,
                marginTop: 3,
              }}
            >
              {p.soldeActuel.toLocaleString('fr-FR')} Ar
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
              Caisse & comptes bancaires
            </div>
          </div>

          <div
            style={{
              background: THEME.bg.card,
              border: `1px solid ${THEME.border.base}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>
              Rythme Ventes / Mois
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: THEME.accent.primary,
                marginTop: 3,
              }}
            >
              {p.moyenneVentesMensuelle.toLocaleString('fr-FR')} Ar
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
              Moyenne mensuelle estimée
            </div>
          </div>

          <div
            style={{
              background: THEME.bg.card,
              border: `1px solid ${THEME.border.base}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>
              Engagements Fournisseurs
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: p.dettesFournisseursTotal > 0 ? THEME.accent.orange : THEME.text.primary,
                marginTop: 3,
              }}
            >
              {p.dettesFournisseursTotal.toLocaleString('fr-FR')} Ar
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
              Dont {p.commandesEngageesTotal.toLocaleString('fr-FR')} Ar en cours
            </div>
          </div>

          <div
            style={{
              background:
                p.statutM3 === 'positif'
                  ? '#ECFDF5'
                  : p.statutM3 === 'alerte'
                  ? '#FFFBEB'
                  : '#FEF2F2',
              border: `1px solid ${
                p.statutM3 === 'positif'
                  ? '#A7F3D0'
                  : p.statutM3 === 'alerte'
                  ? '#FDE68A'
                  : '#FECACA'
              }`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color:
                  p.statutM3 === 'positif'
                    ? '#065F46'
                    : p.statutM3 === 'alerte'
                    ? '#92400E'
                    : '#991B1B',
              }}
            >
              Solde Projeté à M+3
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color:
                  p.statutM3 === 'positif'
                    ? '#059669'
                    : p.statutM3 === 'alerte'
                    ? '#D97706'
                    : '#DC2626',
                marginTop: 3,
              }}
            >
              {p.soldeM3.toLocaleString('fr-FR')} Ar
            </div>
            <div
              style={{
                fontSize: 11,
                color:
                  p.statutM3 === 'positif'
                    ? '#047857'
                    : p.statutM3 === 'alerte'
                    ? '#B45309'
                    : '#B91C1C',
                marginTop: 2,
              }}
            >
              Variation : {p.soldeM3 >= p.soldeActuel ? '+' : ''}
              {(p.soldeM3 - p.soldeActuel).toLocaleString('fr-FR')} Ar
            </div>
          </div>
        </div>

        {/* Conseil / Synthèse automatique */}
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: THEME.bg.soft,
            border: `1px solid ${THEME.border.base}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          {p.statutM3 === 'positif' ? (
            <CheckCircle2 size={18} color={THEME.accent.green} style={{ flexShrink: 0, marginTop: 2 }} />
          ) : p.statutM3 === 'alerte' ? (
            <AlertCircle size={18} color={THEME.accent.orange} style={{ flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertTriangle size={18} color={THEME.accent.danger} style={{ flexShrink: 0, marginTop: 2 }} />
          )}
          <div style={{ fontSize: 12.5, color: THEME.text.secondary, lineHeight: 1.5 }}>
            <strong style={{ color: THEME.text.primary }}>Diagnostic prévisionnel : </strong>
            {p.conseil}
          </div>
        </div>
      </Card>

      {/* 2. GRAPHIQUE ÉVOLUTION DU SOLDE ET DES FLUX */}
      <Card>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: THEME.text.primary, marginBottom: 14 }}>
          Évolution Prévisionnelle des Flux et du Solde de Trésorerie
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.border.base} />
              <XAxis dataKey="name" stroke={THEME.text.muted} fontSize={12} tickLine={false} />
              <YAxis
                stroke={THEME.text.muted}
                fontSize={11}
                tickFormatter={(v) => `${(v / 1000).toLocaleString('fr-FR')} k`}
              />
              <Tooltip
                formatter={(value: any, name: string) => [
                  `${Number(value).toLocaleString('fr-FR')} Ar`,
                  name,
                ]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
              <Bar dataKey="Encaissements" fill={THEME.accent.green} name="Encaissements Prévisionnels" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Décaissements" fill={THEME.accent.danger} name="Décaissements Prévisionnels" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Solde" fill={THEME.accent.primary} name="Solde de Trésorerie Final" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 3. TABLEAU DÉTAILLÉ MOIS PAR MOIS (M+1, M+2, M+3) */}
      <Card>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: THEME.text.primary, marginBottom: 12 }}>
          Tableau Détaillé de Trésorerie Prévisionnelle
        </div>

        <div style={{ overflowX: 'auto', border: `1px solid ${THEME.border.base}`, borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  background: THEME.bg.soft,
                  borderBottom: `1px solid ${THEME.border.base}`,
                  color: THEME.text.muted,
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                <th style={{ padding: '10px 12px' }}>Poste Prévisionnel</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actuel (M0)</th>
                {p.projections.map((mois) => (
                  <th key={mois.moisIndex} style={{ padding: '10px 12px', textAlign: 'right' }}>
                    {mois.moisNom} (M+{mois.moisIndex})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Solde Initial */}
              <tr style={{ background: THEME.bg.card, borderBottom: `1px solid ${THEME.border.base}` }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: THEME.text.primary }}>
                  Solde Initial (Début de mois)
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: THEME.text.primary }}>
                  -
                </td>
                {p.projections.map((mois) => (
                  <td key={mois.moisIndex} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: THEME.text.primary }}>
                    {mois.soldeInitial.toLocaleString('fr-FR')} Ar
                  </td>
                ))}
              </tr>

              {/* ENCAISSEMENTS */}
              <tr style={{ background: '#F0FDF4' }}>
                <td colSpan={5} style={{ padding: '6px 12px', fontWeight: 800, fontSize: 11.5, color: '#166534', letterSpacing: '0.04em' }}>
                  (+) ENCAISSEMENTS PRÉVUS
                </td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${THEME.border.base}` }}>
                <td style={{ padding: '8px 12px 8px 24px', color: THEME.text.secondary }}>
                  • Ventes prévues encaissées
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: THEME.text.muted }}>-</td>
                {p.projections.map((mois) => (
                  <td key={mois.moisIndex} style={{ padding: '8px 12px', textAlign: 'right', color: THEME.accent.green, fontWeight: 600 }}>
                    +{mois.encaissements.ventesPrevues.toLocaleString('fr-FR')} Ar
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: `1px solid ${THEME.border.base}` }}>
                <td style={{ padding: '8px 12px 8px 24px', color: THEME.text.secondary }}>
                  • Recouvrement créances clients existantes
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: THEME.text.muted }}>
                  {p.creancesClientsTotal.toLocaleString('fr-FR')} Ar
                </td>
                {p.projections.map((mois) => (
                  <td key={mois.moisIndex} style={{ padding: '8px 12px', textAlign: 'right', color: THEME.accent.green, fontWeight: 600 }}>
                    +{mois.encaissements.creancesRecouvrables.toLocaleString('fr-FR')} Ar
                  </td>
                ))}
              </tr>
              <tr style={{ background: THEME.bg.card, borderBottom: `1px solid ${THEME.border.base}`, fontWeight: 700 }}>
                <td style={{ padding: '8px 12px', color: '#15803D' }}>Total Encaissements</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: THEME.text.muted }}>-</td>
                {p.projections.map((mois) => (
                  <td key={mois.moisIndex} style={{ padding: '8px 12px', textAlign: 'right', color: '#15803D', fontWeight: 800 }}>
                    +{mois.encaissements.total.toLocaleString('fr-FR')} Ar
                  </td>
                ))}
              </tr>

              {/* DÉCAISSEMENTS */}
              <tr style={{ background: '#FEF2F2' }}>
                <td colSpan={5} style={{ padding: '6px 12px', fontWeight: 800, fontSize: 11.5, color: '#991B1B', letterSpacing: '0.04em' }}>
                  (-) DÉCAISSEMENTS PRÉVUS
                </td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${THEME.border.base}` }}>
                <td style={{ padding: '8px 12px 8px 24px', color: THEME.text.secondary }}>
                  • Règlements commandes en cours & dettes fournisseurs
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: THEME.text.muted }}>
                  {p.dettesFournisseursTotal.toLocaleString('fr-FR')} Ar
                </td>
                {p.projections.map((mois) => (
                  <td key={mois.moisIndex} style={{ padding: '8px 12px', textAlign: 'right', color: THEME.accent.danger, fontWeight: 600 }}>
                    -{mois.decaissements.dettesFournisseurs.toLocaleString('fr-FR')} Ar
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: `1px solid ${THEME.border.base}` }}>
                <td style={{ padding: '8px 12px 8px 24px', color: THEME.text.secondary }}>
                  • Charges fixes & courantes régulières
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: THEME.text.muted }}>-</td>
                {p.projections.map((mois) => (
                  <td key={mois.moisIndex} style={{ padding: '8px 12px', textAlign: 'right', color: THEME.accent.danger, fontWeight: 600 }}>
                    -{mois.decaissements.chargesRegulieres.toLocaleString('fr-FR')} Ar
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: `1px solid ${THEME.border.base}` }}>
                <td style={{ padding: '8px 12px 8px 24px', color: THEME.text.secondary }}>
                  • Budget réapprovisionnement estimé
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: THEME.text.muted }}>-</td>
                {p.projections.map((mois) => (
                  <td key={mois.moisIndex} style={{ padding: '8px 12px', textAlign: 'right', color: THEME.accent.danger, fontWeight: 600 }}>
                    -{mois.decaissements.reapprovisionnementPrevu.toLocaleString('fr-FR')} Ar
                  </td>
                ))}
              </tr>
              <tr style={{ background: THEME.bg.card, borderBottom: `1px solid ${THEME.border.base}`, fontWeight: 700 }}>
                <td style={{ padding: '8px 12px', color: '#B91C1C' }}>Total Décaissements</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: THEME.text.muted }}>-</td>
                {p.projections.map((mois) => (
                  <td key={mois.moisIndex} style={{ padding: '8px 12px', textAlign: 'right', color: '#B91C1C', fontWeight: 800 }}>
                    -{mois.decaissements.total.toLocaleString('fr-FR')} Ar
                  </td>
                ))}
              </tr>

              {/* Flux Net */}
              <tr style={{ background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, fontWeight: 800 }}>
                <td style={{ padding: '9px 12px', color: THEME.text.primary }}>
                  = FLUX NET DU MOIS (Encaissements - Décaissements)
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'right', color: THEME.text.muted }}>-</td>
                {p.projections.map((mois) => {
                  const isPos = mois.fluxNet >= 0;
                  return (
                    <td
                      key={mois.moisIndex}
                      style={{
                        padding: '9px 12px',
                        textAlign: 'right',
                        color: isPos ? THEME.accent.green : THEME.accent.danger,
                        fontWeight: 800,
                      }}
                    >
                      {isPos ? '+' : ''}
                      {mois.fluxNet.toLocaleString('fr-FR')} Ar
                    </td>
                  );
                })}
              </tr>

              {/* SOLDE FINAL */}
              <tr style={{ background: THEME.bg.card, fontWeight: 800, fontSize: 13.5 }}>
                <td style={{ padding: '11px 12px', color: THEME.text.primary }}>
                  SOLDE FINAL PROJETÉ (Fin de mois)
                </td>
                <td style={{ padding: '11px 12px', textAlign: 'right', color: THEME.accent.primary }}>
                  {p.soldeActuel.toLocaleString('fr-FR')} Ar
                </td>
                {p.projections.map((mois) => {
                  const isPos = mois.soldeFinal >= 0;
                  return (
                    <td
                      key={mois.moisIndex}
                      style={{
                        padding: '11px 12px',
                        textAlign: 'right',
                        color: isPos ? THEME.accent.green : THEME.accent.danger,
                      }}
                    >
                      {mois.soldeFinal.toLocaleString('fr-FR')} Ar
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
