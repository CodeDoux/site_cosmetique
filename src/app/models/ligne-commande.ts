import { Gamme } from "./gamme";
import { Produit } from "./produit";

export type TypeCommande= 'PRODUIT'| 'GAMME';

export class LigneCommande {
    id!: number;
    prix!: number;
    quantite!: number;
    montantLigne!: number;
    produit_id!: number;
    gamme_id?: number;
    commande_id!: number;
    type!: TypeCommande;
    created_at!: string;
    updated_at!: string;

    produit!: Produit;
    gamme?: Gamme;

}
