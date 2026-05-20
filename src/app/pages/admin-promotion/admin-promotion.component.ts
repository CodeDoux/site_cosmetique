import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Promotion } from '../../models/promotion';
import { Produit } from '../../models/produit';
import { PromotionFilters, PromotionService } from '../../services/promotion.service';
import { ProduitService } from '../../services/produit.service';
import { environment } from '../../../environments/environment';



// Cible de la promotion : commande globale ou produits spécifiques
type CiblePromotion = 'COMMANDE' | 'PRODUIT';

@Component({
  selector: 'app-promotions-admin',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-promotion.component.html',
  styleUrl: './admin-promotion.component.css'
})
export class AdminPromotionComponent implements OnInit, OnDestroy {

  // ─── Données ───
  promotions: Promotion[] = [];
  storageUrl= environment.storageUrl;

  // ─── Détail ───
showDetailModal = false;
detailPromo: Promotion | null = null;

  // ─── Pagination ───
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  perPage     = 10;

  // ─── Filtres ───
  searchQuery = '';
  filterType  = '';
  filterActif = '';

  // ─── États ───
  isLoading = false;
  hasError  = false;
  errorMsg  = '';
  isSaving  = false;
  formError = '';

  // ─── Modal formulaire ───
  showModal     = false;
  editingPromo: Promotion | null = null;

  // Cible de la promotion
  ciblePromotion: CiblePromotion = 'COMMANDE';

  formData: Partial<Promotion> = this.emptyForm();

  // ─── Sélection de produits ───
  tousLesProduits: Produit[]    = [];
  produitsFiltres: Produit[]    = [];
  produitsSelectionnes: Produit[] = [];
  searchProduit = '';
  isLoadingProduits = false;

  // ─── Modal suppression ───
  showDeleteModal = false;
  deletingPromo: Promotion | null = null;

  private destroy$      = new Subject<void>();
  private searchSubject = new Subject<string>();
  private produitSearchSubject = new Subject<string>();

  constructor(
    private promotionService: PromotionService,
    private produitService:   ProduitService
  ) {}

  ngOnInit(): void {
    this.loadPromotions();

    this.searchSubject.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 1; this.loadPromotions(); });

    this.produitSearchSubject.pipe(
      debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(q => this.filterProduits(q));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDetail(promo: Promotion): void {
  this.detailPromo      = promo;
  this.showDetailModal  = true;
}

  @HostListener('document:click') onDocumentClick(): void {}


  // ══════════════════════════════════════════
  // CHARGEMENT PROMOTIONS
  // ══════════════════════════════════════════

  loadPromotions(): void {
    this.isLoading = true;
    this.hasError  = false;

    const filters: PromotionFilters = {
      search:   this.searchQuery || undefined,
      type:     this.filterType  || undefined,
      estActif: this.filterActif !== '' ? this.filterActif === '1' : undefined,
      page:     this.currentPage,
      per_page: this.perPage,
    };

    this.promotionService.getAll(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.promotions  = Array.isArray(res) ? res : (res?.data ?? []);
        console.log(this.promotions);
        this.lastPage    = res?.last_page    ?? 1;
        this.total       = res?.total        ?? this.promotions.length;
        this.currentPage = res?.current_page ?? 1;
        this.isLoading   = false;
      },
      error: (err) => {
        this.hasError  = true;
        this.errorMsg  = err?.message || 'Impossible de charger les promotions.';
        this.isLoading = false;
      }
    });
  }

 getImagePrimaire(produit: Produit): string {
    return this.produitService.getImagePrimaire(produit, this.storageUrl);
  }
  // ══════════════════════════════════════════
  // CHARGEMENT PRODUITS (pour sélection)
  // ══════════════════════════════════════════

  loadProduits(): void {
    if (this.tousLesProduits.length > 0) return; // déjà chargés
    this.isLoadingProduits = true;

    this.produitService.getProduits({ per_page: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.tousLesProduits = Array.isArray(res) ? res : (res?.data ?? []);
          this.produitsFiltres = [...this.tousLesProduits];
          this.isLoadingProduits = false;
        },
        error: () => { this.isLoadingProduits = false; }
      });
  }

  filterProduits(query: string): void {
    const q = query.toLowerCase();
    this.produitsFiltres = !q
      ? [...this.tousLesProduits]
      : this.tousLesProduits.filter(p => p.nom.toLowerCase().includes(q));
  }

  onSearchProduit(): void {
    this.produitSearchSubject.next(this.searchProduit);
  }

  isSelected(produit: Produit): boolean {
    return this.produitsSelectionnes.some(p => p.id === produit.id);
  }

  toggleProduit(produit: Produit): void {
    if (this.isSelected(produit)) {
      this.produitsSelectionnes = this.produitsSelectionnes.filter(p => p.id !== produit.id);
    } else {
      this.produitsSelectionnes = [...this.produitsSelectionnes, produit];
    }
  }

  retirerProduit(produit: Produit): void {
    this.produitsSelectionnes = this.produitsSelectionnes.filter(p => p.id !== produit.id);
  }


  // ══════════════════════════════════════════
  // FILTRES & PAGINATION
  // ══════════════════════════════════════════

  onSearchChange(): void { this.searchSubject.next(this.searchQuery); }
  onFilterChange(): void { this.currentPage = 1; this.loadPromotions(); }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadPromotions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pagesVisibles(): (number | '...')[] {
    const total = this.lastPage, cur = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (cur > 3) pages.push('...');
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  get paginationStart(): number { return (this.currentPage - 1) * this.perPage + 1; }
  get paginationEnd():   number { return Math.min(this.currentPage * this.perPage, this.total); }


  // ══════════════════════════════════════════
  // MODAL FORMULAIRE
  // ══════════════════════════════════════════

  emptyForm(): Partial<Promotion> {
    const today = new Date().toISOString().slice(0, 10);
    return {
      nom: '', description: '', code: '',
      type: 'POURCENTAGE', valeur: 0,
      montantMinCommande: undefined,
      dateDebut: today, dateFin: today, estActif: true,
    };
  }

  openModal(promo?: Promotion): void {
    this.editingPromo          = promo ?? null;
    this.formData              = promo
      ? { ...promo, dateDebut: promo.dateDebut?.slice(0, 10), dateFin: promo.dateFin?.slice(0, 10) }
      : this.emptyForm();
    this.formError             = '';
    this.searchProduit         = '';

    // Déterminer la cible selon les produits liés
    if (promo?.produits && promo.produits.length > 0) {
      this.ciblePromotion      = 'PRODUIT';
      this.produitsSelectionnes = promo.produits as Produit[];

    } else {
      this.ciblePromotion      = 'COMMANDE';
      this.produitsSelectionnes = [];
    }

    this.showModal = true;

    // Charger les produits si cible PRODUIT
    if (this.ciblePromotion === 'PRODUIT') this.loadProduits();
  }

  onCibleChange(): void {
    this.produitsSelectionnes  = [];
    this.formData.code    = '';
    this.formData.montantMinCommande = undefined;
    if (this.ciblePromotion === 'PRODUIT') this.loadProduits();
  }

  closeModal(): void { this.showModal = false; this.editingPromo = null; }

  closeModalOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) this.closeModal();
  }

  savePromotion(): void {
    this.formError = '';

    if (!this.formData.nom?.trim()) {
      this.formError = 'Le nom est obligatoire.'; return;
    }
    if (!this.formData.valeur || this.formData.valeur <= 0) {
      this.formError = 'La valeur doit être supérieure à 0.'; return;
    }
    if (!this.formData.dateDebut || !this.formData.dateFin) {
      this.formError = 'Les dates sont obligatoires.'; return;
    }
    if (new Date(this.formData.dateFin!) < new Date(this.formData.dateDebut!)) {
      this.formError = 'La date de fin doit être après la date de début.'; return;
    }
    if (this.ciblePromotion === 'PRODUIT' && this.produitsSelectionnes.length === 0) {
      this.formError = 'Sélectionnez au moins un produit.'; return;
    }

    this.isSaving = true;

    // Construire le payload avec les IDs des produits si cible PRODUIT
    const payload: any = { ...this.formData };

    if (this.ciblePromotion === 'PRODUIT') {
      payload.produit_ids    = this.produitsSelectionnes.map(p => p.id);
      payload.code     = null;
      payload.montantMinCommande = null;
      payload.montantMinCommande  = 0; // ← 0 au lieu de null
    } else {
      payload.produit_ids    = [];
      payload.montantMinCommande  = this.formData.montantMinCommande ?? 0; // ← 0 par défau
    }
    console.log('produitsSelectionnes :', this.produitsSelectionnes);
console.log('payload :', JSON.stringify(payload, null, 2));

    const obs = this.editingPromo
      ? this.promotionService.update(this.editingPromo.id, payload)
      : this.promotionService.create(payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.isSaving = false; this.closeModal(); this.loadPromotions(); },
      error: (err) => { this.isSaving = false; this.formError = err?.message || 'Une erreur est survenue.'; }
    });
  }


  // ══════════════════════════════════════════
  // TOGGLE & SUPPRESSION
  // ══════════════════════════════════════════

  toggleActif(promo: Promotion): void {
    this.promotionService.toggleActif(promo.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => { promo.estActif = updated.estActif; },
      error: (err)    => console.error('Erreur toggle :', err?.message)
    });
  }

  confirmDelete(promo: Promotion): void { this.deletingPromo = promo; this.showDeleteModal = true; }

  deletePromotion(): void {
    if (!this.deletingPromo) return;
    this.isSaving = true;
    this.promotionService.delete(this.deletingPromo.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.isSaving = false; this.showDeleteModal = false; this.deletingPromo = null; this.loadPromotions(); },
      error: (err) => { this.isSaving = false; this.formError = err?.message || 'Erreur lors de la suppression.'; }
    });
  }


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getTypeLabel(type: string): string       { return this.promotionService.getTypeLabel(type); }
  formatValeur(promo: Promotion): string   { return this.promotionService.formatValeur(promo); }
  getStatutLabel(promo: Promotion): string { return this.promotionService.getStatutLabel(promo); }
  getStatutClass(promo: Promotion): string { return this.promotionService.getStatutClass(promo); }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatPrix(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' Fr';
  }

  getImageProduit(produit: Produit): string {
    if (!produit.images || produit.images.length === 0) return 'images/placeholder.jpg';
    const primary = produit.images.find(i => i.isPrimary) ?? produit.images[0];
    return primary.chemin ? primary.chemin : 'images/placeholder.jpg';
  }
}