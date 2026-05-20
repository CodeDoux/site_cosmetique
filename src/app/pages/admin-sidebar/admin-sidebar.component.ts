import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {

  constructor(private authService: AuthService, private router: Router){}
  @Input() isOpen = true;

   logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Même en cas d'erreur, on déconnecte localement
        this.authService.removeToken();
        this.router.navigate(['/login']);
      }
    });
  }
}
