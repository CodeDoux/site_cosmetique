import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Produit, ProduitFilters,Image } from '../../models/produit';
import { environment } from '../../../environments/environment';
import { ProduitService } from '../../services/produit.service';
import { PanierService } from '../../services/panier.service';
import { ToastService } from '../../services/toast.service';
import { Categorie } from '../../models/categorie';
import { CategorieService } from '../../services/categorie.service';

interface FiltresPublic extends ProduitFilters {
  statut?: string;
}

interface CategorieFiltre {
  nom: string;
  slug: string;
  count?: number;
}

@Component({
  selector: 'app-produits',
  imports: [CommonModule, FormsModule, RouterLink, RouterModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './produit.component.html',
  styleUrl: './produit.component.css'
})
export class ProduitComponent implements OnInit, OnDestroy {

  storageUrl = 'http://127.0.0.1:8000/storage';

  // ─── Données ───
  produits: Produit[] = [];
  categories: Categorie[] = [];

  loadCategories(): void {
  this.categorieService.getAll().subscribe({
      next: (res: any) => {
        const cats = Array.isArray(res) ? res : (res?.data ?? []);
        this.categories = cats.map((c: any) => c.nom);
      },
      error: () => {
      }
    });
}

  // ─── Pagination ───
  currentPage = 1;
  lastPage    = 1;
  total       = 0;

  // ─── Filtres ───
  filters: FiltresPublic = {
    en_promo: undefined,
    marque: '',
    search:    '',
    categorie: '',
    prix_min:  undefined,
    prix_max:  undefined,
    statut:    '',
    sort:      'nom-asc',
    per_page:  12
  };

  // ─── Vue ───
  currentView: 'grid' | 'list' = 'grid';
  sidebarOpen = false;

  // ─── États ───
  isLoading = false;
  hasError  = false;

  // ─── Gestion des images actives par produit ───
  private activeImageMap = new Map<number, number>();

  // ─── Aperçu rapide ───
  apercuProduit: Produit | null = null;
  apercuQte = 1;

  private destroy$     = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private produitService: ProduitService,
    private panierService:  PanierService,
    private route:          ActivatedRoute,
    private toastService: ToastService,
    private categorieService: CategorieService
  ) {}

  ngOnInit(): void {
    // Lire les queryParams (depuis accueil, gammes…)
    this.loadCategories();
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['category']) this.filters.categorie = params['category'];
      if (params['search'])   this.filters.search    = params['search'];
      if (params['gamme'])    this.filters.categorie  = params['gamme'];
      if (params['marque'])    this.filters.marque  = params['marque'];
      if (params['en_promo'])    this.filters.en_promo  = params['en_promo'];
      this.loadProduits();
    });

    // Debounce recherche
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadProduits();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadProduits(): void {
    this.isLoading = true;
    this.hasError  = false;

    const params: ProduitFilters = {
      en_promo: this.filters.en_promo,
      marque: this.filters.marque    || undefined,
      search:    this.filters.search    || undefined,
      categorie: this.filters.categorie || undefined,
      prix_min:  this.filters.prix_min  ?? undefined,
      prix_max:  this.filters.prix_max  ?? undefined,
      sort:      this.filters.sort,
      page:      this.currentPage,
      per_page:  this.filters.per_page
    };

    this.produitService.getProduits(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.produits    = res.data;
        this.lastPage    = res.last_page;
        this.total       = res.total;
        this.currentPage = res.current_page;
        this.isLoading   = false;
      },
      error: () => {
        this.hasError  = true;
        this.isLoading = false;
      }
    });
  }

  // ══════════════════════════════════════════
  // FILTRES & PAGINATION
  // ══════════════════════════════════════════

  onSearchChange(): void { this.searchSubject.next(this.filters.search ?? ''); }

  onFilterChange(): void {
    this.currentPage = 1;
    this.sidebarOpen = false;
    this.loadProduits();
  }

  resetFiltres(): void {
    this.filters = {
      marque: '', search: '', categorie: '', prix_min: undefined,
      prix_max: undefined, statut: '', sort: 'nom-asc', per_page: 12
    };
    this.currentPage = 1;
    this.loadProduits();
  }

  get nbFiltresActifs(): number {
    let n = 0;
    if (this.filters.marque)    n++;
    if (this.filters.search)    n++;
    if (this.filters.categorie) n++;
    if (this.filters.prix_min)  n++;
    if (this.filters.prix_max)  n++;
    if (this.filters.statut)    n++;
    return n;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadProduits();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pagesVisibles(): (number | '...')[] {
    const total = this.lastPage;
    const cur   = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (cur > 3) pages.push('...');
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  // ══════════════════════════════════════════
  // VUE
  // ══════════════════════════════════════════

  setView(v: 'grid' | 'list'): void { this.currentView = v; }

  // ══════════════════════════════════════════
  // GESTION DES IMAGES
  // ══════════════════════════════════════════

  getActiveIndex(produit: Produit): number {
    return this.activeImageMap.get(produit.id!) ?? 0;
  }

  setActiveImage(produit: Produit, index: number): void {
    this.activeImageMap.set(produit.id!, index);
  }

  // Au survol : afficher la 2e image si elle existe
  setHoverImage(produit: Produit, direction: 0 | 1): void {
    if (!produit.images || produit.images.length < 2) return;
    const idx = direction === 1 ? 1 : 0;
    this.activeImageMap.set(produit.id!, idx);
  }

  getImagePrimaire(produit: Produit): string {
    return this.produitService.getImagePrimaire(produit, this.storageUrl);
  }

  getImageUrl(chemin: String): string {
    return `${this.storageUrl}/${chemin}`;
  }

  // ══════════════════════════════════════════
  // PANIER & FAVORIS
  // ══════════════════════════════════════════

  ajouterAuPanier(produit: Produit): void {
    if (produit.statut === 'EN_RUPTURE') return;
    this.panierService.ajouterProduit(produit, 1);
    this.toastService.show(`✓ ${produit.nom} ajouté au panier`);
  }

  ajouterAuPanierQte(produit: Produit): void {
    if (produit.statut === 'EN_RUPTURE') return;
    this.panierService.ajouterProduit(produit, this.apercuQte);
    this.apercuProduit = null;
    this.apercuQte = 1;
  }

  ajouterAuxFavoris(produit: Produit): void {
    console.log('Favoris :', produit.nom);
  }

  // ══════════════════════════════════════════
  // APERÇU RAPIDE
  // ══════════════════════════════════════════

  ouvrirApercu(produit: Produit): void {
    this.apercuProduit = produit;
    this.apercuQte     = 1;
  }

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  formatPrix(prix: number): string {
    return prix.toLocaleString('fr-FR') + ' Fr';
  }

  getReduction(produit: Produit): number {
    if (!produit.prixPromo) return 0;
    return Math.round((1 - produit.prixPromo / produit.prix) * 100);
  }
}