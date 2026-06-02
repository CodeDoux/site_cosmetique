import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Promotion } from '../models/promotion';
import { environment } from '../../environments/environment';

export interface PromotionFilters {
  search?:    string;
  type?:      string;
  estActif?:  boolean;
  page?:      number;
  per_page?:  number;
}

export interface PaginatedResponse<T> {
  data:         T[];
  current_page: number;
  last_page:    number;
  per_page:     number;
  total:        number;
  from:         number;
  to:           number;
}

@Injectable({ providedIn: 'root' })
export class PromotionService {

  private url = `${environment.apiUrl}/promotions`;

  constructor(private http: HttpClient) {}

  // ─── Liste ───
  getAll(filters: PromotionFilters = {}): Observable<PaginatedResponse<Promotion>> {
    let params = new HttpParams();
    if (filters.search)   params = params.set('search',   filters.search);
    if (filters.type)     params = params.set('type',     filters.type);
    if (filters.page)     params = params.set('page',     filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    if (filters.estActif !== undefined) params = params.set('estActif', filters.estActif ? '1' : '0');
    return this.http.get<PaginatedResponse<Promotion>>(this.url, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Une promotion ───
  getOne(id: number): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.url}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Créer ───
  create(data: Partial<Promotion>): Observable<Promotion> {
    return this.http.post<Promotion>(this.url, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  verifierCode(code: string, montant: number): Observable<any> {
  return this.http.post<any>(`${this.url}/verifier`, {
    code:    code.trim(),
    montant: montant,
  });
}
  // ─── Mettre à jour ───
  update(id: number, data: Partial<Promotion>): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.url}/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Supprimer ───
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Activer / Désactiver ───
  toggleActif(id: number): Observable<Promotion> {
    return this.http.patch<Promotion>(`${this.url}/${id}/toggle`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Helpers ───
  getTypeLabel(type: string): string {
    return type === 'POURCENTAGE' ? 'Pourcentage' : 'Montant fixe';
  }

  formatValeur(promo: Promotion): string {
    return promo.type === 'POURCENTAGE'
      ? `${promo.valeur}%`
      : `${promo.valeur.toLocaleString('fr-FR')} Fr`;
  }

  isExpired(promo: Promotion): boolean {
    return new Date(promo.dateFin) < new Date();
  }

  isEnCours(promo: Promotion): boolean {
    const now = new Date();
    return promo.estActif
      && new Date(promo.dateDebut) <= now
      && new Date(promo.dateFin)   >= now;
  }

  getStatutLabel(promo: Promotion): string {
    if (!promo.estActif)           return 'Inactive';
    if (this.isExpired(promo))     return 'Expirée';
    if (this.isEnCours(promo))     return 'En cours';
    return 'Planifiée';
  }

  getStatutClass(promo: Promotion): string {
    if (!promo.estActif)       return 'statut-inactive';
    if (this.isExpired(promo)) return 'statut-expiree';
    if (this.isEnCours(promo)) return 'statut-encours';
    return 'statut-planifiee';
  }
}