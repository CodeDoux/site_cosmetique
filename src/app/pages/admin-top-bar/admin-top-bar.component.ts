import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification';

@Component({
  selector: 'app-admin-top-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-top-bar.component.html',
  styleUrl: './admin-top-bar.component.css'
})
export class AdminTopBarComponent {
  @Input() isOpen = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  searchQuery = '';

  // Dans la classe
showNotifs    = false;
notifications: Notification[] = [];
nbNonLues     = 0;

private destroy$ = new Subject<void>();

constructor(private notificationService: NotificationService) {}

ngOnInit(): void {
  this.loadNotifications();
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

@HostListener('document:click')
closeNotifs(): void {
  this.showNotifs = false;
}

loadNotifications(): void {
  this.notificationService.getAll()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        this.notifications = Array.isArray(res) ? res : (res?.data ?? []);
        this.nbNonLues     = this.notifications.filter(n => !n.estLu).length;
      }
    });
}


marquerLu(notif: Notification): void {
  if (notif.estLu) return;
  this.notificationService.marquerLu(notif.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        notif.estLu       = true;
        this.nbNonLues = Math.max(0, this.nbNonLues - 1);
      }
    });
}

marquerToutLu(): void {
  this.notificationService.marquerToutLu()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.notifications.forEach(n => n.estLu = true);
        this.nbNonLues = 0;
      }
    });
}

getIcone(type: string): string {
  const icones: Record<string, string> = {
    COMMANDE:  '🛍️',
    PAIEMENT:  '💳',
    LIVRAISON: '🚚',
    STOCK:     '📦',
    AVIS:      '⭐',
  };
  return icones[type] ?? '🔔';
}

getIconeClass(type: string): string {
  const classes: Record<string, string> = {
    COMMANDE:  'icone-commande',
    PAIEMENT:  'icone-paiement',
    LIVRAISON: 'icone-livraison',
    STOCK:     'icone-stock',
    AVIS:      'icone-avis',
  };
  return classes[type] ?? '';
}

formatDateNotif(date: string): string {
  if (!date) return '';
  const d   = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('fr-FR');
}
}
