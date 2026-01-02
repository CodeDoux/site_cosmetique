import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';


interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}
@Component({
  selector: 'app-panier',
  imports: [
    CommonModule, RouterModule, FormsModule, RouterLink
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './panier.component.html',
  styleUrl: './panier.component.css'
})
export class PanierComponent {

  cartItems: CartItem[] = [];
  couponCode: string = '';
  couponApplied: boolean = false;
  discount: number = 0;

  menuItems: string[] = [
    'Capillaires', 
    'Beauté', 
    'Parfums', 
    'Corps et visage',
    'Pédicure manicure',  
    'Hygiéne', 
    'Autres'
  ];

  ngOnInit(): void {
    // Simuler des articles dans le panier (en production, récupérer depuis un service)
    this.cartItems = [
      {
        id: 1,
        name: 'Beauty Ultimate Eye Shadow',
        price: 113.00,
        image: 'produit1.jpg',
        quantity: 2,
        category: 'Makeup Brushes'
      },
      {
        id: 2,
        name: 'Nourishing Gold Kesar',
        price: 126.00,
        image: 'produit2.jpg',
        quantity: 1,
        category: 'Skincare Cream'
      },
      {
        id: 5,
        name: 'Yunucha Eye Liner',
        price: 86.00,
        image: 'produit3.jpg',
        quantity: 3,
        category: 'Makeup Lipstick'
      }
    ];
  }
  constructor(private router: Router){}

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get shipping(): number {
    return this.subtotal > 200 ? 0 : 15.00;
  }

  get tax(): number {
    return this.subtotal * 0.1; // 10% tax
  }

  get total(): number {
    return this.subtotal + this.shipping + this.tax - this.discount;
  }

  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity > 0 && quantity <= 99) {
      item.quantity = quantity;
    }
  }

  increaseQuantity(item: CartItem): void {
    if (item.quantity < 99) {
      item.quantity++;
    }
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
    }
  }

  removeItem(item: CartItem): void {
    const index = this.cartItems.findIndex(i => i.id === item.id);
    if (index > -1) {
      this.cartItems.splice(index, 1);
    }
  }

  applyCoupon(): void {
    if (this.couponCode.trim() === '') {
      alert('Please enter a coupon code');
      return;
    }

    // Simuler la validation du coupon
    const validCoupons: { [key: string]: number } = {
      'WELCOME10': 10,
      'SAVE20': 20,
      'BEAUTY15': 15
    };

    const couponUpper = this.couponCode.toUpperCase();
    if (validCoupons[couponUpper]) {
      this.discount = (this.subtotal * validCoupons[couponUpper]) / 100;
      this.couponApplied = true;
      alert(`Coupon applied! You saved $${this.discount.toFixed(2)}`);
    } else {
      alert('Invalid coupon code');
    }
  }

  removeCoupon(): void {
    this.couponCode = '';
    this.couponApplied = false;
    this.discount = 0;
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartItems = [];
      this.removeCoupon();
    }
  }

  proceedToCheckout(): void {
    /*if (this.cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }*/
    // Navigation vers la page de checkout
    this.router.navigate(['/validerCommande']);
    console.log('Proceeding to checkout...');
  }

  

}
