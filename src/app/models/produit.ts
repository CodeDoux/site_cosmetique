import { Categorie } from "./categorie";
import { Promotion } from "./promotion";


export type StatutProduit = "DISPONIBLE" | "EN_RUPTURE";

export interface Produit {
  id?: number;
  nom: string;
  description?: string;
  prix: number;
  prixPromo?: number;
  marque?: string;
  seuilAlerteStock: number;
  statut: StatutProduit;
  stock: number;
  note: number;
  categorie_id?: number;
  categorie?: Categorie;
  promotion?: Promotion;
  image_primaire?: Image;
  images?: Image[];
  created_at?: string;
  updated_at?: string;
}

export interface Image{
  id: number;
  chemin: string;
  isPrimary: boolean;
  dateCreation: Date;
  altText: string;
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

export interface ProduitFilters {
  en_promo?: number;
  marque?: string;
  search?: string;
  categorie?: string;
  prix_min?: number;
  prix_max?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}
