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

  this.http.get<any>(`${this.apiUrl}/dashboard/stats`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {

        // ─── KPIs ───
        this.totalCommandes     = data.total_commandes     ?? 0;
        this.totalClients       = data.total_clients       ?? 0;
        this.totalRevenu        = Number(data.chiffre_affaires ?? 0);
        this.totalProduits      = data.total_produits      ?? 0;
        this.commandesEnAttente = data.commandes_par_statut
          ?.find((s: any) => s.statut === 'EN_ATTENTE')?.total ?? 0;

        // ─── Commandes récentes ───
        this.recentCommandes = data.commandes_recentes ?? [];

        // ─── Top produits ───
        this.topProduits = data.top_produits ?? [];
        this.recentClients   = data.clients_recents    ?? [];
        // ─── Graphiques ───
        this.calculerVentesParJour(data.ventes_7_jours ?? [], 'week');
        this.calculerStatutsCommandes(data.commandes_par_statut ?? []);

        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
}

  // ══════════════════════════════════════════
  // CALCULS GRAPHIQUES
  // ══════════════════════════════════════════

 private calculerVentesParJour(ventesData: any[], period: string = 'week'): void {

  if (period === 'today') {
    const heures = ['8h','10h','12h','14h','16h','18h','20h'];
    this.ventesParJour = heures.map((label, i) => {
      const vente = ventesData.find((v: any) => Number(v.heure) === i + 8);
      return { label, value: Number(vente?.total ?? 0) };
    });
    return;
  }

  if (period === 'month') {
    // Jours du mois en cours : 01, 02, 03...
    const nbJours     = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const annee       = new Date().getFullYear();
    const mois        = String(new Date().getMonth() + 1).padStart(2, '0');

    this.ventesParJour = Array.from({ length: nbJours }, (_, i) => {
      const jour    = String(i + 1).padStart(2, '0');
      const dateStr = `${annee}-${mois}-${jour}`;
      const vente   = ventesData.find((v: any) => v.date === dateStr);
      return { label: jour, value: Number(vente?.total ?? 0) };
    });
    return;
  }

  if (period === 'year') {
    // Mois de l'année : Jan, Fév, Mar...
    const mois = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    this.ventesParJour = mois.map((label, i) => {
      const vente = ventesData.find((v: any) => Number(v.mois) === i + 1);
      return { label, value: Number(vente?.total ?? 0) };
    });
    return;
  }

  // week — par défaut
  const jours      = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const maintenant = new Date();
  this.ventesParJour = jours.map((label, i) => {
    const date    = new Date(maintenant);
    date.setDate(maintenant.getDate() - (6 - i));
    const dateStr = date.toISOString().slice(0, 10);
    const vente   = ventesData.find((v: any) => v.date === dateStr);
    return { label, value: Number(vente?.total ?? 0) };
  });
}

  private calculerStatutsCommandes(statutsData: any[]): void {
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
    value: Number(statutsData.find(d => d.statut === s.key)?.total ?? 0),
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

   formatPrix(montant: number | string): string {
  if (!montant) return '0 Fr';
  const nombre = typeof montant === 'string' ? parseFloat(montant) : montant;
  if (isNaN(nombre)) return '0 Fr';
  
  // Formatage manuel sans toLocaleString
  const parts = Math.round(nombre).toString().split('');
  let result = '';
  parts.reverse().forEach((digit, i) => {
    if (i > 0 && i % 3 === 0) result = ' ' + result;
    result = digit + result;
  });
  
  return result + ' Fr';
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
    this.updateGraphique(period);
  }

  updateGraphique(period: string): void {
  this.http.get<any>(`${this.apiUrl}/dashboard/ventes?period=${period}`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.calculerVentesParJour(data.ventes ?? [], period);
      }
    });
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