import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Commande, StatutCommande } from '../../models/commande';
import { CommandesService } from '../../services/commande.service';
import jsPDF from 'jspdf';



@Component({
  selector: 'app-admin-commande',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-commande.component.html',
  styleUrl: './admin-commande.component.css'
})
export class AdminCommandeComponent implements OnInit, OnDestroy {

  Math = Math;

  // ─── Données ───
  commandes: Commande[] = [];

  // ─── États ───
  isLoading   = false;
  hasError    = false;
  errorMsg    = '';
  isSaving    = false;

  // ─── Filtres (côté client sur les données déjà chargées) ───
  searchQuery   = '';
  filterStatut  = '';
  filterDate    = '';
  activeTab: 'all' | 'new' | 'urgent' = 'all';

  // ─── Pagination ───
  currentPage  = 1;
  itemsPerPage = 10;

  // ─── Détail commande ───
  showDetail      = false;
  selectedCommande: Commande | null = null;
  isLoadingDetail = false;

  // ─── Frais livraison ───
  showFraisModal = false;
  nouveauxFrais  = 0;

  // ─── Dropdown statut ───
  openDropdownId: number | null = null;

  toggleDropdown(id: number): void {
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  // Fermer le dropdown si clic en dehors
  @HostListener('document:click')
  onDocumentClick(): void {
    this.openDropdownId = null;
  }

  private destroy$      = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private commandesService: CommandesService) {}

  ngOnInit(): void {
    this.loadCommandes();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ══════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════

  loadCommandes(): void {
  this.isLoading = true;
  this.hasError  = false;

  this.commandesService.getAll()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        console.log('Réponse API commandes :', res); // ← voir la structure
        this.commandes = Array.isArray(res)      ? res          :
                         Array.isArray(res?.data) ? res.data    :
                         Array.isArray(res?.commandes) ? res.commandes : [];
        console.log('commandes chargées :', this.commandes.length);
        this.isLoading = false;
      },
      error: (err) => {
        this.hasError  = true;
        this.errorMsg  = err.message || 'Impossible de charger les commandes.';
        this.isLoading = false;
      }
    });
}


  // ══════════════════════════════════════════
  // STATS (calculées depuis les données chargées)
  // ══════════════════════════════════════════

  get statsCards() {
    const list = Array.isArray(this.commandes) ? this.commandes : [];
    const total       = list.length;
    const enAttente   = list.filter(c => c.statut === 'EN_ATTENTE').length;
    const enLivraison = list.filter(c => c.statut === 'EN_LIVRAISON').length;
    const livrees     = list.filter(c => c.statut === 'LIVREE').length;
    const annulees    = list.filter(c => c.statut === 'ANNULEE').length;

    return [
      { title: 'Total commandes', value: total.toString(),        icon: 'orders',   color: 'primary' },
      { title: 'En attente',      value: enAttente.toString(),    icon: 'pending',  color: 'warning' },
      { title: 'En livraison',    value: enLivraison.toString(),  icon: 'shipped',  color: 'info'    },
      { title: 'Livrées',         value: livrees.toString(),      icon: 'done',     color: 'success' },
      { title: 'Annulées',        value: annulees.toString(),     icon: 'cancelled',color: 'purple'  },
    ];
  }


  // ══════════════════════════════════════════
  // FILTRAGE (côté client)
  // ══════════════════════════════════════════

  get filteredCommandes(): Commande[] {
    const list = Array.isArray(this.commandes) ? this.commandes : [];
    return list.filter(commande => {
      const q = this.searchQuery.toLowerCase();

      const matchSearch = !q
        || commande.reference.toLowerCase().includes(q)
        || commande.id.toString().includes(q)
        || (commande.client?.nomComplet?.toLowerCase().includes(q) ?? false)
        || (commande.client?.email?.toLowerCase().includes(q) ?? false)
        || (commande.user?.nomComplet?.toLowerCase().includes(q) ?? false)
        || (commande.user?.email?.toLowerCase().includes(q) ?? false);

      const matchStatut = !this.filterStatut || commande.statut === this.filterStatut;

      const matchDate = this.matchesDateFilter(commande.dateCommande);

      const matchTab = this.activeTab === 'all'
        || (this.activeTab === 'new'    && this.isRecente(commande.dateCommande))
        || (this.activeTab === 'urgent' && commande.statut === 'EN_ATTENTE');

      return matchSearch && matchStatut && matchDate && matchTab;
    });
  }

  get paginatedCommandes(): Commande[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCommandes.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCommandes.length / this.itemsPerPage);
  }

  get visiblePages(): number[] {
    const delta = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, this.currentPage - delta); i <= Math.min(this.totalPages, this.currentPage + delta); i++) {
      pages.push(i);
    }
    return pages;
  }

  private isRecente(dateStr: string): boolean {
    const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 3;
  }

  private matchesDateFilter(dateStr: string): boolean {
    if (!this.filterDate) return true;
    const date = new Date(dateStr);
    const now  = new Date();
    if (this.filterDate === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (this.filterDate === 'week') {
      return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }
    if (this.filterDate === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  }

  onFilterChange(): void { this.currentPage = 1; }
  onSearchChange(): void { this.searchSubject.next(this.searchQuery); this.currentPage = 1; }
  setTab(tab: 'all' | 'new' | 'urgent'): void { this.activeTab = tab; this.currentPage = 1; }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }


  // ══════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════

  // ─── Voir détail ───
  viewCommande(commande: Commande): void {
    this.isLoadingDetail  = true;
    this.showDetail       = true;
    this.selectedCommande = commande;

    this.commandesService.getCommande(commande.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.selectedCommande = data;
          this.isLoadingDetail  = false;
        },
        error: () => { this.isLoadingDetail = false; }
      });
  }

  closeDetail(): void { this.showDetail = false; this.selectedCommande = null; }

  // ─── Changer statut ───
  updateStatut(commande: Commande, statut: StatutCommande): void {
    this.isSaving = true;

    this.commandesService.updateStatut(commande.id, statut)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          commande.statut = updated.statut;
          if (this.selectedCommande?.id === commande.id) {
            this.selectedCommande!.statut = updated.statut;
          }
          this.isSaving = false;
        },
        error: (err) => {
          console.error('Erreur mise à jour statut :', err.message);
          this.isSaving = false;
        }
      });
  }

  // ─── Annuler ───
  annulerCommande(commande: Commande): void {
    if (!confirm(`Annuler la commande ${commande.reference} ?`)) return;

    this.commandesService.annulerCommande(commande.id, 'Annulée par l\'administrateur')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          commande.statut = 'ANNULEE';
          if (this.selectedCommande?.id === commande.id) {
            this.selectedCommande!.statut = 'ANNULEE';
          }
        },
        error: (err) => console.error('Erreur annulation :', err.message)
      });
  }

  // ─── Frais de livraison ───
  openFraisModal(commande: Commande): void {
    this.selectedCommande = commande;
    this.nouveauxFrais    = commande.fraisLivraison;
    this.showFraisModal   = true;
  }

  saveFrais(): void {
    if (!this.selectedCommande) return;
    this.isSaving = true;

    this.commandesService.updateFraisLivraison(this.selectedCommande.id, this.nouveauxFrais)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedCommande!.fraisLivraison = this.nouveauxFrais;
          // Mettre à jour dans la liste
          const c = this.commandes.find(c => c.id === this.selectedCommande!.id);
          if (c) c.fraisLivraison = this.nouveauxFrais;
          this.showFraisModal = false;
          this.isSaving = false;
        },
        error: (err) => {
          console.error('Erreur frais livraison :', err.message);
          this.isSaving = false;
        }
      });
  }

  // ─── Export CSV ───
  exportData(): void {
    const csv = [
      ['Référence', 'Client', 'Email', 'Date', 'Mode livraison', 'Frais', 'Total', 'Statut'].join(','),
      ...this.filteredCommandes.map(c => [
        c.reference,
        this.getNomClient(c),
        this.getEmailClient(c),
        this.formatDate(c.dateCommande),
        c.modeLivraison,
        c.fraisLivraison.toFixed(2),
        c.montantTotal.toFixed(2),
        this.getStatutLabel(c.statut),
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }


  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  getNomClient(commande: Commande): string {
    return commande.client?.nomComplet ?? commande.user?.nomComplet ?? '—';
  }

  getEmailClient(commande: Commande): string {
    return commande.client?.email ?? commande.user?.email ?? '—';
  }

  getInitiales(commande: Commande): string {
    const nom = this.getNomClient(commande);
    if (nom === '—') return '?';
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  formatDateHeure(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatPrix(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' Fr';
  }

  getStatutClass(statut: StatutCommande): string {
    const map: Record<StatutCommande, string> = {
      EN_PREPARATION: 'status-processing',
      EN_ATTENTE:     'status-pending',
      EN_LIVRAISON:   'status-shipped',
      LIVREE:         'status-delivered',
      ANNULEE:        'status-cancelled',
    };
    return map[statut] ?? '';
  }

  getStatutLabel(statut: StatutCommande | string): string {
    const labels: Record<string, string> = {
      EN_PREPARATION: 'En préparation',
      EN_ATTENTE:     'En attente',
      EN_LIVRAISON:   'En livraison',
      LIVREE:         'Livrée',
      ANNULEE:        'Annulée',
    };
    return labels[statut] ?? statut;
  }

  getModeLivraisonLabel(mode: string): string {
    const labels: Record<string, string> = {
      DOMICILE:        'Domicile',
      POINT_RELAIS:    'Point relais',
      RETRAIT_MAGASIN: 'Retrait magasin',
    };
    return labels[mode] ?? mode;
  }

  getAvatarIndex(commande: Commande): number {
    return (commande.id % 5);
  }

  getPaginationStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredCommandes.length);
  }

  // Statuts disponibles pour le dropdown (selon statut actuel)
  getStatutsSuivants(statut: StatutCommande): StatutCommande[] {
    const transitions: Record<StatutCommande, StatutCommande[]> = {
      EN_ATTENTE:     ['EN_PREPARATION', 'ANNULEE'],
      EN_PREPARATION: ['EN_LIVRAISON',   'ANNULEE'],
      EN_LIVRAISON:   ['LIVREE',         'ANNULEE'],
      LIVREE:         [],
      ANNULEE:        [],
    };
    return transitions[statut] ?? [];
  }

  canUpdateStatut(statut: StatutCommande): boolean {
    return !['LIVREE', 'ANNULEE'].includes(statut);
  }


telechargerFacture(commande: Commande): void {
  const doc = new jsPDF();
  const vert = '#354d35';
  const gris = '#6b7a6b';
  let y = 20;

  // ─── En-tête ───
  doc.setFontSize(22);
  doc.setTextColor(vert);
  doc.text('Toulay Skin', 20, y);

  doc.setFontSize(10);
  doc.setTextColor(gris);
  doc.text('Pikine / Saf Bar', 20, y + 8);
  doc.text('+221 78 288 42 45 | toulay@gmail.com', 20, y + 14);

  // ─── Titre FACTURE ───
  doc.setFontSize(18);
  doc.setTextColor(vert);
  doc.text('FACTURE', 150, y, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(gris);
  doc.text(`Réf. : ${commande.reference}`, 150, y + 8, { align: 'right' });
  doc.text(`Date : ${this.formatDate(commande.dateCommande)}`, 150, y + 14, { align: 'right' });

  y += 35;

  // ─── Ligne séparatrice ───
  doc.setDrawColor(202, 202, 142);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 10;

  // ─── Infos client ───
  doc.setFontSize(11);
  doc.setTextColor(vert);
  doc.text('Client', 20, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor('#1e2b1e');
  doc.text(this.getNomClient(commande), 20, y);
  y += 6;
  doc.setTextColor(gris);
  doc.text(this.getEmailClient(commande), 20, y);
  y += 6;
  doc.text(`Mode de livraison : ${this.getModeLivraisonLabel(commande.modeLivraison)}`, 20, y);
  y += 15;

  // ─── Tableau des lignes ───
  doc.setFillColor(53, 77, 53);
  doc.rect(20, y, 170, 8, 'F');

  doc.setTextColor('#ffffff');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Produit / Gamme', 25, y + 5.5);
  doc.text('Type',      95, y + 5.5);
  doc.text('Qté',      120, y + 5.5);
  doc.text('Prix unit.', 140, y + 5.5);
  doc.text('Sous-total', 170, y + 5.5, { align: 'right' });
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#1e2b1e');

  const lignes = commande.lignes_commande ?? [];
  lignes.forEach((ligne, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 245, 244);
      doc.rect(20, y - 3, 170, 8, 'F');
    }
   const label = ligne.type === 'GAMME'
  ? (ligne.gamme?.nom   ?? `Gamme #${ligne.gamme_id}`)
  : (ligne.produit?.nom ?? `Produit #${ligne.produit_id}`);

    doc.setFontSize(9);
    doc.text(label,                              25, y + 2);
    doc.text(ligne.type ?? '—',                  95, y + 2);
    doc.text(String(ligne.quantite),            120, y + 2);
    doc.text(this.formatPrix(ligne.prix),       140, y + 2);
    doc.text(this.formatPrix(ligne.montantLigne), 185, y + 2, { align: 'right' });
    y += 9;
  });

  y += 5;
  doc.setDrawColor(202, 202, 142);
  doc.line(20, y, 190, y);
  y += 8;

  // ─── Totaux ───
  const addLigne = (label: string, valeur: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(bold ? vert : gris);
    doc.text(label,  130, y);
    doc.text(valeur, 185, y, { align: 'right' });
    y += bold ? 9 : 7;
  };

  const sousTotal = lignes.reduce((s, l) => s + l.montantLigne, 0);
  addLigne('Sous-total',       this.formatPrix(sousTotal));
  addLigne('Frais de livraison', this.formatPrix(commande.fraisLivraison));
  y += 2;
  addLigne('TOTAL',            this.formatPrix(commande.montantTotal), true);

  // ─── Paiement ───
  if (commande.paiement) {
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(gris);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mode de paiement : ${commande.paiement.modePaiement}`, 20, y);
    y += 6;
    doc.text(`Statut : ${commande.paiement.statutPaiement}`, 20, y);
  }

  // ─── Pied de page ───
  y = 280;
  doc.setDrawColor(224, 146, 157);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(gris);
  doc.text('Merci pour votre achat ! 🌸 Toulay Skin', 105, y, { align: 'center' });

  // ─── Téléchargement ───
  doc.save(`facture-${commande.reference}.pdf`);
}
}