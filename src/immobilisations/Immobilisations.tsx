import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Calendar, CheckCircle2, Trash2, AlertTriangle, Zap, History, RefreshCw } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { selectStyle, primaryBtn, ghostBtn, Modal } from '../ui';
import { COMPTES_FINANCIERS } from '../constants';
import { Immobilisation, ImmobilisationsProps, ImmoCalculatedDetail } from './types';
import { computeImmoDetails, computeImmoKpis, MOIS_FR } from './immoUtils';
import ImmoKpiCards from './ImmoKpiCards';
import ImmoTable from './ImmoTable';
import AddImmoModal from './AddImmoModal';
import ImmoDetailModal from './ImmoDetailModal';
import ImmoJournalModal from './ImmoJournalModal';

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
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedImmo, setSelectedImmo] = useState<Immobilisation | null>(null);
  const [immoToDelete, setImmoToDelete] = useState<Immobilisation | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Années pour le filtre (de 2020 à 2035)
  const listYears = useMemo(() => {
    const years = [];
    for (let y = 2020; y <= 2035; y++) years.push(y);
    return years;
  }, []);

  const isCurrentMonth = selectedYear === currentActualYear && selectedMonth === currentActualMonth;
  const labelMois = MOIS_FR[selectedMonth - 1] || '';

  // Calcul du plan d'amortissement de chaque immobilisation pour le mois sélectionné
  const immoDetails = useMemo(() => {
    return computeImmoDetails(immobilisations, selectedYear, selectedMonth);
  }, [immobilisations, selectedYear, selectedMonth]);

  // KPIs calculés dynamiquement pour le mois sélectionné
  const kpis = useMemo(() => {
    return computeImmoKpis(immoDetails);
  }, [immoDetails]);

  // Amortissements déjà comptabilisés pour ce mois précis
  const amortissementsDuMois = useMemo(() => {
    return (mouvements || []).filter((m: any) => {
      const isAmort = m.tag === '#amortissement' || m.type === 'amortissement' || m.categorie === 'amortissement';
      if (!isAmort) return false;

      // Correspondance par annee & mois explicites
      if (m.annee === selectedYear && m.mois === selectedMonth) return true;

      // Correspondance par référence AMORT-YYYY-MM
      const refCode = `AMORT-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      if (m.reference && m.reference.includes(refCode)) return true;

      // Correspondance par date
      const d = new Date(m.date);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
      }

      return false;
    });
  }, [mouvements, selectedYear, selectedMonth]);

  // Nombre total de mouvements d'amortissement dans toute l'application
  const totalEcrituresAmortissement = useMemo(() => {
    return (mouvements || []).filter((m: any) =>
      m.tag === '#amortissement' || m.type === 'amortissement' || m.categorie === 'amortissement'
    ).length;
  }, [mouvements]);

  // Actifs éligibles à un amortissement ce mois-ci
  const immosEligiblesCeMois = useMemo(() => {
    return immoDetails.filter(i => i.dotationMois > 0);
  }, [immoDetails]);

  // Actifs pour lesquels l'amortissement n'a pas encore été créé ce mois-ci
  const immosRestantesCeMois = useMemo(() => {
    return immosEligiblesCeMois.filter(immo => {
      return !amortissementsDuMois.some((m: any) =>
        m.immoId === immo.id || (m.immoNom && m.immoNom === immo.nom) || (m.reference && m.reference.includes(immo.id))
      );
    });
  }, [immosEligiblesCeMois, amortissementsDuMois]);

  const dotationRestante = immosRestantesCeMois.reduce((s, i) => s + i.dotationMois, 0);
  const isMoisCompletementAmorti = immosEligiblesCeMois.length > 0 && immosRestantesCeMois.length === 0;

  const handleSetCurrentMonth = () => {
    setSelectedYear(currentActualYear);
    setSelectedMonth(currentActualMonth);
  };

  // Créer l'amortissement pour tout le mois en 1 clic
  const handleCreerAmortissementMois = () => {
    if (immosRestantesCeMois.length === 0) return;

    const dateMois = new Date(selectedYear, selectedMonth, 0, 12, 0, 0).toISOString();
    const refPrefix = `AMORT-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    const nouvellesEcritures = immosRestantesCeMois.map((immo) => ({
      id: `mvt-amort-${immo.id}-${selectedYear}-${selectedMonth}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'amortissement',
      categorie: 'amortissement',
      tag: '#amortissement',
      immoId: immo.id,
      immoNom: immo.nom,
      annee: selectedYear,
      mois: selectedMonth,
      montant: immo.dotationMois,
      description: `Dotation aux amortissements - ${immo.nom} (${labelMois} ${selectedYear})`,
      reference: `${refPrefix}-${immo.id.slice(0, 6)}`,
      compte: 'Amortissements',
      date: dateMois,
    }));

    updateData({ mouvements: [...nouvellesEcritures, ...mouvements] });

    setNotification(`Amortissement de ${labelMois} ${selectedYear} créé avec succès (${dotationRestante.toLocaleString()} MGA pour ${immosRestantesCeMois.length} actif(s)) !`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Créer l'amortissement pour une immobilisation individuelle
  const handleCreerAmortissementImmo = (immo: ImmoCalculatedDetail) => {
    if (immo.dotationMois <= 0) return;

    const dateMois = new Date(selectedYear, selectedMonth, 0, 12, 0, 0).toISOString();
    const refCode = `AMORT-${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${immo.id.slice(0, 6)}`;

    const nouvelleEcriture = {
      id: `mvt-amort-${immo.id}-${selectedYear}-${selectedMonth}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'amortissement',
      categorie: 'amortissement',
      tag: '#amortissement',
      immoId: immo.id,
      immoNom: immo.nom,
      annee: selectedYear,
      mois: selectedMonth,
      montant: immo.dotationMois,
      description: `Dotation aux amortissements - ${immo.nom} (${labelMois} ${selectedYear})`,
      reference: refCode,
      compte: 'Amortissements',
      date: dateMois,
    };

    updateData({ mouvements: [nouvelleEcriture, ...mouvements] });

    setNotification(`Amortissement de ${immo.nom} créé pour ${labelMois} ${selectedYear} (${immo.dotationMois.toLocaleString()} MGA) !`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Annuler l'amortissement d'un mois entier
  const handleAnnulerAmortissementMois = (annee: number, mois: number) => {
    const nextMouvements = mouvements.filter((m: any) => {
      const isAmort = m.tag === '#amortissement' || m.type === 'amortissement' || m.categorie === 'amortissement';
      if (!isAmort) return true;

      if (m.annee === annee && m.mois === mois) return false;
      const refCode = `AMORT-${annee}-${String(mois).padStart(2, '0')}`;
      if (m.reference && m.reference.includes(refCode)) return false;

      const d = new Date(m.date);
      if (!isNaN(d.getTime()) && d.getFullYear() === annee && (d.getMonth() + 1) === mois) {
        return false;
      }

      return true;
    });

    updateData({ mouvements: nextMouvements });
    setNotification(`Écritures d'amortissement de ${MOIS_FR[mois - 1]} ${annee} annulées.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Supprimer une écriture spécifique
  const handleDeleteMouvement = (id: string) => {
    const next = mouvements.filter((m: any) => m.id !== id);
    updateData({ mouvements: next });
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
      {/* Notification toast */}
      {notification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 8,
          background: '#EBF4EC',
          border: '1px solid #C3E2C7',
          color: '#2D5B44',
          fontSize: 13,
          fontWeight: 600,
        }}>
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Titre et actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={20} style={{ color: THEME.accent.primary }} />
            Immobilisations & Amortissements Mensuels
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: THEME.text.muted }}>
            Calcul et création des amortissements linéaires comptabilisés mensuellement (Prorata temporis).
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

          {/* Bouton Journal / Historique */}
          <button
            onClick={() => setShowJournalModal(true)}
            style={{
              ...ghostBtn,
              height: 34,
              padding: '0 10px',
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Consulter le journal de toutes les écritures d'amortissement"
          >
            <History size={15} style={{ color: THEME.accent.purple }} />
            Journal ({totalEcrituresAmortissement})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{ ...primaryBtn, height: 34, padding: '0 12px' }}
          >
            <Plus size={16} />
            Nouvelle Immo
          </button>
        </div>
      </div>

      {/* BANNIÈRE D'ACTION : BOUTON CRÉER L'AMORTISSEMENT DU MOIS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 10,
        background: isMoisCompletementAmorti ? '#EBF4EC' : (kpis.dotationMoisTotale > 0 ? '#FAF5FF' : THEME.bg.card),
        border: `1px solid ${isMoisCompletementAmorti ? '#C3E2C7' : (kpis.dotationMoisTotale > 0 ? '#E9D5FF' : THEME.border.base)}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: isMoisCompletementAmorti ? '#3F7A5C' : (kpis.dotationMoisTotale > 0 ? '#7E22CE' : THEME.text.muted),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            {isMoisCompletementAmorti ? <CheckCircle2 size={18} /> : <Zap size={18} />}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text.primary }}>
              {isMoisCompletementAmorti
                ? `Amortissement de ${labelMois} ${selectedYear} comptabilisé`
                : (kpis.dotationMoisTotale > 0
                  ? `Amortissement du mois de ${labelMois} ${selectedYear}`
                  : `Aucune dotation à amortir pour ${labelMois} ${selectedYear}`)}
            </div>
            <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 1 }}>
              {isMoisCompletementAmorti
                ? `Toutes les dotations du mois sont enregistrées (${kpis.dotationMoisTotale.toLocaleString()} MGA au total).`
                : (kpis.dotationMoisTotale > 0
                  ? `Dotation restante à créer : ${dotationRestante.toLocaleString()} MGA (${immosRestantesCeMois.length} actif(s) en attente).`
                  : `Les immobilisations sont déjà amorties ou n'ont pas de charge pour cette période.`)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isMoisCompletementAmorti ? (
            <button
              type="button"
              onClick={() => handleAnnulerAmortissementMois(selectedYear, selectedMonth)}
              style={{
                ...ghostBtn,
                padding: '6px 12px',
                fontSize: 12,
                color: THEME.accent.danger,
                borderColor: '#FCA5A5',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Annuler les écritures d'amortissement de ce mois"
            >
              <RefreshCw size={13} />
              Annuler / Recalculer ce mois
            </button>
          ) : (
            <button
              type="button"
              disabled={dotationRestante <= 0}
              onClick={handleCreerAmortissementMois}
              style={{
                ...primaryBtn,
                background: dotationRestante > 0 ? '#7E22CE' : THEME.border.base,
                borderColor: dotationRestante > 0 ? '#7E22CE' : THEME.border.base,
                color: '#fff',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: dotationRestante > 0 ? '0 2px 8px rgba(126, 34, 206, 0.25)' : 'none',
                cursor: dotationRestante > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              <Zap size={16} />
              Créer l'amortissement du mois ({dotationRestante.toLocaleString()} MGA)
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards mensuels et annuels */}
      <ImmoKpiCards kpis={kpis} selectedYear={selectedYear} selectedMonth={selectedMonth} />

      {/* Liste des immobilisations */}
      <ImmoTable
        immoDetails={immoDetails}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        amortissementsDuMois={amortissementsDuMois}
        onSelectImmo={setSelectedImmo}
        onDeleteImmo={setImmoToDelete}
        onCreerAmortissementImmo={handleCreerAmortissementImmo}
      />

      {/* Modal d'ajout d'immobilisation */}
      {showAddModal && (
        <AddImmoModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
          comptes={comptes}
        />
      )}

      {/* Modal du journal des amortissements */}
      {showJournalModal && (
        <ImmoJournalModal
          mouvements={mouvements}
          onClose={() => setShowJournalModal(false)}
          onDeleteMouvement={handleDeleteMouvement}
          onDeleteMois={handleAnnulerAmortissementMois}
        />
      )}

      {/* Modal de confirmation de suppression d'immo */}
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
