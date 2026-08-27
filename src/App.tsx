/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { Zap, Package, LayoutDashboard, Plus, Trash2, TrendingUp, Ship, ShoppingCart, Truck, Wallet, Factory, Users, Compass, ArrowDownCircle, ArrowUpCircle, Menu, X, ChevronRight, ArrowRightLeft, HardDrive, ExternalLink, Coins, Sun, Moon, Settings, Activity, FileSpreadsheet } from 'lucide-react';
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
  const [tab, setTab] = useState('dashboard');
  const [searchPreset, setSearchPreset] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [devisesOpen, setDevisesOpen] = useState(false);
  const [exportCsvOpen, setExportCsvOpen] = useState(false);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
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
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenBackup={() => setBackupOpen(true)}
        onOpenDevises={() => setDevisesOpen(true)}
        devises={devises}
        currentSection={currentSection}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
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
        onOpenBackup={() => {
          setDrawerOpen(false);
          setBackupOpen(true);
        }}
        onOpenDiagnostic={() => {
          setDrawerOpen(false);
          setDiagnosticOpen(true);
        }}
        onOpenDevises={() => {
          setDrawerOpen(false);
          setDevisesOpen(true);
        }}
        onOpenExportCsv={() => {
          setDrawerOpen(false);
          setExportCsvOpen(true);
        }}
        onOpenSetupWizard={() => {
          setDrawerOpen(false);
          setSetupWizardOpen(true);
        }}
        devises={devises}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev: boolean) => !prev)}
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
      </div>

      <BackupModal
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
        data={{ products, ventes, commandes, fournisseurs, clients, sourcing, mouvements, changes, devises, immobilisations, emprunts, comptes }}
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
    </div>
  );
}

const Header = memo(function Header({ saving, onOpenDrawer, onOpenBackup, onOpenDevises, devises, currentSection, darkMode, onToggleDarkMode, products, commandes, clients, fournisseurs, onNavigate }: any) {
  const Icon = currentSection.icon;
  return (
    <div style={{
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid ' + THEME.border.base,
      background: THEME.bg.base,
      position: 'sticky', top: 0, zIndex: 30,
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 0 }}>
        <button
          onClick={onOpenDrawer}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 8,
            border: '1px solid ' + THEME.border.base, background: THEME.bg.card,
            color: THEME.text.primary, cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            flexShrink: 0,
          }}
          title="Ouvrir le menu des sections"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6B4226 0%, #3D2312 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            border: '1px solid ' + THEME.border.strong,
          }}>
            <Package size={17} color="#F5ECE4" />
          </div>
          <div style={{ minWidth: 0 }} className="hidden md:block">
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: THEME.text.primary }}>
              Comptoir du Bois
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: THEME.text.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Icon size={11} color={THEME.accent.orange} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: THEME.accent.primary, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSection.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRE DE RECHERCHE GLOBALE */}
      <div style={{ flex: '1 1 320px', maxWidth: 440, display: 'flex', justifyContent: 'center' }}>
        <GlobalSearchBar
          products={products}
          commandes={commandes}
          clients={clients}
          fournisseurs={fournisseurs}
          onNavigate={onNavigate}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={onOpenDrawer}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid ' + THEME.border.base, background: THEME.bg.card,
            fontSize: 12.5, fontWeight: 600, color: THEME.accent.primary,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <Menu size={15} style={{ flexShrink: 0 }} />
          <span>Menu</span>
        </button>
        <div style={{ fontSize: 11, color: saving ? THEME.accent.orange : THEME.accent.green, fontWeight: 600, whiteSpace: 'nowrap' }} className="hidden sm:block">
          {saving ? 'Sauvegarde…' : '● Synchronisé'}
        </div>
      </div>
    </div>
  );
});

const NavDrawer = memo(function NavDrawer({ open, onClose, tab, setTab, counts, onOpenBackup, onOpenDiagnostic, onOpenDevises, onOpenExportCsv, onOpenSetupWizard, devises, darkMode, onToggleDarkMode, saving }: any) {
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
          background: 'rgba(18, 24, 31, 0.5)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Drawer content */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 'min(310px, 88vw)',
        height: '100%',
        background: THEME.bg.card,
        borderRight: '1px solid ' + THEME.border.base,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        zIndex: 101,
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '18px 18px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid ' + THEME.border.base,
          background: THEME.bg.base,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: THEME.accent.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ship size={17} color={THEME.bg.base} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: THEME.text.primary }}>Comptoir ERP</div>
              <div style={{ fontSize: 11, color: THEME.text.muted }}>Navigation & Paramètres</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 7, border: '1px solid ' + THEME.border.base,
              background: THEME.bg.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: THEME.text.muted,
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
          {groups.map((groupName, gIdx) => {
            const groupSections = SECTIONS.filter(s => s.group === groupName);
            return (
              <div key={groupName} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 10px 8px' }}>
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
                        onClick={() => setTab(item.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: 8,
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          background: active ? THEME.bg.surface : 'transparent',
                          color: active ? THEME.text.primary : THEME.text.secondary,
                          fontWeight: active ? 600 : 500, fontSize: 14,
                          transition: 'background 0.1s ease',
                          width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: active ? THEME.accent.orange : THEME.bg.chip,
                            color: active ? '#FFFFFF' : THEME.accent.primary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={15} />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        {badge && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                            background: active ? THEME.bg.card : THEME.border.base, color: THEME.accent.primary,
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

          {/* Section PARAMÈTRES */}
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid ' + THEME.border.base }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings size={13} color={THEME.accent.orange} />
              <span>PARAMÈTRES & CONFIGURATION</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Assistant Setup Wizard */}
              {onOpenSetupWizard && (
                <button
                  onClick={onOpenSetupWizard}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8,
                    border: '1px solid ' + THEME.border.base, background: THEME.bg.base,
                    color: THEME.text.primary, fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={15} color={THEME.accent.primary} />
                    </div>
                    <span>Assistant Configuration</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: THEME.accent.primary, background: THEME.bg.card, padding: '2px 8px', borderRadius: 10, border: '1px solid ' + THEME.border.base }}>
                    10 Étapes
                  </span>
                </button>
              )}

              {/* Thème */}
              {onToggleDarkMode && (
                <button
                  onClick={onToggleDarkMode}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8,
                    border: '1px solid ' + THEME.border.base, background: THEME.bg.base,
                    color: THEME.text.primary, fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {darkMode ? <Sun size={15} color={THEME.accent.orange} /> : <Moon size={15} color={THEME.accent.primary} />}
                    </div>
                    <span>Thème {darkMode ? 'Clair' : 'Sombre'}</span>
                  </div>
                  <span style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600, background: THEME.bg.card, padding: '2px 8px', borderRadius: 10, border: '1px solid ' + THEME.border.base }}>
                    {darkMode ? 'Sombre' : 'Clair'}
                  </span>
                </button>
              )}

              {/* Taux de devises */}
              {onOpenDevises && (
                <button
                  onClick={onOpenDevises}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8,
                    border: '1px solid ' + THEME.border.base, background: THEME.bg.base,
                    color: THEME.text.primary, fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Coins size={15} color={THEME.accent.orange} />
                    </div>
                    <span>Taux de devises</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: THEME.accent.orange, background: THEME.bg.card, padding: '2px 8px', borderRadius: 10, border: '1px solid ' + THEME.border.base }}>
                    ¥ {devises?.rmb || 680} · $ {devises?.usd || 4600}
                  </span>
                </button>
              )}

              {/* Diagnostic d'intégrité */}
              {onOpenDiagnostic && (
                <button
                  onClick={onOpenDiagnostic}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8,
                    border: '1px solid ' + THEME.border.base, background: THEME.bg.base,
                    color: THEME.text.primary, fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={15} color={THEME.accent.orange} />
                    </div>
                    <span>Diagnostic d'intégrité</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: THEME.accent.orange, background: THEME.bg.card, padding: '2px 8px', borderRadius: 10, border: '1px solid ' + THEME.border.base }}>
                    Anomalies & Audit
                  </span>
                </button>
              )}

              {/* Export CSV */}
              {onOpenExportCsv && (
                <button
                  onClick={onOpenExportCsv}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8,
                    border: '1px solid ' + THEME.border.base, background: THEME.bg.base,
                    color: THEME.text.primary, fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileSpreadsheet size={15} color={THEME.accent.green} />
                    </div>
                    <span>Exportation CSV (Excel)</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: THEME.accent.green, background: THEME.bg.card, padding: '2px 8px', borderRadius: 10, border: '1px solid ' + THEME.border.base }}>
                    .CSV
                  </span>
                </button>
              )}

              {/* Sauvegardes */}
              {onOpenBackup && (
                <button
                  onClick={onOpenBackup}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8,
                    border: '1px solid ' + THEME.border.base, background: THEME.bg.base,
                    color: THEME.text.primary, fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HardDrive size={15} color={THEME.accent.green} />
                    </div>
                    <span>Sauvegarde & Export</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: THEME.accent.green, background: THEME.bg.card, padding: '2px 8px', borderRadius: 10, border: '1px solid ' + THEME.border.base }}>
                    JSON
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid ' + THEME.border.base,
          background: THEME.bg.base,
          fontSize: 11.5, color: THEME.text.muted,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Stock & Comptoir ERP</span>
          <span style={{ color: saving ? THEME.accent.orange : THEME.accent.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: saving ? THEME.accent.orange : THEME.accent.green }} />
            {saving ? 'Sauvegarde…' : 'Stockage local OK'}
          </span>
        </div>
      </div>
    </div>
  );
});









