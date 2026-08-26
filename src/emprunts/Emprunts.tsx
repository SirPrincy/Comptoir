import React, { useState, useMemo } from 'react';
import { Landmark, Plus, Trash2, Calendar, DollarSign, Percent, User, ClipboardList, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { Card, cardTitle, Label, Field, Empty, Modal, inputStyle, selectStyle, primaryBtn, ghostBtn, iconBtn } from '../ui';
import { COMPTES_FINANCIERS } from '../constants';

interface Emprunt {
  id: string;
  nomPreteur: string;
  type: 'personnel' | 'institutionnel';
  montantPrincipal: number;
  tauxInteretAnnuel: number; // en % (ex: 5 pour 5%)
  dateSignature: string;
  dureeMois: number;
  notes?: string;
  remboursements: {
    id: string;
    date: string;
    capital: number;
    interet: number;
    compteSource: string;
  }[];
}

interface EmpruntsProps {
  emprunts?: Emprunt[];
  mouvements?: any[];
  updateData: (patch: any) => void;
  comptes?: string[];
}

export default function Emprunts({
  emprunts = [],
  mouvements = [],
  updateData,
  comptes = COMPTES_FINANCIERS,
}: EmpruntsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmprunt, setSelectedEmprunt] = useState<Emprunt | null>(null);
  const [showRepayModal, setShowRepayModal] = useState(false);

  // Formulaire d'ajout
  const [form, setForm] = useState({
    nomPreteur: '',
    type: 'personnel' as 'personnel' | 'institutionnel',
    montantPrincipal: '',
    tauxInteretAnnuel: '0',
    dateSignature: new Date().toISOString().split('T')[0],
    dureeMois: '12',
    notes: '',
    genererEcriture: true,
    compteDest: comptes[0] || 'Caisse / Espèces',
  });

  // Formulaire de remboursement
  const [repayForm, setRepayForm] = useState({
    date: new Date().toISOString().split('T')[0],
    capital: '',
    interet: '0',
    compteSource: comptes[0] || 'Caisse / Espèces',
  });

  // KPIs
  const kpis = useMemo(() => {
    let totalEmprunte = 0;
    let totalCapitalRembourse = 0;
    let totalInteretsPayes = 0;

    emprunts.forEach(emp => {
      totalEmprunte += emp.montantPrincipal;
      emp.remboursements.forEach(r => {
        totalCapitalRembourse += r.capital;
        totalInteretsPayes += r.interet;
      });
    });

    const capitalRestantDu = Math.max(0, totalEmprunte - totalCapitalRembourse);

    return {
      totalEmprunte,
      totalCapitalRembourse,
      totalInteretsPayes,
      capitalRestantDu,
    };
  }, [emprunts]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = Number(form.montantPrincipal);
    const taux = Number(form.tauxInteretAnnuel);
    const duree = Number(form.dureeMois);

    if (!form.nomPreteur.trim() || isNaN(principal) || principal <= 0 || isNaN(taux) || taux < 0 || isNaN(duree) || duree <= 0) {
      alert('Veuillez remplir correctement les champs obligatoires.');
      return;
    }

    const id = 'emp-' + Math.random().toString(36).slice(2, 10);
    const nouvelEmprunt: Emprunt = {
      id,
      nomPreteur: form.nomPreteur.trim(),
      type: form.type,
      montantPrincipal: principal,
      tauxInteretAnnuel: taux,
      dateSignature: form.dateSignature,
      dureeMois: duree,
      notes: form.notes.trim(),
      remboursements: [],
    };

    const nextEmprunts = [...emprunts, nouvelEmprunt];
    const patch: any = { emprunts: nextEmprunts };

    // Écriture de trésorerie (Entrée de capital emprunté)
    if (form.genererEcriture) {
      const mvtId = 'mvt-' + Math.random().toString(36).slice(2, 10);
      const m = {
        id: mvtId,
        type: 'entree',
        montant: principal,
        compte: form.compteDest,
        tag: '#investissement',
        reference: `Emprunt ${nouvelEmprunt.nomPreteur}`,
        description: `Obtention emprunt ${nouvelEmprunt.type === 'personnel' ? 'personnel' : 'institutionnel'} auprès de ${nouvelEmprunt.nomPreteur}`,
        date: new Date(form.dateSignature).toISOString(),
      };
      patch.mouvements = [m, ...mouvements];
    }

    updateData(patch);
    setShowAddModal(false);

    // Reset
    setForm({
      nomPreteur: '',
      type: 'personnel',
      montantPrincipal: '',
      tauxInteretAnnuel: '0',
      dateSignature: new Date().toISOString().split('T')[0],
      dureeMois: '12',
      notes: '',
      genererEcriture: true,
      compteDest: comptes[0] || 'Caisse / Espèces',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous supprimer cet emprunt ? Les remboursements enregistrés dessus seront perdus. (Note : les écritures en trésorerie ne seront pas modifiées automatiquement pour des raisons de cohérence comptable)')) {
      const next = emprunts.filter(e => e.id !== id);
      updateData({ emprunts: next });
      if (selectedEmprunt?.id === id) {
        setSelectedEmprunt(null);
      }
    }
  };

  const handleRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmprunt) return;

    const capital = Number(repayForm.capital);
    const interet = Number(repayForm.interet);

    if (isNaN(capital) || capital < 0 || isNaN(interet) || interet < 0 || (capital === 0 && interet === 0)) {
      alert('Veuillez entrer un montant de remboursement de capital ou d’intérêts valide.');
      return;
    }

    // Calculer le capital restant pour ne pas rembourser plus que dû
    const totalCapRembourse = selectedEmprunt.remboursements.reduce((sum, r) => sum + r.capital, 0);
    const resteDu = selectedEmprunt.montantPrincipal - totalCapRembourse;
    if (capital > resteDu) {
      alert(`Le montant de capital remboursé (${capital.toLocaleString()} MGA) ne peut excéder le reste dû (${resteDu.toLocaleString()} MGA).`);
      return;
    }

    const repayId = 'repay-' + Math.random().toString(36).slice(2, 10);
    const nouveauRemboursement = {
      id: repayId,
      date: repayForm.date,
      capital,
      interet,
      compteSource: repayForm.compteSource,
    };

    // Mettre à jour l'emprunt dans la liste
    const updatedEmprunts = emprunts.map(emp => {
      if (emp.id !== selectedEmprunt.id) return emp;
      const nextR = [...emp.remboursements, nouveauRemboursement];
      return { ...emp, remboursements: nextR };
    });

    const patch: any = { emprunts: updatedEmprunts };

    // Générer les mouvements en trésorerie (Sortie)
    const nextMovs = [...mouvements];
    
    // Écriture remboursement capital
    if (capital > 0) {
      nextMovs.unshift({
        id: 'mvt-' + Math.random().toString(36).slice(2, 10),
        type: 'sortie',
        montant: capital,
        compte: repayForm.compteSource,
        tag: '#remboursement',
        reference: `Remb. Emprunt ${selectedEmprunt.nomPreteur}`,
        description: `Remboursement capital emprunté chez ${selectedEmprunt.nomPreteur}`,
        date: new Date(repayForm.date).toISOString(),
      });
    }

    // Écriture charges d'intérêt
    if (interet > 0) {
      nextMovs.unshift({
        id: 'mvt-' + Math.random().toString(36).slice(2, 10),
        type: 'sortie',
        montant: interet,
        compte: repayForm.compteSource,
        tag: '#frais-bancaires',
        reference: `Intérêts Emprunt ${selectedEmprunt.nomPreteur}`,
        description: `Intérêts payés sur emprunt chez ${selectedEmprunt.nomPreteur}`,
        date: new Date(repayForm.date).toISOString(),
      });
    }

    patch.mouvements = nextMovs;
    updateData(patch);

    // Mettre à jour la sélection locale pour refléter le tableau
    const currentUpdated = updatedEmprunts.find(emp => emp.id === selectedEmprunt.id);
    if (currentUpdated) {
      setSelectedEmprunt(currentUpdated);
    }

    setShowRepayModal(false);
    // Reset repay form
    setRepayForm({
      date: new Date().toISOString().split('T')[0],
      capital: '',
      interet: '0',
      compteSource: comptes[0] || 'Caisse / Espèces',
    });
  };

  const deleteRemboursement = (empruntId: string, repayId: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce remboursement de l’emprunt ? (Les écritures financières correspondantes en trésorerie doivent être nettoyées manuellement)')) {
      const updatedEmprunts = emprunts.map(emp => {
        if (emp.id !== empruntId) return emp;
        return {
          ...emp,
          remboursements: emp.remboursements.filter(r => r.id !== repayId),
        };
      });

      updateData({ emprunts: updatedEmprunts });

      const currentUpdated = updatedEmprunts.find(emp => emp.id === empruntId);
      if (currentUpdated) {
        setSelectedEmprunt(currentUpdated);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Landmark size={20} style={{ color: THEME.accent.primary }} />
            Emprunts & Dettes Financières
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: THEME.text.muted }}>
            Suivi des emprunts personnels ou institutionnels et planification des remboursements.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{ ...primaryBtn, height: 34, padding: '0 12px' }}
        >
          <Plus size={16} />
          Nouveau Contrat
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
            <ArrowDownLeft size={14} style={{ color: THEME.accent.green }} />
            Capital Emprunté
          </div>
          <div style={{ ...TYPOGRAPHY.statValue, color: THEME.text.primary }}>
            {kpis.totalEmprunte.toLocaleString()} MGA
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            Total levé auprès des partenaires
          </div>
        </div>

        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
            <ArrowUpRight size={14} style={{ color: THEME.accent.primary }} />
            Principal Remboursé
          </div>
          <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.primary }}>
            {kpis.totalCapitalRembourse.toLocaleString()} MGA
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            Capital déjà restitué
          </div>
        </div>

        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
            <AlertCircle size={14} style={{ color: THEME.accent.orange }} />
            Capital Restant Dû
          </div>
          <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.orange }}>
            {kpis.capitalRestantDu.toLocaleString()} MGA
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            Dette nette principale à rembourser
          </div>
        </div>

        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.muted, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
            <Percent size={14} style={{ color: THEME.accent.purple }} />
            Intérêts Honorés
          </div>
          <div style={{ ...TYPOGRAPHY.statValue, color: THEME.accent.purple }}>
            {kpis.totalInteretsPayes.toLocaleString()} MGA
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            Frais et intérêts payés en charges
          </div>
        </div>
      </div>

      {/* Tableau ou vue vide */}
      {emprunts.length === 0 ? (
        <Empty text="Aucune dette financière ou emprunt enregistré. Saisissez votre premier contrat !" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: '1fr', gap: 14 }}>
          {/* Liste principale */}
          <div style={{ background: THEME.bg.card, borderRadius: 12, border: `1px solid ${THEME.border.base}`, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.muted, fontWeight: 600 }}>
                    <th style={{ padding: '12px 14px' }}>Prêteur</th>
                    <th style={{ padding: '12px 14px' }}>Type</th>
                    <th style={{ padding: '12px 14px' }}>Date & Durée</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Taux Intérêt</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Capital Initial (MGA)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Déjà Remboursé</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Restant Dû</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emprunts.map(emp => {
                    const capitalPaye = emp.remboursements.reduce((sum, r) => sum + r.capital, 0);
                    const restantDu = Math.max(0, emp.montantPrincipal - capitalPaye);
                    const estAmorti = restantDu === 0;

                    return (
                      <tr
                        key={emp.id}
                        style={{
                          borderBottom: `1px solid ${THEME.border.base}`,
                          transition: 'background 0.1s ease',
                          background: selectedEmprunt?.id === emp.id ? THEME.bg.soft : 'transparent',
                        }}
                        className="hover-bg-row"
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                          <div>{emp.nomPreteur}</div>
                          {emp.notes && <div style={{ fontSize: 11, fontWeight: 400, color: THEME.text.muted, marginTop: 2 }}>{emp.notes}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: THEME.bg.soft,
                            color: emp.type === 'personnel' ? THEME.accent.primary : THEME.accent.purple,
                          }}>
                            {emp.type === 'personnel' ? 'Personnel' : 'Institutionnel'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 500 }}>{new Date(emp.dateSignature).toLocaleDateString('fr-FR')}</div>
                          <div style={{ fontSize: 11, color: THEME.text.muted }}>Durée : {emp.dureeMois} mois</div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: emp.tauxInteretAnnuel > 0 ? THEME.accent.orange : THEME.text.muted, fontWeight: 600 }}>
                          {emp.tauxInteretAnnuel > 0 ? `${emp.tauxInteretAnnuel}%` : 'Sans intérêt'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>
                          {emp.montantPrincipal.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: THEME.accent.green, fontWeight: 500 }}>
                          {capitalPaye.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: restantDu > 0 ? THEME.accent.orange : THEME.text.muted }}>
                          {restantDu.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 20,
                            background: THEME.bg.soft,
                            color: estAmorti ? THEME.accent.green : THEME.accent.orange,
                          }}>
                            {estAmorti ? 'Soldé' : 'En cours'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button
                              onClick={() => setSelectedEmprunt(emp)}
                              style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11 }}
                            >
                              <ClipboardList size={13} />
                              Suivi
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              style={iconBtn}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Volet de suivi de l'emprunt sélectionné */}
          {selectedEmprunt && (
            <div style={{
              background: THEME.bg.card,
              borderRadius: 12,
              border: `1px solid ${THEME.border.base}`,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border.base}`, paddingBottom: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, color: THEME.text.primary, fontWeight: 700 }}>
                    Historique & Suivi : {selectedEmprunt.nomPreteur}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: THEME.text.muted }}>
                    Détail du contrat de remboursement de capital et des frais d'intérêt payés.
                  </p>
                </div>
                
                {selectedEmprunt.montantPrincipal - selectedEmprunt.remboursements.reduce((sum, r) => sum + r.capital, 0) > 0 && (
                  <button
                    onClick={() => {
                      const reste = selectedEmprunt.montantPrincipal - selectedEmprunt.remboursements.reduce((sum, r) => sum + r.capital, 0);
                      setRepayForm({
                        date: new Date().toISOString().split('T')[0],
                        capital: String(reste),
                        interet: '0',
                        compteSource: comptes[0] || 'Caisse / Espèces',
                      });
                      setShowRepayModal(true);
                    }}
                    style={{ ...primaryBtn, padding: '5px 10px', fontSize: 12, height: 30 }}
                  >
                    Enregistrer Remboursement
                  </button>
                )}
              </div>

              {/* Remboursements list */}
              {selectedEmprunt.remboursements.length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center', color: THEME.text.muted, fontSize: 13 }}>
                  Aucun remboursement enregistré pour cet emprunt.
                </div>
              ) : (
                <div style={{ border: `1px solid ${THEME.border.base}`, borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.muted, fontWeight: 600 }}>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                        <th style={{ padding: '8px 10px' }}>Compte Débité</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amortissement Principal (MGA)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Charges d'Intérêt (MGA)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Décaissé (MGA)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Suppr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmprunt.remboursements.map(r => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${THEME.border.base}` }}>
                          <td style={{ padding: '8px 10px' }}>{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '8px 10px', color: THEME.text.secondary }}>{r.compteSource}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: THEME.accent.primary }}>{r.capital.toLocaleString()}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: THEME.accent.orange }}>{r.interet.toLocaleString()}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{(r.capital + r.interet).toLocaleString()}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              onClick={() => deleteRemboursement(selectedEmprunt.id, r.id)}
                              style={{ ...iconBtn, padding: 3 }}
                            >
                              <Trash2 size={13} style={{ color: THEME.text.muted }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal d'ajout de contrat d'emprunt */}
      {showAddModal && (
        <Modal title="Enregistrer un Contrat d'Emprunt" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <Field label="Nom du Prêteur (Personne / Banque) *">
              <input
                type="text"
                required
                placeholder="Ex: Bank of Africa, Jean-Luc R., Investisseur X..."
                value={form.nomPreteur}
                onChange={(e) => setForm({ ...form, nomPreteur: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Type d'emprunt *">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  style={selectStyle}
                >
                  <option value="personnel">Personnel (Associés, Direction, Proches)</option>
                  <option value="institutionnel">Institutionnel (Banque, Microfinance)</option>
                </select>
              </Field>

              <Field label="Durée (Mois) *">
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 12, 24"
                  value={form.dureeMois}
                  onChange={(e) => setForm({ ...form, dureeMois: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Capital Initial (MGA) *">
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 10000000"
                  value={form.montantPrincipal}
                  onChange={(e) => setForm({ ...form, montantPrincipal: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              <Field label="Taux d'intérêt annuel (%)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ex: 5"
                  value={form.tauxInteretAnnuel}
                  onChange={(e) => setForm({ ...form, tauxInteretAnnuel: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <Field label="Date de signature / déblocage des fonds *">
                <input
                  type="date"
                  required
                  value={form.dateSignature}
                  onChange={(e) => setForm({ ...form, dateSignature: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>

            <Field label="Notes / Clauses particulières (Optionnel)">
              <textarea
                placeholder="Frais de dossier, date des mensualités, conditions de remboursement anticipé..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ ...inputStyle, height: 60, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>

            {/* Intégration trésorerie */}
            <div style={{
              background: THEME.bg.soft,
              border: `1px solid ${THEME.border.base}`,
              borderRadius: 8,
              padding: 10,
              marginTop: 4,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.genererEcriture}
                  onChange={(e) => setForm({ ...form, genererEcriture: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: THEME.accent.primary }}
                />
                Déposer directement les fonds en trésorerie (Entrée de cash)
              </label>

              {form.genererEcriture && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, borderTop: `1px solid ${THEME.border.base}`, paddingTop: 8 }}>
                  <Field label="Compte de destination">
                    <select
                      value={form.compteDest}
                      onChange={(e) => setForm({ ...form, compteDest: e.target.value })}
                      style={{ ...selectStyle, height: 32 }}
                    >
                      {comptes.map(cp => (
                        <option key={cp} value={cp}>{cp}</option>
                      ))}
                    </select>
                  </Field>
                  <div style={{ fontSize: 11, color: THEME.text.muted }}>
                    Un mouvement financier de type <strong>Entrée</strong> d'un montant de <strong>{Number(form.montantPrincipal || 0).toLocaleString()} MGA</strong> sera généré avec le tag <strong>#investissement</strong>.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={ghostBtn}>
                Annuler
              </button>
              <button type="submit" style={primaryBtn}>
                Enregistrer l'Emprunt
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal d'enregistrement de remboursement */}
      {showRepayModal && selectedEmprunt && (
        <Modal title={`Remboursement pour : ${selectedEmprunt.nomPreteur}`} onClose={() => setShowRepayModal(false)}>
          <form onSubmit={handleRepay} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ background: THEME.bg.soft, padding: 10, borderRadius: 8, fontSize: 12.5, border: `1px solid ${THEME.border.base}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Emprunt d'origine :</span>
                <strong>{selectedEmprunt.montantPrincipal.toLocaleString()} MGA</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Reste du principal dû :</span>
                <strong style={{ color: THEME.accent.orange }}>
                  {(selectedEmprunt.montantPrincipal - selectedEmprunt.remboursements.reduce((sum, r) => sum + r.capital, 0)).toLocaleString()} MGA
                </strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Capital Remboursé (Principal) *">
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Ex: 1000000"
                  value={repayForm.capital}
                  onChange={(e) => setRepayForm({ ...repayForm, capital: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              <Field label="Intérêts versés *">
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Ex: 50000"
                  value={repayForm.interet}
                  onChange={(e) => setRepayForm({ ...repayForm, interet: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Date de paiement *">
                <input
                  type="date"
                  required
                  value={repayForm.date}
                  onChange={(e) => setRepayForm({ ...repayForm, date: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              <Field label="Compte de règlement *">
                <select
                  value={repayForm.compteSource}
                  onChange={(e) => setRepayForm({ ...repayForm, compteSource: e.target.value })}
                  style={selectStyle}
                >
                  {comptes.map(cp => (
                    <option key={cp} value={cp}>{cp}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
              * Deux écritures financières (ou une selon les montants) de type <strong>Sortie</strong> seront générées automatiquement :
              <br />- Remboursement capital avec tag <strong>#remboursement</strong>
              <br />- Intérêts versés avec tag <strong>#frais-bancaires</strong>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={() => setShowRepayModal(false)} style={ghostBtn}>
                Annuler
              </button>
              <button type="submit" style={primaryBtn}>
                Enregistrer le Règlement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
