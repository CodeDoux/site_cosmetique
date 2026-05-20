import { Gamme } from "./gamme";
import { Produit } from "./produit";
export type TypePanier = 'PRODUIT' | 'GAMME';


export class ProduitPanier {
    produit?: Produit;
  quantite!: number;
  gamme?:   Gamme;    // si type === 'GAMME'
    type?:     TypePanier;

}
