import React, {  useState, useMemo , memo } from 'react';
import { Coins, Star } from 'lucide-react';
import { INTERMEDIAIRES_HABITUELS, CANAUX_RMB, VITESSE_OPTIONS, OperationChange } from './types';
import { uid } from '../constants';
import { safeDateIso } from '../ui';
import { calculerSoldeRMB } from '../paymentUtils';

import ChangeHeaderKPI from './ChangeHeaderKPI';
import ComparateurExchangers from './ComparateurExchangers';
import FormulaireChange from './FormulaireChange';
import JournalOperationsChange from './JournalOperationsChange';

interface ChangeRMBProps {
  changes: OperationChange[];
  mouvements: any[];
  commandes: any[];
  devises?: any;
  fournisseurs?: any[];
  comptes?: string[];
  paiements?: any[];
  updateData: (patch: any) => void;
  onApplyTauxToApp?: (taux: number) => void;
}

const ChangeRMB = memo(function ChangeRMB({
  changes = [],
  mouvements = [],
  commandes = [],
  devises,
  comptes,
  paiements = [],
  updateData,
  onApplyTauxToApp,
}: ChangeRMBProps) {
  const [subTab, setSubTab] = useState<'journal' | 'fiabilite'>('journal');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFournisseur, setFilterFournisseur] = useState('Tous');
  const [filterCanal, setFilterCanal] = useState('Tous');

  const today = new Date().toISOString().slice(0, 10);

  const initialForm = {
    date: today,
    montantMga: '',
    montantRmb: '',
    taux: '',
    fraisMga: '',
    fournisseur: INTERMEDIAIRES_HABITUELS[0],
    canal: CANAUX_RMB[0],
    vitesseExecution: VITESSE_OPTIONS[0],
    noteFiabilite: '5',
    compteSource: 'MVola',
    domaineFonds: 'business' as 'business' | 'perso',
    reference: '',
    notes: '',
    genererMouvementTresorerie: true,
  };

  const [form, setForm] = useState(initialForm);

  // Stats Globales de Change
  const stats = useMemo(() => {
    let totalMga = 0;
    let totalRmb = 0;
    let totalFrais = 0;
    let dernierTaux = devises?.rmb || 680;

    changes.forEach(c => {
      const mga = Number(c.montantMga) || 0;
      const rmb = Number(c.montantRmb) || 0;
      const frais = Number(c.fraisMga) || 0;

      totalMga += mga;
      totalRmb += rmb;
      totalFrais += frais;

      if (c.taux) dernierTaux = c.taux;
    });

    const totalCout = totalMga + totalFrais;
    const tauxMoyenPondere = totalRmb > 0 ? Math.round((totalCout / totalRmb) * 100) / 100 : devises?.rmb || 680;

    return {
      totalMga,
      totalRmb,
      totalFrais,
      tauxMoyenPondere,
      dernierTaux,
    };
  }, [changes, devises]);

  // Solde RMB dispo
  const soldeRmbInfo = useMemo(() => {
    return calculerSoldeRMB(changes, mouvements, commandes, devises, paiements);
  }, [changes, mouvements, commandes, devises, paiements]);

  // Analyse et Historique de Fiabilité des Exchangers P2P
  const exchangersAnalysis = useMemo(() => {
    const groups: Record<string, {
      name: string;
      ops: OperationChange[];
      totalMga: number;
      totalRmb: number;
      totalFrais: number;
      tauxList: number[];
      notesList: number[];
      vitesseList: string[];
    }> = {};

    changes.forEach(op => {
      const name = op.fournisseur || op.exchanger?.split(' (')[0] || 'Intermédiaire non spécifié';
      if (!groups[name]) {
        groups[name] = {
          name,
          ops: [],
          totalMga: 0,
          totalRmb: 0,
          totalFrais: 0,
          tauxList: [],
          notesList: [],
          vitesseList: [],
        };
      }
      groups[name].ops.push(op);
      groups[name].totalMga += Number(op.montantMga) || 0;
      groups[name].totalRmb += Number(op.montantRmb) || 0;
      groups[name].totalFrais += Number(op.fraisMga) || 0;
      if (op.taux > 0) groups[name].tauxList.push(op.taux);
      groups[name].notesList.push(op.noteFiabilite || 5);
      if (op.vitesseExecution) groups[name].vitesseList.push(op.vitesseExecution);
    });

    const list = Object.values(groups).map(g => {
      const sortedOps = [...g.ops].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const minTaux = g.tauxList.length > 0 ? Math.min(...g.tauxList) : 0;
      const maxTaux = g.tauxList.length > 0 ? Math.max(...g.tauxList) : 0;
      const dernierTaux = sortedOps[0]?.taux || 0;
      const derniereDate = sortedOps[0]?.date || '';
      const tauxMoyen = g.totalRmb > 0 ? Math.round(((g.totalMga + g.totalFrais) / g.totalRmb) * 100) / 100 : 0;
      const avgNote = g.notesList.length > 0 ? Math.round((g.notesList.reduce((a, b) => a + b, 0) / g.notesList.length) * 10) / 10 : 5;

      const vitesseCount: Record<string, number> = {};
      g.vitesseList.forEach(v => { vitesseCount[v] = (vitesseCount[v] || 0) + 1; });
      let speedDominante = VITESSE_OPTIONS[0];
      let maxCount = 0;
      Object.entries(vitesseCount).forEach(([v, count]) => {
        if (count > maxCount) {
          maxCount = count;
          speedDominante = v;
        }
      });

      return {
        name: g.name,
        nbOps: g.ops.length,
        totalMga: g.totalMga + g.totalFrais,
        totalRmb: g.totalRmb,
        tauxMoyen,
        minTaux,
        maxTaux,
        dernierTaux,
        derniereDate,
        avgNote,
        vitesseDominante: g.vitesseList.length > 0 ? speedDominante : VITESSE_OPTIONS[0],
        ops: sortedOps,
      };
    });

    list.sort((a, b) => a.tauxMoyen - b.tauxMoyen);

    const bestRateItem = list.length > 0 ? [...list].sort((a, b) => a.tauxMoyen - b.tauxMoyen)[0] : null;
    const fastestItem = list.length > 0 ? list.find(x => x.vitesseDominante.includes('< 1h')) || list[0] : null;
    const mostReliableItem = list.length > 0 ? [...list].sort((a, b) => b.avgNote - a.avgNote)[0] : null;

    return {
      list,
      bestRateItem,
      fastestItem,
      mostReliableItem,
    };
  }, [changes]);

  // Intermédiaires uniques pour filtres
  const intermediairesUniques = useMemo(() => {
    const set = new Set<string>();
    changes.forEach(c => {
      const p = c.fournisseur || c.exchanger?.split(' (')[0];
      if (p) set.add(p);
    });
    return Array.from(set);
  }, [changes]);

  // Filtrage des opérations
  const filtrerOperations = useMemo(() => {
    return changes
      .filter(c => {
        const opFrns = c.fournisseur || c.exchanger || '';
        const opCanal = c.canal || '';

        if (filterFournisseur !== 'Tous' && opFrns !== filterFournisseur && c.exchanger !== filterFournisseur) return false;
        if (filterCanal !== 'Tous' && opCanal !== filterCanal) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchFrns = opFrns.toLowerCase().includes(q);
          const matchCanal = opCanal.toLowerCase().includes(q);
          const matchEx = c.exchanger?.toLowerCase().includes(q);
          const matchRef = c.reference?.toLowerCase().includes(q);
          const matchNotes = c.notes?.toLowerCase().includes(q);
          const matchCompte = c.compteSource?.toLowerCase().includes(q);
          if (!matchFrns && !matchCanal && !matchEx && !matchRef && !matchNotes && !matchCompte) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [changes, filterFournisseur, filterCanal, searchQuery]);

  // Enregistrer ou modifier une opération avec impact Trésorerie automatique
  const enregistrerOperation = () => {
    const mga = Number(form.montantMga);
    const rmb = Number(form.montantRmb);
    if (!mga || !rmb || mga <= 0 || rmb <= 0) return;

    const frais = Number(form.fraisMga) || 0;
    const tauxFinal = Number(form.taux) || Math.round((mga / rmb) * 100) / 100;
    const opId = editingId || uid();
    const mvtId = editingId ? (changes.find(c => c.id === editingId)?.mouvementId || uid()) : uid();

    const dateIso = safeDateIso(form.date);

    const provider = form.fournisseur?.trim() || 'Non spécifié';
    const channel = form.canal || CANAUX_RMB[0];
    const exLabel = `${provider} (${channel})`;

    const nouvelleOp: OperationChange = {
      id: opId,
      date: form.date,
      montantMga: mga,
      montantRmb: rmb,
      taux: tauxFinal,
      fraisMga: frais > 0 ? frais : undefined,
      fournisseur: provider,
      canal: channel,
      exchanger: exLabel,
      vitesseExecution: form.vitesseExecution || VITESSE_OPTIONS[0],
      noteFiabilite: Number(form.noteFiabilite) || 5,
      compteSource: form.compteSource,
      domaineFonds: form.domaineFonds,
      reference: form.reference.trim(),
      notes: form.notes.trim(),
      genererMouvementTresorerie: form.genererMouvementTresorerie,
      mouvementId: form.genererMouvementTresorerie ? mvtId : undefined,
    };

    let nextChanges = [...changes];
    if (editingId) {
      nextChanges = nextChanges.map(c => (c.id === editingId ? nouvelleOp : c));
    } else {
      nextChanges = [nouvelleOp, ...nextChanges];
    }

    // Synchronisation automatique avec la Trésorerie
    let nextMouvements = [...mouvements];
    if (form.genererMouvementTresorerie) {
      const isPerso = form.domaineFonds === 'perso';
      const mouvementTresorerie = {
        id: mvtId,
        type: 'sortie',
        categorie: 'change',
        montant: mga + frais,
        compte: form.compteSource || 'MVola',
        tag: isPerso ? '#retrait-perso' : '#change-rmb',
        isInvestissement: isPerso,
        reference: form.reference.trim() || `Change RMB (${provider})`,
        description: `Change ${mga.toLocaleString('fr-FR')} Ar ➔ ${rmb.toLocaleString('fr-FR')} ¥ via ${channel} (${provider} @ ${tauxFinal} Ar/¥)${frais > 0 ? ` + ${frais.toLocaleString('fr-FR')} Ar frais` : ''} [${isPerso ? 'Fonds Perso' : 'Fonds Business'}]`,
        date: dateIso,
        changeId: opId,
      };

      const existingMvtIndex = nextMouvements.findIndex(m => m.id === mvtId || m.changeId === opId);
      if (existingMvtIndex >= 0) {
        nextMouvements[existingMvtIndex] = mouvementTresorerie;
      } else {
        nextMouvements = [mouvementTresorerie, ...nextMouvements];
      }
    } else {
      nextMouvements = nextMouvements.filter(m => m.changeId !== opId && m.id !== mvtId);
    }

    updateData({
      changes: nextChanges,
      mouvements: nextMouvements,
    });

    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleTauxChange = (val: string) => {
    const t = Number(val);
    const rmb = Number(form.montantRmb);
    if (t > 0 && rmb > 0) {
      const calcMga = Math.round(rmb * t);
      setForm({
        ...form,
        taux: val,
        montantMga: String(calcMga),
      });
    } else {
      setForm({ ...form, taux: val });
    }
  };

  const editerOperation = (op: OperationChange) => {
    setEditingId(op.id);
    setForm({
      date: op.date || today,
      montantMga: String(op.montantMga),
      montantRmb: String(op.montantRmb),
      taux: String(op.taux),
      fraisMga: op.fraisMga ? String(op.fraisMga) : '',
      fournisseur: op.fournisseur || op.exchanger?.split(' (')[0] || INTERMEDIAIRES_HABITUELS[0],
      canal: op.canal || CANAUX_RMB[0],
      vitesseExecution: op.vitesseExecution || VITESSE_OPTIONS[0],
      noteFiabilite: String(op.noteFiabilite || 5),
      compteSource: op.compteSource || 'MVola',
      domaineFonds: op.domaineFonds || 'business',
      reference: op.reference || '',
      notes: op.notes || '',
      genererMouvementTresorerie: op.genererMouvementTresorerie ?? true,
    });
    setShowForm(true);
  };

  const supprimerOperation = (opId: string) => {
    const op = changes.find(c => c.id === opId);
    const nextChanges = changes.filter(c => c.id !== opId);
    const nextMouvements = mouvements.filter(m => m.changeId !== opId && (!op?.mouvementId || m.id !== op.mouvementId));

    updateData({
      changes: nextChanges,
      mouvements: nextMouvements,
    });
  };

  const appliquerTauxGlobal = () => {
    if (stats.tauxMoyenPondere > 0) {
      const arrondi = Math.round(stats.tauxMoyenPondere);
      updateData({
        devises: {
          ...devises,
          rmb: arrondi,
        },
      });
      if (onApplyTauxToApp) onApplyTauxToApp(arrondi);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header & KPI */}
      <ChangeHeaderKPI
        stats={stats}
        soldeRmbInfo={soldeRmbInfo}
        showForm={showForm}
        onToggleForm={() => {
          if (showForm) {
            setShowForm(false);
            setEditingId(null);
          } else {
            setEditingId(null);
            setForm(initialForm);
            setShowForm(true);
          }
        }}
        onAppliquerTauxGlobal={appliquerTauxGlobal}
      />

      {/* Formulaire de Saisie / Modification */}
      {showForm && (
        <FormulaireChange
          editingId={editingId}
          form={form}
          setForm={setForm}
          onSave={enregistrerOperation}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          handleTauxChange={handleTauxChange}
          comptes={comptes}
        />
      )}

      {/* Navigation Sous-Onglets */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #EAE2D4', paddingBottom: 6 }}>
        <button
          type="button"
          onClick={() => setSubTab('journal')}
          style={{
            background: subTab === 'journal' ? '#2C5E43' : '#FAF7F2',
            color: subTab === 'journal' ? '#FFFFFF' : '#5E584E',
            border: subTab === 'journal' ? '1px solid #2C5E43' : '1px solid #EAE2D4',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Coins size={14} />
          <span>Journal des Opérations ({changes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('fiabilite')}
          style={{
            background: subTab === 'fiabilite' ? '#2C5E43' : '#FAF7F2',
            color: subTab === 'fiabilite' ? '#FFFFFF' : '#5E584E',
            border: subTab === 'fiabilite' ? '1px solid #2C5E43' : '1px solid #EAE2D4',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Star size={14} color={subTab === 'fiabilite' ? '#FFD700' : '#B78103'} />
          <span>Comparateur & Fiabilité Exchangers ({exchangersAnalysis.list.length})</span>
        </button>
      </div>

      {subTab === 'fiabilite' ? (
        <ComparateurExchangers exchangersAnalysis={exchangersAnalysis} />
      ) : (
        <JournalOperationsChange
          operations={filtrerOperations}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterFournisseur={filterFournisseur}
          setFilterFournisseur={setFilterFournisseur}
          filterCanal={filterCanal}
          setFilterCanal={setFilterCanal}
          intermediairesList={intermediairesUniques}
          onEdit={editerOperation}
          onDelete={supprimerOperation}
        />
      )}
    </div>
  );
});

export default ChangeRMB;
