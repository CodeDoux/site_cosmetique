import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: string;
}

interface Order {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  image: string;
  status: 'active' | 'inactive';
}

interface Customer {
  id: number;
  name: string;
  email: string;
  orders: number;
  spent: number;
  joinDate: string;
  avatar: string;
}

interface ChartData {
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit{
  Math = Math;
  // Sidebar state
  sidebarOpen: boolean = true;
  activeMenu: string = 'dashboard';

  // Statistics Cards
  statsCards: StatCard[] = [
    {
      title: 'Total Revenue',
      value: '$45,231',
      change: 12.5,
      icon: '💰',
      color: 'primary'
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: 8.3,
      icon: '📦',
      color: 'success'
    },
    {
      title: 'Total Customers',
      value: '892',
      change: 15.2,
      icon: '👥',
      color: 'info'
    },
    {
      title: 'Products Sold',
      value: '3,456',
      change: -2.4,
      icon: '🛍️',
      color: 'warning'
    }
  ];

  // Recent Orders
  recentOrders: Order[] = [
    {
      id: '#ORD-001234',
      customer: 'Aminata Diop',
      date: '2024-12-28',
      total: 325.00,
      status: 'delivered',
      items: 3
    },
    {
      id: '#ORD-001233',
      customer: 'Moussa Kane',
      date: '2024-12-28',
      total: 189.50,
      status: 'shipped',
      items: 2
    },
    {
      id: '#ORD-001232',
      customer: 'Fatou Sall',
      date: '2024-12-27',
      total: 456.75,
      status: 'processing',
      items: 5
    },
    {
      id: '#ORD-001231',
      customer: 'Ibrahima Ndiaye',
      date: '2024-12-27',
      total: 234.00,
      status: 'pending',
      items: 4
    },
    {
      id: '#ORD-001230',
      customer: 'Aissatou Ba',
      date: '2024-12-26',
      total: 567.25,
      status: 'delivered',
      items: 6
    }
  ];

  // Top Products
  topProducts: Product[] = [
    {
      id: 1,
      name: 'Beauty Ultimate Eye Shadow',
      category: 'Makeup Brushes',
      price: 113.00,
      stock: 45,
      sales: 250,
      image: 'produit1.jpg',
      status: 'active'
    },
    {
      id: 2,
      name: 'Nourishing Gold Kesar',
      category: 'Skincare Cream',
      price: 126.00,
      stock: 32,
      sales: 320,
      image: 'produit2.jpg',
      status: 'active'
    },
    {
      id: 3,
      name: 'Yunucha Eye Liner',
      category: 'Makeup Lipstick',
      price: 86.00,
      stock: 78,
      sales: 410,
      image: 'produit5.jpg',
      status: 'active'
    },
    {
      id: 4,
      name: 'Matte Poreless Liquid',
      category: 'Face Cream',
      price: 122.00,
      stock: 12,
      sales: 380,
      image: 'produit6.jpg',
      status: 'active'
    }
  ];

  // Recent Customers
  recentCustomers: Customer[] = [
    {
      id: 1,
      name: 'Aminata Diop',
      email: 'aminata.diop@example.com',
      orders: 12,
      spent: 1456.80,
      joinDate: '2024-01-15',
      avatar: '👩🏾'
    },
    {
      id: 2,
      name: 'Moussa Kane',
      email: 'moussa.kane@example.com',
      orders: 8,
      spent: 892.50,
      joinDate: '2024-02-20',
      avatar: '👨🏾'
    },
    {
      id: 3,
      name: 'Fatou Sall',
      email: 'fatou.sall@example.com',
      orders: 15,
      spent: 2134.00,
      joinDate: '2023-11-10',
      avatar: '👩🏿'
    },
    {
      id: 4,
      name: 'Ibrahima Ndiaye',
      email: 'ibrahima.n@example.com',
      orders: 6,
      spent: 678.90,
      joinDate: '2024-03-05',
      avatar: '👨🏿'
    }
  ];

  // Sales Chart Data (Last 7 days)
  salesChartData: ChartData[] = [
    { label: 'Mon', value: 2400 },
    { label: 'Tue', value: 3200 },
    { label: 'Wed', value: 2800 },
    { label: 'Thu', value: 4100 },
    { label: 'Fri', value: 3800 },
    { label: 'Sat', value: 5200 },
    { label: 'Sun', value: 4600 }
  ];

  // Category Distribution
  categoryData: ChartData[] = [
    { label: 'Skincare', value: 35 },
    { label: 'Makeup', value: 28 },
    { label: 'Hair Care', value: 18 },
    { label: 'Perfumes', value: 12 },
    { label: 'Others', value: 7 }
  ];

  // Filters
  selectedPeriod: string = 'week';
  searchQuery: string = '';

  ngOnInit(): void {
    // Initialize dashboard data
  }

  // Sidebar Methods
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveMenu(menu: string): void {
    this.activeMenu = menu;
  }

  // Order Methods
  getOrderStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || '';
  }

  getOrderStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  }

  viewOrder(order: Order): void {
    console.log('View order:', order);
  }

  // Product Methods
  editProduct(product: Product): void {
    console.log('Edit product:', product);
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      console.log('Delete product:', product);
    }
  }

  toggleProductStatus(product: Product): void {
    product.status = product.status === 'active' ? 'inactive' : 'active';
  }

  // Customer Methods
  viewCustomer(customer: Customer): void {
    console.log('View customer:', customer);
  }

  // Chart Methods
  getChartBarHeight(value: number, maxValue: number): number {
    return (value / maxValue) * 100;
  }

  getMaxSalesValue(): number {
    return Math.max(...this.salesChartData.map(d => d.value));
  }

  getCategoryPercentage(value: number): number {
    const total = this.categoryData.reduce((sum, item) => sum + item.value, 0);
    return (value / total) * 100;
  }

  // Filter Methods
  filterByPeriod(period: string): void {
    this.selectedPeriod = period;
    console.log('Filter by period:', period);
  }

  // Export Methods
  exportData(type: string): void {
    console.log('Export data:', type);
    alert(`Exporting ${type} data...`);
  }

  // Utility Methods
  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

}
