/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { Zap, Package, LayoutDashboard, Plus, Trash2, TrendingUp, Ship, ShoppingCart, Truck, Wallet, Factory, Users, Compass, ArrowDownCircle, ArrowUpCircle, Menu, X, ChevronRight, ArrowRightLeft, HardDrive, ExternalLink, Coins, Sun, Moon, Settings, Activity, FileSpreadsheet, Wifi, WifiOff, Terminal, Grid } from 'lucide-react';
import { ApiTesterModal } from './components/ApiTesterModal';
import { THEME, CHART_COLORS as COLORS } from './colors';
import { FONTS, TYPOGRAPHY } from './fonts';
import {
  CATEGORIES,
  SOURCES,
  STATUTS_ACHAT,
  STATUTS_LOGISTIQUE,
  STATUTS,
  STATUTS_SOURCING,
  STATUT_DATE_FIELD,
  TYPES_ENVOI_MARITIME,
  TYPES_ENVOI_AERIEN,
  COMPTES_FINANCIERS,
  SECTIONS,
  uid,
} from './constants';
import { Card, cardTitle, Label, Field, Empty, Stat, SectionHeader, Modal, inputStyle, selectStyle, primaryBtn, ghostBtn, iconBtn, rowCard, tooltipStyle } from './ui';
import VenteRapide from './ventes/VenteRapide';
import Achat from './achat/Achat';
import Logistique from './logistique/Logistique';
import Stock from './stock/Stock';
import TresorerieEtFrais from './Tresorerie/TresorerieEtFrais';
import Partenaires from './partenaires/Partenaires';
import Sourcing from './sourcing/Sourcing';
import Dashboard from './dashboard/Dashboard';
import FinancesStructurelles from './finances/FinancesStructurelles';
import EtatsFinanciers from './finances/EtatsFinanciers';
import SystemeOutils from './systeme/SystemeOutils';
import { getStatutVenteLabel } from './paymentUtils';
import { calculerScoreFournisseur, getQCBadgeInfo } from './qcUtils';
import BackupModal from './backup/BackupModal';
import BackupBanner from './backup/BackupBanner';
import ModalDevises from './components/ModalDevises';
import ModalExportCsv from './components/ModalExportCsv';
import GlobalSearchBar from './components/GlobalSearchBar';
import DiagnosticReport from './dashboard/DiagnosticReport';
import SetupWizard from './setup/SetupWizard';
import { Sparkles } from 'lucide-react';
import { persistDouble, loadWithFallback } from './backup/indexedDbStore';
import { verifierAutoBackupQuotidien, verifierAutoBackupApresVente, migrateDataSchema } from './backup/backupUtils';


export default function App() {
  const [tab, setTab] = useState('vente');
  const [searchPreset, setSearchPreset] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [devisesOpen, setDevisesOpen] = useState(false);
  const [exportCsvOpen, setExportCsvOpen] = useState(false);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [apiTesterOpen, setApiTesterOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [sourcing, setSourcing] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [changes, setChanges] = useState([]);
  const [immobilisations, setImmobilisations] = useState([]);
  const [emprunts, setEmprunts] = useState([]);
  const [frais, setFrais] = useState([]);
  const [chargesFixes, setChargesFixes] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [devises, setDevises] = useState({ rmb: 680, usd: 4600 });
  const [comptes, setComptes] = useState<string[]>(COMPTES_FINANCIERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('comptoir-theme') === 'dark';
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('comptoir-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('comptoir-theme', 'light');
      }
    } catch (_) {}
  }, [darkMode]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await loadWithFallback('erp-data');
        if (raw) {
          const data = migrateDataSchema(raw);
          setProducts(data.products || []);
          setVentes(data.ventes || []);
          setCommandes(data.commandes || []);
          setFournisseurs(data.fournisseurs || []);
          setClients(data.clients || []);
          setSourcing(data.sourcing || []);
          setMouvements(data.mouvements || []);
          setChanges(data.changes || []);
          setImmobilisations(data.immobilisations || []);
          setEmprunts(data.emprunts || []);
          setFrais(data.frais || []);
          setChargesFixes(data.chargesFixes || []);
          setPaiements(data.paiements || []);
          if (data.devises) setDevises(data.devises);
          if (data.comptes && Array.isArray(data.comptes) && data.comptes.length > 0) setComptes(data.comptes);
          verifierAutoBackupQuotidien(data, 1);
        }

        // Première utilisation : afficher le Setup Wizard si non encore complété
        if (!localStorage.getItem('comptoir_setup_done')) {
          setSetupWizardOpen(true);
        }
      } catch (e) {
        console.error('Erreur chargement backup', e);
      }
      setLoading(false);
    })();
  }, []);

  // Ref pour garder l'état courant à jour sans déclencher de re-rendu de callback
  const stateRef = useRef<any>({});
  stateRef.current = {
    products, ventes, commandes, fournisseurs, clients, sourcing,
    mouvements, changes, devises, comptes, immobilisations, emprunts,
    frais, chargesFixes, paiements
  };

  const persist = useCallback(async (next: any) => {
    await persistDouble('erp-data', next);
  }, []);

  const save = useCallback((overrides: any) => {
    const cur = stateRef.current;
    const next = {
      products: overrides.products ?? cur.products,
      ventes: overrides.ventes ?? cur.ventes,
      commandes: overrides.commandes ?? cur.commandes,
      fournisseurs: overrides.fournisseurs ?? cur.fournisseurs,
      clients: overrides.clients ?? cur.clients,
      sourcing: overrides.sourcing ?? cur.sourcing,
      mouvements: overrides.mouvements ?? cur.mouvements,
      changes: overrides.changes ?? cur.changes,
      devises: overrides.devises ?? cur.devises,
      comptes: overrides.comptes ?? cur.comptes,
      immobilisations: overrides.immobilisations ?? cur.immobilisations,
      emprunts: overrides.emprunts ?? cur.emprunts,
      frais: overrides.frais ?? cur.frais,
      chargesFixes: overrides.chargesFixes ?? cur.chargesFixes,
      paiements: overrides.paiements ?? cur.paiements,
    };

    if (overrides.ventes && overrides.ventes.length > cur.ventes.length) {
      verifierAutoBackupApresVente(next, 10);
    }

    if (overrides.products !== undefined) setProducts(next.products);
    if (overrides.ventes !== undefined) setVentes(next.ventes);
    if (overrides.commandes !== undefined) setCommandes(next.commandes);
    if (overrides.fournisseurs !== undefined) setFournisseurs(next.fournisseurs);
    if (overrides.clients !== undefined) setClients(next.clients);
    if (overrides.sourcing !== undefined) setSourcing(next.sourcing);
    if (overrides.mouvements !== undefined) setMouvements(next.mouvements);
    if (overrides.changes !== undefined) setChanges(next.changes);
    if (overrides.devises !== undefined) setDevises(next.devises);
    if (overrides.comptes !== undefined) setComptes(next.comptes);
    if (overrides.immobilisations !== undefined) setImmobilisations(next.immobilisations);
    if (overrides.emprunts !== undefined) setEmprunts(next.emprunts);
    if (overrides.frais !== undefined) setFrais(next.frais);
    if (overrides.chargesFixes !== undefined) setChargesFixes(next.chargesFixes);
    if (overrides.paiements !== undefined) setPaiements(next.paiements);

    persist(next);
  }, [persist]);

  const updateAll = useCallback((p: any, v: any, c: any) => save({ products: p, ventes: v, commandes: c }), [save]);
  const updateData = useCallback((patch: any) => save(patch), [save]);

  const handleSetupComplete = useCallback((setupData: any) => {
    try {
      localStorage.setItem('comptoir_setup_done', 'true');
    } catch (_) {}

    const patch: any = {};
    if (setupData.devises) patch.devises = setupData.devises;
    if (setupData.comptes) patch.comptes = setupData.comptes;

    if (setupData.newProduct) {
      patch.products = [setupData.newProduct, ...products];
    }
    if (setupData.newFournisseur) {
      patch.fournisseurs = [setupData.newFournisseur, ...fournisseurs];
    }
    if (setupData.newClient) {
      patch.clients = [setupData.newClient, ...clients];
    }
    if (setupData.initialMouvements) {
      patch.mouvements = [...(setupData.initialMouvements), ...mouvements];
    }
    if (setupData.newChargeFixe) {
      patch.chargesFixes = [setupData.newChargeFixe, ...chargesFixes];
    }

    save(patch);
    setSetupWizardOpen(false);
  }, [products, fournisseurs, clients, mouvements, chargesFixes]);



  const memoizedCounts = useMemo(() => ({
    produits: products.length,
    achats: commandes.filter((c: any) => c.statut === 'Commandé').length,
    transit: commandes.filter((c: any) => STATUTS_LOGISTIQUE.includes(c.statut) && c.statut !== 'Arrivé').length,
    fournisseurs: fournisseurs.length,
    clients: clients.length,
    changes: changes.length,
  }), [products.length, commandes, fournisseurs.length, clients.length, changes.length]);

  const currentSection = SECTIONS.find(s => s.id === tab) || SECTIONS[0];

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#3D5A6C' }}>Chargement…</div>;
  }

  return (
    <div style={{
      background: THEME.bg.base,
      minHeight: '100vh',
      color: THEME.text.primary,
      width: '100%',
      overflowX: 'hidden',
    }}>
      <Header
        saving={saving}
        isOnline={isOnline}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenBackup={() => setBackupOpen(true)}
        onOpenDevises={() => setDevisesOpen(true)}
        devises={devises}
        currentSection={currentSection}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev: boolean) => !prev)}
        products={products}
        commandes={commandes}
        clients={clients}
        fournisseurs={fournisseurs}
        onNavigate={(targetTab: string, preset?: string) => {
          setTab(targetTab);
          if (preset !== undefined) {
            setSearchPreset(preset);
          }
        }}
      />

      <div style={{ maxWidth: 1140, margin: '14px auto 0', padding: '0 16px' }}>
        <BackupBanner data={{ products, ventes, commandes, fournisseurs, clients, sourcing, mouvements, changes, devises, immobilisations, emprunts, frais, chargesFixes }} />
      </div>

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tab={tab}
        setTab={(newTab: string) => {
          setTab(newTab);
          setDrawerOpen(false);
        }}
        counts={memoizedCounts}
        saving={saving}
      />

      <div style={{ padding: '20px 16px 80px', maxWidth: 1140, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {tab === 'vente' && (
          <VenteRapide
            products={products}
            ventes={ventes}
            commandes={commandes}
            clients={clients}
            updateAll={updateAll}
            updateData={updateData}
            comptes={comptes}
            paiements={paiements}
            mouvements={mouvements}
            fournisseurs={fournisseurs}
          />
        )}
        {tab === 'achat' && (
          <Achat products={products} commandes={commandes} ventes={ventes} fournisseurs={fournisseurs} devises={devises} changes={changes} mouvements={mouvements} updateAll={updateAll} sourcing={sourcing} updateData={updateData} onNavigateTab={(targetTab: string) => setTab(targetTab)} initialSearch={searchPreset} paiements={paiements} comptes={comptes} />
        )}
        {tab === 'logistique' && (
          <Logistique products={products} commandes={commandes} ventes={ventes} fournisseurs={fournisseurs} devises={devises} updateAll={updateAll} onNavigateTab={(targetTab: string) => setTab(targetTab)} />
        )}
        {tab === 'stock' && (
          <Stock products={products} commandes={commandes} ventes={ventes} mouvements={mouvements} devises={devises} updateAll={updateAll} updateData={updateData} initialSearch={searchPreset} />
        )}
        {(tab === 'tresorerie' || tab === 'frais' || tab === 'change') && (
          <TresorerieEtFrais
            ventes={ventes}
            commandes={commandes}
            products={products}
            fournisseurs={fournisseurs}
            clients={clients}
            mouvements={mouvements}
            changes={changes}
            devises={devises}
            frais={frais}
            comptes={comptes}
            paiements={paiements}
            updateData={updateData}
            initialSubTab={tab === 'frais' ? 'frais' : tab === 'change' ? 'change' : 'tresorerie'}
          />
        )}
        {(tab === 'finances-structurelles' || tab === 'charges-fixes' || tab === 'immobilisations' || tab === 'emprunts') && (
          <FinancesStructurelles
            chargesFixes={chargesFixes}
            immobilisations={immobilisations}
            emprunts={emprunts}
            mouvements={mouvements}
            ventes={ventes}
            products={products}
            commandes={commandes}
            devises={devises}
            comptes={comptes}
            updateData={updateData}
            initialSubTab={tab === 'immobilisations' || tab === 'emprunts' ? tab : 'charges-fixes'}
          />
        )}
        {(tab === 'etats-financiers' || tab === 'pnl' || tab === 'bilan' || tab === 'projection-tresorerie') && (
          <EtatsFinanciers
            products={products}
            ventes={ventes}
            commandes={commandes}
            mouvements={mouvements}
            frais={frais}
            immobilisations={immobilisations}
            emprunts={emprunts}
            comptes={comptes}
            devises={devises}
            chargesFixes={chargesFixes}
            paiements={paiements}
            fournisseurs={fournisseurs}
            initialSubTab={tab === 'bilan' ? 'bilan' : tab === 'projection-tresorerie' ? 'projection' : 'pnl'}
          />
        )}
        {(tab === 'partenaires' || tab === 'fournisseurs' || tab === 'clients') && (
          <Partenaires
            fournisseurs={fournisseurs}
            clients={clients}
            commandes={commandes}
            ventes={ventes}
            products={products}
            updateData={updateData}
            initialSubTab={tab === 'clients' ? 'clients' : 'fournisseurs'}
            initialSearch={searchPreset}
            paiements={paiements}
          />
        )}
        {tab === 'sourcing' && (
          <Sourcing sourcing={sourcing} products={products} fournisseurs={fournisseurs} devises={devises} changes={changes} updateData={updateData} />
        )}
        {tab === 'dashboard' && (
          <Dashboard
            products={products}
            ventes={ventes}
            commandes={commandes}
            mouvements={mouvements}
            sourcing={sourcing}
            changes={changes}
            immobilisations={immobilisations}
            emprunts={emprunts}
            fournisseurs={fournisseurs}
            clients={clients}
            paiements={paiements}
            devises={devises}
            chargesFixes={chargesFixes}
            comptes={comptes}
            onNavigateTab={(targetTab) => setTab(targetTab)}
          />
        )}
        {(tab === 'systeme' || tab === 'parametres' || tab === 'devises' || tab === 'backup' || tab === 'diagnostic' || tab === 'export-csv' || tab === 'comptes' || tab === 'api') && (
          <SystemeOutils
            products={products}
            ventes={ventes}
            commandes={commandes}
            fournisseurs={fournisseurs}
            clients={clients}
            sourcing={sourcing}
            mouvements={mouvements}
            changes={changes}
            immobilisations={immobilisations}
            emprunts={emprunts}
            frais={frais}
            chargesFixes={chargesFixes}
            paiements={paiements}
            devises={devises}
            comptes={comptes}
            darkMode={darkMode}
            isOnline={isOnline}
            saving={saving}
            initialSubTab={
              tab === 'devises' ? 'devises' :
              tab === 'backup' ? 'backup' :
              tab === 'diagnostic' ? 'diagnostic' :
              tab === 'export-csv' ? 'export-csv' :
              tab === 'comptes' ? 'comptes' :
              tab === 'api' ? 'api' :
              tab === 'parametres' ? 'general' :
              'apercu'
            }
            updateData={updateData}
            save={save}
            onToggleDarkMode={() => setDarkMode((prev: boolean) => !prev)}
            onOpenSetupWizard={() => setSetupWizardOpen(true)}
            onNavigateTab={(targetTab: string) => setTab(targetTab)}
          />
        )}
      </div>

      <BackupModal
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
        data={{ products, ventes, commandes, fournisseurs, clients, sourcing, mouvements, changes, devises, immobilisations, emprunts, comptes, chargesFixes, frais, paiements }}
        onRestore={(newData) => save(newData)}
      />

      {diagnosticOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20, 16, 13, 0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(5px)' }}>
          <div className="modal-container" style={{
            background: THEME.bg.base,
            borderRadius: 16,
            padding: '22px 24px',
            width: '100%',
            maxWidth: 960,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25), 0 0 0 1px ' + THEME.border.strong,
            border: `1px solid ${THEME.border.base}`,
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${THEME.border.base}` }}>
              <div style={{ ...TYPOGRAPHY.appTitle, color: THEME.text.primary, fontSize: 18, lineHeight: 1.3, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={20} color={THEME.accent.orange} />
                <span>Diagnostic d'Intégrité des Données</span>
              </div>
              <button onClick={() => setDiagnosticOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 24, color: THEME.text.muted, lineHeight: 1, padding: '0 6px', borderRadius: 4 }} title="Fermer">&times;</button>
            </div>
            <div style={{ overflowY: 'auto', overflowX: 'hidden', paddingRight: 2, margin: '0 -2px', flex: 1 }}>
              <DiagnosticReport
                commandes={commandes}
                immobilisations={immobilisations}
                mouvements={mouvements}
                ventes={ventes}
                emprunts={emprunts}
                products={products}
                fournisseurs={fournisseurs}
                clients={clients}
                onNavigateTab={(targetTab: string) => {
                  setDiagnosticOpen(false);
                  setTab(targetTab);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ModalDevises
        open={devisesOpen}
        onClose={() => setDevisesOpen(false)}
        devises={devises}
        onSave={(nextDevises) => save({ devises: nextDevises })}
      />

      <ModalExportCsv
        open={exportCsvOpen}
        onClose={() => setExportCsvOpen(false)}
        ventes={ventes}
        commandes={commandes}
        mouvements={mouvements}
        products={products}
        clients={clients}
        fournisseurs={fournisseurs}
      />

      <SetupWizard
        show={setupWizardOpen}
        onClose={() => {
          try {
            localStorage.setItem('comptoir_setup_done', 'true');
          } catch (_) {}
          setSetupWizardOpen(false);
        }}
        onComplete={handleSetupComplete}
        currentDevises={devises}
        currentComptes={comptes}
      />

      {apiTesterOpen && (
        <ApiTesterModal onClose={() => setApiTesterOpen(false)} />
      )}
    </div>
  );
}

const Header = memo(function Header({ saving, isOnline = true, onOpenDrawer, onOpenBackup, onOpenDevises, devises, currentSection, darkMode, onToggleDarkMode, products, commandes, clients, fournisseurs, onNavigate }: any) {
  const Icon = currentSection.icon;

  return (
    <div style={{
      padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid ' + THEME.border.base,
      background: THEME.bg.base,
      position: 'sticky', top: 0, zIndex: 30,
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flexShrink: 0 }}>
        <button
          onClick={onOpenDrawer}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 4,
            border: '1px solid ' + THEME.border.strong, background: THEME.bg.card,
            color: THEME.text.primary, cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            flexShrink: 0,
          }}
          title="Ouvrir le menu des sections"
        >
          <Menu size={18} />
        </button>

        <div
          onClick={() => onNavigate('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, cursor: 'pointer' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 4, background: THEME.text.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid ' + THEME.border.strong,
          }}>
            <Package size={17} color={THEME.bg.base} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: FONTS.display,
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.05,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: THEME.text.primary
            }}>
              Comptoir Central
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: FONTS.mono,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: THEME.text.muted,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <Icon size={10} color={THEME.accent.primary} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: THEME.accent.primary, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSection.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRE DE RECHERCHE GLOBALE ARCHITECTURALE */}
      <div style={{ flex: '1 1 320px', maxWidth: 460, display: 'flex', justifyContent: 'center' }}>
        <GlobalSearchBar
          products={products}
          commandes={commandes}
          clients={clients}
          fournisseurs={fournisseurs}
          onNavigate={onNavigate}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={onOpenDrawer}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 4,
            border: '1px solid ' + THEME.border.strong, background: THEME.bg.card,
            fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: THEME.text.primary,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <Menu size={14} style={{ flexShrink: 0 }} />
          <span>Menu</span>
        </button>

        {/* STATUS META VARIATION 7 */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          fontFamily: FONTS.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
          lineHeight: 1.25,
          color: THEME.text.secondary
        }} className="hidden md:flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: !isOnline ? THEME.accent.orange : (saving ? THEME.accent.primary : THEME.accent.green), fontWeight: 600 }}>
            <span>●</span>
            <span>{!isOnline ? 'STATUS: OFFLINE' : saving ? 'SYNC: SAVING...' : 'STATUS: ONLINE'}</span>
          </div>
          <div style={{ color: THEME.text.muted, fontSize: 9 }}>[ERP 4.3.3]</div>
        </div>
      </div>
    </div>
  );
});

const NavDrawer = memo(function NavDrawer({ open, onClose, tab, setTab, counts, saving }: any) {
  if (!open) return null;

  const groups = Array.from(new Set(SECTIONS.map(s => s.group)));

  const getBadge = (id: string) => {
    if (id === 'stock' && counts.produits > 0) return `${counts.produits} art.`;
    if (id === 'achat' && counts.achats > 0) return `${counts.achats} à payer`;
    if (id === 'logistique' && counts.transit > 0) return `${counts.transit} en transit`;
    if (id === 'fournisseurs' && counts.fournisseurs > 0) return counts.fournisseurs;
    if (id === 'clients' && counts.clients > 0) return counts.clients;
    return null;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(29, 26, 22, 0.55)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Drawer content */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 'min(320px, 88vw)',
        height: '100%',
        background: THEME.bg.card,
        borderRight: '1px solid ' + THEME.border.strong,
        boxShadow: '4px 0 24px rgba(29, 26, 22, 0.15)',
        display: 'flex', flexDirection: 'column',
        zIndex: 101,
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '18px 20px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid ' + THEME.border.base,
          background: THEME.bg.base,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 4, background: THEME.text.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ship size={17} color={THEME.bg.base} />
            </div>
            <div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', color: THEME.text.primary, lineHeight: 1.1 }}>
                Comptoir Central
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: THEME.text.muted, marginTop: 2 }}>
                SYSTEM NAV_
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 4, border: '1px solid ' + THEME.border.strong,
              background: THEME.bg.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: THEME.text.muted,
              fontFamily: FONTS.mono, fontSize: 16
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
          {groups.map((groupName, gIdx) => {
            const groupSections = SECTIONS.filter(s => s.group === groupName);
            return (
              <div key={groupName} style={{ marginBottom: 20 }}>
                <div style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  color: THEME.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  padding: '4px 8px 8px',
                  opacity: 0.75
                }}>
                  {groupName}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {groupSections.map(item => {
                    const Icon = item.icon;
                    const active = tab === item.id;
                    const badge = getBadge(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setTab(item.id);
                          onClose();
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 12px', borderRadius: 4,
                          border: active ? `1px solid ${THEME.accent.primary}` : '1px solid transparent',
                          cursor: 'pointer', textAlign: 'left',
                          background: active ? THEME.bg.surface : 'transparent',
                          color: active ? THEME.accent.primary : THEME.text.primary,
                          fontWeight: active ? 600 : 500, fontSize: 13.5,
                          transition: 'all 0.1s ease',
                          width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: 4,
                            background: active ? THEME.accent.primary : THEME.bg.chip,
                            color: active ? THEME.bg.base : THEME.text.primary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={14} />
                          </div>
                          <span style={{ fontFamily: FONTS.body }}>{item.label}</span>
                        </div>
                        {badge && (
                          <span style={{
                            fontFamily: FONTS.mono,
                            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                            background: active ? THEME.accent.primary : THEME.bg.chip,
                            color: active ? THEME.bg.base : THEME.text.secondary,
                            letterSpacing: '0.04em'
                          }}>
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid ' + THEME.border.base,
          background: THEME.bg.base,
          fontFamily: FONTS.mono,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: THEME.text.muted,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>COMPTOIR CENTRAL</span>
          <span style={{ color: saving ? THEME.accent.orange : THEME.accent.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: saving ? THEME.accent.orange : THEME.accent.green }} />
            {saving ? 'SAVING…' : 'LOCAL DB OK'}
          </span>
        </div>
      </div>
    </div>
  );
});









