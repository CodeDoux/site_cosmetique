import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminTopBarComponent } from '../admin-top-bar/admin-top-bar.component';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AdminSidebarComponent, AdminTopBarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  sidebarOpen = true;

}
