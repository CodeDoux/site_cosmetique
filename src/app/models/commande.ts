import { LigneCommande } from "./ligne-commande";
import { Livraison } from "./livraison";
import { Paiement } from "./paiement";
import { Produit } from "./produit";
import { User } from "./user";

export type StatutCommande = 'EN_PREPARATION'|'EN_ATTENTE'|'EN_LIVRAISON'|'LIVREE'|'ANNULEE';
export type ModeLivraison= 'DOMICILE'|'POINT_RELAIS'|'RETRAIT_MAGASIN';

export class Commande {
   id!: number;
  client_id!: number;
  reference!: string;
  dateCommande!: string;
  montantTotal!: number;
  statut!: StatutCommande;
  fraisLivraison!: number;
  modeLivraison!: ModeLivraison;
  created_at!: string;
  updated_at!: string;

  // Relations
  user?: User;                    // client associé
  client?: User;                  // alias pour user
  lignes_commande?: LigneCommande[]; // produits commandés avec quantités
  produits?: Produit[];           // produits de la commande
  paiement?: Paiement;            // paiement lié
  livraison?: Livraison;
}

