import { Injectable } from '@angular/core';
import { Categorie } from '../models/categorie';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {

  private endpoint = 'http://127.0.0.1:8000/api/categories';

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) { }

 /** Récupérer toutes les catégories */
  getAll(): Observable<Categorie[]> {
    return this.httpClient.get<Categorie[]>(this.endpoint);
  }
 
  /** Récupérer une catégorie par ID */
  getById(id: number): Observable<Categorie> {
    return this.httpClient.get<Categorie>(`${this.endpoint}/${id}`);
  }
 
  /** Créer une nouvelle catégorie */
  create(categorie: Omit<Categorie, 'id'>): Observable<Categorie> {
    return this.httpClient.post<Categorie>(this.endpoint, categorie);
  }
 
  /** Mettre à jour une catégorie existante */
  update(id: number, categorie: Partial<Categorie>): Observable<Categorie> {
    return this.httpClient.put<Categorie>(`${this.endpoint}/${id}`, categorie);
  }
 
  /** Supprimer une catégorie */
  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.endpoint}/${id}`);
  }

  // Méthodes utilitaires pour vérifier les permissions
  canManageCategories(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  canViewCategories(): boolean {
    return this.authService.isAuthenticated();
  }
}