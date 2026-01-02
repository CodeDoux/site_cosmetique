import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';

interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  badge?: string;
  category: string;
  sales: number;
  description: string;
}

interface Category {
  name: string;
  count: number;
  icon: string;
}

@Component({
  selector: 'app-produit',
  imports: [
    CommonModule,
    RouterLink,
  FormsModule,
  RouterModule ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './produit.component.html',
  styleUrl: './produit.component.css'
})
export class ProduitComponent implements OnInit{

  cartCount: number = 0;
  searchQuery: string = '';
  selectedCategory: string = 'all';
  selectedSort: string = 'default';
  priceRange: { min: number, max: number } = { min: 0, max: 500 };
  currentPriceRange: { min: number, max: number } = { min: 0, max: 500 };
  
  categories: Category[] = [
    { name: 'Tout', count: 24, icon: '🛍️' },
    { name: 'Capillaires', count: 5, icon: '💆‍♀️' },
    { name: 'Beauté', count: 4, icon: '💄' },
    { name: 'Parfums', count: 3, icon: '🌸' },
    { name: 'Corps et visage', count: 6, icon: '🧴' },
    { name: 'Pédicure manicure', count: 4, icon: '🖌️' },
    { name: 'Hygiéne', count: 2, icon: '✨' }
  ];

  allProducts: Product[] = [
    { 
      id: 1, 
      name: 'Beauty Ultimate Eye Shadow', 
      price: 113.00, 
      image: 'produit1.jpg', 
      rating: 5, 
      badge: '5% OFF',
      category: 'Beauté',
      sales: 250,
      description: 'Professional eye shadow palette with rich pigmentation'
    },
    { 
      id: 2, 
      name: 'Nourishing Gold Kesar', 
      price: 126.00, 
      oldPrice: 130.00, 
      image: 'produit2.jpg', 
      rating: 5, 
      badge: '8% OFF',
      category: 'Corps et visage',
      sales: 320,
      description: 'Luxurious gold kesar cream for radiant skin'
    },
    { 
      id: 3, 
      name: 'Fab Karat Glow Combo', 
      price: 134.00, 
      oldPrice: 137.00, 
      image: 'produit3.jpg', 
      rating: 5, 
      badge: '9% OFF',
      category: 'Beauté',
      sales: 180,
      description: 'Complete glow combo for stunning makeup looks'
    },
    { 
      id: 4, 
      name: 'Makeup Success Kits', 
      price: 120.00, 
      oldPrice: 128.00, 
      image: 'produit4.jpg', 
      rating: 4, 
      badge: '8% OFF',
      category: 'Beauté',
      sales: 290,
      description: 'Complete makeup kit for professionals'
    },
    { 
      id: 5, 
      name: 'Yunucha Eye Liner', 
      price: 86.00, 
      oldPrice: 98.00, 
      image: 'produit5.jpg', 
      rating: 5, 
      badge: '12% OFF',
      category: 'Beauté',
      sales: 410,
      description: 'Long-lasting waterproof eye liner'
    },
    { 
      id: 6, 
      name: 'Matte Poreless Liquid Tube', 
      price: 122.00, 
      oldPrice: 140.00, 
      image: 'produit6.jpg', 
      rating: 5, 
      badge: '15% OFF',
      category: 'Corps et visage',
      sales: 380,
      description: 'Matte finish foundation for flawless skin'
    },
    { 
      id: 7, 
      name: 'Kobo Beauty Canvas Kit', 
      price: 104.00, 
      image: 'produit7.jpg', 
      rating: 5, 
      badge: '7% OFF',
      category: 'Corps et visage',
      sales: 210,
      description: 'Professional makeup brush collection'
    },
    { 
      id: 8, 
      name: 'Renee Skin Prep Combo', 
      price: 115.00, 
      oldPrice: 135.00, 
      image: 'produit8.jpg', 
      rating: 5, 
      badge: '8% OFF',
      category: 'Parfums',
      sales: 340,
      description: 'Complete skin preparation combo'
    },
    { 
      id: 9, 
      name: 'My Tyas Fashion Makeup Kit', 
      price: 108.00, 
      image: 'produit9.jpg', 
      rating: 5,
      category: 'Parfums',
      sales: 275,
      description: 'Fashion-forward makeup essentials'
    },
    { 
      id: 10, 
      name: 'Swiss Beauty Blusher', 
      price: 110.00, 
      oldPrice: 125.00, 
      image: 'produit10.jpg', 
      rating: 4, 
      badge: '8% OFF',
      category: 'Hygiéne',
      sales: 195,
      description: 'Natural glow blush for all skin tones'
    },
    { 
      id: 11, 
      name: 'Lavender Dream Perfume', 
      price: 89.00, 
      image: 'produit11.jpg', 
      rating: 5,
      category: 'Parfums',
      sales: 420,
      description: 'Long-lasting lavender fragrance'
    },
    { 
      id: 12, 
      name: 'Argan Oil Hair Serum', 
      price: 95.00, 
      oldPrice: 110.00, 
      image: 'produit12.jpg', 
      rating: 4, 
      badge: '14% OFF',
      category: 'Capillaires',
      sales: 360,
      description: 'Nourishing argan oil for silky hair'
    },
    { 
      id: 13, 
      name: 'Rose Gold Highlighter', 
      price: 78.00, 
      image: 'produit13.jpg', 
      rating: 5,
      category: 'Capillaires',
      sales: 310,
      description: 'Radiant rose gold highlighter'
    },
    { 
      id: 14, 
      name: 'Vitamin C Serum', 
      price: 145.00, 
      oldPrice: 160.00, 
      image: 'produit14.jpg', 
      rating: 5, 
      badge: '10% OFF',
      category: 'Hygiéne',
      sales: 450,
      description: 'Brightening vitamin C serum'
    },
    { 
      id: 15, 
      name: 'Coconut Hair Mask', 
      price: 92.00, 
      image: 'produit15.jpg', 
      rating: 4,
      category: 'Capillaires',
      sales: 240,
      description: 'Deep conditioning coconut hair mask'
    },
    { 
      id: 16, 
      name: 'Floral Essence Perfume', 
      price: 125.00, 
      oldPrice: 140.00, 
      image: 'produit16.jpg', 
      rating: 5, 
      badge: '11% OFF',
      category: 'Autres',
      sales: 390,
      description: 'Elegant floral perfume blend'
    },
    { 
      id: 17, 
      name: 'Keratin Hair Treatment', 
      price: 118.00, 
      image: 'produit17.jpg', 
      rating: 5,
      category: 'Autres',
      sales: 280,
      description: 'Professional keratin treatment'
    },
    { 
      id: 18, 
      name: 'Matte Lipstick Set', 
      price: 98.00, 
      oldPrice: 115.00, 
      image: 'produit18.jpg', 
      rating: 4, 
      badge: '15% OFF',
      category: 'Autres',
      sales: 470,
      description: 'Collection of matte lipstick shades'
    },
    { 
      id: 19, 
      name: 'Hyaluronic Acid Moisturizer', 
      price: 135.00, 
      image: 'produit19.jpg', 
      rating: 5,
      category: 'Beauté',
      sales: 430,
      description: 'Intense hydration moisturizer'
    },
    { 
      id: 20, 
      name: 'Professional Brush Set', 
      price: 156.00, 
      oldPrice: 175.00, 
      image: 'produit20.jpg', 
      rating: 5, 
      badge: '11% OFF',
      category: 'Capillaires',
      sales: 325,
      description: 'Complete professional brush collection'
    },
    { 
      id: 21, 
      name: 'Midnight Oud Perfume', 
      price: 168.00, 
      image: 'produit21.jpg', 
      rating: 5,
      category: 'Parfums',
      sales: 295,
      description: 'Luxurious oud fragrance'
    },
    { 
      id: 22, 
      name: 'Silk Protein Hair Cream', 
      price: 102.00, 
      oldPrice: 120.00, 
      image: 'produit22.jpg', 
      rating: 4, 
      badge: '15% OFF',
      category: 'Autres',
      sales: 350,
      description: 'Smoothing silk protein treatment'
    },
    { 
      id: 23, 
      name: 'Retinol Night Cream', 
      price: 178.00, 
      image: 'produit23.jpg', 
      rating: 5,
      category: 'Corps et visage',
      sales: 485,
      description: 'Anti-aging retinol night cream'
    },
    { 
      id: 24, 
      name: 'Collagen Hair Serum', 
      price: 88.00, 
      oldPrice: 98.00, 
      image: 'produit24.jpg', 
      rating: 4, 
      badge: '10% OFF',
      category: 'Pédicure manicure',
      sales: 265,
      description: 'Strengthening collagen hair serum'
    }
  ];

  filteredProducts: Product[] = [];

  menuItems: string[] = [
    'Capillaires', 
    'Beauté', 
    'Parfums', 
    'Corps et visage', 
    'Pédicure manicure', 
    'Hygiéne', 
    'Autres'
  ];

  constructor(
  private route: ActivatedRoute,
  private router: Router
) {}
  ngOnInit(): void {
    this.filteredProducts = [...this.allProducts];
    this.updatePriceRange();

    // Écouter les paramètres de route
  this.route.queryParams.subscribe(params => {
    if (params['category']) {
      this.selectedCategory = params['category'];
    }
    if (params['search']) {
      this.searchQuery = params['search'];
    }
    this.filterProducts();
  });
  }

  updatePriceRange(): void {
    const prices = this.allProducts.map(p => p.price);
    this.priceRange.min = Math.floor(Math.min(...prices));
    this.priceRange.max = Math.ceil(Math.max(...prices));
    this.currentPriceRange = { ...this.priceRange };
  }

  filterProducts(): void {
    let filtered = [...this.allProducts];

    // Filter by category
    if (this.selectedCategory !== 'Tout') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    filtered = filtered.filter(p => 
      p.price >= this.currentPriceRange.min && 
      p.price <= this.currentPriceRange.max
    );

    // Sort products
    switch (this.selectedSort) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'bestseller':
        filtered.sort((a, b) => b.sales - a.sales);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    this.filteredProducts = filtered;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category === 'All Products' ? 'all' : category;
    this.filterProducts();
  }

  onSearchChange(): void {
    this.filterProducts();
  }

  onSortChange(): void {
    this.filterProducts();
  }

  onPriceRangeChange(): void {
    this.filterProducts();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedSort = 'default';
    this.currentPriceRange = { ...this.priceRange };
    this.filterProducts();
  }

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

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i);
  }

  isStarFilled(index: number, rating: number): boolean {
    return index < rating;
  }

  getCategoryCount(categoryName: string): number {
    if (categoryName === 'All Products') {
      return this.allProducts.length;
    }
    return this.allProducts.filter(p => p.category === categoryName).length;
  }

}
