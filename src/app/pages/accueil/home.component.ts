import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core'; // ← ajouter OnInit, OnDestroy
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { PanierService } from '../../services/panier.service';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';
import { CategorieService } from '../../services/categorie.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, FormsModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit { // ← ajouter implements
  showCatsDropdown = false;

@HostListener('document:click')
closeDropdowns(): void {
  this.showCatsDropdown = false;
}

  toasts$: Observable<Toast[]>;
  menuItems: string[] = [];
  cartCount = 0;
  currentSlide = 0;
  activeTab    = 'new';

  private destroy$ = new Subject<void>();

  constructor(
    private panierService:  PanierService,
    private toastService:   ToastService,
    private categorieService: CategorieService
  ) {
    this.toasts$ = this.toastService.toasts$;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.panierService.getNombreProduits()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.cartCount = count);
  }


  loadCategories(): void {
    this.categorieService.getAll().subscribe({
      next: (res: any) => {
        const cats   = Array.isArray(res) ? res : (res?.data ?? []);
        this.menuItems = cats.map((c: any) => c.nom);
      },
      error: () => {
        this.menuItems = [
          'Capillaires', 'Beauté', 'Parfums',
          'Corps et visage', 'Pédicure manicure', 'Hygiène', 'Autres'
        ];
      }
    });
  }

  addToCart(product: any):    void { this.cartCount++; }
  addToWishlist(product: any): void {}
  quickView(product: any):     void {}
  setActiveTab(tab: string):   void { this.activeTab = tab; }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i);
  }

  isStarFilled(index: number, rating: number): boolean {
    return index < rating;
  }
}