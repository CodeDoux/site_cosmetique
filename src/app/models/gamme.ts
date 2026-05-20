import { Image, Produit } from "./produit";

export type StatutGamme= 'DISPONIBLE'|'EPUISEE'|'A_VENIR';
export interface Gamme {
  id?: number;
  nom: string;
  description?: string;
  image?: Image;
  marque?: string;
  statut: StatutGamme;
  prix_fixe: number;
  prixPromo?: number;
  dateDebut: string;
  dateFin: string;
  produits?: GammeProduit[];
  created_at?: string;
  updated_at?: string;
}


export interface GammeProduit {
  id: number;
  quantite: number;
  produit_id: number;
  gamme_id: number;
  quantité: number;
  valeur_unitaire: number;
  produit: Produit;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface GammeFilters {
  search?: string;
  categorie?: string;
  prix_min?: number;
  prix_max?: number;
  actif?: boolean;
  sort?: 'nom-asc' | 'nom-desc' | 'prix-asc' | 'prix-desc';
  page?: number;
  per_page?: number;
}