import React, { useState } from 'react';
import {
  Building2,
  Coins,
  Wallet,
  Truck,
  Package,
  Users,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  DollarSign,
  Layers,
  MapPin,
  Check
} from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { COMPTES_FINANCIERS, CATEGORIES } from '../constants';

interface SetupWizardProps {
  show: boolean;
  onClose: () => void;
  onComplete: (setupData: any) => void;
  currentDevises?: { rmb: number; usd: number };
  currentComptes?: string[];
}

export default function SetupWizard({
  show,
  onClose,
  onComplete,
  currentDevises = { rmb: 680, usd: 4600 },
  currentComptes = COMPTES_FINANCIERS,
}: SetupWizardProps) {
  const [step, setStep] = useState(1);

  // Étape 1 : Profil Entreprise
  const [companyName, setCompanyName] = useState('Mon Comptoir ERP');
  const [secteur, setSecteur] = useState('Import-Export & Commerce de détail');

  // Étape 2 : Taux de Change
  const [rmb, setRmb] = useState(String(currentDevises.rmb || 680));
  const [usd, setUsd] = useState(String(currentDevises.usd || 4600));

  // Étape 3 : Comptes Financiers
  const [comptesList, setComptesList] = useState<string[]>(
    currentComptes && currentComptes.length > 0
      ? currentComptes
      : ['Caisse Espèces', 'MVola / Mobile Money', 'Compte BNI / Bank']
  );
  const [newCompte, setNewCompte] = useState('');

  // Étape 4 : Soldes Initiaux Trésorerie
  const [soldeCaisse, setSoldeCaisse] = useState('0');
  const [soldeBanque, setSoldeBanque] = useState('0');

  // Étape 5 : Premier Fournisseur / Transitaire
  const [fournisseurNom, setFournisseurNom] = useState('Fournisseur Chine Express');
  const [fournisseurContact, setFournisseurContact] = useState('+86 138 0000 0000 / WeChat');

  // Étape 6 : Premier Produit au Catalogue
  const [productNom, setProductNom] = useState('');
  const [productCategorie, setProductCategorie] = useState('High-Tech');
  const [productPuRmb, setProductPuRmb] = useState('0');
  const [productPrixVente, setProductPrixVente] = useState('0');

  // Étape 7 : Stock Initial
  const [stockQty, setStockQty] = useState('0');
  const [stockEntrepot, setStockEntrepot] = useState('Entrepôt Principal (Tana)');

  // Étape 8 : Premier Client
  const [clientNom, setClientNom] = useState('');
  const [clientContact, setClientContact] = useState('');

  // Étape 9 : Charge Fixe Récurrente
  const [chargeNom, setChargeNom] = useState('Loyer Local');
  const [chargeMontant, setChargeMontant] = useState('0');

  if (!show) return null;

  const totalSteps = 10;

  const handleAddCompte = () => {
    if (!newCompte.trim()) return;
    if (!comptesList.includes(newCompte.trim())) {
      setComptesList([...comptesList, newCompte.trim()]);
    }
    setNewCompte('');
  };

  const handleRemoveCompte = (name: string) => {
    setComptesList(comptesList.filter(c => c !== name));
  };

  const handleFinish = () => {
    const rmbNum = Number(rmb) || 680;
    const usdNum = Number(usd) || 4600;

    const setupPayload: any = {
      devises: { rmb: rmbNum, usd: usdNum },
      comptes: comptesList.length > 0 ? comptesList : COMPTES_FINANCIERS,
      companyName,
      secteur,
    };

    // Nouveau produit si renseigné
    if (productNom.trim()) {
      setupPayload.newProduct = {
        id: `prod_${Date.now()}`,
        nom: productNom.trim(),
        categorie: productCategorie,
        puRmb: Number(productPuRmb) || 0,
        prix: Number(productPrixVente) || 0,
        stock: Number(stockQty) || 0,
        entrepot: stockEntrepot,
      };
    }

    // Nouveau fournisseur si renseigné
    if (fournisseurNom.trim()) {
      setupPayload.newFournisseur = {
        id: `fourn_${Date.now()}`,
        nom: fournisseurNom.trim(),
        contact: fournisseurContact.trim(),
        pays: 'Chine',
      };
    }

    // Nouveau client si renseigné
    if (clientNom.trim()) {
      setupPayload.newClient = {
        id: `cli_${Date.now()}`,
        nom: clientNom.trim(),
        contact: clientContact.trim(),
        categorie: 'Standard',
      };
    }

    // Mouvements de trésorerie initiaux
    const initialMouvements: any[] = [];
    if (Number(soldeCaisse) > 0) {
      initialMouvements.push({
        id: `mvt_init_caisse_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'entree',
        compte: comptesList[0] || 'Caisse Espèces',
        montant: Number(soldeCaisse),
        categorie: 'Apport Initial',
        libelle: 'Solde de départ caisse',
      });
    }
    if (Number(soldeBanque) > 0) {
      initialMouvements.push({
        id: `mvt_init_banque_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'entree',
        compte: comptesList[1] || 'Compte BNI / Bank',
        montant: Number(soldeBanque),
        categorie: 'Apport Initial',
        libelle: 'Solde de départ banque',
      });
    }
    if (initialMouvements.length > 0) {
      setupPayload.initialMouvements = initialMouvements;
    }

    // Nouvelle charge fixe si renseignée
    if (chargeNom.trim() && Number(chargeMontant) > 0) {
      setupPayload.newChargeFixe = {
        id: `charge_${Date.now()}`,
        libelle: chargeNom.trim(),
        montant: Number(chargeMontant),
        frequence: 'Mensuel',
        compteDefaut: comptesList[0] || 'Caisse Espèces',
      };
    }

    onComplete(setupPayload);
  };

  const stepsInfo = [
    { num: 1, title: 'Bienvenue & Entreprise', icon: Building2 },
    { num: 2, title: 'Taux de Change (RMB/USD)', icon: Coins },
    { num: 3, title: 'Comptes Financiers', icon: Wallet },
    { num: 4, title: 'Soldes de Trésorerie', icon: DollarSign },
    { num: 5, title: 'Premier Fournisseur', icon: Truck },
    { num: 6, title: 'Premier Produit', icon: Package },
    { num: 7, title: 'Stock & Entrepôt', icon: Layers },
    { num: 8, title: 'Premier Client', icon: Users },
    { num: 9, title: 'Charges Fixes', icon: FileText },
    { num: 10, title: 'Résumé & Validation', icon: CheckCircle2 },
  ];

  const currentStepInfo = stepsInfo[step - 1];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: THEME.bg.card,
          border: `1px solid ${THEME.border.base}`,
          borderRadius: 20,
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* En-tête Wizard */}
        <div
          style={{
            padding: '18px 24px',
            background: THEME.bg.soft,
            borderBottom: `1px solid ${THEME.border.base}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: THEME.text.primary, letterSpacing: '-0.01em' }}>
                  Assistant de Configuration
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                  Étape {step} sur {totalSteps} : <span style={{ fontWeight: 600, color: THEME.accent.primary }}>{currentStepInfo.title}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: THEME.bg.card,
                border: `1px solid ${THEME.border.base}`,
                color: THEME.text.muted,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Fermer / Passer"
            >
              <span>Passer</span>
              <X size={16} />
            </button>
          </div>

          {/* Step Dots Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', overflowX: 'auto', paddingBottom: 2 }}>
            {stepsInfo.map(s => {
              const isActive = s.num === step;
              const isCompleted = s.num < step;
              return (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  style={{
                    flex: 1,
                    minWidth: 28,
                    height: 28,
                    borderRadius: 8,
                    border: 'none',
                    background: isActive
                      ? THEME.accent.primary
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.18)'
                      : THEME.bg.surface,
                    color: isActive
                      ? '#FFFFFF'
                      : isCompleted
                      ? THEME.accent.green
                      : THEME.text.muted,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                  }}
                  title={`${s.num}. ${s.title}`}
                >
                  {isCompleted ? <Check size={13} strokeWidth={3} /> : s.num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barre de Progression Visuelle */}
        <div style={{ background: THEME.border.base, height: 3, width: '100%' }}>
          <div
            style={{
              background: 'linear-gradient(90deg, #2563EB 0%, #10B981 100%)',
              height: '100%',
              width: `${(step / totalSteps) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Contenu de l'Étape */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ÉTAPE 1 : PROFIL ENTREPRISE */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={24} style={{ color: THEME.accent.primary }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Identité de votre entreprise
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Nommez votre comptoir pour personnaliser vos éditions et rapports.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Nom de la Société / Enseigne :
                </label>
                <input
                  style={inputStyle as any}
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ex: Comptoir Tana Express"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Secteur d'activité principal :
                </label>
                <select
                  style={selectStyle as any}
                  value={secteur}
                  onChange={e => setSecteur(e.target.value)}
                >
                  <option value="Import-Export & Commerce de détail">Import-Export Chine & Vente au détail</option>
                  <option value="Grossiste & Distribution">Grossiste & Distribution régionale</option>
                  <option value="E-commerce & Vente en ligne">E-commerce & Réseaux Sociaux</option>
                  <option value="Boutique & Showroom">Boutique & Showroom physique</option>
                </select>
              </div>

              <div style={{ background: THEME.bg.soft, borderRadius: 8, padding: 12, fontSize: 12, color: THEME.text.secondary }}>
                💡 <strong>KISS (Keep It Simple) :</strong> La devise principale du système est fixée en Ariary (Ar).
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : TAUX DE CHANGE */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Coins size={24} style={{ color: THEME.accent.primary }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Taux de Devises d'Achat (Chine / USD)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Définissez les cours de conversion utilisés pour vos achats en RMB et USD.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                    1 RMB (Yuan) = ? Ariary
                  </label>
                  <input
                    type="number"
                    style={inputStyle as any}
                    value={rmb}
                    onChange={e => setRmb(e.target.value)}
                    placeholder="680"
                  />
                  <span style={{ fontSize: 11, color: THEME.text.muted }}>Valeur par défaut : 680 Ar</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                    1 USD (Dollar) = ? Ariary
                  </label>
                  <input
                    type="number"
                    style={inputStyle as any}
                    value={usd}
                    onChange={e => setUsd(e.target.value)}
                    placeholder="4600"
                  />
                  <span style={{ fontSize: 11, color: THEME.text.muted }}>Valeur par défaut : 4600 Ar</span>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : COMPTES FINANCIERS */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wallet size={24} style={{ color: THEME.accent.primary }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Vos Comptes Financiers
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Où encaissez-vous vos ventes et d'où réglez-vous vos dépenses ?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: 1 } as any}
                  value={newCompte}
                  onChange={e => setNewCompte(e.target.value)}
                  placeholder="Ex: MVola Pro, Orange Money, BNI..."
                />
                <button
                  onClick={handleAddCompte}
                  style={primaryBtn as any}
                >
                  Ajouter
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {comptesList.map((c, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 20,
                      background: THEME.bg.soft,
                      border: `1px solid ${THEME.border.base}`,
                      fontSize: 12,
                      fontWeight: 600,
                      color: THEME.text.primary,
                    }}
                  >
                    {c}
                    {comptesList.length > 1 && (
                      <button
                        onClick={() => handleRemoveCompte(c)}
                        style={{ border: 'none', background: 'transparent', color: THEME.text.muted, cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : SOLDES DE TRÉSORERIE */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DollarSign size={24} style={{ color: THEME.accent.green }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Soldes de Départ en Trésorerie
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Saisissez le fond de caisse ou les disponibilités initiales (en Ar).
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Fond de Caisse Espèces (Ar) :
                </label>
                <input
                  type="number"
                  style={inputStyle as any}
                  value={soldeCaisse}
                  onChange={e => setSoldeCaisse(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Solde Banque / Mobile Money (Ar) :
                </label>
                <input
                  type="number"
                  style={inputStyle as any}
                  value={soldeBanque}
                  onChange={e => setSoldeBanque(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : PREMIER FOURNISSEUR */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck size={24} style={{ color: THEME.accent.primary }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Fournisseur ou Transitaire Principal
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Enregistrez votre partenaire logistique ou usine de sourcing Chine/local.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Nom du Fournisseur / Transitaire :
                </label>
                <input
                  style={inputStyle as any}
                  value={fournisseurNom}
                  onChange={e => setFournisseurNom(e.target.value)}
                  placeholder="Ex: Guangzhou Freight Co."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Contact (WeChat / Whatsapp) :
                </label>
                <input
                  style={inputStyle as any}
                  value={fournisseurContact}
                  onChange={e => setFournisseurContact(e.target.value)}
                  placeholder="+86 138 0000 0000"
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 6 : PREMIER PRODUIT */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={24} style={{ color: THEME.accent.primary }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Créer un 1er Produit au Catalogue
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Vous pourrez en ajouter davantage dans l'onglet Stock plus tard.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Nom de l'article :
                </label>
                <input
                  style={inputStyle as any}
                  value={productNom}
                  onChange={e => setProductNom(e.target.value)}
                  placeholder="Ex: Écouteurs Bluetooth Pro"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                    Prix Achat (RMB) :
                  </label>
                  <input
                    type="number"
                    style={inputStyle as any}
                    value={productPuRmb}
                    onChange={e => setProductPuRmb(e.target.value)}
                    placeholder="25"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                    Prix Vente Public (Ariary) :
                  </label>
                  <input
                    type="number"
                    style={inputStyle as any}
                    value={productPrixVente}
                    onChange={e => setProductPrixVente(e.target.value)}
                    placeholder="85000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 7 : STOCK INITIAL */}
          {step === 7 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Layers size={24} style={{ color: THEME.accent.primary }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Stock de Départ & Entrepôt
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Combien d'unités de ce produit avez-vous déjà en rayon ?
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Quantité en stock actuel (pièces) :
                </label>
                <input
                  type="number"
                  style={inputStyle as any}
                  value={stockQty}
                  onChange={e => setStockQty(e.target.value)}
                  placeholder="10"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Emplacement / Entrepôt :
                </label>
                <input
                  style={inputStyle as any}
                  value={stockEntrepot}
                  onChange={e => setStockEntrepot(e.target.value)}
                  placeholder="Entrepôt Principal (Tana)"
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 8 : PREMIER CLIENT */}
          {step === 8 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={24} style={{ color: THEME.accent.primary }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Premier Client ou Fiche Client
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Facultatif. Vous pouvez aussi réaliser des ventes comptant directes.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Nom / Raison Sociale Client :
                </label>
                <input
                  style={inputStyle as any}
                  value={clientNom}
                  onChange={e => setClientNom(e.target.value)}
                  placeholder="Ex: Client Fidèle ou Entreprise X"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Téléphone / WhatsApp :
                </label>
                <input
                  style={inputStyle as any}
                  value={clientContact}
                  onChange={e => setClientContact(e.target.value)}
                  placeholder="034 00 000 00"
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 9 : CHARGES FIXES */}
          {step === 9 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={24} style={{ color: THEME.accent.orange }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: THEME.text.primary }}>
                    Charge Fixe Mensuelle (Loyer / Salaire)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                    Définissez vos dépenses récurrentes pour alimenter automatiquement votre P&L.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Intitulé de la charge :
                </label>
                <input
                  style={inputStyle as any}
                  value={chargeNom}
                  onChange={e => setChargeNom(e.target.value)}
                  placeholder="Ex: Loyer Local commercial"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.text.primary, marginBottom: 4 }}>
                  Montant mensuel estimé (Ariary) :
                </label>
                <input
                  type="number"
                  style={inputStyle as any}
                  value={chargeMontant}
                  onChange={e => setChargeMontant(e.target.value)}
                  placeholder="500000"
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 10 : RÉSUMÉ & VALIDATION */}
          {step === 10 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <CheckCircle2 size={36} style={{ color: THEME.accent.green, margin: '0 auto 6px' }} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: THEME.text.primary }}>
                  Résumé de votre configuration
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: THEME.text.muted }}>
                  Vérifiez le récapitulatif des paramètres configurés avant de finaliser l'initialisation.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* 1. Entreprise */}
                <div
                  onClick={() => setStep(1)}
                  style={{
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  title="Cliquer pour modifier"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={13} /> 1. Entreprise
                    </span>
                    <span style={{ fontSize: 10, color: THEME.text.muted }}>Modifier ✏️</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary }}>{companyName || 'Non renseigné'}</div>
                  <div style={{ fontSize: 11, color: THEME.text.muted }}>{secteur}</div>
                </div>

                {/* 2. Devises */}
                <div
                  onClick={() => setStep(2)}
                  style={{
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                  title="Cliquer pour modifier"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Coins size={13} /> 2. Devises d'achat
                    </span>
                    <span style={{ fontSize: 10, color: THEME.text.muted }}>Modifier ✏️</span>
                  </div>
                  <div style={{ fontSize: 12, color: THEME.text.primary, fontWeight: 600 }}>
                    1 RMB = {rmb} Ar
                  </div>
                  <div style={{ fontSize: 12, color: THEME.text.primary, fontWeight: 600 }}>
                    1 USD = {usd} Ar
                  </div>
                </div>

                {/* 3. Comptes */}
                <div
                  onClick={() => setStep(3)}
                  style={{
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                  title="Cliquer pour modifier"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Wallet size={13} /> 3. Comptes ({comptesList.length})
                    </span>
                    <span style={{ fontSize: 10, color: THEME.text.muted }}>Modifier ✏️</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {comptesList.join(', ')}
                  </div>
                </div>

                {/* 4. Trésorerie */}
                <div
                  onClick={() => setStep(4)}
                  style={{
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                  title="Cliquer pour modifier"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarSign size={13} /> 4. Fond initial
                    </span>
                    <span style={{ fontSize: 10, color: THEME.text.muted }}>Modifier ✏️</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.text.primary }}>
                    {(Number(soldeCaisse) + Number(soldeBanque)).toLocaleString('fr-FR')} Ar
                  </div>
                  <div style={{ fontSize: 10.5, color: THEME.text.muted }}>
                    Caisse: {Number(soldeCaisse).toLocaleString()} Ar · Banque: {Number(soldeBanque).toLocaleString()} Ar
                  </div>
                </div>

                {/* 5. Fournisseur */}
                <div
                  onClick={() => setStep(5)}
                  style={{
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                  title="Cliquer pour modifier"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Truck size={13} /> 5. Fournisseur
                    </span>
                    <span style={{ fontSize: 10, color: THEME.text.muted }}>Modifier ✏️</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>
                    {fournisseurNom || 'Aucun'}
                  </div>
                  {fournisseurContact && <div style={{ fontSize: 11, color: THEME.text.muted }}>{fournisseurContact}</div>}
                </div>

                {/* 6 & 7. Produit & Stock */}
                <div
                  onClick={() => setStep(6)}
                  style={{
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                  title="Cliquer pour modifier"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Package size={13} /> 6-7. Produit & Stock
                    </span>
                    <span style={{ fontSize: 10, color: THEME.text.muted }}>Modifier ✏️</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>
                    {productNom ? `${productNom} (${stockQty} pcs)` : 'Aucun produit créé'}
                  </div>
                  {productPrixVente && Number(productPrixVente) > 0 && (
                    <div style={{ fontSize: 11, color: THEME.text.muted }}>Vente: {Number(productPrixVente).toLocaleString()} Ar</div>
                  )}
                </div>

                {/* 8. Client */}
                <div
                  onClick={() => setStep(8)}
                  style={{
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                  title="Cliquer pour modifier"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={13} /> 8. Client initial
                    </span>
                    <span style={{ fontSize: 10, color: THEME.text.muted }}>Modifier ✏️</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>
                    {clientNom || 'Aucun client créé'}
                  </div>
                  {clientContact && <div style={{ fontSize: 11, color: THEME.text.muted }}>{clientContact}</div>}
                </div>

                {/* 9. Charge fixe */}
                <div
                  onClick={() => setStep(9)}
                  style={{
                    background: THEME.bg.soft,
                    border: `1px solid ${THEME.border.base}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                  title="Cliquer pour modifier"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.orange, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={13} /> 9. Charge fixe
                    </span>
                    <span style={{ fontSize: 10, color: THEME.text.muted }}>Modifier ✏️</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: THEME.text.primary }}>
                    {chargeNom && Number(chargeMontant) > 0 ? `${chargeNom} (${Number(chargeMontant).toLocaleString()} Ar/mois)` : 'Aucune charge fixe'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11.5, color: THEME.text.muted, textAlign: 'center', marginTop: 4 }}>
                💡 Cliquez sur un bloc pour modifier l'étape correspondante avant la validation.
              </div>
            </div>
          )}
        </div>

        {/* Pied de page avec navigation */}
        <div
          style={{
            padding: '12px 20px',
            background: THEME.bg.soft,
            borderTop: `1px solid ${THEME.border.base}`,
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
          }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              style={ghostBtn as any}
            >
              <ArrowLeft size={14} />
              Précédent
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{ ...ghostBtn, color: THEME.text.muted } as any}
            >
              Passer
            </button>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {step < totalSteps && (
              <button
                onClick={() => setStep(step + 1)}
                style={{ ...ghostBtn, fontSize: 12 } as any}
              >
                Sauter cette étape
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                style={primaryBtn as any}
              >
                Suivant
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                style={{ ...primaryBtn, background: THEME.accent.green, color: '#FFFFFF' } as any}
              >
                <Check size={16} />
                Lancer l'Application !
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
