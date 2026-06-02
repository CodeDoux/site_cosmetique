import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { PanierService }    from '../../services/panier.service';
import { GammeService }     from '../../services/gamme.service';
import { ProduitService }   from '../../services/produit.service';
import { PromotionService } from '../../services/promotion.service';
import { ProduitPanier }    from '../../models/produit-panier';
import { environment }      from '../../../environments/environment';

@Component({
  selector: 'app-panier',
  imports: [CommonModule, RouterModule, FormsModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './panier.component.html',
  styleUrl: './panier.component.css'
})
export class PanierComponent implements OnInit, OnDestroy {

  storageUrl = environment.storageUrl;

  cartItems: ProduitPanier[] = [];

  // ─── Code promo ───
  couponCode       = '';
  couponApplied    = false;
  couponError      = '';
  isCheckingCoupon = false;
  discount         = 0;

  private subscription = new Subscription();

  constructor(
    private router:           Router,
    private panierService:    PanierService,
    private gammeService:     GammeService,
    private produitService:   ProduitService,
    private promotionService: PromotionService
  ) {}

  ngOnInit(): void {
    this.cartItems = this.panierService.getProduits();
    this.subscription.add(
      this.panierService.getNombreProduits().subscribe(() => {
        this.cartItems = this.panierService.getProduits();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


  // ══════════════════════════════════════════
  // GETTERS FINANCIERS
  // ══════════════════════════════════════════

  get subtotal(): number {
    return this.panierService.getTotal();
  }

  get shipping(): number {
    return this.subtotal >= 50000 ? 0 : 2000;
  }

  get total(): number {
    return this.subtotal + this.shipping - this.discount;
  }

  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantite, 0);
  }


  // ══════════════════════════════════════════
  // IMAGES
  // ══════════════════════════════════════════

  getImageProduit(item: ProduitPanier): string {
    if (!item.produit) return 'images/placeholder.jpg';
    return this.produitService.getImagePrimaire(item.produit, this.storageUrl);
  }

  getImageGamme(item: ProduitPanier): string {
    if (!item.gamme) return 'images/placeholder.jpg';
    return this.gammeService.getImageUrl(item.gamme);
  }


  // ══════════════════════════════════════════
  // SOUS-TOTAL PAR ITEM
  // ══════════════════════════════════════════

  getSousTotal(item: ProduitPanier): string {
    let prix = 0;
    if (item.type === 'PRODUIT' && item.produit) {
      prix = Number(item.produit.prixPromo ?? item.produit.prix) * item.quantite;
    } else if (item.type === 'GAMME' && item.gamme) {
      prix = Number(item.gamme.prixPromo ?? item.gamme.prix_fixe) * item.quantite;
    }
    return this.formatPrix(prix);
  }


  // ══════════════════════════════════════════
  // ACTIONS PANIER
  // ══════════════════════════════════════════

  increaseQuantity(item: ProduitPanier): void {
    this.panierService.modifierQuantite(item, item.quantite + 1);
  }

  decreaseQuantity(item: ProduitPanier): void {
    if (item.quantite <= 1) {
      this.removeItem(item);
    } else {
      this.panierService.modifierQuantite(item, item.quantite - 1);
    }
  }

  updateQuantity(item: ProduitPanier, quantite: number): void {
    const q = Math.max(1, Number(quantite));
    this.panierService.modifierQuantite(item, q);
  }

  removeItem(item: ProduitPanier): void {
    this.panierService.retirerItem(item);
  }

  clearCart(): void {
    if (confirm('Vider le panier ?')) {
      this.panierService.viderPanier();
    }
  }


  // ══════════════════════════════════════════
  // CODE PROMO
  // ══════════════════════════════════════════

  applyCoupon(): void {
    if (!this.couponCode.trim()) return;

    this.isCheckingCoupon = true;
    this.couponError      = '';

    this.promotionService.verifierCode(this.couponCode, this.subtotal)
      .subscribe({
        next: (res: any) => {
          this.isCheckingCoupon = false;
          this.discount         = Number(res.reduction ?? 0);
          this.couponApplied    = true;
          this.couponError      = '';
           // ← Sauvegarder dans le service
        this.panierService.setDiscount(this.discount, this.couponCode);
        },
        error: (err: any) => {
          this.isCheckingCoupon = false;
          this.couponApplied    = false;
          this.discount         = 0;
          this.couponError      = err?.error?.message ?? 'Code promo invalide.';
          this.panierService.resetDiscount();
        }
      });
  }

  removeCoupon(): void {
    this.couponCode    = '';
    this.discount      = 0;
    this.couponApplied = false;
    this.couponError   = '';
     this.panierService.resetDiscount();
  }


  // ══════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════

  proceedToCheckout(): void {
    this.router.navigate(['/home/validerCommande']);
  }


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  formatPrix(montant: number | string): string {
    if (!montant) return '0 Fr';
    const nombre = typeof montant === 'string' ? parseFloat(montant) : montant;
    if (isNaN(nombre)) return '0 Fr';
    return nombre.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ' Fr';
  }
}