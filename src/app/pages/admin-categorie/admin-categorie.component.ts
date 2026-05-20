import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categorie } from '../../models/categorie';
import { CategorieService } from '../../services/categorie.service';

@Component({
  selector: 'app-admin-categorie',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categorie.component.html',
  styleUrl: './admin-categorie.component.css'
})
export class AdminCategorieComponent implements OnInit {

  Math = Math;

  // ── État ─────────────────────────────────────────────────────
  categories: Categorie[] = [];
  isLoading = false;
  errorMessage = '';

  isEditing = false;
  editingId: number | null = null;

  searchQuery = '';
  currentPage = 1;
  itemsPerPage = 5;

  form: Omit<Categorie, 'id'> = {
    nom: '',
    description: '',
  };

  constructor(private categorieService: CategorieService) {}

  // ── Cycle de vie ─────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCategories();
  }

  // ── Chargement ───────────────────────────────────────────────
  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categorieService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des catégories.';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // ── Filtrage & pagination ────────────────────────────────────
  get filteredCategories(): Categorie[] {
    const q = this.searchQuery.toLowerCase();
    return this.categories.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }

  get paginatedCategories(): Categorie[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCategories.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ── CRUD ─────────────────────────────────────────────────────
  saveCategory(): void {
    if (!this.form.nom.trim()) return;

    if (this.isEditing && this.editingId !== null) {
      this.categorieService.update(this.editingId, this.form).subscribe({
        next: (updated) => {
          const idx = this.categories.findIndex(c => c.id === this.editingId);
          if (idx !== -1) this.categories[idx] = updated;
          this.loadCategories();
          this.resetForm();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la mise à jour.';
          console.error(err);
        }
      });

    } else {
      this.categorieService.create(this.form).subscribe({
        next: (created) => {
          this.categories = [created, ...this.categories];
          this.loadCategories();
          this.resetForm();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la création.';
          console.error(err);
        }
      });
    }
  }

  editCategory(cat: Categorie): void {
    this.isEditing = true;
    this.editingId = cat.id;
    this.form = { nom: cat.nom, description: cat.description };
  }

  deleteCategory(cat: Categorie): void {
    if (!confirm(`Supprimer la catégorie "${cat.nom}" ?`)) return;

    this.categorieService.delete(cat.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== cat.id);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la suppression.';
        console.error(err);
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.errorMessage = '';
    this.form = { nom: '', description: '' };
  }

  // ── Pagination ───────────────────────────────────────────────
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ── Export CSV ───────────────────────────────────────────────
  exportData(): void {
    const csv = [
      ['ID', 'Nom', 'Description'].join(','),
      ...this.categories.map(c =>
        [c.id, c.nom, `"${c.description}"`].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'categories.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}