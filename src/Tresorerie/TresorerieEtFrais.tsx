import React, { useState } from 'react';
import { Wallet, FileText, ArrowLeftRight, CreditCard, Truck } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import Tresorerie from './index';
import NotesDeFrais from '../frais/NotesDeFrais';
import ChangeRMB from '../change/ChangeRMB';
import CreancesClients from './CreancesClients';
import DettesFournisseurs from './DettesFournisseurs';
import ModalPaiementFacture from './ModalPaiementFacture';
import { useTresorerieForms } from './useTresorerieForms';
import { getRestePayeVente, getRestePayeFret, getRestePayeMarchandise, calculerSoldeRMB } from '../paymentUtils';

interface TresorerieEtFraisProps {
  ventes?: any[];
  commandes?: any[];
  products?: any[];
  fournisseurs?: any[];
  clients?: any[];
  mouvements?: any[];
  changes?: any[];
  devises?: { rmb: number; usd: number };
  frais?: any[];
  comptes?: string[];
  paiements?: any[];
  updateData: (patch: any) => void;
  initialSubTab?: 'tresorerie' | 'creances' | 'dettes' | 'frais' | 'change';
}

export default function TresorerieEtFrais({
  ventes = [],
  commandes = [],
  products = [],
  fournisseurs = [],
  clients = [],
  mouvements = [],
  changes = [],
  devises = { rmb: 680, usd: 4600 },
  frais = [],
  comptes = [],
  paiements = [],
  updateData,
  initialSubTab = 'tresorerie',
}: TresorerieEtFraisProps) {
  const [subTab, setSubTab] = useState<'tresorerie' | 'creances' | 'dettes' | 'frais' | 'change'>(
    initialSubTab
  );

  const today = new Date().toISOString().slice(0, 10);

  const {
    showPaiementFactureModal,
    setShowPaiementFactureModal,
    factureForm,
    setFactureForm,
    ventesUnpaid,
    commandesUnpaidMarchandise,
    commandesUnpaidFret,
    handleNatureChange,
    handleToggleSelectId,
    handleToggleSelectAll,
    enregistrerPaiementFacture,
  } = useTresorerieForms({
    ventes,
    commandes,
    products,
    fournisseurs,
    clients,
    mouvements,
    paiements,
    updateData,
    today,
  });

  const handleEncaisserVente = (venteId: string) => {
    const v = ventes.find(item => item.id === venteId);
    const reste = v ? getRestePayeVente(v, paiements) : 0;
    const cl = clients.find(c => c.id === v?.clientId);

    setFactureForm({
      nature: 'vente',
      selectedIds: [venteId],
      selectedId: venteId,
      compte: v?.modePaiement || 'Caisse / Espèces',
      montant: String(reste),
      frais: '',
      beneficiaire: cl?.nom || v?.description || 'Client',
      description: `Encaissement Solde Vente #${venteId.slice(0, 6)}`,
      reference: '',
      date: today,
    });
    setShowPaiementFactureModal(true);
  };

  const handleEncaisserClient = (clientId: string, venteIds: string[]) => {
    let sum = 0;
    venteIds.forEach(id => {
      const v = ventes.find(item => item.id === id);
      if (v) sum += getRestePayeVente(v, paiements);
    });
    const cl = clients.find(c => c.id === clientId);

    setFactureForm({
      nature: 'vente',
      selectedIds: venteIds,
      selectedId: venteIds[0] || '',
      compte: 'Caisse / Espèces',
      montant: String(sum),
      frais: '',
      beneficiaire: cl?.nom || 'Client',
      description: `Encaissement groupé Client (${venteIds.length} factures)`,
      reference: '',
      date: today,
    });
    setShowPaiementFactureModal(true);
  };

  const handlePayerFret = (commandeId: string) => {
    const c = commandes.find((item: any) => item.id === commandeId);
    const reste = c ? getRestePayeFret(c, paiements) : 0;
    const trans = fournisseurs.find((f: any) => f.id === c?.transitaireId);
    const p = products.find((pr: any) => pr.id === c?.productId);

    setFactureForm({
      nature: 'fret',
      selectedIds: [commandeId],
      selectedId: commandeId,
      compte: c?.compteFret || 'MVola',
      montant: String(reste),
      frais: '',
      beneficiaire: trans?.nom || 'Transitaire',
      description: `Règlement Fret — ${p ? p.nom : 'Colis'} (${trans?.nom || c?.modeExpedition || 'Fret'})`,
      reference: c?.tracking || '',
      date: today,
    });
    setShowPaiementFactureModal(true);
  };

  const handlePayerTransitaireGroup = (transitaireId: string, commandeIds: string[]) => {
    let sum = 0;
    commandeIds.forEach(id => {
      const c = commandes.find((item: any) => item.id === id);
      if (c) sum += getRestePayeFret(c, paiements);
    });
    const trans = fournisseurs.find((f: any) => f.id === transitaireId);

    setFactureForm({
      nature: 'fret',
      selectedIds: commandeIds,
      selectedId: commandeIds[0] || '',
      compte: 'MVola',
      montant: String(sum),
      frais: '',
      beneficiaire: trans?.nom || 'Transitaire',
      description: `Règlement groupé Fret Transitaire (${commandeIds.length} colis)`,
      reference: '',
      date: today,
    });
    setShowPaiementFactureModal(true);
  };

  const handlePayerAchat = (commandeId: string) => {
    const c = commandes.find((item: any) => item.id === commandeId);
    const reste = c ? getRestePayeMarchandise(c, paiements) : 0;
    const four = fournisseurs.find((f: any) => f.id === c?.fournisseurId);
    const p = products.find((pr: any) => pr.id === c?.productId);

    setFactureForm({
      nature: 'marchandise',
      selectedIds: [commandeId],
      selectedId: commandeId,
      compte: c?.comptePayeur || 'MVola',
      montant: String(reste),
      frais: '',
      beneficiaire: four?.nom || c?.source || 'Fournisseur Chine',
      description: `Règlement Achat — ${p ? p.nom : 'Article'}`,
      reference: c?.tracking || '',
      date: today,
    });
    setShowPaiementFactureModal(true);
  };

  const handlePayerFournisseurGroup = (fournisseurId: string, commandeIds: string[]) => {
    let sum = 0;
    commandeIds.forEach(id => {
      const c = commandes.find((item: any) => item.id === id);
      if (c) sum += getRestePayeMarchandise(c, paiements);
    });
    const four = fournisseurs.find((f: any) => f.id === fournisseurId);

    setFactureForm({
      nature: 'marchandise',
      selectedIds: commandeIds,
      selectedId: commandeIds[0] || '',
      compte: 'MVola',
      montant: String(sum),
      frais: '',
      beneficiaire: four?.nom || 'Fournisseur Chine',
      description: `Règlement groupé Achats Chine (${commandeIds.length} commandes)`,
      reference: '',
      date: today,
    });
    setShowPaiementFactureModal(true);
  };

  const soldeRmbInfo = calculerSoldeRMB(changes, mouvements, commandes, devises, paiements);

  const TABS = [
    { id: 'tresorerie', label: 'Trésorerie & Mouvements', icon: Wallet },
    { id: 'dettes', label: `Dettes & Factures Fret (${commandesUnpaidFret.length + commandesUnpaidMarchandise.length})`, icon: Truck },
    { id: 'creances', label: `Créances Clients (${ventesUnpaid.length})`, icon: CreditCard },
    { id: 'change', label: 'Change RMB', icon: ArrowLeftRight },
    { id: 'frais', label: 'Notes de Frais', icon: FileText },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête principal & Navigation par onglets */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 4,
        borderBottom: `1px solid ${THEME.border.base}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: THEME.bg.chip,
            color: THEME.accent.primary,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
          }}>
            <Wallet size={20} />
          </div>
          <div>
            <h1 style={{ ...TYPOGRAPHY.sectionTitle, margin: 0, fontSize: 19, color: THEME.text.primary }}>
              Trésorerie & Devises
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: THEME.text.muted }}>
              Gestion des comptes financiers, créances clients, change RMB et notes de frais.
            </p>
          </div>
        </div>

        {/* Boutons d'onglets */}
        <div className="tabs-scrollable" style={{
          display: 'flex',
          background: THEME.bg.soft,
          padding: 3,
          borderRadius: 8,
          border: `1px solid ${THEME.border.base}`,
          gap: 2,
          maxWidth: '100%',
        }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  background: active ? THEME.bg.card : 'transparent',
                  color: active ? THEME.accent.primary : THEME.text.secondary,
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} style={{ color: active ? THEME.accent.primary : THEME.text.muted }} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu de l'onglet sélectionné */}
      {subTab === 'tresorerie' && (
        <Tresorerie
          ventes={ventes}
          commandes={commandes}
          products={products}
          fournisseurs={fournisseurs}
          clients={clients}
          mouvements={mouvements}
          changes={changes}
          devises={devises}
          updateData={updateData}
          comptes={comptes}
          paiements={paiements}
        />
      )}

      {subTab === 'dettes' && (
        <DettesFournisseurs
          commandes={commandes}
          fournisseurs={fournisseurs}
          products={products}
          paiements={paiements}
          onPayerFret={handlePayerFret}
          onPayerTransitaireGroup={handlePayerTransitaireGroup}
          onPayerAchat={handlePayerAchat}
          onPayerFournisseurGroup={handlePayerFournisseurGroup}
        />
      )}

      {subTab === 'creances' && (
        <CreancesClients
          ventes={ventes}
          clients={clients}
          products={products}
          paiements={paiements}
          onEncaisserVente={handleEncaisserVente}
          onEncaisserClient={handleEncaisserClient}
        />
      )}

      {subTab === 'change' && (
        <ChangeRMB
          changes={changes}
          mouvements={mouvements}
          commandes={commandes}
          devises={devises}
          fournisseurs={fournisseurs}
          updateData={updateData}
          comptes={comptes}
          paiements={paiements}
        />
      )}

      {subTab === 'frais' && (
        <NotesDeFrais
          frais={frais}
          mouvements={mouvements}
          comptes={comptes}
          updateData={updateData}
        />
      )}

      {/* Modal de paiement déclenché depuis Créances Clients */}
      <ModalPaiementFacture
        show={showPaiementFactureModal}
        onClose={() => setShowPaiementFactureModal(false)}
        factureForm={factureForm}
        setFactureForm={setFactureForm}
        handleNatureChange={handleNatureChange}
        handleToggleSelectId={handleToggleSelectId}
        handleToggleSelectAll={handleToggleSelectAll}
        enregistrerPaiementFacture={enregistrerPaiementFacture}
        ventesUnpaid={ventesUnpaid}
        commandesUnpaidMarchandise={commandesUnpaidMarchandise}
        commandesUnpaidFret={commandesUnpaidFret}
        products={products}
        clients={clients}
        fournisseurs={fournisseurs}
        paiements={paiements}
        today={today}
        comptes={comptes}
        soldeRmbInfo={soldeRmbInfo}
      />
    </div>
  );
}

