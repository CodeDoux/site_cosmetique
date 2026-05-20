export class Paiement {
    id!: number;
  commande_id!: number;
  statutPaiement!: 'PAYEE' | 'NON_PAYEE' | 'REMBOURSE';
  modePaiement!: 'EN_LIGNE' | 'EN_ESPECE';
  operateur?: 'ORANGE_MONEY'|'WAVE'|'FREE_MONEY';
  telephone?: string;
  montant!: number;
  datePaiement!: string;
  reference?: string;
  created_at!: string;
  updated_at!: string;
}

