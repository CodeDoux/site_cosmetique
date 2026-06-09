import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Gamme, GammeFilters, PaginatedResponse, StatutGamme } from '../models/gamme';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GammeService {

  private endpoint = `${environment.apiUrl}/gammes`;
  storageUrl= environment.storageUrl;


  constructor(private http: HttpClient) {}

  // ─── Liste paginée ───
  getGammes(filters: GammeFilters = {}): Observable<PaginatedResponse<Gamme>> {
    let params = new HttpParams();
    if (filters.search)    params = params.set('search',    filters.search);
    if (filters.prix_min)  params = params.set('prix_min',  filters.prix_min.toString());
    if (filters.prix_max)  params = params.set('prix_max',  filters.prix_max.toString());
    if (filters.sort)      params = params.set('sort',      filters.sort);
    if (filters.page)      params = params.set('page',      filters.page.toString());
    if (filters.per_page)  params = params.set('per_page',  filters.per_page.toString());
    return this.http.get<PaginatedResponse<Gamme>>(this.endpoint, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }

 getGamme(id: number): Observable<Gamme> {
  return this.http.get<any>(`${this.endpoint}/${id}`).pipe(
    map((res: any) => {
      console.log('Réponse getGamme :', res);
      // L'API peut retourner { gamme: {...} } ou { data: {...} } ou directement {...}
      return res?.gamme ?? res?.data ?? res;
    }),
    catchError(err => throwError(() => err))
  );
}

  // ─── Créer ───
  createGamme(data: FormData): Observable<Gamme> {
    return this.http.post<Gamme>(this.endpoint, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Mettre à jour ───
  updateGamme(id: number, data: FormData): Observable<Gamme> {
    data.append('_method', 'PUT');
    return this.http.post<Gamme>(`${this.endpoint}/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Supprimer ───
  deleteGamme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ─── Construire FormData ───
  buildFormData(gamme: Partial<Gamme>, imageFile?: File, produits?: { produit_id: number; quantite: number; valeur_unitaire: number }[]): FormData {
    const fd = new FormData();
    if (gamme.nom         !== undefined) fd.append('nom',         gamme.nom);
    if (gamme.description !== undefined) fd.append('description', gamme.description ?? '');
    if (gamme.statut      !== undefined) fd.append('statut',      gamme.statut);
    if (gamme.prix_fixe   !== undefined) fd.append('prix_fixe',   gamme.prix_fixe.toString());
    if (gamme.prixPromo   !== undefined && gamme.prixPromo !== null) fd.append('prixPromo', gamme.prixPromo.toString());
    if (gamme.dateDebut   !== undefined) fd.append('dateDebut',   gamme.dateDebut);
    if (gamme.dateFin     !== undefined) fd.append('dateFin',     gamme.dateFin);
    if (imageFile) fd.append('image', imageFile, imageFile.name);

    // Produits de la gamme
    if (produits && produits.length > 0) {
      produits.forEach((p, i) => {
        fd.append(`produits[${i}][produit_id]`,      p.produit_id.toString());
        fd.append(`produits[${i}][quantite]`,        p.quantite.toString());
        fd.append(`produits[${i}][valeur_unitaire]`, p.valeur_unitaire.toString());
      });
    }

    return fd;
  }

  // ─── Helpers ───
  getImageUrl(gamme: Gamme): string {
    if (!gamme.image) return 'images/placeholder.jpg';
    return `${this.storageUrl}/${gamme.image}`;
  }

  getStatutLabel(statut: StatutGamme): string {
    const labels: Record<StatutGamme, string> = {
      DISPONIBLE: 'Disponible',
      EPUISEE:    'Épuisée',
      A_VENIR:    'À venir',
    };
    return labels[statut] ?? statut;
  }

  getStatutClass(statut: StatutGamme): string {
    const classes: Record<StatutGamme, string> = {
      DISPONIBLE: 'statut-disponible',
      EPUISEE:    'statut-epuisee',
      A_VENIR:    'statut-avenir',
    };
    return classes[statut] ?? '';
  }

  formatPrix(gamme: Gamme): string {
    const prix = gamme.prixPromo ?? gamme.prix_fixe;
    return prix ? prix.toLocaleString('fr-FR') + ' Fr' : '—';
  }

  getReduction(gamme: Gamme): number {
    if (!gamme.prixPromo || !gamme.prix_fixe) return 0;
    return Math.round((1 - gamme.prixPromo / gamme.prix_fixe) * 100);
  }

  getValeurTotale(gamme: Gamme): number {
    if (!gamme.produits) return 0;
    return gamme.produits.reduce((sum, gp) => sum + (gp.valeur_unitaire * gp.quantite), 0);
  }
}