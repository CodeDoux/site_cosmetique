import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';


interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  badge?: string;
}

interface Category {
  name: string;
  icon: string;
}
@Component({
  selector: 'app-accueil',
  imports: [
     CommonModule,
  RouterLink,
  FormsModule,
  RouterModule  
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css'
})
export class AccueilComponent {

  cartCount: number = 0;
  currentSlide: number = 0;
  activeTab: string = 'new';

  categories: Category[] = [
    { name: 'Capillaire', icon: '💆‍♀️' },
    { name: 'Beauté', icon: '💄' },
    { name: 'Parfums', icon: '🌸' },
    { name: 'Hygiene', icon: '🧴' },
    { name: 'Corporelle et visage', icon: '✨' },
    { name: 'Autre', icon: '🖌️' }
  ];

  products: Product[] = [
    { 
      id: 1, 
      name: 'Beauty Ultimate Eye Shad...', 
      price: 113.00, 
      image: 'produit1.jpg', 
      rating: 5, 
      badge: '5% OFF' 
    },
    { 
      id: 2, 
      name: 'Nourishing Gold Kesar', 
      price: 126.00, 
      oldPrice: 130.00, 
      image: 'produit2.jpg', 
      rating: 5, 
      badge: '8% OFF' 
    },
    { 
      id: 3, 
      name: 'Fab Karat Glow Combo', 
      price: 134.00, 
      oldPrice: 137.00, 
      image: 'produit3.jpg', 
      rating: 5, 
      badge: '9% OFF' 
    },
    { 
      id: 4, 
      name: 'Makeup Success kits', 
      price: 120.00, 
      oldPrice: 128.00, 
      image: 'produit4.jpg', 
      rating: 4, 
      badge: '8% OFF' 
    },
    { 
      id: 5, 
      name: 'Yunucha Eye Liner', 
      price: 86.00, 
      oldPrice: 98.00, 
      image: 'produit5.jpg', 
      rating: 5, 
      badge: '12% OFF' 
    },
    { 
      id: 6, 
      name: 'Matte Poreless Liquid Tube', 
      price: 122.00, 
      oldPrice: 140.00, 
      image: 'produit6.jpg', 
      rating: 5, 
      badge: '15% OFF' 
    },
    { 
      id: 7, 
      name: 'Kobo Beauty Canvas Kit', 
      price: 104.00, 
      image: 'produit7.jpg', 
      rating: 5, 
      badge: '7% OFF' 
    },
    { 
      id: 8, 
      name: 'Renee Skin Prep Combo', 
      price: 115.00, 
      oldPrice: 135.00, 
      image: 'produit8.jpg', 
      rating: 5, 
      badge: '8% OFF' 
    },
    { 
      id: 9, 
      name: 'My Tyas Fashion Makeup Kit', 
      price: 108.00, 
      image: 'produit9.jpg', 
      rating: 5 
    },
    { 
      id: 10, 
      name: 'Swiss Beauty Blusher', 
      price: 110.00, 
      oldPrice: 125.00, 
      image: 'produit10.jpg', 
      rating: 4, 
      badge: '8% OFF' 
    },
    { 
      id: 11, 
      name: 'Swiss Beauty Blusher', 
      price: 110.00, 
      oldPrice: 125.00, 
      image: 'produit11.jpg', 
      rating: 4, 
      badge: '8% OFF' 
    },
    { 
      id: 12, 
      name: 'Swiss Beauty Blusher', 
      price: 110.00, 
      oldPrice: 125.00, 
      image: 'produit12.jpg', 
      rating: 4, 
      badge: '8% OFF' 
    },
    { 
      id: 13, 
      name: 'Swiss Beauty Blusher', 
      price: 110.00, 
      oldPrice: 125.00, 
      image: 'produit13.jpg', 
      rating: 4, 
      badge: '8% OFF' 
    },
    { 
      id: 14, 
      name: 'Swiss Beauty Blusher', 
      price: 110.00, 
      oldPrice: 125.00, 
      image: 'produit14.jpg', 
      rating: 4, 
      badge: '8% OFF' 
    },
    { 
      id: 15, 
      name: 'Swiss Beauty Blusher', 
      price: 110.00, 
      oldPrice: 125.00, 
      image: 'produit15.jpg', 
      rating: 4, 
      badge: '8% OFF' 
    }
  ];

  menuItems: string[] = [
    'Capillaires', 
    'Beauté', 
    'Parfums', 
    'Corps et visage',
    'Pédicure manicure',  
    'Hygiéne', 
    'Autres'
  ];

  addToCart(product: Product): void {
    this.cartCount++;
    console.log('Product added to cart:', product);
  }

  addToWishlist(product: Product): void {
    console.log('Product added to wishlist:', product);
  }

  quickView(product: Product): void {
    console.log('Quick view:', product);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i);
  }

  isStarFilled(index: number, rating: number): boolean {
    return index < rating;
  }

}
