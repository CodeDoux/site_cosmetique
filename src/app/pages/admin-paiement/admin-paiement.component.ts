import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Paiement } from '../../models/paiement';

type StatutPaiement = 'PAYEE' | 'NON_PAYEE' | 'REMBOURSE';
type ModePaiement   = 'EN_LIGNE' | 'EN_ESPECE';
type Operateur      = 'ORANGE_MONEY' | 'WAVE' | 'FREE_MONEY';

@Component({
  selector: 'app-paiements-admin',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-paiement.component.html',
  styleUrl: './admin-paiement.component.css'
})
export class AdminPaiementComponent implements OnInit, OnDestroy {

  private apiUrl = `${environment.apiUrl}/paiements`;

  // ─── Données ───
  paiements: Paiement[] = [];

  // ─── Pagination ───
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  perPage     = 12;

  // ─── Filtres ───
  searchQuery    = '';
  filterStatut   = '';
  filterMode     = '';
  filterDate     = '';

  // ─── États ───
  isLoading  = false;
  hasError   = false;
  errorMsg   = '';
  isSaving   = false;

  // ─── Détail ───
  showDetail      = false;
  selectedPaiement: Paiement | null = null;

  // ─── Modal remboursement ───
  showRembModal    = false;
  rembPaiement: Paiement | null = null;
  motifRemb        = '';
  formError        = '';

  private destroy$      = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPaiements();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 1; this.loadPaiements(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click')
  onDocumentClick(): void {}


  // ══════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════

  get statsCards() {
    const list      = Array.isArray(this.paiements) ? this.paiements : [];
    const payees    = list.filter(p => p.statutPaiement === 'PAYEE');
    const nonPayees = list.filter(p => p.statutPaiement === 'NON_PAYEE');
    const rembourses = list.filter(p => p.statutPaiement === 'REMBOURSE');
    const totalMontant = payees.reduce((s, p) => s + p.montant, 0);

    return [
      { title: 'Total encaissé',   value: this.formatPrix(totalMontant), icon: 'money',    color: 'success' },
      { title: 'Payés',            value: payees.length.toString(),       icon: 'check',    color: 'primary' },
      { title: 'Non payés',        value: nonPayees.length.toString(),    icon: 'pending',  color: 'warning' },
      { title: 'Remboursés',       value: rembourses.length.toString(),   icon: 'refund',   color: 'purple'  },
    ];
  }


  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadPaiements(): void {
    this.isLoading = true;
    this.hasError  = false;

    let params = new HttpParams()
      .set('page',     this.currentPage.toString())
      .set('per_page', this.perPage.toString());

    if (this.searchQuery)  params = params.set('search',  this.searchQuery);
    if (this.filterStatut) params = params.set('statut',  this.filterStatut);
    if (this.filterMode)   params = params.set('mode',    this.filterMode);
    if (this.filterDate)   params = params.set('date',    this.filterDate);

    this.http.get<any>(this.apiUrl, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.paiements   = Array.isArray(res) ? res : (res?.data ?? []);
          this.lastPage    = res?.last_page    ?? 1;
          this.total       = res?.total        ?? this.paiements.length;
          this.currentPage = res?.current_page ?? 1;
          this.isLoading   = false;
        },
        error: (err) => {
          this.hasError  = true;
          this.errorMsg  = err?.error?.message || 'Impossible de charger les paiements.';
          this.isLoading = false;
        }
      });
  }


  // ══════════════════════════════════════════
  // FILTRES & PAGINATION
  // ══════════════════════════════════════════

  onSearchChange(): void { this.searchSubject.next(this.searchQuery); }
  onFilterChange(): void { this.currentPage = 1; this.loadPaiements(); }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadPaiements();
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
  // DÉTAIL
  // ══════════════════════════════════════════

  openDetail(paiement: Paiement): void {
    this.selectedPaiement = paiement;
    this.showDetail       = true;
  }

  closeDetail(): void { this.showDetail = false; this.selectedPaiement = null; }


  // ══════════════════════════════════════════
  // MARQUER COMME PAYÉ
  // ══════════════════════════════════════════

  marquerPayee(paiement: Paiement): void {
    this.http.patch(`${this.apiUrl}/${paiement.id}/statut`, { statutPaiement: 'PAYEE' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          paiement.statutPaiement = 'PAYEE';
          const p = this.paiements.find(p => p.id === paiement.id);
          if (p) p.statutPaiement = 'PAYEE';
        },
        error: (err) => console.error('Erreur :', err?.error?.message)
      });
  }

  // ══════════════════════════════════════════
  // REMBOURSEMENT
  // ══════════════════════════════════════════

  openRembModal(paiement: Paiement): void {
    this.rembPaiement  = paiement;
    this.motifRemb     = '';
    this.formError     = '';
    this.showRembModal = true;
  }

  confirmerRemboursement(): void {
    if (!this.rembPaiement) return;
    this.isSaving  = true;
    this.formError = '';

    this.http.patch(`${this.apiUrl}/${this.rembPaiement.id}/rembourser`, {
      motif: this.motifRemb || 'Remboursement administrateur'
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.rembPaiement!.statutPaiement = 'REMBOURSE';
        const p = this.paiements.find(p => p.id === this.rembPaiement!.id);
        if (p) p.statutPaiement = 'REMBOURSE';
        this.isSaving      = false;
        this.showRembModal = false;
        this.rembPaiement  = null;
      },
      error: (err) => {
        this.isSaving  = false;
        this.formError = err?.error?.message || 'Erreur lors du remboursement.';
      }
    });
  }


  // ══════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════

  exportCSV(): void {
    const list = Array.isArray(this.paiements) ? this.paiements : [];
    const csv = [
      ['Référence', 'Commande', 'Mode', 'Opérateur', 'Téléphone', 'Montant', 'Statut', 'Date'].join(','),
      ...list.map(p => [
        p.reference      ?? '—',
        p.commande_id,
        this.getModeLabel(p.modePaiement),
        p.operateur ? this.getOperateurLabel(p.operateur) : '—',
        p.telephone      ?? '—',
        p.montant.toFixed(2),
        this.getStatutLabel(p.statutPaiement),
        this.formatDate(p.datePaiement),
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `paiements-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getStatutLabel(statut: StatutPaiement | string): string {
    const labels: Record<string, string> = {
      PAYEE:      'Payé',
      NON_PAYEE:  'Non payé',
      REMBOURSE:  'Remboursé',
    };
    return labels[statut] ?? statut;
  }

  getStatutClass(statut: StatutPaiement | string): string {
    const classes: Record<string, string> = {
      PAYEE:     'statut-payee',
      NON_PAYEE: 'statut-nonpayee',
      REMBOURSE: 'statut-rembourse',
    };
    return classes[statut] ?? '';
  }

  getModeLabel(mode: ModePaiement | string): string {
    return mode === 'EN_LIGNE' ? 'En ligne' : 'En espèces';
  }

  getOperateurLabel(op: Operateur | string): string {
    const labels: Record<string, string> = {
      ORANGE_MONEY: 'Orange Money',
      WAVE:         'Wave',
      FREE_MONEY:   'Free Money',
    };
    return labels[op] ?? op;
  }

  getOperateurIcon(op?: string): string {
    const icons: Record<string, string> = {
      ORANGE_MONEY: '🟠',
      WAVE:         '🔵',
      FREE_MONEY:   '🟢',
    };
    return op ? (icons[op] ?? '📱') : '💵';
  }

  formatPrix(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' Fr';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}