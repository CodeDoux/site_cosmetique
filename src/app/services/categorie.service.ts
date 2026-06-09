import { Injectable } from '@angular/core';
import { Categorie } from '../models/categorie';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {

  private readonly endpoint = environment.apiUrl;

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) { }

 /** Récupérer toutes les catégories */
  getAll(): Observable<Categorie[]> {
    return this.httpClient.get<Categorie[]>(`${this.endpoint}/categories`);
  }
 
  /** Récupérer une catégorie par ID */
  getById(id: number): Observable<Categorie> {
    return this.httpClient.get<Categorie>(`${this.endpoint}/categories/${id}`);
  }
 
  /** Créer une nouvelle catégorie */
  create(categorie: Omit<Categorie, 'id'>): Observable<Categorie> {
    return this.httpClient.post<Categorie>(`${this.endpoint}/categories`, categorie);
  }
 
  /** Mettre à jour une catégorie existante */
  update(id: number, categorie: Partial<Categorie>): Observable<Categorie> {
    return this.httpClient.put<Categorie>(`${this.endpoint}/categories/${id}`, categorie);
  }
 
  /** Supprimer une catégorie */
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.endpoint}/categories/${id}`);
  }

  // Méthodes utilitaires pour vérifier les permissions
  canManageCategories(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  canViewCategories(): boolean {
    return this.authService.isAuthenticated();
  }
}