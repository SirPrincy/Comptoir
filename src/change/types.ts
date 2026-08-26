export interface OperationChange {
  id: string;
  date: string;
  montantMga: number;
  montantRmb: number;
  taux: number;
  fraisMga?: number;
  fournisseur?: string;
  canal?: string;
  exchanger?: string;
  compteSource?: string;
  domaineFonds?: 'business' | 'perso';
  reference?: string;
  notes?: string;
  vitesseExecution?: string;
  noteFiabilite?: number;
  genererMouvementTresorerie?: boolean;
  mouvementId?: string;
}

export const CANAUX_RMB = [
  'Alipay Direct',
  'WeChat Pay',
  'UnionPay / Virement bancaire',
  'Recharge 1688 / Taobao',
  'Cash / Espèces',
  'Western Union / MoneyGram',
  'Autre',
];

export const VITESSE_OPTIONS = [
  'Très rapide (< 1h)',
  'Rapide (1-4h)',
  'Même jour',
  'Lent (> 24h)',
];

export const INTERMEDIAIRES_HABITUELS = [
  'Agent de change Tanà',
  'Agent Guangzhou',
  'Comptoir Exchange P2P',
  'Contact WeChat Direct',
  'Banque / Broker Officiel',
  'Autre / Particulier',
];
