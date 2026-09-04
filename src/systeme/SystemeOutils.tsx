import React, { useState, useMemo } from 'react';
import {
  Settings,
  HardDrive,
  Coins,
  FileSpreadsheet,
  Activity,
  Terminal,
  Sparkles,
  Sun,
  Moon,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sliders,
  DollarSign,
  Plus,
  Trash2,
  Calculator,
  Server,
  Play,
  Copy,
  Check,
  ArrowDownUp,
  Cpu,
  Building2,
  HelpCircle,
  BookOpen,
  FileText,
  Smartphone,
} from 'lucide-react';
import AndroidBuildHub from './AndroidBuildHub';
import { THEME } from '../colors';
import { FONTS, TYPOGRAPHY } from '../fonts';
import { Card, cardTitle, Stat, inputStyle, selectStyle, primaryBtn, ghostBtn, Label, RADIUS, SHADOWS, ComptoirSvgLogo, downloadOfficialSvg, RAW_COMPTOIR_SVG } from '../ui';
import DiagnosticReport from '../dashboard/DiagnosticReport';
import { exportAllDataCsv, exportVentesCsv, exportAchatsCsv, exportTresorerieCsv } from '../dashboard/csvExportUtils';
import { offlineApi } from '../api/offlineApi';
import { uid } from '../constants';
import { migrateDataSchema, marquerBackupFait, enregistrerAutoSnapshot, CURRENT_SCHEMA_VERSION } from '../backup/backupUtils';
import { Image as ImageIcon } from 'lucide-react';

export interface SystemeOutilsProps {
  products: any[];
  ventes: any[];
  commandes: any[];
  fournisseurs: any[];
  clients: any[];
  sourcing: any[];
  mouvements: any[];
  changes: any[];
  immobilisations: any[];
  emprunts: any[];
  frais: any[];
  chargesFixes: any[];
  paiements: any[];
  devises: { rmb: number; usd: number };
  comptes: string[];
  darkMode: boolean;
  isOnline: boolean;
  saving: boolean;
  initialSubTab?: 'apercu' | 'general' | 'devises' | 'backup' | 'export-csv' | 'diagnostic' | 'api' | 'comptes' | 'help';
  updateData: (key: string, data: any) => void;
  save: (data: any) => void;
  onToggleDarkMode: () => void;
  onOpenSetupWizard: () => void;
  onNavigateTab: (tab: string) => void;
}

export default function SystemeOutils({
  products = [],
  ventes = [],
  commandes = [],
  fournisseurs = [],
  clients = [],
  sourcing = [],
  mouvements = [],
  changes = [],
  immobilisations = [],
  emprunts = [],
  frais = [],
  chargesFixes = [],
  paiements = [],
  devises = { rmb: 680, usd: 4600 },
  comptes = [],
  darkMode,
  isOnline,
  saving,
  initialSubTab = 'apercu',
  updateData,
  save,
  onToggleDarkMode,
  onOpenSetupWizard,
  onNavigateTab,
}: SystemeOutilsProps) {
  const [subTab, setSubTab] = useState<'apercu' | 'general' | 'devises' | 'backup' | 'export-csv' | 'diagnostic' | 'api' | 'comptes' | 'help'>(initialSubTab);
  
  // États Devises
  const [inputRmb, setInputRmb] = useState<number>(devises.rmb || 680);
  const [inputUsd, setInputUsd] = useState<number>(devises.usd || 4600);
  const [devisesSavedMsg, setDevisesSavedMsg] = useState<string | null>(null);

  // Convertisseur rapide
  const [convAmount, setConvAmount] = useState<number>(100);
  const [convCurrency, setConvCurrency] = useState<'RMB' | 'USD' | 'MGA'>('RMB');

  // État Backup
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [resetConfirmInput, setResetConfirmInput] = useState('');

  // État Export CSV
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  // État Console API
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/v1/health');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiBody, setApiBody] = useState<string>('{\n  "nom": "Pin Sylvestre 75x225",\n  "stock": 50,\n  "prixAchat": 42000,\n  "prixVente": 65000\n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiCopied, setApiCopied] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

  // État Comptes
  const [newCompteName, setNewCompteName] = useState('');

  // Métriques globales du système
  const totalEntities = useMemo(() => {
    return (
      products.length +
      ventes.length +
      commandes.length +
      fournisseurs.length +
      clients.length +
      sourcing.length +
      mouvements.length +
      changes.length +
      immobilisations.length +
      emprunts.length +
      frais.length +
      chargesFixes.length +
      paiements.length
    );
  }, [
    products.length,
    ventes.length,
    commandes.length,
    fournisseurs.length,
    clients.length,
    sourcing.length,
    mouvements.length,
    changes.length,
    immobilisations.length,
    emprunts.length,
    frais.length,
    chargesFixes.length,
    paiements.length,
  ]);

  // Statistiques sur les images / photos d'articles
  const imagesStats = useMemo(() => {
    let count = 0;
    let bytes = 0;
    products.forEach((p: any) => {
      const pImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
      pImages.forEach((img: string) => {
        if (typeof img === 'string' && img.length > 0) {
          count++;
          bytes += img.length;
        }
      });
    });
    const sizeStr = bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return { count, bytes, sizeStr };
  }, [products]);

  const databaseSizeEstimate = useMemo(() => {
    try {
      const json = JSON.stringify({
        products,
        ventes,
        commandes,
        fournisseurs,
        clients,
        sourcing,
        mouvements,
        changes,
        immobilisations,
        emprunts,
        frais,
        chargesFixes,
        paiements,
        devises,
        comptes,
      });
      const bytes = new Blob([json]).size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } catch {
      return '~150 KB';
    }
  }, [products, ventes, commandes, fournisseurs, clients, sourcing, mouvements, changes, immobilisations, emprunts, frais, chargesFixes, paiements, devises, comptes]);

  // Sauvegarder les devises
  const handleSaveDevises = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rmbVal = Number(inputRmb) || 680;
    const usdVal = Number(inputUsd) || 4600;
    save({ devises: { rmb: rmbVal, usd: usdVal } });
    setDevisesSavedMsg('Taux de devises appliqués avec succès !');
    setTimeout(() => setDevisesSavedMsg(null), 3000);
  };

  // Convertisseur instantané
  const conversionResults = useMemo(() => {
    const val = Number(convAmount) || 0;
    const rmbRate = Number(devises.rmb) || 680;
    const usdRate = Number(devises.usd) || 4600;

    if (convCurrency === 'RMB') {
      const inMga = val * rmbRate;
      const inUsd = usdRate > 0 ? inMga / usdRate : 0;
      return { inMga, inUsd, inRmb: val };
    } else if (convCurrency === 'USD') {
      const inMga = val * usdRate;
      const inRmb = rmbRate > 0 ? inMga / rmbRate : 0;
      return { inMga, inUsd: val, inRmb };
    } else {
      const inRmb = rmbRate > 0 ? val / rmbRate : 0;
      const inUsd = usdRate > 0 ? val / usdRate : 0;
      return { inMga: val, inUsd, inRmb };
    }
  }, [convAmount, convCurrency, devises]);

  // Télécharger JSON (avec intégration complète des photos)
  const handleDownloadBackup = () => {
    try {
      const cleanData = migrateDataSchema({
        products,
        ventes,
        commandes,
        fournisseurs,
        clients,
        sourcing,
        mouvements,
        changes,
        immobilisations,
        emprunts,
        frais,
        chargesFixes,
        paiements,
        devises,
        comptes,
      });

      const payload = {
        app: 'Comptoir ERP',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        totalImages: imagesStats.count,
        totalImagesSize: imagesStats.sizeStr,
        ...cleanData,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `comptoir_central_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      marquerBackupFait();
      enregistrerAutoSnapshot(cleanData);

      setRestoreFeedback({
        type: 'success',
        msg: `Sauvegarde JSON exportée avec succès (${totalEntities} entités + ${imagesStats.count} photo${imagesStats.count > 1 ? 's' : ''}) !`
      });
      setTimeout(() => setRestoreFeedback(null), 4000);
    } catch (err: any) {
      setRestoreFeedback({ type: 'error', msg: 'Erreur lors de la génération du fichier : ' + err.message });
    }
  };

  // Restaurer JSON (avec migration automatique et restauration des photos)
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Format JSON invalide');
        }

        const migrated = migrateDataSchema(parsed);
        save(migrated);

        let restoredImgs = 0;
        migrated.products?.forEach((p: any) => {
          if (Array.isArray(p.images)) restoredImgs += p.images.length;
        });

        setRestoreFeedback({
          type: 'success',
          msg: `Données et ${restoredImgs} photo${restoredImgs > 1 ? 's' : ''} restaurées avec succès depuis le fichier !`
        });
        setTimeout(() => setRestoreFeedback(null), 5000);
      } catch (err: any) {
        setRestoreFeedback({ type: 'error', msg: 'Échec de la restauration : ' + (err.message || 'fichier invalide') });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Réinitialiser la base
  const handleResetDatabase = () => {
    if (resetConfirmInput.trim().toUpperCase() !== 'EFFACER') {
      alert('Veuillez taper "EFFACER" pour confirmer la réinitialisation.');
      return;
    }
    if (window.confirm('Êtes-vous absolument certain de vouloir effacer toutes les données locales ? Cette action est irréversible.')) {
      save({
        products: [],
        ventes: [],
        commandes: [],
        fournisseurs: [],
        clients: [],
        sourcing: [],
        mouvements: [],
        changes: [],
        immobilisations: [],
        emprunts: [],
        frais: [],
        chargesFixes: [],
        paiements: [],
      });
      setResetConfirmInput('');
      setRestoreFeedback({ type: 'success', msg: 'Base de données réinitialisée.' });
      setTimeout(() => setRestoreFeedback(null), 4000);
    }
  };

  // Exporter CSV
  const triggerCsv = (type: 'all' | 'ventes' | 'achats' | 'tresorerie') => {
    if (type === 'all') {
      exportAllDataCsv({ ventes, commandes, mouvements, products, clients, fournisseurs });
      setCsvFeedback('Pack 3 CSV exporté !');
    } else if (type === 'ventes') {
      exportVentesCsv({ ventes, products, clients });
      setCsvFeedback('CSV Ventes exporté !');
    } else if (type === 'achats') {
      exportAchatsCsv({ commandes, products, fournisseurs });
      setCsvFeedback('CSV Achats exporté !');
    } else if (type === 'tresorerie') {
      exportTresorerieCsv({ mouvements, ventes, commandes });
      setCsvFeedback('CSV Trésorerie exporté !');
    }
    setTimeout(() => setCsvFeedback(null), 3000);
  };

  // Exécuter requête API offline
  const handleExecuteApi = async () => {
    setApiLoading(true);
    setApiResponse(null);
    try {
      if (apiEndpoint === '/api/v1/health') {
        const res = await offlineApi.ping();
        setApiResponse({ status: 200, provider: 'IndexedDB Direct API', data: res });
      } else if (apiEndpoint === '/api/v1/products') {
        if (apiMethod === 'GET') {
          const res = await offlineApi.products.getAll();
          setApiResponse({ status: 200, count: res.length, data: res });
        } else {
          const parsed = JSON.parse(apiBody);
          const res = await offlineApi.products.create(parsed);
          setApiResponse({ status: 201, message: 'Produit créé', data: res });
        }
      } else if (apiEndpoint === '/api/v1/ventes') {
        if (apiMethod === 'GET') {
          const res = await offlineApi.ventes.getAll();
          setApiResponse({ status: 200, count: res.length, data: res });
        } else {
          const parsed = JSON.parse(apiBody);
          const res = await offlineApi.ventes.create(parsed);
          setApiResponse({ status: 201, message: 'Vente enregistrée', data: res });
        }
      } else if (apiEndpoint === '/api/v1/commandes') {
        const res = await offlineApi.commandes.getAll();
        setApiResponse({ status: 200, count: res.length, data: res });
      } else if (apiEndpoint === '/api/v1/stats') {
        const res = await offlineApi.stats.getOverview();
        setApiResponse({ status: 200, data: res });
      } else if (apiEndpoint === '/api/v1/backup') {
        const res = await offlineApi.backup.exportAll();
        setApiResponse({ status: 200, data: res });
      }
    } catch (err: any) {
      setApiResponse({ status: 500, error: err.message || 'Erreur requête' });
    } finally {
      setApiLoading(false);
    }
  };

  // Ajouter / Supprimer compte financier
  const handleAddCompte = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompteName.trim()) return;
    if (comptes.includes(newCompteName.trim())) {
      alert('Ce compte financier existe déjà.');
      return;
    }
    const nextComptes = [...comptes, newCompteName.trim()];
    save({ comptes: nextComptes });
    setNewCompteName('');
  };

  const handleRemoveCompte = (name: string) => {
    if (comptes.length <= 1) {
      alert('Vous devez conserver au moins un compte financier.');
      return;
    }
    if (window.confirm(`Supprimer le compte "${name}" des choix de règlements ?`)) {
      const nextComptes = comptes.filter(c => c !== name);
      save({ comptes: nextComptes });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* HEADER SECTION ARCHITECTURALE */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 16,
        borderBottom: `1px solid ${THEME.border.base}`
      }}>
        <div>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize: 10.5,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: THEME.accent.primary,
            fontWeight: 600,
            marginBottom: 4
          }}>
            [SYSTEM CONTROL CENTER · ERP V4.3.3]
          </div>
          <h1 style={{
            fontFamily: FONTS.display,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: THEME.text.primary,
            lineHeight: 0.95,
            margin: 0
          }}>
            Système & Outils
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onToggleDarkMode}
            style={{ ...ghostBtn, gap: 8 }}
            title="Basculer le mode sombre/clair"
          >
            {darkMode ? <Sun size={14} color={THEME.accent.primary} /> : <Moon size={14} color={THEME.accent.primary} />}
            <span>{darkMode ? 'MODE CLAIR' : 'MODE SOMBRE'}</span>
          </button>

          <button
            onClick={onOpenSetupWizard}
            style={{ ...primaryBtn, gap: 8 }}
          >
            <Sparkles size={14} />
            <span>ASSISTANT CONFIG</span>
          </button>
        </div>
      </div>

      {/* SYSTEM KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <Stat
          label="Base Locale IndexedDB"
          value="Opérationnelle"
          subvalue={`Volume : ${databaseSizeEstimate}`}
          accent={THEME.accent.green}
          icon={Database}
        />
        <Stat
          label="Enregistrements"
          value={totalEntities.toLocaleString()}
          subvalue={`${products.length} réf. · ${ventes.length} ventes`}
          accent={THEME.text.primary}
          icon={Layers}
        />
        <Stat
          label="Devises de Référence"
          value={`¥ ${devises.rmb} / $ ${devises.usd}`}
          subvalue="Taux MGA appliqués"
          accent={THEME.accent.primary}
          icon={Coins}
        />
        <Stat
          label="Connectivité / PWA"
          value={isOnline ? 'En ligne' : 'Hors-ligne'}
          subvalue={saving ? 'Synchronisation…' : 'Stockage local actif'}
          accent={isOnline ? THEME.accent.green : THEME.accent.orange}
          icon={Zap}
        />
      </div>

      {/* NAVIGATION SOUS-ONGLETS */}
      <div className="tabs-scrollable" style={{
        display: 'flex',
        gap: 6,
        borderBottom: `1px solid ${THEME.border.base}`,
        paddingBottom: 2,
      }}>
        {[
          { id: 'apercu', label: 'Menu Paramètres', icon: Sliders },
          { id: 'general', label: 'Général & Thème', icon: Settings },
          { id: 'android', label: 'Build Android / APK', icon: Smartphone },
          { id: 'devises', label: 'Taux & Devises', icon: Coins },
          { id: 'comptes', label: 'Comptes Financiers', icon: DollarSign },
          { id: 'backup', label: 'Sauvegarde & Restore', icon: HardDrive },
          { id: 'export-csv', label: 'Exportations CSV', icon: FileSpreadsheet },
          { id: 'diagnostic', label: 'Audit & Diagnostic', icon: Activity },
          { id: 'api', label: 'Console API v1', icon: Terminal },
          { id: 'help', label: 'Aide & FAQ', icon: HelpCircle },
        ].map((tabItem) => {
          const active = subTab === tabItem.id;
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.id}
              onClick={() => setSubTab(tabItem.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                border: 'none',
                borderBottom: active ? `2px solid ${THEME.accent.primary}` : '2px solid transparent',
                background: active ? THEME.bg.surface : 'transparent',
                color: active ? THEME.accent.primary : THEME.text.secondary,
                fontFamily: FONTS.mono,
                fontSize: 11.5,
                fontWeight: active ? 600 : 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                borderRadius: '4px 4px 0 0',
              }}
            >
              <Icon size={14} />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* VUE 1 : APERÇU / HUBS D'OUTILS */}
      {subTab === 'apercu' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* CARTE 0 : PARAMÈTRES GÉNÉRAUX & THÈME */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                PARAMÈTRES GÉNÉRAUX & THÈME
              </div>
              <Settings size={16} color={THEME.accent.primary} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Basculez entre le mode Clair et Sombre, personnalisez les préférences d'affichage et l'assistant de configuration.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onToggleDarkMode} style={{ ...primaryBtn, flex: 1, justifyContent: 'center' }}>
                {darkMode ? <Sun size={13} /> : <Moon size={13} />}
                <span>THÈME : {darkMode ? 'SOMBRE' : 'CLAIR'}</span>
              </button>
              <button onClick={() => setSubTab('general')} style={{ ...ghostBtn, flex: 1, justifyContent: 'center' }}>
                <span>OPTIONS</span>
              </button>
            </div>
          </Card>

          {/* CARTE 0.5 : PLATEFORME ANDROID & BUILD APK */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                PLATEFORME ANDROID & APK
              </div>
              <Smartphone size={16} color={THEME.accent.primary} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Générez le package binaire APK Android, synchronisez les assets natifs et testez le pont API local.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSubTab('android')} style={{ ...primaryBtn, flex: 1, justifyContent: 'center' }}>
                <Smartphone size={13} />
                <span>BUILD ANDROID</span>
              </button>
            </div>
          </Card>

          {/* CARTE 1 : TAUX DE CHANGE */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                DEVISES & CHANGES
              </div>
              <Coins size={16} color={THEME.accent.primary} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Ajustez les cours de conversion Yuan Chinois (RMB) et Dollar US (USD) utilisés pour le calcul des coûts de revient et marges.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, background: THEME.bg.soft, padding: '10px 14px', borderRadius: 6 }}>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: THEME.text.muted }}>1 RMB (¥)</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 600 }}>{devises.rmb} Ar</div>
              </div>
              <div style={{ width: 1, height: 28, background: THEME.border.strong, margin: '0 8px' }} />
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: THEME.text.muted }}>1 USD ($)</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 600 }}>{devises.usd} Ar</div>
              </div>
            </div>
            <button onClick={() => setSubTab('devises')} style={{ ...ghostBtn, width: '100%', justifyContent: 'center' }}>
              MODIFIER LES TAUX
            </button>
          </Card>

          {/* CARTE 2 : SAUVEGARDE & RESTAURATION */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                SAUVEGARDE & INTÉGRITÉ
              </div>
              <HardDrive size={16} color={THEME.accent.green} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Téléchargez un instantané JSON complet de votre base ou restaurez vos données sur un autre appareil.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleDownloadBackup} style={{ ...primaryBtn, flex: 1, justifyContent: 'center' }}>
                <Download size={13} />
                <span>EXPORTER JSON</span>
              </button>
              <button onClick={() => setSubTab('backup')} style={{ ...ghostBtn, flex: 1, justifyContent: 'center' }}>
                <Upload size={13} />
                <span>RESTAURER</span>
              </button>
            </div>
          </Card>

          {/* CARTE 3 : EXPORT CSV & TABLEURS */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                TABLEURS & EXCEL
              </div>
              <FileSpreadsheet size={16} color={THEME.accent.primary} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Générez des fichiers CSV (séparateur point-virgule UTF-8) prêts pour Microsoft Excel, Numbers ou Google Sheets.
            </div>
            <button onClick={() => triggerCsv('all')} style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}>
              <Download size={13} />
              <span>TÉLÉCHARGER LE PACK CSV (3 TABLES)</span>
            </button>
          </Card>

          {/* CARTE 4 : DIAGNOSTIC D'INTÉGRITÉ */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                AUDIT DES DONNÉES
              </div>
              <Activity size={16} color={THEME.accent.orange} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Analysez les orphelins, anomalies de calcul, doublons et incohérences de soldes dans toutes vos tables.
            </div>
            <button onClick={() => setSubTab('diagnostic')} style={{ ...ghostBtn, width: '100%', justifyContent: 'center' }}>
              OUVRIR LE RAPPORT D'AUDIT
            </button>
          </Card>

          {/* CARTE 5 : CONSOLE API DEVELOPPEUR */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                API REST & DEVELOPPEUR
              </div>
              <Terminal size={16} color={THEME.text.primary} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Consultez et testez les routes API locales (`/api/v1/*`) connectées en temps réel à la base IndexedDB.
            </div>
            <button onClick={() => setSubTab('api')} style={{ ...ghostBtn, width: '100%', justifyContent: 'center' }}>
              LANCER LA CONSOLE API
            </button>
          </Card>

          {/* CARTE 6 : ASSISTANT ET COMPTES */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                RÉFÉRENTIELS & COMPTES
              </div>
              <DollarSign size={16} color={THEME.accent.green} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Configurez vos modes de paiement (Caisse, MVola, Orange Money, Banque) ou relancez l'assistant pas-à-pas.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSubTab('comptes')} style={{ ...ghostBtn, flex: 1, justifyContent: 'center' }}>
                COMPTES ({comptes.length})
              </button>
              <button onClick={onOpenSetupWizard} style={{ ...ghostBtn, flex: 1, justifyContent: 'center' }}>
                <Sparkles size={13} />
                <span>WIZARD</span>
              </button>
            </div>
          </Card>

          {/* CARTE 7 : AIDE & FAQ */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                CENTRE D'AIDE & DOCUMENTATION
              </div>
              <HelpCircle size={16} color={THEME.accent.primary} />
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
              Guide d'utilisation, réponses aux questions fréquentes sur la restauration avec photos, la trésorerie et les devises.
            </div>
            <button onClick={() => setSubTab('help')} style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}>
              <BookOpen size={13} />
              <span>CONSULTER L'AIDE & FAQ</span>
            </button>
          </Card>
        </div>
      )}

      {/* VUE : PARAMÈTRES GÉNÉRAUX & SYSTÈME */}
      {subTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {/* APPARENCE & THÈME */}
          <Card>
            <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
              {darkMode ? <Moon size={16} color={THEME.accent.primary} /> : <Sun size={16} color={THEME.accent.primary} />}
              <span>APPARENCE & THÈME VISUEL</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5 }}>
                Le système applique le <strong>Thème Signature Comptoir Central</strong>, directement synchronisé avec l'emblème de la marque (Or Stellaire, Saphir Impérial &amp; Titane Nuit).
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: RADIUS.item,
                background: THEME.bg.soft,
                border: `1px solid ${THEME.border.base}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: THEME.text.primary }}>
                    Mode Actuel : {darkMode ? 'Obsidienne Nuit (Dark)' : 'Platine Minéral (Light)'}
                  </div>
                  <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>
                    Finitions haute lisibilité et reflets d'or satiné
                  </div>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  style={{ ...primaryBtn, padding: '8px 14px' }}
                >
                  {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                  <span>Passer en mode {darkMode ? 'Clair' : 'Sombre'}</span>
                </button>
              </div>

              <div style={{ borderTop: `1px solid ${THEME.border.base}`, paddingTop: 14 }}>
                <Label>Harmonie issue de l'emblème</Label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 28, background: '#151821', borderRadius: 6, border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: FONTS.mono, color: '#FDE68A', fontWeight: 700 }}>TITANE</div>
                  <div style={{ flex: 1, height: 28, background: '#2563EB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: FONTS.mono, color: '#FFFFFF', fontWeight: 700 }}>SAPHIR</div>
                  <div style={{ flex: 1, height: 28, background: '#D97706', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: FONTS.mono, color: '#FFFFFF', fontWeight: 700 }}>OR ROYAL</div>
                  <div style={{ flex: 1, height: 28, background: '#10B981', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: FONTS.mono, color: '#FFFFFF', fontWeight: 700 }}>ÉMERAUDE</div>
                </div>
              </div>
            </div>
          </Card>

          {/* ÉTABLISSEMENT & ASSISTANT */}
          <Card>
            <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={16} color={THEME.accent.primary} />
              <span>ÉTABLISSEMENT & ASSISTANT</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Label>Nom de la structure commerciale</Label>
                <input
                  type="text"
                  readOnly
                  value="Comptoir Central"
                  style={{ ...inputStyle, background: THEME.bg.soft, cursor: 'default' }}
                />
              </div>

              <div>
                <Label>Devise principale de tenue de compte</Label>
                <input
                  type="text"
                  readOnly
                  value="MGA (Ariary Malgache)"
                  style={{ ...inputStyle, background: THEME.bg.soft, cursor: 'default' }}
                />
              </div>

              <div style={{ borderTop: `1px solid ${THEME.border.base}`, paddingTop: 14 }}>
                <Label>Assistant pas-à-pas de configuration</Label>
                <p style={{ fontSize: 12.5, color: THEME.text.secondary, marginTop: 4, marginBottom: 12 }}>
                  Relancez l'assistant en 10 étapes pour configurer les devises, comptes financiers, fournisseurs initiaux et stocks de départ.
                </p>
                <button
                  onClick={onOpenSetupWizard}
                  style={{ ...ghostBtn, width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={14} color={THEME.accent.primary} />
                  <span>OUVRIR LE SETUP WIZARD (10 ÉTAPES)</span>
                </button>
              </div>
            </div>
          </Card>

          {/* IDENTITÉ VISUELLE & LOGO VECTORIEL (SVG) */}
          <Card style={{ gridColumn: '1 / -1' }}>
            <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={16} color={THEME.brand.blue} />
                <span>IDENTITÉ VISUELLE &amp; LOGO VECTORIEL (SVG)</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: THEME.brand.blue, background: `${THEME.brand.blue}15`, padding: '2px 8px', borderRadius: RADIUS.pill, fontWeight: 700 }}>
                FORMAT SVG 1.1 VECTORIEL PUR
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 14 }}>
              {/* Aperçu Fond Clair */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: RADIUS.card,
                padding: '24px 20px',
                border: '1px solid #E4E4E7',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: SHADOWS.subtle,
              }}>
                <div style={{ fontSize: 11, fontFamily: FONTS.mono, textTransform: 'uppercase', color: '#71717A', fontWeight: 600, letterSpacing: '0.1em' }}>
                  Aperçu Fond Clair (Standard)
                </div>
                <div style={{ width: '100%', maxWidth: 360, padding: '10px 0' }}>
                  <ComptoirSvgLogo width="100%" isDark={false} />
                </div>
              </div>

              {/* Aperçu Fond Sombre */}
              <div style={{
                background: '#0E1116',
                borderRadius: RADIUS.card,
                padding: '24px 20px',
                border: '1px solid #27272A',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: SHADOWS.subtle,
              }}>
                <div style={{ fontSize: 11, fontFamily: FONTS.mono, textTransform: 'uppercase', color: '#A1A1AA', fontWeight: 600, letterSpacing: '0.1em' }}>
                  Aperçu Fond Sombre (Dark Mode)
                </div>
                <div style={{ width: '100%', maxWidth: 360, padding: '10px 0' }}>
                  <ComptoirSvgLogo width="100%" isDark={true} />
                </div>
              </div>
            </div>

            {/* Barre d'actions & Téléchargements */}
            <div style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: `1px solid ${THEME.border.base}`,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div style={{ fontSize: 12.5, color: THEME.text.secondary }}>
                Graphisme vectoriel haute précision : compatible documents légaux, factures pro, en-têtes et écrans Retina.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => downloadOfficialSvg('logo')}
                  style={{ ...primaryBtn, padding: '8px 14px' }}
                  title="Télécharger le logo complet Comptoir Central en SVG"
                >
                  <Download size={14} />
                  <span>TÉLÉCHARGER LOGO.SVG</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadOfficialSvg('favicon')}
                  style={{ ...ghostBtn, padding: '8px 14px' }}
                  title="Télécharger le monogramme / icône en SVG"
                >
                  <Download size={14} />
                  <span>TÉLÉCHARGER FAVICON.SVG</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(RAW_COMPTOIR_SVG);
                    setCopiedSvg(true);
                    setTimeout(() => setCopiedSvg(false), 2500);
                  }}
                  style={{ ...ghostBtn, padding: '8px 14px' }}
                  title="Copier le balisage SVG source"
                >
                  {copiedSvg ? <Check size={14} color={THEME.accent.green} /> : <Copy size={14} />}
                  <span>{copiedSvg ? 'CODE SVG COPIÉ !' : 'COPIER CODE SVG'}</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* VUE : PLATEFORME ANDROID & BUILD APK */}
      {subTab === 'android' && <AndroidBuildHub />}

      {/* VUE 2 : TAUX DE DEVISES & CONVERTISSEUR */}
      {subTab === 'devises' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          <Card>
            <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coins size={16} color={THEME.accent.primary} />
              <span>ÉDITION DES TAUX DE RÉFÉRENCE</span>
            </div>

            {devisesSavedMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 6,
                background: `${THEME.accent.green}18`,
                border: `1px solid ${THEME.accent.green}44`,
                color: THEME.accent.green,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}>
                <CheckCircle2 size={16} />
                <span>{devisesSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDevises} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Label>Taux Yuan Chinois (RMB / MGA)</Label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="any"
                    value={inputRmb}
                    onChange={(e) => setInputRmb(Number(e.target.value))}
                    style={inputStyle}
                  />
                  <span style={{ position: 'absolute', right: 12, top: 11, fontFamily: FONTS.mono, fontSize: 12, color: THEME.text.muted }}>
                    Ar / ¥
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: THEME.text.muted, marginTop: 4 }}>
                  Utilisé pour valoriser les commandes 1688, Taobao, fret Chine et réserves RMB.
                </div>
              </div>

              <div>
                <Label>Taux Dollar Américain (USD / MGA)</Label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="any"
                    value={inputUsd}
                    onChange={(e) => setInputUsd(Number(e.target.value))}
                    style={inputStyle}
                  />
                  <span style={{ position: 'absolute', right: 12, top: 11, fontFamily: FONTS.mono, fontSize: 12, color: THEME.text.muted }}>
                    Ar / $
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: THEME.text.muted, marginTop: 4 }}>
                  Utilisé pour les cotations internationales et factures transitaire en devises USD.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" style={{ ...primaryBtn, flex: 1, justifyContent: 'center' }}>
                  ENREGISTRER LES TAUX
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputRmb(680);
                    setInputUsd(4600);
                  }}
                  style={{ ...ghostBtn, justifyContent: 'center' }}
                >
                  DÉFAUT (680 / 4600)
                </button>
              </div>
            </form>
          </Card>

          {/* CALCULATRICE DE CONVERSION INSTANTANÉE */}
          <Card>
            <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calculator size={16} color={THEME.accent.primary} />
              <span>SIMULATEUR DE CONVERSION MULTI-DEVISES</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                <div>
                  <Label>Montant à convertir</Label>
                  <input
                    type="number"
                    value={convAmount}
                    onChange={(e) => setConvAmount(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label>Monnaie</Label>
                  <select
                    value={convCurrency}
                    onChange={(e) => setConvCurrency(e.target.value as any)}
                    style={selectStyle}
                  >
                    <option value="RMB">RMB (¥)</option>
                    <option value="USD">USD ($)</option>
                    <option value="MGA">MGA (Ar)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: THEME.bg.soft, padding: '16px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', color: THEME.text.muted }}>Équivalent Ariary (MGA) :</span>
                  <span style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: THEME.text.primary }}>
                    {Math.round(conversionResults.inMga).toLocaleString()} Ar
                  </span>
                </div>
                <div style={{ height: 1, background: THEME.border.base }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', color: THEME.text.muted }}>Équivalent Yuan (RMB) :</span>
                  <span style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, color: THEME.accent.primary }}>
                    ¥ {conversionResults.inRmb.toFixed(2)}
                  </span>
                </div>
                <div style={{ height: 1, background: THEME.border.base }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', color: THEME.text.muted }}>Équivalent Dollar (USD) :</span>
                  <span style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, color: THEME.accent.primary }}>
                    $ {conversionResults.inUsd.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* VUE 3 : SAUVEGARDE & RESTAURATION */}
      {subTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {restoreFeedback && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 6,
              background: restoreFeedback.type === 'success' ? `${THEME.accent.green}18` : `${THEME.accent.danger}18`,
              border: `1px solid ${restoreFeedback.type === 'success' ? THEME.accent.green : THEME.accent.danger}44`,
              color: restoreFeedback.type === 'success' ? THEME.accent.green : THEME.accent.danger,
              fontSize: 13.5,
              fontWeight: 600,
            }}>
              {restoreFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{restoreFeedback.msg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {/* EXPORT JSON */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={16} color={THEME.accent.green} />
                <span>EXPORTER UNE SAUVEGARDE COMPLÈTE</span>
              </div>
              <p style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
                Générez un fichier JSON autonome contenant toutes vos collections : catalogue complet, <strong>photos et galeries d'articles</strong>, commandes fournisseurs, ventes, paiements, charges fixes, immobilisations, emprunts et devises.
              </p>
              <div style={{ background: THEME.bg.soft, padding: '12px 14px', borderRadius: 6, marginBottom: 16, fontSize: 12, color: THEME.text.muted, fontFamily: FONTS.mono, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>STATUT : Base synchronisée IndexedDB + localStorage</div>
                <div>TAILLE ESTIMÉE : {databaseSizeEstimate}</div>
                <div>ENTITÉS : {totalEntities.toLocaleString()} objets</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: THEME.accent.green, fontWeight: 600 }}>
                  <ImageIcon size={13} />
                  <span>PHOTOS EMBARQUÉES : {imagesStats.count} ({imagesStats.sizeStr})</span>
                </div>
              </div>
              <button onClick={handleDownloadBackup} style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}>
                <Download size={14} />
                <span>TÉLÉCHARGER LE FICHIER .JSON (AVEC PHOTOS)</span>
              </button>
            </Card>

            {/* IMPORT RESTAURATION */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={16} color={THEME.accent.primary} />
                <span>RESTAURER DEPUIS UN FICHIER JSON</span>
              </div>
              <p style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 16 }}>
                Chargez un fichier de sauvegarde préalablement exporté. Les données existantes seront remplacées par le contenu du fichier.
              </p>
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '24px 16px',
                border: `2px dashed ${THEME.border.strong}`,
                borderRadius: 8,
                background: THEME.bg.soft,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}>
                <Upload size={24} color={THEME.accent.primary} />
                <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>
                  SÉLECTIONNER LE FICHIER .JSON
                </span>
                <span style={{ fontSize: 11, color: THEME.text.muted }}>
                  ou glissez-déposez le fichier ici
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileRestore}
                  style={{ display: 'none' }}
                />
              </label>
            </Card>
          </div>

          {/* ZONE DE DANGER : RÉINITIALISATION */}
          <Card style={{ borderColor: `${THEME.accent.danger}44` }}>
            <div style={{ ...cardTitle, color: THEME.accent.danger, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color={THEME.accent.danger} />
              <span>ZONE DE SÉCURITÉ : RÉINITIALISATION COMPLÈTE</span>
            </div>
            <p style={{ fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5, marginBottom: 14 }}>
              Cette opération efface l'intégralité des données locales dans le navigateur (stocks, ventes, commandes, écritures de trésorerie). <strong>Pensez à télécharger une sauvegarde JSON avant toute réinitialisation.</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder='Tapez "EFFACER" pour débloquer'
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                style={{ ...inputStyle, maxWidth: 260, fontFamily: FONTS.mono, textTransform: 'uppercase' }}
              />
              <button
                onClick={handleResetDatabase}
                disabled={resetConfirmInput.trim().toUpperCase() !== 'EFFACER'}
                style={{
                  ...primaryBtn,
                  background: resetConfirmInput.trim().toUpperCase() === 'EFFACER' ? THEME.accent.danger : THEME.border.strong,
                  cursor: resetConfirmInput.trim().toUpperCase() === 'EFFACER' ? 'pointer' : 'not-allowed',
                }}
              >
                RÉINITIALISER LA BASE
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* VUE 4 : EXPORTATIONS CSV */}
      {subTab === 'export-csv' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {csvFeedback && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 6,
              background: `${THEME.accent.green}18`,
              border: `1px solid ${THEME.accent.green}44`,
              color: THEME.accent.green,
              fontSize: 13,
              fontWeight: 600,
            }}>
              <CheckCircle2 size={16} />
              <span>{csvFeedback}</span>
            </div>
          )}

          <div style={{ background: THEME.bg.soft, padding: '14px 18px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5 }}>
            Les fichiers CSV générés sont encodés en <strong>UTF-8 avec séparateurs point-virgule (;)</strong> pour une compatibilité native et immédiate avec Microsoft Excel (FR), Google Sheets et LibreOffice Calc.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* PACK GLOBAL */}
            <Card style={{ borderTop: `3px solid ${THEME.text.primary}` }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: THEME.text.muted, fontWeight: 600, marginBottom: 8 }}>
                PACK GLOBAL
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 20, textTransform: 'uppercase', color: THEME.text.primary, marginBottom: 8 }}>
                Toutes les tables (3 fichiers)
              </div>
              <p style={{ fontSize: 12.5, color: THEME.text.muted, marginBottom: 16 }}>
                Télécharge simultanément les exports Ventes, Achats/Commandes et Journal de Trésorerie.
              </p>
              <button onClick={() => triggerCsv('all')} style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}>
                <Download size={13} />
                <span>EXPORTER TOUT (.CSV)</span>
              </button>
            </Card>

            {/* VENTES */}
            <Card style={{ borderTop: `3px solid ${THEME.accent.green}` }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: THEME.text.muted, fontWeight: 600, marginBottom: 8 }}>
                VENTES & RECETTES
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 20, textTransform: 'uppercase', color: THEME.text.primary, marginBottom: 8 }}>
                Journal des Ventes ({ventes.length})
              </div>
              <p style={{ fontSize: 12.5, color: THEME.text.muted, marginBottom: 16 }}>
                Détail de chaque transaction : date, client, articles, prix unitaire, règlement et reliquat.
              </p>
              <button onClick={() => triggerCsv('ventes')} style={{ ...ghostBtn, width: '100%', justifyContent: 'center' }}>
                <Download size={13} />
                <span>EXPORTER VENTES.CSV</span>
              </button>
            </Card>

            {/* ACHATS */}
            <Card style={{ borderTop: `3px solid ${THEME.accent.primary}` }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: THEME.text.muted, fontWeight: 600, marginBottom: 8 }}>
                COMMANDES & ACHATS
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 20, textTransform: 'uppercase', color: THEME.text.primary, marginBottom: 8 }}>
                Achats & Fret Chine ({commandes.length})
              </div>
              <p style={{ fontSize: 12.5, color: THEME.text.muted, marginBottom: 16 }}>
                Détail des achats fournisseurs : coûts RMB, conversions Ar, fret estimé et statuts logistiques.
              </p>
              <button onClick={() => triggerCsv('achats')} style={{ ...ghostBtn, width: '100%', justifyContent: 'center' }}>
                <Download size={13} />
                <span>EXPORTER ACHATS.CSV</span>
              </button>
            </Card>

            {/* TRÉSORERIE */}
            <Card style={{ borderTop: `3px solid ${THEME.accent.orange}` }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: THEME.text.muted, fontWeight: 600, marginBottom: 8 }}>
                GRAND LIVRE
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 20, textTransform: 'uppercase', color: THEME.text.primary, marginBottom: 8 }}>
                Flux de Trésorerie ({mouvements.length})
              </div>
              <p style={{ fontSize: 12.5, color: THEME.text.muted, marginBottom: 16 }}>
                Historique complet des encaissements, décaissements, frais généraux et transferts de comptes.
              </p>
              <button onClick={() => triggerCsv('tresorerie')} style={{ ...ghostBtn, width: '100%', justifyContent: 'center' }}>
                <Download size={13} />
                <span>EXPORTER TRÉSORERIE.CSV</span>
              </button>
            </Card>
          </div>
        </div>
      )}

      {/* VUE 5 : DIAGNOSTIC D'INTÉGRITÉ */}
      {subTab === 'diagnostic' && (
        <DiagnosticReport
          commandes={commandes}
          immobilisations={immobilisations}
          mouvements={mouvements}
          ventes={ventes}
          emprunts={emprunts}
          products={products}
          fournisseurs={fournisseurs}
          clients={clients}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* VUE 6 : CONSOLE API REST OFFLINE */}
      {subTab === 'api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: THEME.bg.soft, padding: '14px 18px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, fontSize: 13, color: THEME.text.secondary, lineHeight: 1.5 }}>
            Cette console émule un serveur REST client-side (`offlineApi`) branché directement sur IndexedDB. Elle permet d'intégrer des scripts, automations ou d'inspecter les schémas JSON du système.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* FORMULAIRE REQUÊTE */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={16} color={THEME.accent.primary} />
                <span>EXÉCUTEUR DE REQUÊTES REST</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
                  <div>
                    <Label>Méthode</Label>
                    <select
                      value={apiMethod}
                      onChange={(e) => setApiMethod(e.target.value as any)}
                      style={selectStyle}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </div>
                  <div>
                    <Label>Endpoint</Label>
                    <select
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="/api/v1/health">/api/v1/health (Ping & Statut DB)</option>
                      <option value="/api/v1/products">/api/v1/products (Catalogue Produits)</option>
                      <option value="/api/v1/ventes">/api/v1/ventes (Journal des Ventes)</option>
                      <option value="/api/v1/commandes">/api/v1/commandes (Commandes Achats)</option>
                      <option value="/api/v1/stats">/api/v1/stats (Métriques Globales)</option>
                      <option value="/api/v1/backup">/api/v1/backup (Export Global JSON)</option>
                    </select>
                  </div>
                </div>

                {apiMethod === 'POST' && (
                  <div>
                    <Label>Corps de la requête (JSON Body)</Label>
                    <textarea
                      value={apiBody}
                      onChange={(e) => setApiBody(e.target.value)}
                      rows={6}
                      style={{ ...inputStyle, height: 'auto', padding: 12, fontFamily: FONTS.mono, fontSize: 12 }}
                    />
                  </div>
                )}

                <button
                  onClick={handleExecuteApi}
                  disabled={apiLoading}
                  style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}
                >
                  <Play size={13} />
                  <span>{apiLoading ? 'EXÉCUTION…' : 'ENVOYER LA REQUÊTE'}</span>
                </button>
              </div>
            </Card>

            {/* RÉPONSE JSON */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: THEME.text.muted, fontWeight: 600 }}>
                  RÉPONSE DU SERVEUR
                </div>
                {apiResponse && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
                      setApiCopied(true);
                      setTimeout(() => setApiCopied(false), 2000);
                    }}
                    style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11 }}
                  >
                    {apiCopied ? <Check size={12} color={THEME.accent.green} /> : <Copy size={12} />}
                    <span>{apiCopied ? 'COPIÉ !' : 'COPIER JSON'}</span>
                  </button>
                )}
              </div>

              <div style={{
                background: THEME.bg.soft,
                border: `1px solid ${THEME.border.base}`,
                borderRadius: 6,
                padding: 12,
                minHeight: 220,
                maxHeight: 380,
                overflowY: 'auto',
                fontFamily: FONTS.mono,
                fontSize: 11.5,
                color: THEME.text.primary,
              }}>
                {apiLoading ? (
                  <div style={{ color: THEME.text.muted, padding: 20, textAlign: 'center' }}>Exécution de la requête locale...</div>
                ) : apiResponse ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                ) : (
                  <div style={{ color: THEME.text.muted, padding: 40, textAlign: 'center' }}>
                    Sélectionnez un endpoint et cliquez sur "Envoyer la requête" pour inspecter la réponse JSON.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* VUE 7 : COMPTES FINANCIERS & CANAUX DE PAIEMENT */}
      {subTab === 'comptes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          <Card>
            <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} color={THEME.accent.primary} />
              <span>AJOUTER UN COMPTE FINANCIER</span>
            </div>
            <form onSubmit={handleAddCompte} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <Label>Nom du compte ou portefeuille</Label>
                <input
                  type="text"
                  placeholder="Ex: Caisse Boutique 2, BMOI Courant, BNI..."
                  value={newCompteName}
                  onChange={(e) => setNewCompteName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button type="submit" style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}>
                <Plus size={14} />
                <span>AJOUTER LE COMPTE</span>
              </button>
            </form>
          </Card>

          <Card>
            <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={16} color={THEME.accent.green} />
              <span>COMPTES ACTIFS ({comptes.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comptes.map((cName) => (
                <div
                  key={cName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: THEME.accent.primary }} />
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: THEME.text.primary }}>{cName}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveCompte(cName)}
                    style={{ ...ghostBtn, padding: '4px 8px', color: THEME.accent.danger, borderColor: `${THEME.accent.danger}33` }}
                    title="Supprimer ce compte"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* VUE 8 : CENTRE D'AIDE & DOCUMENTATION (FAQ) */}
      {subTab === 'help' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* BANNIÈRE D'ACCUEIL AIDE */}
          <div style={{
            background: THEME.bg.card,
            border: `1px solid ${THEME.border.base}`,
            borderRadius: RADIUS.card,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
            boxShadow: SHADOWS.card,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: `${THEME.accent.primary}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: THEME.accent.primary,
              }}>
                <BookOpen size={24} />
              </div>
              <div>
                <h2 style={{ fontFamily: FONTS.display, fontSize: 20, margin: 0, color: THEME.text.primary, textTransform: 'uppercase' }}>
                  Centre d'Aide & Documentation ERP
                </h2>
                <div style={{ fontSize: 13, color: THEME.text.secondary, marginTop: 4 }}>
                  Guide d'utilisation et réponses aux questions fréquemment posées sur votre application.
                </div>
              </div>
            </div>

            <button onClick={() => setSubTab('backup')} style={{ ...primaryBtn, gap: 8 }}>
              <HardDrive size={14} />
              <span>GÉRER MES SAUVEGARDES</span>
            </button>
          </div>

          {/* GRILLE DES QUESTIONS FRÉQUENTES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {/* FAQ 1 : SAUVEGARDE & PHOTOS */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 10, color: THEME.accent.primary }}>
                <HardDrive size={18} />
                <span>Sauvegarde & Restauration avec Photos</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: THEME.text.primary, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: THEME.text.primary }}>
                  Q : Si je sauvegarde puis restaure un fichier JSON, mes photos sont-elles conservées ?
                </div>
                <div style={{ background: THEME.bg.soft, padding: '12px 14px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  <strong style={{ color: THEME.accent.green }}>Oui, à 100 % !</strong> Lorsque vous téléchargez votre sauvegarde au format <code>.json</code>, toutes les images de votre catalogue sont automatiquement converties et intégrées au fichier. Lors de l'import, vos articles et leurs photos réapparaissent exactement à leur place.
                </div>
                <div style={{ fontSize: 12, color: THEME.text.muted }}>
                  💡 <em>Conseil : Téléchargez régulièrement un fichier de sauvegarde depuis l'onglet <strong>Sauvegarde & Restore</strong> pour sécuriser votre base.</em>
                </div>
              </div>
            </Card>

            {/* FAQ 2 : REGLEMENT MULTI-FACTURES */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 10, color: THEME.accent.primary }}>
                <DollarSign size={18} />
                <span>Multi-Paiements & Acomptes Libres</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: THEME.text.primary, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: THEME.text.primary }}>
                  Q : Comment régler plusieurs factures en une fois sans multiplier les lignes dans le journal ?
                </div>
                <div style={{ background: THEME.bg.soft, padding: '12px 14px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  Utilisez le bouton <strong>"Régler des Factures"</strong> dans Trésorerie. Vous pouvez cocher autant de factures que souhaité. L'application génère <strong>une seule ligne consolidée</strong> dans le journal de trésorerie avec le détail disponible au clic.
                </div>
                <div style={{ background: THEME.bg.soft, padding: '12px 14px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  <strong>Acomptes libres :</strong> Vous pouvez également effectuer un paiement sans sélectionner de facture. La somme est mise en réserve en <em>Acompte Libre / Reliquat Disponible</em> et pourra être imputée plus tard.
                </div>
              </div>
            </Card>

            {/* FAQ 3 : COMPTES FINANCIERS */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 10, color: THEME.accent.primary }}>
                <Sliders size={18} />
                <span>Gestion des Comptes Financiers & Caisses</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: THEME.text.primary, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: THEME.text.primary }}>
                  Q : Comment ajouter ou organiser mes moyens de paiement (Mobile Money, Caisse, Banque) ?
                </div>
                <div style={{ background: THEME.bg.soft, padding: '12px 14px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  Rendez-vous dans le sous-onglet <strong>Comptes Financiers</strong> pour ajouter de nouveaux libellés de compte (ex: <em>Caisse Principale, MVola, Orange Money, BNI Courant</em>). Ils deviendront immédiatement sélectionnables lors des encaissements et transferts.
                </div>
              </div>
            </Card>

            {/* FAQ 4 : TAUX & DEVISES */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 10, color: THEME.accent.primary }}>
                <Coins size={18} />
                <span>Devises, Yuan RMB & Dollar USD</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: THEME.text.primary, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: THEME.text.primary }}>
                  Q : Comment sont recalculés les prix de revient en Ariary lors des achats en Chine ou Fret ?
                </div>
                <div style={{ background: THEME.bg.soft, padding: '12px 14px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  Les taux configurés dans <strong>Taux & Devises</strong> servent à convertir les montants exprimés en Yuan (RMB) ou Dollar (USD) en Ariary (MGA) pour déterminer le coût de revient unitaire net de chaque produit importé.
                </div>
              </div>
            </Card>

            {/* FAQ 5 : HORS-LIGNE & PWA */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 10, color: THEME.accent.primary }}>
                <Zap size={18} />
                <span>Mode Hors-Ligne & Base Local-First</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: THEME.text.primary, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: THEME.text.primary }}>
                  Q : Puis-je utiliser l'application sans connexion Internet ?
                </div>
                <div style={{ background: THEME.bg.soft, padding: '12px 14px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  <strong>Absolument !</strong> L'ERP fonctionne sur une architecture Local-First stockée dans le navigateur (IndexedDB). Toutes vos saisies, ventes et modifications sont enregistrées localement même en coupure réseau.
                </div>
              </div>
            </Card>

            {/* FAQ 6 : EXPORT EXCEL */}
            <Card>
              <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 10, color: THEME.accent.primary }}>
                <FileSpreadsheet size={18} />
                <span>Exports CSV & Compatibilité Excel</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: THEME.text.primary, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: THEME.text.primary }}>
                  Q : Comment réexploiter mes ventes et achats sur Microsoft Excel ou Numbers ?
                </div>
                <div style={{ background: THEME.bg.soft, padding: '12px 14px', borderRadius: 8, border: `1px solid ${THEME.border.base}`, color: THEME.text.secondary }}>
                  Depuis l'onglet <strong>Exportations CSV</strong>, téléchargez en un clic le pack complet. Les fichiers sont formatés avec l'encodage UTF-8 avec BOM et des séparateurs adaptés à Excel.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
