import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Commande } from '../../models/commande';
import { Produit } from '../../models/produit';
import { User } from '../../models/user';
import { Paiement } from '../../models/paiement';
import { ProduitService } from '../../services/produit.service';
import { CommandesService } from '../../services/commande.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {

  Math = Math;
  private apiUrl = environment.apiUrl;
 storageUrl= environment.storageUrl
  private destroy$ = new Subject<void>();

  // ─── États ───
  isLoading = true;

  // ─── Stats ───
  totalRevenu     = 0;
  totalCommandes  = 0;
  totalClients    = 0;
  totalProduits   = 0;
  commandesEnAttente = 0;

  // ─── Données ───
  recentCommandes: Commande[] = [];
  topProduits:     Produit[]  = [];
  recentClients:   User[]     = [];

  // ─── Graphique ventes (7 derniers jours) ───
  ventesParJour: { label: string; value: number }[] = [];

  // ─── Répartition statuts commandes ───
  statutsCommandes: { label: string; value: number; color: string }[] = [];

  // ─── Filtres ───
  selectedPeriod = 'week';

  constructor(
    private http:             HttpClient,
    private commandesService: CommandesService,
    private produitService:   ProduitService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ══════════════════════════════════════════
  // CHARGEMENT GLOBAL
  // ══════════════════════════════════════════

  loadDashboard(): void {
    this.isLoading = true;
    forkJoin({
      commandes: this.commandesService.getAll().pipe(catchError(() => of([]))),
      produits:  this.produitService.getProduits({ per_page: 100 }).pipe(catchError(() => of({ data: [] }))),
      clients:   this.http.get<any>(`${this.apiUrl}/users?role=CLIENT&per_page=100`).pipe(catchError(() => of({ data: [] }))),
      paiements: this.http.get<any>(`${this.apiUrl}/paiements?per_page=100`).pipe(catchError(() => of({ data: [] }))),
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ commandes, produits, clients, paiements }) => {

        // ─── Commandes ───
        const listeCommandes: Commande[] = Array.isArray(commandes)
          ? commandes
          : (commandes as any)?.data ?? [];

        this.totalCommandes     = listeCommandes.length;
        this.commandesEnAttente = listeCommandes.filter(c => c.statut === 'EN_ATTENTE').length;
        this.recentCommandes    = listeCommandes.slice(0, 5);

        // ─── Produits ───
        const listeProduits: Produit[] = Array.isArray(produits)
          ? produits
          : (produits as any)?.data ?? [];

        this.totalProduits = listeProduits.length;
        this.topProduits   = listeProduits.slice(0, 4);

        // ─── Clients ───
        const listeClients: User[] = Array.isArray(clients)
          ? clients
          : (clients as any)?.data ?? [];

        this.totalClients  = listeClients.length;
        this.recentClients = listeClients.slice(0, 4);

        // ─── Paiements (revenu total) ───
        const listePaiements: Paiement[] = Array.isArray(paiements)
          ? paiements
          : (paiements as any)?.data ?? [];

        this.totalRevenu = listePaiements
          .filter(p => p.statutPaiement === 'PAYEE')
          .reduce((sum, p) => sum + p.montant, 0);

        // ─── Calculs graphiques ───
        this.calculerVentesParJour(listeCommandes);
        this.calculerStatutsCommandes(listeCommandes);

        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }


  // ══════════════════════════════════════════
  // CALCULS GRAPHIQUES
  // ══════════════════════════════════════════

 private calculerVentesParJour(commandes: Commande[]): void {
  const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const maintenant = new Date();

  this.ventesParJour = jours.map((label, i) => {
    const date = new Date(maintenant);
    date.setDate(maintenant.getDate() - (6 - i));
    const dateStr = date.toISOString().slice(0, 10);

    const total = commandes
      .filter(c => c.dateCommande?.slice(0, 10) === dateStr)
      .reduce((sum, c) => sum + Number(c.montantTotal ?? 0), 0); // ← Number()

    return { label, value: total };
  });
}

  private calculerStatutsCommandes(commandes: Commande[]): void {
    const statuts = [
      { key: 'EN_ATTENTE',     label: 'En attente',     color: '#f59e0b' },
      { key: 'EN_PREPARATION', label: 'En préparation', color: '#3b82f6' },
      { key: 'EN_LIVRAISON',   label: 'En livraison',   color: '#caca8e' },
      { key: 'LIVREE',         label: 'Livrée',         color: '#354d35' },
      { key: 'ANNULEE',        label: 'Annulée',        color: '#ef4444' },
    ];

    this.statutsCommandes = statuts.map(s => ({
      label: s.label,
      color: s.color,
      value: commandes.filter(c => c.statut === s.key).length,
    })).filter(s => s.value > 0);
  }


  // ══════════════════════════════════════════
  // HELPERS GRAPHIQUES
  // ══════════════════════════════════════════

  get maxVente(): number {
  return Math.max(...this.ventesParJour.map(d => Number(d.value)), 1);
}

getBarHeight(value: number | string): number {
  const val = Number(value);
  return Math.round((val / this.maxVente) * 100);
}

  getStatutPourcentage(value: number): number {
    const total = this.statutsCommandes.reduce((s, i) => s + i.value, 0);
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }


  // ══════════════════════════════════════════
  // HELPERS PRODUIT / CLIENT
  // ══════════════════════════════════════════

  getProduitImage(produit: Produit): string {
    if (!produit.images || produit.images.length === 0) return 'images/placeholder.jpg';
    const primary = produit.images.find(i => i.isPrimary) ?? produit.images[0];
    return `${this.storageUrl}/${primary.chemin}`;
  }

  getInitiales(nom: string): string {
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(id: number): string {
    const colors = ['avatar-green', 'avatar-pink', 'avatar-blue', 'avatar-amber', 'avatar-purple'];
    return colors[id % colors.length];
  }


  // ══════════════════════════════════════════
  // HELPERS COMMANDES
  // ══════════════════════════════════════════

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE:     'status-pending',
      EN_PREPARATION: 'status-processing',
      EN_LIVRAISON:   'status-shipped',
      LIVREE:         'status-delivered',
      ANNULEE:        'status-cancelled',
    };
    return map[statut] ?? '';
  }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE:     'En attente',
      EN_PREPARATION: 'En préparation',
      EN_LIVRAISON:   'En livraison',
      LIVREE:         'Livrée',
      ANNULEE:        'Annulée',
    };
    return map[statut] ?? statut;
  }

  getNomClient(commande: Commande): string {
    return commande.client?.nomComplet ?? commande.user?.nomComplet ?? '—';
  }


  // ══════════════════════════════════════════
  // FORMATTERS
  // ══════════════════════════════════════════

  formatPrix(montant: number | string | null | undefined): string {
  if (!montant) return '0 Fr';
  const nombre = typeof montant === 'string' ? parseFloat(montant) : montant;
  if (isNaN(nombre)) return '0 Fr';
  return nombre.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' Fr';
}

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }


  // ══════════════════════════════════════════
  // FILTRE PÉRIODE
  // ══════════════════════════════════════════

  filterByPeriod(period: string): void {
    this.selectedPeriod = period;
    this.loadDashboard();
  }

 get totalVentes(): number {
  console.log('ventesParJour:', this.ventesParJour);
  console.log('types:', this.ventesParJour.map(d => typeof d.value));
  return this.ventesParJour.reduce((s, d) => s + Number(d.value), 0);
}

get aucuneVente(): boolean {
  return this.ventesParJour.every(d => d.value === 0);
}
}