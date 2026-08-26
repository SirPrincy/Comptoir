import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Calendar, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { selectStyle, primaryBtn, ghostBtn, Modal } from '../ui';
import { COMPTES_FINANCIERS } from '../constants';
import { Immobilisation, ImmobilisationsProps } from './types';
import { computeImmoDetails, computeImmoKpis, MOIS_FR } from './immoUtils';
import ImmoKpiCards from './ImmoKpiCards';
import ImmoTable from './ImmoTable';
import AddImmoModal from './AddImmoModal';
import ImmoDetailModal from './ImmoDetailModal';

export default function Immobilisations({
  immobilisations = [],
  mouvements = [],
  updateData,
  comptes = COMPTES_FINANCIERS,
}: ImmobilisationsProps) {
  const now = new Date();
  const currentActualYear = now.getFullYear();
  const currentActualMonth = now.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState<number>(currentActualYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentActualMonth);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedImmo, setSelectedImmo] = useState<Immobilisation | null>(null);
  const [immoToDelete, setImmoToDelete] = useState<Immobilisation | null>(null);

  // Années pour le filtre (de 2020 à 2035)
  const listYears = useMemo(() => {
    const years = [];
    for (let y = 2020; y <= 2035; y++) years.push(y);
    return years;
  }, []);

  const isCurrentMonth = selectedYear === currentActualYear && selectedMonth === currentActualMonth;

  // Calcul du plan d'amortissement de chaque immobilisation pour le mois sélectionné
  const immoDetails = useMemo(() => {
    return computeImmoDetails(immobilisations, selectedYear, selectedMonth);
  }, [immobilisations, selectedYear, selectedMonth]);

  // KPIs calculés dynamiquement pour le mois sélectionné
  const kpis = useMemo(() => {
    return computeImmoKpis(immoDetails);
  }, [immoDetails]);

  const handleSetCurrentMonth = () => {
    setSelectedYear(currentActualYear);
    setSelectedMonth(currentActualMonth);
  };

  const handleAdd = (nouvelleImmo: Immobilisation, genererEcriture: boolean, compteTresorerie: string) => {
    const nextImmos = [...immobilisations, nouvelleImmo];
    const patch: any = { immobilisations: nextImmos };

    // Optionnel : Générer l'écriture financière de sortie de caisse
    if (genererEcriture) {
      const mvtId = 'mvt-' + Math.random().toString(36).slice(2, 10);
      const m = {
        id: mvtId,
        type: 'sortie',
        montant: nouvelleImmo.valeurOrigine,
        compte: compteTresorerie,
        tag: '#materiel',
        reference: `Immo ${nouvelleImmo.nom}`,
        description: `Acquisition d'immobilisation : ${nouvelleImmo.nom}`,
        date: new Date(nouvelleImmo.dateAchat).toISOString(),
      };
      patch.mouvements = [m, ...mouvements];
    }

    updateData(patch);
    setShowAddModal(false);
  };

  const handleConfirmDelete = () => {
    if (!immoToDelete) return;
    const next = immobilisations.filter(i => i.id !== immoToDelete.id);
    updateData({ immobilisations: next });
    if (selectedImmo?.id === immoToDelete.id) {
      setSelectedImmo(null);
    }
    setImmoToDelete(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Titre et actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={20} style={{ color: THEME.accent.primary }} />
            Immobilisations & Amortissements Mensuels
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: THEME.text.muted }}>
            Calcul et suivi des amortissements linéaires comptabilisés mensuellement (Prorata temporis).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {/* Sélecteur de mois & exercice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: THEME.bg.card,
            padding: '4px 8px',
            borderRadius: 8,
            border: `1px solid ${THEME.border.base}`,
          }}>
            <Calendar size={15} style={{ color: THEME.accent.primary }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: THEME.text.secondary }}>Période :</span>

            {/* Sélecteur du mois */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ ...selectStyle, width: 110, height: 30, fontSize: 12, padding: '0 6px' }}
            >
              {MOIS_FR.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>{m}</option>
              ))}
            </select>

            {/* Sélecteur de l'année */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ ...selectStyle, width: 75, height: 30, fontSize: 12, padding: '0 6px' }}
            >
              {listYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Bouton rapide 'Mois en cours' */}
            <button
              onClick={handleSetCurrentMonth}
              style={{
                ...ghostBtn,
                height: 30,
                padding: '0 8px',
                fontSize: 11.5,
                fontWeight: 600,
                background: isCurrentMonth ? THEME.bg.soft : 'transparent',
                borderColor: isCurrentMonth ? THEME.accent.green : THEME.border.base,
                color: isCurrentMonth ? THEME.accent.green : THEME.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Caler immédiatement sur le mois actuel"
            >
              {isCurrentMonth ? <CheckCircle2 size={13} /> : null}
              {isCurrentMonth ? 'Ce mois-ci' : 'Aller au mois actuel'}
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{ ...primaryBtn, height: 34, padding: '0 12px' }}
          >
            <Plus size={16} />
            Nouvelle Immo
          </button>
        </div>
      </div>

      {/* KPI Cards mensuels et annuels */}
      <ImmoKpiCards kpis={kpis} selectedYear={selectedYear} selectedMonth={selectedMonth} />

      {/* Liste des immobilisations */}
      <ImmoTable
        immoDetails={immoDetails}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectImmo={setSelectedImmo}
        onDeleteImmo={setImmoToDelete}
      />

      {/* Modal d'ajout d'immobilisation */}
      {showAddModal && (
        <AddImmoModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
          comptes={comptes}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {immoToDelete && (
        <Modal title="Supprimer l'immobilisation" onClose={() => setImmoToDelete(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 8,
              background: THEME.bg.soft,
              border: `1px solid ${THEME.border.base}`,
            }}>
              <AlertTriangle size={20} color={THEME.accent.danger} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: THEME.text.primary, lineHeight: 1.5 }}>
                Êtes-vous sûr de vouloir supprimer définitivement l'actif <strong>« {immoToDelete.nom} »</strong> ?
                <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 4 }}>
                  • Valeur d'origine : <strong>{immoToDelete.valeurOrigine?.toLocaleString()} MGA</strong><br />
                  • Date d'acquisition : <strong>{new Date(immoToDelete.dateAchat).toLocaleDateString('fr-FR')}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setImmoToDelete(null)}
                style={ghostBtn}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  ...primaryBtn,
                  background: THEME.accent.danger,
                  borderColor: THEME.accent.danger,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={15} />
                Confirmer la suppression
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal d'affichage du plan d'amortissement complet */}
      {selectedImmo && (
        <ImmoDetailModal
          immo={selectedImmo}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onClose={() => setSelectedImmo(null)}
        />
      )}
    </div>
  );
}

export * from './types';
export * from './immoUtils';

