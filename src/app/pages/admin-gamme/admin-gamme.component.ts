import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';


import { environment } from '../../../environments/environment';
import { Produit } from '../../models/produit';
import { Gamme, GammeFilters, StatutGamme } from '../../models/gamme';
import { GammeService } from '../../services/gamme.service';
import { ProduitService } from '../../services/produit.service';

interface LigneProduit {
  produit:         Produit;
  quantite:        number;
  valeur_unitaire: number;
}

@Component({
  selector: 'app-gammes-admin',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-gamme.component.html',
  styleUrl: './admin-gamme.component.css'
})
export class AdminGammeComponent implements OnInit, OnDestroy {

  storageUrl = environment.storageUrl;

  // ─── Données ───
  gammes: Gamme[] = [];

  // ─── Pagination ───
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  perPage     = 10;

  // ─── Filtres ───
  searchQuery  = '';
  filterStatut = '';
  filterSort   = 'nom-asc';

  // ─── États ───
  isLoading = false;
  hasError  = false;
  errorMsg  = '';
  isSaving  = false;
  formError = '';

  // ─── Modal formulaire ───
  showModal      = false;
  editingGamme: Gamme | null = null;
  isDragOver     = false;

  formData: Partial<Gamme> = this.emptyForm();
  imageFile: File | null   = null;
  imagePreview: string     = '';

  // ─── Lignes produits de la gamme ───
  lignesProduits: LigneProduit[]  = [];
  tousLesProduits: Produit[]      = [];
  produitsFiltres: Produit[]      = [];
  searchProduit                   = '';
  showProduitPicker               = false;
  isLoadingProduits               = false;

  // ─── Modal détail ───
  showDetailModal = false;
  detailGamme: Gamme | null = null;
  isLoadingDetail = false;

  // ─── Modal suppression ───
  showDeleteModal  = false;
  deletingGamme: Gamme | null = null;

  private destroy$           = new Subject<void>();
  private searchSubject      = new Subject<string>();
  private produitSearchSubject = new Subject<string>();

  constructor(
    private gammeService:   GammeService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    this.loadGammes();

    this.searchSubject.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 1; this.loadGammes(); });

    this.produitSearchSubject.pipe(
      debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(q => this.filterProduits(q));
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }


  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadGammes(): void {
    this.isLoading = true;
    this.hasError  = false;

    const filters: GammeFilters = {
      search:   this.searchQuery  || undefined,
      sort:     this.filterSort as any,
      page:     this.currentPage,
      per_page: this.perPage,
    };

    this.gammeService.getGammes(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.gammes      = Array.isArray(res) ? res : (res?.data ?? []);
        console.log(this.gammes);
        this.lastPage    = res?.last_page    ?? 1;
        this.total       = res?.total        ?? this.gammes.length;
        this.currentPage = res?.current_page ?? 1;
        this.isLoading   = false;
      },
      error: (err) => {
        this.hasError  = true;
        this.errorMsg  = err?.message || 'Impossible de charger les gammes.';
        this.isLoading = false;
      }
    });
  }

  loadProduits(): void {
    if (this.tousLesProduits.length > 0) return;
    this.isLoadingProduits = true;
    this.produitService.getProduits({ per_page: 100 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.tousLesProduits = Array.isArray(res) ? res : (res?.data ?? []);
        this.produitsFiltres = [...this.tousLesProduits];
        this.isLoadingProduits = false;
      },
      error: () => { this.isLoadingProduits = false; }
    });
  }

  filterProduits(q: string): void {
    const query = q.toLowerCase();
    this.produitsFiltres = !query
      ? [...this.tousLesProduits]
      : this.tousLesProduits.filter(p => p.nom.toLowerCase().includes(query));
  }

  onSearchProduit(): void { this.produitSearchSubject.next(this.searchProduit); }


  // ══════════════════════════════════════════
  // FILTRES & PAGINATION
  // ══════════════════════════════════════════

  onSearchChange(): void { this.searchSubject.next(this.searchQuery); }
  onFilterChange(): void { this.currentPage = 1; this.loadGammes(); }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadGammes();
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

  emptyForm(): Partial<Gamme> {
    const today = new Date().toISOString().slice(0, 10);
    return {
      nom: '', description: '', statut: 'DISPONIBLE',
      prix_fixe: 0, prixPromo: undefined,
      dateDebut: today, dateFin: today,
    };
  }

  openModal(gamme?: Gamme): void {
    this.editingGamme  = gamme ?? null;
    this.formData      = gamme
      ? { ...gamme, dateDebut: gamme.dateDebut?.slice(0, 10), dateFin: gamme.dateFin?.slice(0, 10) }
      : this.emptyForm();
    this.imageFile     = null;
    this.imagePreview  = gamme?.image ? this.gammeService.getImageUrl(gamme) : '';
    this.formError     = '';
    this.searchProduit = '';
    this.showProduitPicker = false;

    // Charger les lignes produits existantes
    this.lignesProduits = gamme?.produits?.map(gp => ({
      produit:         gp.produit,
      quantite:        gp.quantite,
      valeur_unitaire: gp.valeur_unitaire,
    })) ?? [];

    this.loadProduits();
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.editingGamme = null; }

  closeModalOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) this.closeModal();
  }

  // ─── Image ───
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.setImageFile(file);
    event.target.value = '';
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }
  onDrop(event: DragEvent): void {
    event.preventDefault(); this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.setImageFile(file);
  }

  setImageFile(file: File): void {
    this.imageFile = file;
    const reader   = new FileReader();
    reader.onload  = (e: any) => this.imagePreview = e.target.result;
    reader.readAsDataURL(file);
  }

  removeImage(): void { this.imageFile = null; this.imagePreview = ''; }

  // ─── Produits dans la gamme ───
  isProduitDansGamme(produit: Produit): boolean {
    return this.lignesProduits.some(l => l.produit.id === produit.id);
  }

  ajouterProduit(produit: Produit): void {
    if (this.isProduitDansGamme(produit)) return;
    this.lignesProduits = [...this.lignesProduits, {
      produit,
      quantite:        1,
      valeur_unitaire: produit.prixPromo ?? produit.prix,
    }];
  }

  retirerProduit(index: number): void {
    this.lignesProduits = this.lignesProduits.filter((_, i) => i !== index);
  }

  get valeurTotaleGamme(): number {
    return this.lignesProduits.reduce((sum, l) => sum + (l.valeur_unitaire * l.quantite), 0);
  }

  // ─── Sauvegarde ───
  saveGamme(): void {
    this.formError = '';

    if (!this.formData.nom?.trim()) {
      this.formError = 'Le nom est obligatoire.'; return;
    }
    if (!this.formData.prix_fixe || this.formData.prix_fixe <= 0) {
      this.formError = 'Le prix est obligatoire.'; return;
    }
    if (!this.formData.dateDebut || !this.formData.dateFin) {
      this.formError = 'Les dates sont obligatoires.'; return;
    }
    if (this.lignesProduits.length === 0) {
      this.formError = 'Ajoutez au moins un produit à la gamme.'; return;
    }

    this.isSaving = true;

    const produits = this.lignesProduits.map(l => ({
      produit_id:      l.produit.id!,
      quantite:        l.quantite,
      valeur_unitaire: l.valeur_unitaire,
    }));

    const fd = this.gammeService.buildFormData(this.formData, this.imageFile ?? undefined, produits);

    const obs = this.editingGamme
      ? this.gammeService.updateGamme(this.editingGamme.id!, fd)
      : this.gammeService.createGamme(fd);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.isSaving = false; this.closeModal(); this.loadGammes(); },
      error: (err) => { this.isSaving = false; this.formError = err?.message || 'Une erreur est survenue.'; }
    });
  }


  // ══════════════════════════════════════════
  // MODAL DÉTAIL
  // ══════════════════════════════════════════

  openDetail(gamme: Gamme): void {
    this.showDetailModal = true;
    this.isLoadingDetail = true;
    this.detailGamme     = gamme;

    this.gammeService.getGamme(gamme.id!).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.detailGamme = data; this.isLoadingDetail = false; },
      error: ()    => { this.isLoadingDetail = false; }
    });
  }


  // ══════════════════════════════════════════
  // SUPPRESSION
  // ══════════════════════════════════════════

  confirmDelete(gamme: Gamme): void { this.deletingGamme = gamme; this.showDeleteModal = true; }

  deleteGamme(): void {
    if (!this.deletingGamme) return;
    this.isSaving = true;
    this.gammeService.deleteGamme(this.deletingGamme.id!).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.isSaving = false; this.showDeleteModal = false; this.deletingGamme = null; this.loadGammes(); },
      error: (err) => { this.isSaving = false; this.formError = err?.message || 'Erreur lors de la suppression.'; }
    });
  }


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getImageUrl(gamme: Gamme): string   { return this.gammeService.getImageUrl(gamme); }
  getStatutLabel(s: StatutGamme): string { return this.gammeService.getStatutLabel(s); }
  getStatutClass(s: StatutGamme): string { return this.gammeService.getStatutClass(s); }
  formatPrix(gamme: Gamme): string    { return this.gammeService.formatPrix(gamme); }
  getReduction(gamme: Gamme): number  { return this.gammeService.getReduction(gamme); }

  formatMontant(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' Fr';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  // Dans gammes-admin.component.ts — dans la section HELPERS
getValeurTotale(gamme: Gamme): number {
  return this.gammeService.getValeurTotale(gamme);
}

  getProduitImage(produit: Produit): string {
    return `${this.storageUrl}/${produit.image_primaire?.chemin}`;
  }
}