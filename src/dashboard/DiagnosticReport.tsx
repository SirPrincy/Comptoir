import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldCheck,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  Layers,
  CalendarX,
  FileWarning,
  Coins,
} from 'lucide-react';
import { THEME } from '../colors';
import { Card, cardTitle, Stat, inputStyle, selectStyle, ghostBtn } from '../ui';
import { DiagnosticIssue, DiagnosticReportData, runDataDiagnostic } from './diagnosticUtils';

interface DiagnosticReportProps {
  commandes: any[];
  immobilisations: any[];
  mouvements: any[];
  ventes: any[];
  emprunts: any[];
  products: any[];
  fournisseurs?: any[];
  clients?: any[];
  onNavigateTab?: (tab: string) => void;
}

export default function DiagnosticReport({
  commandes = [],
  immobilisations = [],
  mouvements = [],
  ventes = [],
  emprunts = [],
  products = [],
  fournisseurs = [],
  clients = [],
  onNavigateTab,
}: DiagnosticReportProps) {
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Exécution du diagnostic complet
  const report: DiagnosticReportData = useMemo(() => {
    return runDataDiagnostic({
      commandes,
      immobilisations,
      mouvements,
      ventes,
      emprunts,
      products,
      fournisseurs,
      clients,
    });
  }, [commandes, immobilisations, mouvements, ventes, emprunts, products, fournisseurs, clients, refreshTrigger]);

  // Filtrage des anomalies
  const filteredIssues = useMemo(() => {
    return report.issues.filter(issue => {
      if (selectedModule !== 'all' && issue.module !== selectedModule) return false;
      if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(q);
        const matchesDesc = issue.description.toLowerCase().includes(q);
        const matchesItem = issue.itemLabel.toLowerCase().includes(q);
        const matchesCat = issue.categoryLabel.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesItem && !matchesCat) return false;
      }
      return true;
    });
  }, [report.issues, selectedModule, selectedSeverity, searchQuery]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Critique',
          bg: THEME.bg.alert,
          color: THEME.accent.danger,
          border: `1px solid ${THEME.accent.danger}33`,
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          label: 'Avertissement',
          bg: THEME.bg.soft,
          color: THEME.accent.orange,
          border: `1px solid ${THEME.accent.orange}33`,
        };
      default:
        return {
          icon: Info,
          label: 'Information',
          bg: THEME.bg.chip,
          color: THEME.accent.primary,
          border: `1px solid ${THEME.border.base}`,
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'date_invalide':
        return <CalendarX size={14} />;
      case 'montant_invalide':
        return <Coins size={14} />;
      case 'reference_manquante':
        return <Layers size={14} />;
      default:
        return <FileWarning size={14} />;
    }
  };

  const isAllHealthy = report.totalIssues === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* En-tête et métriques de santé globales */}
      <Card>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: `1px solid ${THEME.border.base}`,
          paddingBottom: 12,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isAllHealthy ? `${THEME.accent.green}20` : `${THEME.accent.orange}20`,
              color: isAllHealthy ? THEME.accent.green : THEME.accent.orange,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isAllHealthy ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: THEME.text.primary }}>
                Diagnostic d'Intégrité des Données
              </div>
              <div style={{ fontSize: 12, color: THEME.text.muted }}>
                Audit automatique des références croisées, montants nuls et dates invalides
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setRefreshTrigger(t => t + 1)}
              style={{
                ...ghostBtn,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '6px 10px',
              }}
              title="Réanalyser toutes les écritures"
            >
              <RefreshCw size={13} />
              Réanalyser
            </button>
          </div>
        </div>

        {/* Grille de stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
        }}>
          <Stat
            label="Score de Santé"
            value={`${report.healthScore}%`}
            color={report.healthScore >= 90 ? THEME.accent.green : report.healthScore >= 60 ? THEME.accent.orange : THEME.accent.danger}
            icon={ShieldCheck}
            caption={`${report.auditedCounts.total} enregistrements audités`}
          />
          <Stat
            label="Erreurs Critiques"
            value={report.errorCount}
            color={report.errorCount === 0 ? THEME.accent.green : THEME.accent.danger}
            icon={AlertCircle}
            caption="Dates ou montants bloquants"
          />
          <Stat
            label="Avertissements"
            value={report.warningCount}
            color={report.warningCount === 0 ? THEME.accent.green : THEME.accent.orange}
            icon={AlertTriangle}
            caption="Montants nuls ou surpaiements"
          />
          <Stat
            label="Écritures Analysées"
            value={report.auditedCounts.total}
            color={THEME.accent.primary}
            icon={Layers}
            caption="Achats, Immo, Mouvements, Ventes, Dettes"
          />
        </div>
      </Card>

      {/* Résumé par module */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 8,
      }}>
        {[
          { key: 'achats', label: 'Achats', count: report.auditedCounts.achats, issues: report.byModule.achats, tab: 'achat' },
          { key: 'immobilisations', label: 'Immobilisations', count: report.auditedCounts.immobilisations, issues: report.byModule.immobilisations, tab: 'immobilisations' },
          { key: 'mouvements', label: 'Trésorerie', count: report.auditedCounts.mouvements, issues: report.byModule.mouvements, tab: 'tresorerie' },
          { key: 'ventes', label: 'Ventes', count: report.auditedCounts.ventes, issues: report.byModule.ventes, tab: 'vente' },
          { key: 'emprunts', label: 'Emprunts', count: report.auditedCounts.emprunts, issues: report.byModule.emprunts, tab: 'emprunts' },
        ].map(mod => {
          const hasIssues = mod.issues > 0;
          const isSelected = selectedModule === mod.key;

          return (
            <div
              key={mod.key}
              onClick={() => setSelectedModule(isSelected ? 'all' : mod.key)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: isSelected ? THEME.bg.surface : THEME.bg.card,
                border: `1px solid ${isSelected ? THEME.accent.orange : THEME.border.base}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: THEME.text.primary }}>{mod.label}</span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: hasIssues ? THEME.bg.alert : THEME.bg.chip,
                  color: hasIssues ? THEME.accent.danger : THEME.accent.green,
                }}>
                  {hasIssues ? `${mod.issues} anomalie(s)` : '100% sain'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: THEME.text.muted }}>
                {mod.count} écriture(s) vérifiée(s)
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre de filtres et recherche */}
      <Card>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: 200, flex: 1 }}>
              <Search size={14} color={THEME.text.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filtrer une anomalie, un article, un montant..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 30, fontSize: 12 }}
              />
            </div>

            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              style={{ ...selectStyle, width: 'auto', fontSize: 12 }}
            >
              <option value="all">Tous les modules ({report.totalIssues})</option>
              <option value="achats">Achats ({report.byModule.achats})</option>
              <option value="immobilisations">Immobilisations ({report.byModule.immobilisations})</option>
              <option value="mouvements">Trésorerie ({report.byModule.mouvements})</option>
              <option value="ventes">Ventes ({report.byModule.ventes})</option>
              <option value="emprunts">Emprunts ({report.byModule.emprunts})</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              style={{ ...selectStyle, width: 'auto', fontSize: 12 }}
            >
              <option value="all">Toutes gravités</option>
              <option value="error">Critiques ({report.errorCount})</option>
              <option value="warning">Avertissements ({report.warningCount})</option>
              <option value="info">Informations ({report.infoCount})</option>
            </select>
          </div>

          {(selectedModule !== 'all' || selectedSeverity !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedModule('all');
                setSelectedSeverity('all');
                setSearchQuery('');
              }}
              style={{ ...ghostBtn, fontSize: 11.5, padding: '5px 8px' }}
            >
              Réinitialiser filtres
            </button>
          )}
        </div>
      </Card>

      {/* Liste des anomalies ou état sain */}
      {isAllHealthy ? (
        <Card>
          <div style={{
            padding: '30px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: `${THEME.accent.green}20`,
              color: THEME.accent.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle2 size={30} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: THEME.text.primary }}>
              Toutes les données sont intègres et cohérentes !
            </div>
            <div style={{ fontSize: 12.5, color: THEME.text.muted, maxWidth: 500, lineHeight: 1.5 }}>
              Aucune référence croisée orpheline, aucun montant nul suspect ni aucune date invalide n'ont été détectés parmi les <strong>{report.auditedCounts.total}</strong> écritures de vos achats, immobilisations, mouvements, ventes et emprunts.
            </div>
          </div>
        </Card>
      ) : filteredIssues.length === 0 ? (
        <Card>
          <div style={{ padding: '24px 16px', textAlign: 'center', color: THEME.text.muted, fontSize: 13 }}>
            Aucune anomalie ne correspond à vos filtres de recherche.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 4px' }}>
            {filteredIssues.length} anomalie(s) identifiée(s)
          </div>

          {filteredIssues.map(issue => {
            const badge = getSeverityBadge(issue.severity);
            const SeverityIcon = badge.icon;

            return (
              <div
                key={issue.id}
                style={{
                  background: THEME.bg.card,
                  border: `1px solid ${THEME.border.base}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: badge.bg,
                      color: badge.color,
                      border: badge.border,
                    }}>
                      <SeverityIcon size={12} />
                      {badge.label}
                    </span>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: THEME.bg.soft,
                      color: THEME.text.secondary,
                    }}>
                      {getCategoryIcon(issue.category)}
                      {issue.categoryLabel}
                    </span>

                    <span style={{ fontSize: 11, color: THEME.text.muted }}>
                      [{issue.moduleLabel}]
                    </span>
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab(issue.targetTab)}
                      style={{
                        ...ghostBtn,
                        fontSize: 11.5,
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        color: THEME.accent.orange,
                        fontWeight: 600,
                      }}
                      title={`Aller corriger dans la section ${issue.moduleLabel}`}
                    >
                      Corriger dans {issue.moduleLabel}
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary }}>
                    {issue.title} : <span style={{ fontWeight: 500, color: THEME.text.secondary }}>{issue.itemLabel}</span>
                  </div>
                  <div style={{ fontSize: 12, color: THEME.text.muted, lineHeight: 1.4 }}>
                    {issue.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
