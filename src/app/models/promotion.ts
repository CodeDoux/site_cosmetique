import { Produit } from "./produit";

export interface Promotion {
  id: number;
  nom: string;
  description?: string;
  code?: string;
  type: "POURCENTAGE"|"MONTANT_FIXE";
  valeur: number; // valeur de la reduction
  montantMinCommande?: number // montant minimum pour appliquer
  dateDebut: string;
  dateFin: string;
  estActif: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Relations
  produits?: Produit[];
}

export interface PromotionProduit {
  id: number;
  promo_id: number;
  produit_id: number;
  montant_reduction?: number;
  created_at?: string;
  updated_at?: string;
  
  // Relations
  promotion?: Promotion;
  produit?: any;
}