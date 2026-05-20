import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { GammeService } from '../../services/gamme.service';
import { Gamme, GammeFilters, StatutGamme } from '../../models/gamme';

@Component({
  selector: 'app-gammes',
  imports: [CommonModule, FormsModule, RouterLink, RouterModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './gamme.component.html',
  styleUrl: './gamme.component.css'
})
export class GammeComponent implements OnInit, OnDestroy {

  // ─── Données ───
  gammes: Gamme[] = [];

  // ─── Pagination ───
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  perPage     = 6;

  // ─── Filtres ───
  searchQuery    = '';
  prixMin: number | null = null;
  prixMax: number | null = null;
  triSelectionne: GammeFilters['sort'] = 'nom-asc';

  // ─── Vue ───
  currentView: 'grid' | 'list' = 'grid';

  // ─── États ───
  isLoading = false;
  hasError  = false;
  errorMsg  = '';

  private destroy$      = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private gammeService: GammeService,
    private router:       Router,
    private route:        ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['search']) this.searchQuery = params['search'];
      this.loadGammes();
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadGammes();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadGammes(): void {
    this.isLoading = true;
    this.hasError  = false;
    this.errorMsg  = '';

    const filters: GammeFilters = {
      search:   this.searchQuery || undefined,
      prix_min: this.prixMin     ?? undefined,
      prix_max: this.prixMax     ?? undefined,
      sort:     this.triSelectionne,
      page:     this.currentPage,
      per_page: this.perPage,
    };

    this.gammeService.getGammes(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.gammes      = Array.isArray(res) ? res : (res?.data ?? []);
        this.currentPage = res?.current_page ?? 1;
        this.lastPage    = res?.last_page    ?? 1;
        this.total       = res?.total        ?? this.gammes.length;
        this.isLoading   = false;
      },
      error: (err) => {
        this.hasError  = true;
        this.errorMsg  = err?.message || 'Impossible de charger les gammes.';
        this.isLoading = false;
      }
    });
  }


  // ══════════════════════════════════════════
  // FILTRES & PAGINATION
  // ══════════════════════════════════════════

  onSearchChange(): void { this.searchSubject.next(this.searchQuery); }

  onFiltreChange(): void { this.currentPage = 1; this.loadGammes(); }

  resetFiltres(): void {
    this.searchQuery    = '';
    this.prixMin        = null;
    this.prixMax        = null;
    this.triSelectionne = 'nom-asc';
    this.currentPage    = 1;
    this.loadGammes();
  }

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


  // ══════════════════════════════════════════
  // VUE & NAVIGATION
  // ══════════════════════════════════════════

  setView(v: 'grid' | 'list'): void { this.currentView = v; }

 voirGamme(gamme: Gamme): void {
  if (!gamme.id) return;
  this.router.navigate(['/home/gammes', gamme.id]);
}

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getImageUrl(gamme: Gamme): string {
    return this.gammeService.getImageUrl(gamme);
  }

  formatPrix(gamme: Gamme): string {
    return this.gammeService.formatPrix(gamme);
  }

  getStatutLabel(statut: StatutGamme): string {
    return this.gammeService.getStatutLabel(statut);
  }

  hasPrix(gamme: Gamme): boolean {
    return !!(gamme.prixPromo ?? gamme.prix_fixe);
  }

  getReduction(gamme: Gamme): number {
    return this.gammeService.getReduction(gamme);
  }

  // Nombre de produits dans la gamme
  getNbProduits(gamme: Gamme): number {
    return gamme.produits?.length ?? 0;
  }

  // La gamme est-elle disponible à l'achat ?
  isDisponible(gamme: Gamme): boolean {
    return gamme.statut === 'DISPONIBLE';
  }

  // Afficher le badge statut uniquement si pas DISPONIBLE
  showStatutBadge(gamme: Gamme): boolean {
    return gamme.statut !== 'DISPONIBLE';
  }

  getStatutBadgeClass(statut: StatutGamme): string {
    return statut === 'EPUISEE' ? 'badge-epuisee' : 'badge-avenir';
  }

  formatMontant(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' Fr';
  }
}