import React from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Scale,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, Stat } from '../ui';
import { OperationChange } from './types';

interface PortefeuilleRMBViewProps {
  changes: OperationChange[];
  commandes: any[];
  soldeRmbInfo: {
    totalRmbAchete: number;
    totalRmbDepense: number;
    soldeRmbDispo: number;
    tauxActuel: number;
    valeurRmbAr: number;
  };
  tauxMoyenPondere: number;
  onOpenNewChange?: () => void;
}

export default function PortefeuilleRMBView({
  changes,
  commandes,
  soldeRmbInfo,
  tauxMoyenPondere,
  onOpenNewChange,
}: PortefeuilleRMBViewProps) {


  // 1. Analyse des lots d'achats RMB (650, 640, 655, etc.)
  const lotsParTaux = React.useMemo(() => {
    const map = new Map<
      number,
      {
        taux: number;
        totalRmb: number;
        totalMga: number;
        nbOps: number;
        dernierAchat: string;
        intermediaires: Set<string>;
      }
    >();

    changes.forEach(c => {
      const t = Number(c.taux) || 680;
      const rmb = Number(c.montantRmb) || 0;
      const mga = (Number(c.montantMga) || 0) + (Number(c.fraisMga) || 0);
      const interm = c.fournisseur || c.exchanger || 'Non spécifié';

      if (!map.has(t)) {
        map.set(t, {
          taux: t,
          totalRmb: 0,
          totalMga: 0,
          nbOps: 0,
          dernierAchat: c.date,
          intermediaires: new Set<string>(),
        });
      }

      const item = map.get(t)!;
      item.totalRmb += rmb;
      item.totalMga += mga;
      item.nbOps += 1;
      item.intermediaires.add(interm);
      if (c.date > item.dernierAchat) {
        item.dernierAchat = c.date;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.taux - b.taux);
  }, [changes]);

  // 2. Analyse des intermédiaires / acheteurs Chine
  const acheteursStats = React.useMemo(() => {
    const map = new Map<
      string,
      {
        nom: string;
        type: string;
        totalRmbFourni: number;
        totalMgaDebourse: number;
        totalCommissionMga: number;
        nbChanges: number;
        nbCommandesTraitees: number;
        totalRmbCommandes: number;
        tauxMoyen: number;
        tauxMin: number;
        tauxMax: number;
        derniereActivite: string;
      }
    >();

    changes.forEach(c => {
      const nom = (c.fournisseur || c.exchanger || 'Direct / Particulier').trim();
      const type = c.typeIntermediaire || 'acheteur';
      const rmb = Number(c.montantRmb) || 0;
      const mga = Number(c.montantMga) || 0;
      const commMga = Number(c.commissionMga) || (Number(c.fraisMga) || 0);
      const t = Number(c.taux) || (rmb > 0 ? mga / rmb : 680);

      if (!map.has(nom)) {
        map.set(nom, {
          nom,
          type,
          totalRmbFourni: 0,
          totalMgaDebourse: 0,
          totalCommissionMga: 0,
          nbChanges: 0,
          nbCommandesTraitees: 0,
          totalRmbCommandes: 0,
          tauxMoyen: t,
          tauxMin: t,
          tauxMax: t,
          derniereActivite: c.date,
        });
      }

      const entry = map.get(nom)!;
      entry.totalRmbFourni += rmb;
      entry.totalMgaDebourse += mga + commMga;
      entry.totalCommissionMga += commMga;
      entry.nbChanges += 1;
      entry.tauxMin = Math.min(entry.tauxMin, t);
      entry.tauxMax = Math.max(entry.tauxMax, t);
      if (c.date > entry.derniereActivite) {
        entry.derniereActivite = c.date;
      }
    });

    // Attribuer les commandes d'achat Chine qui ont un acheteur spécifié
    commandes.forEach(cmd => {
      const nomAcheteur = cmd.acheteurNom?.trim();
      if (nomAcheteur && map.has(nomAcheteur)) {
        const entry = map.get(nomAcheteur)!;
        entry.nbCommandesTraitees += 1;
        const puRmb = Number(cmd.puDevise || cmd.puRmb || 0);
        const qty = Number(cmd.qty || 1);
        const fraisLiv = Number(cmd.fraisLivraisonChineDevise || 0);
        entry.totalRmbCommandes += (puRmb * qty) + fraisLiv;
      }
    });

    // Calcul final du taux moyen pondéré par acheteur
    return Array.from(map.values()).map(e => {
      const tauxMoyen = e.totalRmbFourni > 0 ? Math.round((e.totalMgaDebourse / e.totalRmbFourni) * 100) / 100 : e.tauxMoyen;
      return {
        ...e,
        tauxMoyen,
      };
    }).sort((a, b) => a.tauxMoyen - b.tauxMoyen);
  }, [changes, commandes]);

  const tauxMinGlobal = lotsParTaux.length > 0 ? lotsParTaux[0].taux : 0;
  const tauxMaxGlobal = lotsParTaux.length > 0 ? lotsParTaux[lotsParTaux.length - 1].taux : 0;
  const ecartTaux = tauxMaxGlobal - tauxMinGlobal;

  // Calcul du gain / économie réalisée grâce aux meilleurs taux vs taux max
  const economieRealiseeVsMax = React.useMemo(() => {
    if (lotsParTaux.length <= 1) return 0;
    const pireTaux = tauxMaxGlobal;
    let depenseReelle = 0;
    let depensePireCas = 0;
    lotsParTaux.forEach(lot => {
      depenseReelle += lot.totalMga;
      depensePireCas += lot.totalRmb * pireTaux;
    });
    return Math.max(0, depensePireCas - depenseReelle);
  }, [lotsParTaux, tauxMaxGlobal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Résumé Portefeuille & PUMP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        <Stat
          label="Solde RMB en Stock"
          value={`${soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} ¥`}
          subvalue={`Valeur : ${(soldeRmbInfo.soldeRmbDispo * (tauxMoyenPondere || 680)).toLocaleString('fr-FR')} Ar (au PUMP)`}
          icon={Wallet}
          accent={soldeRmbInfo.soldeRmbDispo > 0 ? '#2C5E43' : '#C24A3F'}
        />
        <Stat
          label="Taux Moyen Pondéré (PUMP)"
          value={tauxMoyenPondere > 0 ? `${tauxMoyenPondere} Ar / ¥` : '—'}
          subvalue="Votre prix de revient réel moyen"
          icon={Scale}
          accent="#8D6E00"
        />
        <Stat
          label="Dispersion des Taux"
          value={lotsParTaux.length > 0 ? `${tauxMinGlobal} ➔ ${tauxMaxGlobal} Ar` : '—'}
          subvalue={`Écart max : ${ecartTaux} Ar / Yuan`}
          icon={TrendingDown}
          accent="#3D5A6C"
        />
        <Stat
          label="Économie vs Pire Taux"
          value={economieRealiseeVsMax > 0 ? `+ ${economieRealiseeVsMax.toLocaleString('fr-FR')} Ar` : '0 Ar'}
          subvalue="Grâce à vos achats négociés à bas taux"
          icon={Sparkles}
          accent="#2C5E43"
        />
      </div>

      {/* 2. Explication pédagogique sur la variation des taux */}
      <div
        style={{
          background: '#FAF7F2',
          border: '1px solid #EAE2D4',
          borderRadius: 8,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ color: '#8D6E00', marginTop: 2 }}>
          <HelpCircle size={18} />
        </div>
        <div style={{ fontSize: 12.5, color: '#3E3932', lineHeight: 1.5 }}>
          <strong style={{ color: '#26333D' }}>Comment gérer vos fluctuations de taux (640, 650, 655 Ar/¥) ?</strong>
          <br />
          Le principe clé est le <strong>PUMP (Prix Unitaire Moyen Pondéré)</strong>. Quand vous achetez à 640 puis à 655, le logiciel calcule automatiquement la vraie valeur moyenne de votre stock de Yuans.
          En fixant ce <strong>taux moyen ({tauxMoyenPondere || 680} Ar)</strong> dans vos fiches produits et vos commandes d'achat, vous évitez de fausser votre marge réelle et vos prix de vente finaux à Madagascar.
        </div>
      </div>

      {/* 3. Décomposition par lots de taux d'achat (Lots 640, 650, 655...) */}
      <Card style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#26333D', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#2C5E43" />
              <span>Historique des Lots par Taux d'Achat</span>
            </h3>
            <div style={{ fontSize: 11.5, color: '#8A8375', marginTop: 2 }}>
              Détail du volume de Yuans acheté à chaque niveau de cours et intermédiaire associé.
            </div>
          </div>
        </div>

        {lotsParTaux.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8A8375', fontSize: 12.5 }}>
            Aucun lot de change enregistré. Utilisez le bouton « + Nouvelle Opération » pour enregistrer vos achats à 640, 650 ou 655 Ar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr 120px 140px 160px', padding: '6px 12px', background: '#F8F5EE', borderRadius: 6, fontSize: 11.5, fontWeight: 700, color: '#5E584E' }}>
              <span>Taux (Ar/¥)</span>
              <span>Intermédiaires / Acheteurs</span>
              <span style={{ textAlign: 'right' }}>Nb Opérations</span>
              <span style={{ textAlign: 'right' }}>Volume RMB</span>
              <span style={{ textAlign: 'right' }}>Total Déboursé MGA</span>
            </div>

            {lotsParTaux.map(lot => {
              const isBestRate = lot.taux === tauxMinGlobal;
              const isWorstRate = lot.taux === tauxMaxGlobal && lotsParTaux.length > 1;
              const pctVolume = soldeRmbInfo.totalRmbAchete > 0 ? Math.round((lot.totalRmb / soldeRmbInfo.totalRmbAchete) * 100) : 0;

              return (
                <div
                  key={lot.taux}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '85px 1fr 120px 140px 160px',
                    padding: '10px 12px',
                    background: isBestRate ? '#F0F7F4' : '#FFFFFF',
                    border: isBestRate ? '1px solid #A8D5BA' : '1px solid #EAE2D4',
                    borderRadius: 8,
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <strong style={{ fontSize: 14, color: isBestRate ? '#1E4632' : isWorstRate ? '#A83232' : '#26333D' }}>
                      {lot.taux}
                    </strong>
                    <span style={{ fontSize: 10, color: '#8A8375' }}>Ar</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {Array.from(lot.intermediaires).map(name => (
                      <span
                        key={name}
                        style={{
                          background: '#F1ECE1',
                          color: '#3E3932',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 500,
                        }}
                      >
                        {name}
                      </span>
                    ))}
                    {isBestRate && (
                      <span style={{ background: '#E1F0E8', color: '#1E4632', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                        ⭐ Meilleur Taux
                      </span>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', color: '#5E584E' }}>
                    {lot.nbOps} achat{lot.nbOps > 1 ? 's' : ''}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#2C5E43' }}>{lot.totalRmb.toLocaleString('fr-FR')} ¥</strong>
                    <div style={{ fontSize: 10, color: '#8A8375' }}>{pctVolume}% du volume</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: '#26333D' }}>
                      {lot.totalMga.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 4. Tableau d'Analyse des Acheteurs / Intermédiaires Chine */}
      <Card style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#26333D', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={16} color="#3D5A6C" />
              <span>Performance des Acheteurs & Cambistes Partenaires</span>
            </h3>
            <div style={{ fontSize: 11.5, color: '#8A8375', marginTop: 2 }}>
              Comparez le taux moyen obtenu, le total des Yuans fournis et les commissions prélevées par chaque acheteur.
            </div>
          </div>
        </div>

        {acheteursStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#8A8375', fontSize: 12.5 }}>
            Aucun acheteur enregistré pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {acheteursStats.map(ach => {
              const isBestRate = ach.tauxMoyen === acheteursStats[0].tauxMoyen;

              return (
                <div
                  key={ach.nom}
                  style={{
                    background: isBestRate ? '#FAFDFB' : '#FFFFFF',
                    border: isBestRate ? '1.5px solid #2C5E43' : '1px solid #EAE2D4',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#26333D' }}>
                          {ach.nom}
                        </span>
                        {isBestRate && (
                          <span style={{ background: '#E1F0E8', color: '#1E4632', padding: '1px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 700 }}>
                            🏆 Plus Avantageux
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: '#8A8375', background: '#F1ECE1', padding: '1px 6px', borderRadius: 4 }}>
                          {ach.type === 'acheteur' ? 'Acheteur Chine' : 'Bureau de change'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#8A8375', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>{ach.nbChanges} approvisionnement{ach.nbChanges > 1 ? 's' : ''} RMB</span>
                        {ach.nbCommandesTraitees > 0 && (
                          <span>· {ach.nbCommandesTraitees} commande{ach.nbCommandesTraitees > 1 ? 's' : ''} d'achat gérée{ach.nbCommandesTraitees > 1 ? 's' : ''}</span>
                        )}
                        <span>· Dernière activité : {ach.derniereActivite}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#8A8375' }}>Taux Moyen Obtenu</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: isBestRate ? '#1E4632' : '#8D6E00' }}>
                          {ach.tauxMoyen} Ar / ¥
                        </div>
                        {ach.tauxMin !== ach.tauxMax && (
                          <div style={{ fontSize: 10, color: '#8A8375' }}>
                            (min {ach.tauxMin} — max {ach.tauxMax})
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#8A8375' }}>Total Yuans Fournis</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#2C5E43' }}>
                          {ach.totalRmbFourni.toLocaleString('fr-FR')} ¥
                        </div>
                        <div style={{ fontSize: 10, color: '#8A8375' }}>
                          {ach.totalMgaDebourse.toLocaleString('fr-FR')} Ar déboursés
                        </div>
                      </div>

                      {ach.totalCommissionMga > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#8A8375' }}>Commissions payées</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#C24A3F' }}>
                            {ach.totalCommissionMga.toLocaleString('fr-FR')} Ar
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
