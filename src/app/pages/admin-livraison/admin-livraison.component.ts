import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Adresse, Livraison, StatutLivraison } from '../../models/livraison';
import { Livreur } from '../../models/user';


@Component({
  selector: 'app-livraisons-admin',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-livraison.component.html',
  styleUrl: './admin-livraison.component.css'
})
export class AdminLivraisonComponent implements OnInit, OnDestroy {

  private apiUrl     = `${environment.apiUrl}/livraisons`;
  private usersUrl   = `${environment.apiUrl}/users`;

  // ─── Données ───
  livraisons: Livraison[] = [];
  livreurs:   Livreur[]   = [];

  // ─── Pagination ───
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  perPage     = 12;

  // ─── Filtres ───
  searchQuery  = '';
  filterStatut = '';
  filterDate   = '';

  // ─── États ───
  isLoading  = false;
  hasError   = false;
  errorMsg   = '';
  isSaving   = false;
  formError  = '';

  // ─── Modal détail ───
  showDetail        = false;
  selectedLivraison: Livraison | null = null;
  isLoadingDetail   = false;

  // ─── Modal assignation ───
  showAssignModal    = false;
  assignLivraison: Livraison | null = null;
  selectedLivreurId: number | null  = null;
  // Nouveau livreur à créer
  showNouveauLivreur = false;
  nouveauLivreur = { nom: '', email: '', tel: '' };

  private destroy$      = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLivraisons();
    this.loadLivreurs();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 1; this.loadLivraisons(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ══════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════

  get statsCards() {
    const list       = Array.isArray(this.livraisons) ? this.livraisons : [];
    const enCours    = list.filter(l => l.statutLivraison === 'EN_COURS').length;
    const livrees    = list.filter(l => l.statutLivraison === 'LIVREE').length;
    const nonLivrees = list.filter(l => l.statutLivraison === 'NON_LIVREE').length;

    return [
      { title: 'Total livraisons', value: list.length.toString(), icon: 'truck',    color: 'primary' },
      { title: 'En cours',         value: enCours.toString(),     icon: 'shipping', color: 'info'    },
      { title: 'Livrées',          value: livrees.toString(),      icon: 'done',     color: 'success' },
      { title: 'Non livrées',      value: nonLivrees.toString(),   icon: 'failed',   color: 'danger'  },
    ];
  }


  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadLivraisons(): void {
    this.isLoading = true;
    this.hasError  = false;

    let params = new HttpParams()
      .set('page',     this.currentPage.toString())
      .set('per_page', this.perPage.toString());

    if (this.searchQuery)  params = params.set('search', this.searchQuery);
    if (this.filterStatut) params = params.set('statut', this.filterStatut);
    if (this.filterDate)   params = params.set('date',   this.filterDate);

    this.http.get<any>(this.apiUrl, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.livraisons  = Array.isArray(res) ? res : (res?.data ?? []);
          this.lastPage    = res?.last_page    ?? 1;
          this.total       = res?.total        ?? this.livraisons.length;
          this.currentPage = res?.current_page ?? 1;
          this.isLoading   = false;
        },
        error: (err) => {
          this.hasError  = true;
          this.errorMsg  = err?.error?.message || 'Impossible de charger les livraisons.';
          this.isLoading = false;
        }
      });
  }

  loadLivreurs(): void {
    this.http.get<any>(`${this.usersUrl}?role=LIVREUR`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.livreurs = Array.isArray(res) ? res : (res?.data ?? []);
        },
        error: () => { this.livreurs = []; }
      });
  }


  // ══════════════════════════════════════════
  // FILTRES & PAGINATION
  // ══════════════════════════════════════════

  onSearchChange(): void { this.searchSubject.next(this.searchQuery); }
  onFilterChange(): void { this.currentPage = 1; this.loadLivraisons(); }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadLivraisons();
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
  // MODAL DÉTAIL
  // ══════════════════════════════════════════

  openDetail(livraison: Livraison): void {
    this.selectedLivraison = livraison;
    this.isLoadingDetail   = true;
    this.showDetail        = true;

    this.http.get<Livraison>(`${this.apiUrl}/${livraison.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.selectedLivraison = data?.livraison ?? data;
          this.isLoadingDetail   = false;
        },
        error: () => { this.isLoadingDetail = false; }
      });
  }

  closeDetail(): void { this.showDetail = false; this.selectedLivraison = null; }


  // ══════════════════════════════════════════
  // MODAL ASSIGNATION LIVREUR
  // ══════════════════════════════════════════

  openAssignModal(livraison: Livraison): void {
    if (!livraison) return; // ← garde
    this.assignLivraison     = livraison;
    this.selectedLivreurId   = livraison.livreur?.id ?? null;
    this.showNouveauLivreur  = false;
    this.nouveauLivreur      = { nom: '', email: '', tel: '' };
    this.formError           = '';
    this.showAssignModal     = true;
  }

  toggleNouveauLivreur(): void {
    this.showNouveauLivreur = !this.showNouveauLivreur;
    if (this.showNouveauLivreur) this.selectedLivreurId = null;
    else this.nouveauLivreur = { nom: '', email: '', tel: '' };
  }

  confirmerAssignation(): void {
    if (!this.assignLivraison) return;
    this.formError = '';

    // Cas 1 : assigner un livreur existant
    if (!this.showNouveauLivreur) {
      if (!this.selectedLivreurId) {
        this.formError = 'Veuillez sélectionner un livreur.'; return;
      }
      this.assignerLivreur(this.assignLivraison.id, this.selectedLivreurId);
      return;
    }

    // Cas 2 : créer un nouveau livreur puis assigner
    if (!this.nouveauLivreur.nom.trim() || !this.nouveauLivreur.email.trim()) {
      this.formError = 'Le nom et l\'email du livreur sont requis.'; return;
    }

    this.isSaving = true;
    const password = Math.random().toString(36).slice(-8) + 'A1!';

    this.http.post<Livreur>(`${this.usersUrl}`, {
      nomComplet: this.nouveauLivreur.nom,
      email:      this.nouveauLivreur.email,
      tel:        this.nouveauLivreur.tel,
      role:       'LIVREUR',
      password:   password, // mot de passe temporaire
      password_confirmation: password,
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (livreur) => {
        this.livreurs.push(livreur);
        this.assignerLivreur(this.assignLivraison!.id, livreur.id);
      },
      error: (err) => {
        this.isSaving  = false;
        this.formError = err?.error?.message || 'Erreur lors de la création du livreur.';
      }
    });
  }

  private assignerLivreur(livraisonId: number, livreurId: number): void {
    this.isSaving = true;

    this.http.post(`${this.apiUrl}/${livraisonId}/assigner`, { livreur_id: livreurId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          // Mettre à jour dans la liste
          const l = this.livraisons.find(l => l.id === livraisonId);
          if (l) l.livreur = this.livreurs.find(lv => lv.id === livreurId);
          this.isSaving        = false;
          this.showAssignModal = false;
          this.assignLivraison = null;
        },
        error: (err) => {
          this.isSaving  = false;
          this.formError = err?.error?.message || 'Erreur lors de l\'assignation.';
        }
      });
  }


  // ══════════════════════════════════════════
  // CHANGEMENT STATUT LIVRAISON
  // ══════════════════════════════════════════

  openStatutDropdownId: number | null = null;

  toggleStatutDropdown(id: number): void {
    this.openStatutDropdownId = this.openStatutDropdownId === id ? null : id;
  }

  closeStatutDropdown(): void {
    this.openStatutDropdownId = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openStatutDropdownId = null;
  }

  getStatutsSuivants(statut: StatutLivraison): StatutLivraison[] {
    const transitions: Record<StatutLivraison, StatutLivraison[]> = {
      EN_COURS:   ['LIVREE', 'NON_LIVREE'],
      NON_LIVREE: ['EN_COURS'],
      LIVREE:     [],
    };
    return transitions[statut] ?? [];
  }

  changerStatutLivraison(livraison: Livraison, statut: StatutLivraison): void {
    this.isSaving = true;

    this.http.patch(`${this.apiUrl}/${livraison.id}/statut`, { statutLivraison: statut })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          livraison.statutLivraison = statut;
          if (this.selectedLivraison?.id === livraison.id) {
            this.selectedLivraison!.statutLivraison = statut;
          }
          this.isSaving = false;
        },
        error: (err) => {
          this.isSaving  = false;
          this.formError = err?.error?.message || 'Erreur lors du changement de statut.';
        }
      });
  }

  // ══════════════════════════════════════════
  // CHANGEMENT STATUT
  // ══════════════════════════════════════════


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getStatutLabel(statut: StatutLivraison | string): string {
    const labels: Record<string, string> = {
      EN_COURS:    'En cours',
      LIVREE:      'Livrée',
      NON_LIVREE:  'Non livrée',
    };
    return labels[statut] ?? statut;
  }

  getStatutClass(statut: StatutLivraison | string): string {
    const classes: Record<string, string> = {
      EN_COURS:   'statut-encours',
      LIVREE:     'statut-livree',
      NON_LIVREE: 'statut-nonlivree',
    };
    return classes[statut] ?? '';
  }

  formatAdresse(adresse?: Adresse): string {
    if (!adresse) return '—';
    const parts = [adresse.rue, adresse.quartier, adresse.ville, adresse.codePostal];
    return parts.filter(Boolean).join(', ');
  }

  formatPrix(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' Fr';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  getLivreurLabel(livraison: Livraison): string {
    return livraison.livreur ? livraison.livreur.nomComplet : 'Non assigné';
  }
}