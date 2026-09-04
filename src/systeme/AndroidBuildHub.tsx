// src/systeme/AndroidBuildHub.tsx
// Hub de gestion de la compilation Android, génération d'APK et diagnostics du pont API natif.

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Terminal,
  Layers,
  ShieldCheck,
  Zap,
  HardDrive,
  RefreshCw,
  Download,
  Share2,
  Activity,
  ExternalLink
} from 'lucide-react';
import { THEME } from '../colors';
import { FONTS } from '../fonts';
import { Card, cardTitle, primaryBtn, ghostBtn, Label, RADIUS, SHADOWS } from '../ui';
import { getAndroidDeviceInfo } from '../api/androidBridge';
import { offlineApi } from '../api/offlineApi';
import { comptoirFetch } from '../api/httpInterceptor';

export default function AndroidBuildHub() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [apiPingResult, setApiPingResult] = useState<any>(null);
  const [apiPingLoading, setApiPingLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hapticSuccess, setHapticSuccess] = useState(false);

  useEffect(() => {
    setDeviceInfo(getAndroidDeviceInfo());
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestApi = async () => {
    setApiPingLoading(true);
    try {
      const startTime = performance.now();
      // Test d'un appel fetch standard intercepté par l'engine Android
      const res = await comptoirFetch('/api/v1/health');
      const data = await res.json();
      const duration = Math.round(performance.now() - startTime);

      setApiPingResult({
        status: res.status,
        engine: res.headers.get('X-Comptoir-Engine') || 'Android-Local-Bridge',
        durationMs: duration,
        data,
      });
    } catch (err: any) {
      setApiPingResult({
        status: 500,
        error: err?.message || 'Erreur lors du test API',
      });
    } finally {
      setApiPingLoading(false);
    }
  };

  const handleTestHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([60, 40, 60]);
    }
    setHapticSuccess(true);
    setTimeout(() => setHapticSuccess(false), 2000);
  };

  const handleTestShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Comptoir Central ERP',
          text: 'Accès au système de gestion commerciale et logistique.',
          url: window.location.href,
        });
      } catch (e) {
        // Partage annulé par l'utilisateur
      }
    } else {
      alert('L\'API Web Share est disponible sur les appareils mobiles et l\'application Android native.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* BANNIÈRE D'ÉTAT ANDROID */}
      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.base}`,
        borderRadius: RADIUS.card,
        padding: '22px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
        boxShadow: SHADOWS.card,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
            border: `1px solid rgba(37, 99, 235, 0.3)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: THEME.accent.primary,
          }}>
            <Smartphone size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontFamily: FONTS.display, fontSize: 20, margin: 0, color: THEME.text.primary, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Plateforme Android & Générateur d'APK
              </h2>
              <span style={{
                fontSize: 11,
                fontFamily: FONTS.mono,
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.12)',
                color: THEME.accent.green,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 8px',
                borderRadius: RADIUS.pill,
              }}>
                CAPACITOR 8 CONFIGURÉ
              </span>
            </div>
            <div style={{ fontSize: 13, color: THEME.text.secondary, marginTop: 4 }}>
              Votre projet intègre le moteur natif Android avec pont API local, gestion du bouton retour matériel et safe-area responsive.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleTestApi} style={{ ...primaryBtn, gap: 8 }}>
            <Activity size={14} />
            <span>TESTER L'API ANDROID</span>
          </button>
        </div>
      </div>

      {/* GRILLE PRINCIPALE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* CARTE 1 : CONFIGURATION TECHNIQUE */}
        <Card>
          <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color={THEME.accent.primary} />
            <span>SPÉCIFICATIONS TECHNIQUES ANDROID</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              background: THEME.bg.soft,
              border: `1px solid ${THEME.border.base}`,
              fontSize: 12.5,
            }}>
              <span style={{ color: THEME.text.secondary }}>Application ID</span>
              <strong style={{ fontFamily: FONTS.mono, color: THEME.accent.primary }}>com.comptoircentral.erp</strong>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              background: THEME.bg.soft,
              border: `1px solid ${THEME.border.base}`,
              fontSize: 12.5,
            }}>
              <span style={{ color: THEME.text.secondary }}>Compatibilité Android</span>
              <strong style={{ fontFamily: FONTS.mono, color: THEME.accent.green }}>Android 7.0+ à 15 (API 24 à 35)</strong>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              background: THEME.bg.soft,
              border: `1px solid ${THEME.border.base}`,
              fontSize: 12.5,
            }}>
              <span style={{ color: THEME.text.secondary }}>Schéma de communication</span>
              <strong style={{ fontFamily: FONTS.mono, color: THEME.accent.green }}>https:// (AndroidScheme)</strong>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              background: THEME.bg.soft,
              border: `1px solid ${THEME.border.base}`,
              fontSize: 12.5,
            }}>
              <span style={{ color: THEME.text.secondary }}>Moteur de Persistance</span>
              <strong style={{ fontFamily: FONTS.mono, color: THEME.text.primary }}>IndexedDB + LocalStorage</strong>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              background: THEME.bg.soft,
              border: `1px solid ${THEME.border.base}`,
              fontSize: 12.5,
            }}>
              <span style={{ color: THEME.text.secondary }}>Statut Environnement Actuel</span>
              <strong style={{ fontFamily: FONTS.mono, color: deviceInfo?.isNative ? THEME.accent.green : THEME.accent.primary }}>
                {deviceInfo?.isNative ? 'Conteneur Natif Android' : 'Navigateur / PWA Prêt'}
              </strong>
            </div>
          </div>
        </Card>

        {/* CARTE 2 : COMMANDES DE COMPILATION APK */}
        <Card>
          <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={16} color={THEME.accent.terracotta} />
            <span>COMMANDES DE COMPILATION DU PROJET</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Commande 1 : Sync */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>1. Build & Synchronisation Android :</span>
                <button
                  onClick={() => handleCopy('npm run build:android', 'sync')}
                  style={{ ...ghostBtn, padding: '2px 8px', fontSize: 11, gap: 4 }}
                >
                  {copiedKey === 'sync' ? <Check size={12} color={THEME.accent.green} /> : <Copy size={12} />}
                  <span>{copiedKey === 'sync' ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <div style={{
                background: '#0B0D12',
                color: '#34D399',
                fontFamily: FONTS.mono,
                fontSize: 12,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                npm run build:android
              </div>
            </div>

            {/* Commande 2 : Build APK */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>2. Compilation directe APK (Gradle) :</span>
                <button
                  onClick={() => handleCopy('npm run build:apk', 'apk')}
                  style={{ ...ghostBtn, padding: '2px 8px', fontSize: 11, gap: 4 }}
                >
                  {copiedKey === 'apk' ? <Check size={12} color={THEME.accent.green} /> : <Copy size={12} />}
                  <span>{copiedKey === 'apk' ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <div style={{
                background: '#0B0D12',
                color: '#FBBF24',
                fontFamily: FONTS.mono,
                fontSize: 12,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                npm run build:apk
              </div>
            </div>

            {/* Commande 3 : Android Studio */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>3. Ouvrir dans Android Studio :</span>
                <button
                  onClick={() => handleCopy('npx cap open android', 'studio')}
                  style={{ ...ghostBtn, padding: '2px 8px', fontSize: 11, gap: 4 }}
                >
                  {copiedKey === 'studio' ? <Check size={12} color={THEME.accent.green} /> : <Copy size={12} />}
                  <span>{copiedKey === 'studio' ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <div style={{
                background: '#0B0D12',
                color: '#60A5FA',
                fontFamily: FONTS.mono,
                fontSize: 12,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                npx cap open android
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION DIAGNOSTIC INTERACTIF DE L'API */}
      <Card>
        <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color={THEME.accent.green} />
          <span>DIAGNOSTIC DU PONT API & FONCTIONNALITÉS MOBILES</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Action 1 : Test API Local */}
          <div style={{
            background: THEME.bg.soft,
            border: `1px solid ${THEME.border.base}`,
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: THEME.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color={THEME.accent.primary} />
              <span>Intercepteur HTTP & REST</span>
            </div>
            <div style={{ fontSize: 12, color: THEME.text.secondary }}>
              Vérifie que les appels <code>fetch('/api/v1/...')</code> sont interceptés sans latence par le moteur local.
            </div>
            <button
              onClick={handleTestApi}
              disabled={apiPingLoading}
              style={{ ...primaryBtn, padding: '8px 12px', fontSize: 12, justifyContent: 'center' }}
            >
              {apiPingLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>Lancer le Test REST (0ms)</span>
            </button>
          </div>

          {/* Action 2 : Vibration / Haptique */}
          <div style={{
            background: THEME.bg.soft,
            border: `1px solid ${THEME.border.base}`,
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: THEME.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={16} color={THEME.accent.terracotta} />
              <span>Retour Haptique / Vibration</span>
            </div>
            <div style={{ fontSize: 12, color: THEME.text.secondary }}>
              Teste le retour tactile pour confirmation des ventes, scans de codes-barres ou validations.
            </div>
            <button
              onClick={handleTestHaptic}
              style={{ ...ghostBtn, padding: '8px 12px', fontSize: 12, justifyContent: 'center' }}
            >
              {hapticSuccess ? <Check size={14} color={THEME.accent.green} /> : <Zap size={14} />}
              <span>{hapticSuccess ? 'Vibration émise !' : 'Tester la Vibration'}</span>
            </button>
          </div>

          {/* Action 3 : Partage Natif Android */}
          <div style={{
            background: THEME.bg.soft,
            border: `1px solid ${THEME.border.base}`,
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: THEME.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 size={16} color={THEME.accent.green} />
              <span>Partage Natif Android (Intent)</span>
            </div>
            <div style={{ fontSize: 12, color: THEME.text.secondary }}>
              Déclenche la feuille de partage système Android pour exporter un reçu ou un bon de commande.
            </div>
            <button
              onClick={handleTestShare}
              style={{ ...ghostBtn, padding: '8px 12px', fontSize: 12, justifyContent: 'center' }}
            >
              <Share2 size={14} />
              <span>Tester le Partage Natif</span>
            </button>
          </div>
        </div>

        {/* Résultat du Ping API si exécuté */}
        {apiPingResult && (
          <div style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 8,
            background: '#0B0D12',
            border: `1px solid ${apiPingResult.error ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color={THEME.accent.green} />
                <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>
                  RÉPONSE HTTP {apiPingResult.status} (Temps de réponse : {apiPingResult.durationMs}ms)
                </span>
              </div>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#94A3B8' }}>
                Moteur : {apiPingResult.engine}
              </span>
            </div>
            <pre style={{
              margin: 0,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: '#34D399',
              overflowX: 'auto',
              maxHeight: 180,
            }}>
              {JSON.stringify(apiPingResult.data, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* GUIDE ÉTAPE PAR ÉTAPE */}
      <Card>
        <div style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color={THEME.accent.primary} />
          <span>GUIDE DE DÉPLOIEMENT ANDROID POUR PRODUCTION</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div style={{ background: THEME.bg.soft, padding: 14, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: THEME.accent.primary, marginBottom: 4 }}>
              ÉTAPE 1 : ASSETS WEB
            </div>
            <div style={{ fontSize: 12.5, color: THEME.text.secondary, lineHeight: 1.4 }}>
              Exécutez <code>npm run build:android</code> pour compiler l'application React et copier les fichiers optimisés dans le dossier natif.
            </div>
          </div>

          <div style={{ background: THEME.bg.soft, padding: 14, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: THEME.accent.terracotta, marginBottom: 4 }}>
              ÉTAPE 2 : GÉNÉRATION APK
            </div>
            <div style={{ fontSize: 12.5, color: THEME.text.secondary, lineHeight: 1.4 }}>
              Lancez <code>npm run build:apk</code>. Le fichier <code>app-debug.apk</code> sera généré dans <code>android/app/build/outputs/apk/debug/</code>.
            </div>
          </div>

          <div style={{ background: THEME.bg.soft, padding: 14, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: THEME.accent.green, marginBottom: 4 }}>
              ÉTAPE 3 : INSTALLATION TÉLÉPHONE
            </div>
            <div style={{ fontSize: 12.5, color: THEME.text.secondary, lineHeight: 1.4 }}>
              Transférez l'APK sur votre smartphone ou tablette Android par câble USB, Drive ou WhatsApp pour l'installer directement.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
