import React, { useState, useRef } from 'react';
import { Download, Upload, Database, RotateCcw, AlertTriangle, Check, FileJson, Activity, ShieldCheck, Wrench, Clock } from 'lucide-react';
import { Modal, primaryBtn, ghostBtn } from '../ui';
import {
  CURRENT_SCHEMA_VERSION,
  migrateDataSchema,
  analyzeDataHealth,
  repairDataIntegrity,
  getDernierAutoSnapshot,
  exporterJSON
} from './backupUtils';

interface BackupModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    products: any[];
    ventes: any[];
    commandes: any[];
    fournisseurs: any[];
    clients: any[];
    sourcing: any[];
    mouvements: any[];
    changes?: any[];
    devises: { rmb: number; usd: number };
    immobilisations?: any[];
    emprunts?: any[];
    frais?: any[];
    chargesFixes?: any[];
    comptes?: string[];
  };
  onRestore: (newData: any) => void;
}

export default function BackupModal({ open, onClose, data, onRestore }: BackupModalProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const healthReport = analyzeDataHealth(data);
  const autoSnapshot = getDernierAutoSnapshot();

  const handleExportJSON = () => {
    try {
      exporterJSON(data);
      setSuccessMsg(`Fichier de sauvegarde (v${CURRENT_SCHEMA_VERSION}) téléchargé avec succès !`);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(`Erreur lors de l'exportation : ${err.message}`);
    }
  };

  const handleRestoreAutoSnapshot = () => {
    if (!autoSnapshot?.data) return;
    const cleanData = migrateDataSchema(autoSnapshot.data);
    onRestore(cleanData);
    const timeFormatted = new Date(autoSnapshot.timestamp).toLocaleString();
    setSuccessMsg(`Restauration réussie depuis le snapshot auto du ${timeFormatted} !`);
    setErrorMsg(null);
  };

  const handleRepairData = () => {
    const repaired = repairDataIntegrity(data);
    onRestore(repaired);
    setSuccessMsg("Nettoyage et réparation de l'intégrité des données effectués avec succès !");
    setErrorMsg(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Format JSON invalide.');
        }

        // Migration automatique de schéma lors de l'import
        const restoredData = migrateDataSchema(parsed);

        onRestore(restoredData);

        const totalItems =
          restoredData.products.length +
          restoredData.commandes.length +
          restoredData.ventes.length +
          restoredData.fournisseurs.length +
          restoredData.immobilisations.length +
          restoredData.emprunts.length;

        setSuccessMsg(`Sauvegarde restaurée avec succès ! Schema v${restoredData.schemaVersion || CURRENT_SCHEMA_VERSION} (${totalItems} éléments importés)`);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(`Fichier JSON invalide : ${err.message}`);
        setSuccessMsg(null);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleReset = () => {
    const emptyData = migrateDataSchema({});
    onRestore(emptyData);
    setShowConfirmReset(false);
    setSuccessMsg('Toutes les données ont été réinitialisées.');
    setErrorMsg(null);
  };

  return (
    <Modal title="Gestion, Sauvegarde & Santé des Données" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Messages d'information */}
        {successMsg && (
          <div style={{ background: '#E3EFE9', border: '1px solid #C4DEC0', color: '#2C5E43', padding: '10px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#FDF2F2', border: '1px solid #F8C4C4', color: '#C24A3F', padding: '10px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Diagnostic de santé & intégrité */}
        <div style={{ background: healthReport.score >= 90 ? '#F2F8F4' : '#FFF9E6', padding: 14, borderRadius: 10, border: `1px solid ${healthReport.score >= 90 ? '#C8E6C9' : '#FFE082'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: healthReport.score >= 90 ? '#2E7D32' : '#F57F17', display: 'flex', alignItems: 'center', gap: 6 }}>
              {healthReport.score >= 90 ? <ShieldCheck size={17} /> : <Activity size={17} />}
              <span>Santé de la base de données : <strong>{healthReport.score}%</strong></span>
            </div>
            <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
              Schéma v{CURRENT_SCHEMA_VERSION}
            </span>
          </div>

          {healthReport.anomalies.length === 0 && healthReport.warnings.length === 0 ? (
            <div style={{ fontSize: 12, color: '#2E7D32' }}>
              ✓ Aucune anomalie détectée. Toutes les clés et valeurs numériques sont parfaitement intègres.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {healthReport.anomalies.map((anom, idx) => (
                <div key={idx} style={{ fontSize: 12, color: '#C24A3F', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  • {anom}
                </div>
              ))}
              {healthReport.warnings.map((warn, idx) => (
                <div key={idx} style={{ fontSize: 12, color: '#B78103', display: 'flex', alignItems: 'center', gap: 4 }}>
                  • {warn}
                </div>
              ))}
              <button
                onClick={handleRepairData}
                style={{ ...ghostBtn, height: 32, marginTop: 4, alignSelf: 'flex-start', color: '#2D6A4F', borderColor: '#2D6A4F' }}
              >
                <Wrench size={13} />
                <span>Nettoyer & Réparer automatiquement</span>
              </button>
            </div>
          )}
        </div>

        {/* Auto-Snapshot de secours si disponible */}
        {autoSnapshot && (
          <div style={{ background: '#FAF6F0', padding: 12, borderRadius: 8, border: '1px solid #E2D5C3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#5E4A3C' }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: '#6B4226' }}>
                <Clock size={14} />
                <span>Dernier snapshot auto local :</span>
              </div>
              <div style={{ fontSize: 11.5, marginTop: 2, color: '#8C7868' }}>
                {new Date(autoSnapshot.timestamp).toLocaleString()} (v{autoSnapshot.schemaVersion || 1.0})
              </div>
            </div>
            <button
              onClick={handleRestoreAutoSnapshot}
              style={{ ...ghostBtn, height: 32, fontSize: 12 }}
            >
              <RotateCcw size={13} />
              <span>Restaurer snapshot auto</span>
            </button>
          </div>
        )}

        {/* Récapitulatif du contenu actuel */}
        <div style={{ background: '#FAF7F2', padding: 12, borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3D5A6C', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={15} />
            <span>État des enregistrements : ({healthReport.totalRecords} au total)</span>
          </div>
          <div style={{ fontSize: 12, color: '#5E584E', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            <div>• Produits : <strong>{data.products?.length || 0}</strong></div>
            <div>• Achats / Commandes : <strong>{data.commandes?.length || 0}</strong></div>
            <div>• Ventes enregistrées : <strong>{data.ventes?.length || 0}</strong></div>
            <div>• Fournisseurs & Transitaires : <strong>{data.fournisseurs?.length || 0}</strong></div>
            <div>• Clients : <strong>{data.clients?.length || 0}</strong></div>
            <div>• Mouvements Trésorerie : <strong>{data.mouvements?.length || 0}</strong></div>
            <div>• Opérations de Change : <strong>{data.changes?.length || 0}</strong></div>
            <div>• Immobilisations : <strong>{data.immobilisations?.length || 0}</strong></div>
            <div>• Emprunts : <strong>{data.emprunts?.length || 0}</strong></div>
          </div>
        </div>

        {/* Action 1 : EXPORTER */}
        <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #EAE2D4', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#26333D', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} color="#3F7A5C" />
            <span>1. Télécharger une sauvegarde (Export JSON v{CURRENT_SCHEMA_VERSION})</span>
          </div>
          <div style={{ fontSize: 12, color: '#8A8375' }}>
            Génère un fichier `.json` structuré et migré, contenant l'intégralité de vos données d'entreprise.
          </div>
          <button
            onClick={handleExportJSON}
            style={{ ...primaryBtn, height: 38, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
          >
            <FileJson size={15} />
            <span>Télécharger ma sauvegarde (.json)</span>
          </button>
        </div>

        {/* Action 2 : IMPORTER */}
        <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #EAE2D4', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#26333D', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={16} color="#3D5A6C" />
            <span>2. Restaurer depuis un fichier (Import JSON avec Migration Auto)</span>
          </div>
          <div style={{ fontSize: 12, color: '#8A8375' }}>
            Sélectionnez un fichier `.json` (ancien ou récent). Les données seront adaptées et migrées automatiquement.
          </div>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ ...ghostBtn, height: 38, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
          >
            <Upload size={15} />
            <span>Choisir un fichier de sauvegarde (.json)</span>
          </button>
        </div>

        {/* Action 3 : RÉINITIALISER */}
        <div style={{ padding: 12, borderRadius: 8, background: '#FFF5F5', border: '1px solid #F8C4C4', marginTop: 4 }}>
          {!showConfirmReset ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#C24A3F', fontWeight: 600 }}>
                Zone de réinitialisation :
              </div>
              <button
                onClick={() => setShowConfirmReset(true)}
                style={{ background: 'transparent', border: '1px solid #C24A3F', color: '#C24A3F', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RotateCcw size={13} />
                <span>Mettre à zéro</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#C24A3F', fontWeight: 700 }}>
                ⚠️ Attention ! Cette action effacera définitivement toutes les données locales. Êtes-vous sûr ?
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  style={{ ...ghostBtn, height: 32, fontSize: 12 }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleReset}
                  style={{ background: '#C24A3F', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '0 12px', height: 32, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirmer l'effacement
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

