import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Produit, ProduitFilters, PaginatedResponse, Image } from '../models/produit';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

    private endpoint = `${environment.apiUrl}/produits`;
  

  constructor(private http: HttpClient) {}


  // ─── Liste paginée avec filtres ───

  getProduits(filters: ProduitFilters = {}): Observable<PaginatedResponse<Produit>> {
    let params = new HttpParams();

    if (filters.search)    params = params.set('search',    filters.search);
    if (filters.categorie) params = params.set('categorie', filters.categorie);
    if (filters.prix_min)  params = params.set('prix_min',  filters.prix_min.toString());
    if (filters.prix_max)  params = params.set('prix_max',  filters.prix_max.toString());
    if (filters.sort)      params = params.set('sort',      filters.sort);
    if (filters.order)     params = params.set('order',     filters.order);
    if (filters.page)      params = params.set('page',      filters.page.toString());
    if (filters.per_page)  params = params.set('per_page',  filters.per_page.toString());
    if (filters.en_promo) params = params.set('en_promo', filters.en_promo.toString());
    if (filters.marque) params = params.set('marque', filters.marque);

    return this.http.get<PaginatedResponse<Produit>>(this.endpoint, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }


  // ─── Un produit par ID ───

  getProduit(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.endpoint}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }


  // ─── Créer un produit (avec plusieurs images) ───

  createProduit(data: FormData): Observable<Produit> {
    return this.http.post<Produit>(this.endpoint, data).pipe(
      catchError(err => throwError(() => err))
    );
  }


  // ─── Mettre à jour un produit ───

  updateProduit(id: number, data: FormData): Observable<Produit> {
    // Laravel : POST + _method=PUT pour accepter FormData
    data.append('_method', 'PUT');
    return this.http.post<Produit>(`${this.endpoint}/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }


  // ─── Supprimer un produit ───

  deleteProduit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }


  // ─── Supprimer une image spécifique d'un produit ───

  deleteImage(produitId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${produitId}/images/${imageId}`).pipe(
      catchError(err => throwError(() => err))
    );
  }


  // ─── Définir l'image principale ───

  setImagePrimary(produitId: number, imageId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.endpoint}/${produitId}/images/${imageId}/primary`, {}
    ).pipe(catchError(err => throwError(() => err)));
  }


  // ─── Construire FormData depuis le modèle Produit + fichiers images ───

  buildFormData(produit: Partial<Produit>, images: File[] = []): FormData {
    const fd = new FormData();

    if (produit.nom !== undefined)              fd.append('nom',              produit.nom);
    if (produit.marque !== undefined)           fd.append('marque',        produit.marque);
    if (produit.description !== undefined)      fd.append('description',      produit.description ?? '');
    if (produit.prix !== undefined)             fd.append('prix',             produit.prix.toString());
    if (produit.prixPromo !== undefined)        fd.append('prixPromo',        produit.prixPromo?.toString() ?? '');
    if (produit.stock !== undefined)            fd.append('stock',            produit.stock.toString());
    if (produit.seuilAlerteStock !== undefined) fd.append('seuilAlerteStock', produit.seuilAlerteStock.toString());
    if (produit.statut !== undefined)           fd.append('statut',           produit.statut);
    if (produit.categorie_id !== undefined)     fd.append('categorie_id',     produit.categorie_id!.toString());

    fd.append('note', (produit.note ?? 0).toString());
    // Plusieurs images
    images.forEach((file, i) => {
      fd.append(`images[${i}]`, file, file.name);
    });

    return fd;
  }


  // ─── Helpers ───

  getImagePrimaire(produit: Produit, storageUrl: string): string {
  if (!produit.images || produit.images.length === 0) {
    return 'images/placeholder.jpg';
  }
  const primary = produit.images.find(img => img.isPrimary);
  const img     = primary ?? produit.images[0];
  // ✅ Utiliser img.chemin directement
  return `${storageUrl}/${img.chemin}`;
}

  getStatutLabel(statut: string): string {
    return statut === 'DISPONIBLE' ? 'Disponible' : 'En rupture';
  }

  getStatutClass(statut: string): string {
    return statut === 'DISPONIBLE' ? 'statut-disponible' : 'statut-rupture';
  }

  formatPrix(prix: number): string {
    return prix.toLocaleString('fr-FR') + ' Fr';
  }
}