import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type TypeRole = 'ADMIN' | 'CLIENT' | 'LIVREUR';

interface User {
  id:              number;
  nomComplet:      string;
  email:           string;
  tel?:            string;
  role:            TypeRole;
  dateInscription?: string;
  created_at:      string;
}

@Component({
  selector: 'app-users-admin',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user.component.html',
  styleUrl: './admin-user.component.css'
})
export class AdminUserComponent implements OnInit, OnDestroy {

  private apiUrl = `${environment.apiUrl}/users`;

  // ─── Données ───
  users: User[] = [];

  // ─── Pagination ───
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  perPage     = 12;

  // ─── Filtres ───
  searchQuery = '';
  filterRole  = '';

  // ─── États ───
  isLoading = false;
  hasError  = false;
  errorMsg  = '';
  isSaving  = false;
  formError = '';

  // ─── Modal formulaire (ajout / édition) ───
  showModal    = false;
  editingUser: User | null = null;

  formData: Partial<User> & { password?: string; password_confirmation?: string } = this.emptyForm();

  // ─── Modal suppression ───
  showDeleteModal = false;
  deletingUser: User | null = null;

  // ─── Modal détail ───
  showDetail      = false;
  selectedUser: User | null = null;

  private destroy$      = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 1; this.loadUsers(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ══════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════

  get statsCards() {
    const list     = Array.isArray(this.users) ? this.users : [];
    const admins   = list.filter(u => u.role === 'ADMIN').length;
    const clients  = list.filter(u => u.role === 'CLIENT').length;
    const livreurs = list.filter(u => u.role === 'LIVREUR').length;

    return [
      { title: 'Total utilisateurs', value: list.length.toString(), icon: 'users',    color: 'primary' },
      { title: 'Clients',            value: clients.toString(),      icon: 'client',   color: 'success' },
      { title: 'Livreurs',           value: livreurs.toString(),     icon: 'livreur',  color: 'info'    },
      { title: 'Admins',             value: admins.toString(),       icon: 'admin',    color: 'warning' },
    ];
  }


  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadUsers(): void {
    this.isLoading = true;
    this.hasError  = false;

    let params = new HttpParams()
      .set('page',     this.currentPage.toString())
      .set('per_page', this.perPage.toString());

    if (this.searchQuery) params = params.set('search', this.searchQuery);
    if (this.filterRole)  params = params.set('role',   this.filterRole);

    this.http.get<any>(this.apiUrl, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.users       = Array.isArray(res) ? res : (res?.data ?? []);
          this.lastPage    = res?.last_page    ?? 1;
          this.total       = res?.total        ?? this.users.length;
          this.currentPage = res?.current_page ?? 1;
          this.isLoading   = false;
        },
        error: (err) => {
          this.hasError  = true;
          this.errorMsg  = err?.error?.message || 'Impossible de charger les utilisateurs.';
          this.isLoading = false;
        }
      });
  }


  // ══════════════════════════════════════════
  // FILTRES & PAGINATION
  // ══════════════════════════════════════════

  onSearchChange(): void { this.searchSubject.next(this.searchQuery); }
  onFilterChange(): void { this.currentPage = 1; this.loadUsers(); }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadUsers();
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

  emptyForm(): Partial<User> & { password?: string; password_confirmation?: string } {
    return { nomComplet: '', email: '', tel: '', role: 'CLIENT', password: '', password_confirmation: '' };
  }

  openModal(user?: User): void {
    this.editingUser = user ?? null;
    this.formData    = user
      ? { ...user, password: '', password_confirmation: '' }
      : this.emptyForm();
    this.formError   = '';
    this.showModal   = true;
  }

  closeModal(): void { this.showModal = false; this.editingUser = null; }

  closeModalOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) this.closeModal();
  }

  saveUser(): void {
    this.formError = '';

    if (!this.formData.nomComplet?.trim()) {
      this.formError = 'Le nom est obligatoire.'; return;
    }
    if (!this.formData.email?.trim()) {
      this.formError = 'L\'e-mail est obligatoire.'; return;
    }
    if (!this.editingUser && !this.formData.password?.trim()) {
      this.formError = 'Le mot de passe est obligatoire.'; return;
    }
    if (this.formData.password && this.formData.password !== this.formData.password_confirmation) {
      this.formError = 'Les mots de passe ne correspondent pas.'; return;
    }

    this.isSaving = true;

    const payload: any = {
      nomComplet: this.formData.nomComplet,
      email:      this.formData.email,
      tel:        this.formData.tel || undefined,
      role:       this.formData.role,
    };

    if (this.formData.password) {
      payload.password              = this.formData.password;
      payload.password_confirmation = this.formData.password_confirmation;
    }

    const obs = this.editingUser
      ? this.http.put(`${this.apiUrl}/${this.editingUser.id}`, payload)
      : this.http.post(this.apiUrl, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.isSaving = false; this.closeModal(); this.loadUsers(); },
      error: (err) => {
        this.isSaving  = false;
        this.formError = err?.error?.message || 'Une erreur est survenue.';
      }
    });
  }


  // ══════════════════════════════════════════
  // CHANGER RÔLE
  // ══════════════════════════════════════════

  changerRole(user: User, role: TypeRole): void {
    this.http.patch(`${this.apiUrl}/${user.id}/role`, { role })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { user.role = role; },
        error: (err) => console.error('Erreur changement rôle :', err?.error?.message)
      });
  }


  // ══════════════════════════════════════════
  // DÉTAIL
  // ══════════════════════════════════════════

  openDetail(user: User): void {
    this.selectedUser = user;
    this.showDetail   = true;
  }


  // ══════════════════════════════════════════
  // SUPPRESSION
  // ══════════════════════════════════════════

  confirmDelete(user: User): void {
    this.deletingUser   = user;
    this.showDeleteModal = true;
  }

  deleteUser(): void {
    if (!this.deletingUser) return;
    this.isSaving = true;

    this.http.delete(`${this.apiUrl}/${this.deletingUser.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving        = false;
          this.showDeleteModal = false;
          this.deletingUser    = null;
          this.loadUsers();
        },
        error: (err) => {
          this.isSaving  = false;
          this.formError = err?.error?.message || 'Erreur lors de la suppression.';
        }
      });
  }


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getRoleLabel(role: TypeRole | string): string {
    const labels: Record<string, string> = {
      ADMIN:   'Admin',
      CLIENT:  'Client',
      LIVREUR: 'Livreur',
    };
    return labels[role] ?? role;
  }

  getRoleClass(role: TypeRole | string): string {
    const classes: Record<string, string> = {
      ADMIN:   'role-admin',
      CLIENT:  'role-client',
      LIVREUR: 'role-livreur',
    };
    return classes[role] ?? '';
  }

  getInitiales(nomComplet: string): string {
    return nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(id: number): string {
    const colors = ['avatar-green', 'avatar-pink', 'avatar-blue', 'avatar-amber', 'avatar-purple'];
    return colors[id % colors.length];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}