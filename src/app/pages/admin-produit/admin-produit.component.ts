import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Produit, ProduitFilters, Image } from '../../models/produit';
import { Categorie } from '../../models/categorie';
import { ProduitService } from '../../services/produit.service';
import { CategorieService } from '../../services/categorie.service';

// On étend les filtres pour le statut
interface AdminFilters extends ProduitFilters {
  statut?: string;
}

@Component({
  selector: 'app-produits-admin',
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './admin-produit.component.html',
  styleUrl: './admin-produit.component.css'
})
export class AdminProduitComponent implements OnInit, OnDestroy {

 storageUrl = environment.storageUrl;
  // ─── Données ───
  produits: Produit[] = [];
  categories: Categorie[] = [];

  // ─── Pagination ───
  currentPage = 1;
  lastPage = 1;
  total = 0;
  from = 0;
  to = 0;

  // ─── Filtres ───
  filters: AdminFilters = {
    search:    '',
    categorie: '',
    statut:    '',
    sort:      'nom',
    order:     'asc',
    per_page:  12
  };

  // ─── Sélection multiple ───
  selectedIds: number[] = [];

  // ─── États UI ───
  isLoading  = false;
  isSaving   = false;
  formError  = '';

  // ─── Modal formulaire ───
  showModal      = false;
  editingProduit : Produit | null = null;

  formData: Partial<Produit> & { note: number } = this.emptyForm();

  // ─── Images ───
  newImageFiles    : File[]   = [];
  newImagePreviews : string[] = [];
  isDragOver = false;

  // ─── Galerie ───
  showGallery   = false;
  galleryProduit: Produit | null = null;
  galleryImages : Image[]  = [];
  galleryIndex  = 0;

  // ─── Suppression ───
  showDeleteModal = false;
  deletingProduit : Produit | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private produitService: ProduitService, private categorieService: CategorieService) {}

  ngOnInit(): void {
    this.loadProduits();
    this.loadCategories();

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

    const params: ProduitFilters = {
      ...this.filters,
      page: this.currentPage
    };

    this.produitService.getProduits(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.produits    = res.data;
        this.lastPage    = res.last_page;
        this.total       = res.total;
        this.from        = res.from;
        this.to          = res.to;
        this.currentPage = res.current_page;
        this.isLoading   = false;
        console.log(this.produits);
      },
      error: () => { this.isLoading = false; }
    });
    
  }

  loadCategories(): void {
    this.categorieService.getAll().subscribe(cats => this.categories = cats);
  }

  // ══════════════════════════════════════════
  // FILTRES & PAGINATION
  // ══════════════════════════════════════════

  onSearchChange(): void { this.searchSubject.next(this.filters.search ?? ''); }
  onFilterChange(): void { this.currentPage = 1; this.loadProduits(); }

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
  // SÉLECTION MULTIPLE
  // ══════════════════════════════════════════

  isSelected(id: number): boolean { return this.selectedIds.includes(id); }

  toggleSelect(id: number): void {
    if (this.isSelected(id)) this.selectedIds = this.selectedIds.filter(i => i !== id);
    else this.selectedIds.push(id);
  }

  toggleAll(event: any): void {
    this.selectedIds = event.target.checked ? this.produits.map(p => p.id!) : [];
  }

  deleteSelected(): void {
    if (!confirm(`Supprimer ${this.selectedIds.length} produit(s) ?`)) return;
    // TODO : appel API bulk delete
    console.log('Supprimer :', this.selectedIds);
  }

  // ══════════════════════════════════════════
  // MODAL FORMULAIRE
  // ══════════════════════════════════════════

  emptyForm(): Partial<Produit> & { note: number } {
    return {
      nom: '', description: '', prix: 0, prixPromo: undefined,
      stock: 0, seuilAlerteStock: 5, statut: 'DISPONIBLE',
      categorie_id: undefined, note: 0
    };
  }

  openModal(produit?: Produit): void {
    this.editingProduit   = produit ?? null;
    this.formData         = produit
      ? { ...produit, note: produit.note ?? 0 }
      : this.emptyForm();
    this.newImageFiles    = [];
    this.newImagePreviews = [];
    this.formError        = '';
    this.showModal        = true;
  }

  closeModal(): void { this.showModal = false; this.editingProduit = null; }

  closeModalOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) this.closeModal();
  }

  // ── Sauvegarde ──

  saveProduit(): void {
    if (!this.formData.nom || this.formData.prix === undefined) {
      this.formError = 'Le nom et le prix sont obligatoires.';
      return;
    }

    this.isSaving  = true;
    this.formError = '';

    const fd = this.produitService.buildFormData(this.formData, this.newImageFiles);
    console.log('produit :',this.formData);

    const obs = this.editingProduit
      ? this.produitService.updateProduit(this.editingProduit.id!, fd)
      : this.produitService.createProduit(fd);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeModal();
        this.loadProduits();
      },
      error: (err) => {
        this.isSaving  = false;
        this.formError = err?.message || 'Une erreur est survenue.';
      }
    });
  }

  // ══════════════════════════════════════════
  // GESTION DES IMAGES
  // ══════════════════════════════════════════

  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    this.addFiles(Array.from(files));
    event.target.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.addFiles(files.filter(f => f.type.startsWith('image/')));
  }

  addFiles(files: File[]): void {
    files.forEach(file => {
      this.newImageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => this.newImagePreviews.push(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  removeNewImage(index: number): void {
    this.newImageFiles.splice(index, 1);
    this.newImagePreviews.splice(index, 1);
  }

  deleteImage(img: Image): void {
    if (!this.editingProduit?.id) return;
    if (!confirm('Supprimer cette image ?')) return;

    this.produitService.deleteImage(this.editingProduit.id, img.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingProduit!.images = this.editingProduit!.images!.filter(i => i.id !== img.id);
        },
        error: (err) => console.error('Erreur suppression image :', err)
      });
  }

  setImagePrimary(img: Image): void {
    if (!this.editingProduit?.id) return;

    this.produitService.setImagePrimary(this.editingProduit.id, img.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingProduit!.images!.forEach(i => i.isPrimary = i.id === img.id);
        },
        error: (err) => console.error('Erreur image principale :', err)
      });
  }

  // ══════════════════════════════════════════
  // GALERIE
  // ══════════════════════════════════════════

  openGallery(produit: Produit): void {
    if (!produit.images?.length) return;
    this.galleryProduit = produit;
    this.galleryImages  = produit.images;
    this.galleryIndex   = produit.images.findIndex(i => i.isPrimary) ?? 0;
    this.showGallery    = true;
  }

  galleryNext(): void { this.galleryIndex = (this.galleryIndex + 1) % this.galleryImages.length; }
  galleryPrev(): void { this.galleryIndex = (this.galleryIndex - 1 + this.galleryImages.length) % this.galleryImages.length; }

  // ══════════════════════════════════════════
  // SUPPRESSION
  // ══════════════════════════════════════════

  confirmDelete(produit: Produit): void {
    this.deletingProduit = produit;
    this.showDeleteModal = true;
  }

  deleteProduit(): void {
    if (!this.deletingProduit?.id) return;
    this.isSaving = true;

    this.produitService.deleteProduit(this.deletingProduit.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving       = false;
          this.showDeleteModal = false;
          this.deletingProduit = null;
          this.loadProduits();
        },
        error: () => { this.isSaving = false; }
      });
  }

  // ══════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════

  exportCSV(): void {
    // TODO : brancher l'export API
    console.log('Export CSV');
  }

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getImagePrimaire(produit: Produit): string {
    return this.produitService.getImagePrimaire(produit, this.storageUrl);
  }

  getImageUrl(chemin: string): string {
    console.log(this.storageUrl)
    return `${this.storageUrl}/${chemin}`;
  }

  getStatutLabel(statut: string): string { return this.produitService.getStatutLabel(statut); }
  getStatutClass(statut: string): string { return this.produitService.getStatutClass(statut); }
  formatPrix(prix: number): string        { return this.produitService.formatPrix(prix); }
}