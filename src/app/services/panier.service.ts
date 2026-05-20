import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProduitPanier } from '../models/produit-panier';
import { Produit } from '../models/produit';
import { Gamme } from '../models/gamme';

@Injectable({ providedIn: 'root' })
export class PanierService {

  private items$ = new BehaviorSubject<ProduitPanier[]>(
    this.chargerDepuisSession()
  );

  // ─── Ajouter un produit ───
  ajouterProduit(produit: Produit, quantite = 1): void {
    const items   = this.items$.value;
    const existant = items.find(i => i.type === 'PRODUIT' && i.produit?.id === produit.id);

    if (existant) {
      existant.quantite += quantite;
      this.items$.next([...items]);
    } else {
      this.items$.next([...items, { type: 'PRODUIT', produit, quantite }]);
    }

    this.sauvegarderSession();
  }

  // ─── Ajouter une gamme ───
  ajouterGamme(gamme: Gamme, quantite = 1): void {
    const items   = this.items$.value;
    const existant = items.find(i => i.type === 'GAMME' && i.gamme?.id === gamme.id);

    if (existant) {
      existant.quantite += quantite;
      this.items$.next([...items]);
    } else {
      this.items$.next([...items, { type: 'GAMME', gamme, quantite }]);
    }

    this.sauvegarderSession();
  }

  // ─── Retirer un item ───
  retirerItem(item: ProduitPanier): void {
    const items = this.items$.value.filter(i => {
      if (i.type === 'PRODUIT') return i.produit?.id !== item.produit?.id;
      if (i.type === 'GAMME')   return i.gamme?.id   !== item.gamme?.id;
      return true;
    });
    this.items$.next(items);
    this.sauvegarderSession();
  }

  // ─── Modifier quantité ───
  modifierQuantite(item: ProduitPanier, quantite: number): void {
    const items = this.items$.value;
    const found = items.find(i => {
      if (i.type === 'PRODUIT') return i.produit?.id === item.produit?.id;
      if (i.type === 'GAMME')   return i.gamme?.id   === item.gamme?.id;
      return false;
    });
    if (found) {
      found.quantite = quantite;
      this.items$.next([...items]);
      this.sauvegarderSession();
    }
  }

  // ─── Vider le panier ───
  viderPanier(): void {
    this.items$.next([]);
    sessionStorage.removeItem('panier');
  }

  // ─── Getters ───
  getProduits(): ProduitPanier[] { return this.items$.value; }

  getNombreProduits(): Observable<number> {
    return this.items$.pipe(map(items => items.reduce((s, i) => s + i.quantite, 0)));
  }

 getTotal(): number {
  return this.items$.value.reduce((total, item) => {
    console.log('item :', item); // ← voir la structure exacte
    if (item.type === 'GAMME' && item.gamme) {
      return total + (item.gamme.prixPromo ?? item.gamme.prix_fixe) * item.quantite;
    }
    if (item.produit) {
      return total + (item.produit.prixPromo ?? item.produit.prix) * item.quantite;
    }
    return total;
  }, 0);
}

  estDansPanier(id: number, type: 'PRODUIT' | 'GAMME'): boolean {
    return this.items$.value.some(i =>
      i.type === type &&
      (type === 'PRODUIT' ? i.produit?.id === id : i.gamme?.id === id)
    );
  }

  // ─── Session ───
  private sauvegarderSession(): void {
    try {
      sessionStorage.setItem('panier', JSON.stringify(this.items$.value));
    } catch {}
  }

  private chargerDepuisSession(): ProduitPanier[] {
    try {
      const data = sessionStorage.getItem('panier');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }
}