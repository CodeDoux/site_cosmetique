import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { Login } from '../../models/token-response';


@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, FormsModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  credentials: Login = {
    email: '',
    password: ''
  };

  rememberMe: boolean = false;
  showPassword: boolean = false;
  isLoading: boolean = false;

  // ─── Erreurs ───
  emailError: string = '';
  passwordError: string = '';
  globalError: string = '';

  currentYear = new Date().getFullYear();

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Rediriger si déjà connecté
    const token = localStorage.getItem('admin_token');
    if (token) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  // ─── Validation ───

  validate(): boolean {
    this.emailError = '';
    this.passwordError = '';
    this.globalError = '';
    let valid = true;

    if (!this.credentials.email) {
      this.emailError = 'L\'adresse e-mail est obligatoire.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.credentials.email)) {
      this.emailError = 'Adresse e-mail invalide.';
      valid = false;
    }

    if (!this.credentials.password) {
      this.passwordError = 'Le mot de passe est obligatoire.';
      valid = false;
    } else if (this.credentials.password.length < 6) {
      this.passwordError = 'Le mot de passe doit contenir au moins 6 caractères.';
      valid = false;
    }

    return valid;
  }

  clearErrors(): void {
    this.emailError = '';
    this.passwordError = '';
    this.globalError = '';
  }

  // ─── Soumission ───

  onSubmit(): void {
    if (!this.validate()) return;

    this.isLoading = true;
    this.globalError = '';
     this.auth.login(this.credentials).subscribe({
      next: (res) => {
        // Sauvegarder le token
        const storage = this.rememberMe ? localStorage : sessionStorage;
        storage.setItem('admin_token', res.token);
        //storage.setItem('admin_user', JSON.stringify(res.user));

        this.isLoading = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;

        if (err.status === 401) {
          this.globalError = 'E-mail ou mot de passe incorrect.';
        } else if (err.status === 403) {
          this.globalError = 'Accès refusé. Vous n\'avez pas les droits administrateur.';
        } else if (err.status === 422 && err.error?.errors) {
          const errors = err.error.errors;
          if (errors.email)    this.emailError    = errors.email[0];
          if (errors.password) this.passwordError = errors.password[0];
        } else if (err.status === 0) {
          this.globalError = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else {
          this.globalError = err.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }
}