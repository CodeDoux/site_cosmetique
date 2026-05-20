import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export type CustomerSegment = 'vip' | 'regular' | 'new' | 'inactive';
export type ViewMode = 'grid' | 'table';
export type SortOption = 'name' | 'spent_desc' | 'orders_desc' | 'recent';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  initials: string;
  avatarColor: string;
  segment: CustomerSegment;
  orders: number;
  spent: number;
  satisfaction: number;
  lastOrderDate: Date;
  joinDate: Date;
}

@Component({
  selector: 'app-admin-client',
  standalone: true,
    encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-client.component.html',
  styleUrl: './admin-client.component.css'
})
export class AdminClientComponent {

  Math = Math;

  // ── État ─────────────────────────────────────────────────────
  viewMode: ViewMode = 'grid';
  searchQuery = '';
  filterSegment = '';
  filterCity = '';
  sortBy: SortOption = 'spent_desc';
  currentPage = 1;
  itemsPerPage = 9;

  // ── Données ──────────────────────────────────────────────────
  customers: Customer[] = [
    { id: 1,  name: 'Amina Diallo',   email: 'amina@email.com',    phone: '+221 77 123 45 67', city: 'Dakar',       initials: 'AD', avatarColor: 'pink',   segment: 'vip',      orders: 12, spent: 430.50, satisfaction: 4.8, lastOrderDate: new Date('2024-03-15'), joinDate: new Date('2022-05-10') },
    { id: 2,  name: 'Fatou Sow',      email: 'fatou@email.com',    phone: '+221 76 234 56 78', city: 'Thiès',       initials: 'FS', avatarColor: 'blue',   segment: 'regular',  orders: 8,  spent: 280.00, satisfaction: 4.5, lastOrderDate: new Date('2024-03-14'), joinDate: new Date('2022-09-20') },
    { id: 3,  name: 'Mariama Balde',  email: 'mariama@email.com',  phone: '+221 70 345 67 89', city: 'Dakar',       initials: 'MB', avatarColor: 'green',  segment: 'new',      orders: 2,  spent: 96.00,  satisfaction: 5.0, lastOrderDate: new Date('2024-03-13'), joinDate: new Date('2024-02-28') },
    { id: 4,  name: 'Rokhaya Ndiaye', email: 'rokhaya@email.com',  phone: '+221 77 456 78 90', city: 'Saint-Louis', initials: 'RN', avatarColor: 'amber',  segment: 'vip',      orders: 21, spent: 890.00, satisfaction: 4.9, lastOrderDate: new Date('2024-03-12'), joinDate: new Date('2021-11-05') },
    { id: 5,  name: 'Khadija Diop',   email: 'khadija@email.com',  phone: '+221 78 567 89 01', city: 'Dakar',       initials: 'KD', avatarColor: 'purple', segment: 'regular',  orders: 6,  spent: 195.75, satisfaction: 4.3, lastOrderDate: new Date('2024-03-11'), joinDate: new Date('2023-03-14') },
    { id: 6,  name: 'Aissatou Ba',    email: 'aissatou@email.com', phone: '+221 76 678 90 12', city: 'Thiès',       initials: 'AB', avatarColor: 'teal',   segment: 'new',      orders: 1,  spent: 54.00,  satisfaction: 4.7, lastOrderDate: new Date('2024-03-10'), joinDate: new Date('2024-03-01') },
    { id: 7,  name: 'Ndèye Fall',     email: 'ndeye@email.com',    phone: '+221 77 789 01 23', city: 'Dakar',       initials: 'NF', avatarColor: 'blue',   segment: 'vip',      orders: 18, spent: 720.00, satisfaction: 4.6, lastOrderDate: new Date('2024-03-09'), joinDate: new Date('2022-01-17') },
    { id: 8,  name: 'Coumba Sarr',    email: 'coumba@email.com',   phone: '+221 78 890 12 34', city: 'Saint-Louis', initials: 'CS', avatarColor: 'green',  segment: 'inactive', orders: 3,  spent: 78.50,  satisfaction: 3.8, lastOrderDate: new Date('2023-11-20'), joinDate: new Date('2023-06-08') },
    { id: 9,  name: 'Yacine Mbaye',   email: 'yacine@email.com',   phone: '+221 70 901 23 45', city: 'Dakar',       initials: 'YM', avatarColor: 'amber',  segment: 'regular',  orders: 9,  spent: 312.00, satisfaction: 4.4, lastOrderDate: new Date('2024-03-07'), joinDate: new Date('2022-08-22') },
    { id: 10, name: 'Sokhna Gueye',   email: 'sokhna@email.com',   phone: '+221 77 012 34 56', city: 'Dakar',       initials: 'SG', avatarColor: 'purple', segment: 'vip',      orders: 15, spent: 615.00, satisfaction: 4.9, lastOrderDate: new Date('2024-03-06'), joinDate: new Date('2021-07-30') },
  ];

  // ── Stats ─────────────────────────────────────────────────────
  get statsCards() {
    const totalSpent = this.customers.reduce((s, c) => s + c.spent, 0);
    const avgSpent   = totalSpent / this.customers.length;
    return [
      { title: 'Total clients',        value: this.customers.length.toString(),                                       icon: 'users',   color: 'primary' },
      { title: 'Nouveaux ce mois',      value: '+' + this.newThisMonth,                                               icon: 'new',     color: 'success' },
      { title: 'Clients actifs',        value: this.customers.filter(c => c.segment !== 'inactive').length.toString(), icon: 'active',  color: 'info'    },
      { title: 'Valeur moyenne',        value: this.formatCurrency(avgSpent),                                          icon: 'value',   color: 'warning' },
    ];
  }

  get newThisMonth(): number {
    const now = new Date();
    return this.customers.filter(c =>
      c.joinDate.getMonth() === now.getMonth() &&
      c.joinDate.getFullYear() === now.getFullYear()
    ).length;
  }

  // ── Villes disponibles ────────────────────────────────────────
  get availableCities(): string[] {
    return [...new Set(this.customers.map(c => c.city))].sort();
  }

  // ── Filtrage & tri ────────────────────────────────────────────
  get filteredCustomers(): Customer[] {
    let result = this.customers.filter(c => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q
        || c.name.toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q)
        || c.phone.includes(q);
      const matchSegment = !this.filterSegment || c.segment === this.filterSegment;
      const matchCity    = !this.filterCity    || c.city    === this.filterCity;
      return matchSearch && matchSegment && matchCity;
    });

    switch (this.sortBy) {
      case 'name':        result = result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'spent_desc':  result = result.sort((a, b) => b.spent  - a.spent);           break;
      case 'orders_desc': result = result.sort((a, b) => b.orders - a.orders);          break;
      case 'recent':      result = result.sort((a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime()); break;
    }
    return result;
  }

  get paginatedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCustomers.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
  }

  get visiblePages(): number[] {
    const delta = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, this.currentPage - delta); i <= Math.min(this.totalPages, this.currentPage + delta); i++) {
      pages.push(i);
    }
    return pages;
  }

  // Part du CA pour la barre de progression
  getSpentPercent(spent: number): number {
    const max = Math.max(...this.customers.map(c => c.spent));
    return Math.round((spent / max) * 100);
  }

  // ── Actions ──────────────────────────────────────────────────
  setView(mode: ViewMode): void {
    this.viewMode = mode;
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  getPaginationStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredCustomers.length);
  }

  viewCustomer(customer: Customer): void {
    console.log('Voir client', customer.id);
    // → naviguer vers /admin/clients/:id
  }

  editCustomer(customer: Customer): void {
    console.log('Modifier client', customer.id);
  }

  deleteCustomer(customer: Customer): void {
    if (confirm(`Supprimer le client "${customer.name}" ?`)) {
      this.customers = this.customers.filter(c => c.id !== customer.id);
    }
  }

  exportData(): void {
    const csv = [
      ['ID', 'Nom', 'Email', 'Téléphone', 'Ville', 'Segment', 'Commandes', 'Total dépensé', 'Satisfaction'].join(','),
      ...this.filteredCustomers.map(c => [
        c.id, c.name, c.email, c.phone, c.city,
        c.segment, c.orders, c.spent.toFixed(2), c.satisfaction,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'clients.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Helpers ───────────────────────────────────────────────────
  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  getSegmentClass(segment: CustomerSegment): string {
    return `segment-${segment}`;
  }

  getSegmentLabel(segment: CustomerSegment): string {
    const labels: Record<CustomerSegment, string> = {
      vip:      'VIP',
      regular:  'Régulier',
      new:      'Nouveau',
      inactive: 'Inactif',
    };
    return labels[segment];
  }

  getAvatarClass(color: string): string {
    return `avatar-${color}`;
  }

  getStars(rating: number): string {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }
}