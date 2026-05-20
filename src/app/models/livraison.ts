import { Commande } from "./commande";
import { Livreur } from "./user";
export type StatutLivraison='EN_COURS' | 'LIVREE' | 'NON_LIVREE';

export class Livraison {

    id!: number;
  commande_id!: number;
  statutLivraison!: StatutLivraison;
  dateLivraison!: string;
  adresse!: Adresse;
  frais_livraison!: number;
  reference?: string;
  created_at!: string;
  updated_at!: string;
  commande?: Commande;
  livreur?: Livreur;
}

export interface Adresse{
  rue?: string;
  ville: string;
  quartier?: string;
  codePostal?: string;
}