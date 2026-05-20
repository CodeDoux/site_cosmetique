import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

}
