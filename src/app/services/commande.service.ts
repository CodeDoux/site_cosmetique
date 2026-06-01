import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Commande } from '../models/commande';

@Injectable({
  providedIn: 'root'
})
export class CommandesService {
  private readonly URL = "http://127.0.0.1:8000/api";

  constructor(private http: HttpClient) {}

  // Récupérer toutes les commandes (Admin / Employé)
  getAll(): Observable<any> {
    return this.http.get<any>(`${this.URL}/commandes`).pipe(
      catchError(this.handleError)
    );
  }

  initierPaiement(commandeId: number, data: {
  modePaiement: string;
  operateur:    string;
  telephone:    string;
}): Observable<any> {
  return this.http.post(
    `${this.URL}/paiements/${commandeId}/initier`, data
  );
}

  createPaiement(data: {
  commande_id:   number;
  modePaiement:  'EN_LIGNE' | 'EN_ESPECE';
  operateur?:    'ORANGE_MONEY' | 'WAVE' | 'FREE_MONEY';
  telephone?:    string;
}): Observable<any> {
  return this.http.post(`${this.URL}/paiements`, data).pipe(
    catchError(this.handleError)
  );
}

  // Récupérer commandes d'un client connecté
  getByClient(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.URL}/mes-commandes`).pipe(
      catchError(this.handleError)
    );
  }

  // Créer une commande (Client) - avec gestion des promotions et frais
  createCommande(data: any): Observable<any> {
    return this.http.post(`${this.URL}/commandes`, data).pipe(
      catchError(this.handleError)
    );
  }

  updateStatut(id: number, statut: Commande['statut']): Observable<Commande> {
  return this.http.patch<Commande>(`${this.URL}/commandes/${id}/statut`, { statut }).pipe(
    catchError(this.handleError)
  );
}

  // Mettre à jour statut de livraison (Employé/Admin)
  updateLivraisonStatut(commandeId: number, statut: string): Observable<any> {
    return this.http.put(`${this.URL}/commandes/${commandeId}/statut`, { 
      statut: statut 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Mettre à jour statut de paiement (Employé/Admin)
  updatePaiementStatut(commandeId: number, statut: string): Observable<any> {
    return this.http.put(`${this.URL}/commande/${commandeId}/paiement`, { 
      statut: statut 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Mettre à jour frais de livraison (Admin/Employé)
  updateFraisLivraison(commandeId: number, frais: number): Observable<any> {
    return this.http.put(`${this.URL}/commandes/${commandeId}/frais-livraison`, { 
      frais_livraison: frais 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Récupérer une commande spécifique avec tous ses détails
  getCommande(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.URL}/commandes/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Supprimer une commande (Admin uniquement)
  deleteCommande(id: number): Observable<any> {
    return this.http.delete(`${this.URL}/commandes/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Annuler une commande et restaurer le stock (Admin/Employé)
  annulerCommande(id: number, motif?: string): Observable<any> {
    return this.http.put(`${this.URL}/commandes/${id}/annuler`, { 
      motif: motif || 'Commande annulée' 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Appliquer une promotion à une commande existante (Admin)
  appliquerPromotion(commandeId: number, promoId: number, produitIds: number[]): Observable<any> {
    return this.http.post(`${this.URL}/commandes/${commandeId}/promotion`, {
      promo_id: promoId,
      produit_ids: produitIds
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Retirer une promotion d'une commande (Admin)
  retirerPromotion(commandeId: number, produitIds: number[]): Observable<any> {
    return this.http.delete(`${this.URL}/commandes/${commandeId}/promotion`, {
      body: { produit_ids: produitIds }
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Récupérer l'historique des modifications d'une commande
  getHistorique(commandeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/commandes/${commandeId}/historique`).pipe(
      catchError(this.handleError)
    );
  }

  // Générer et télécharger facture PDF
  telechargerFacture(commandeId: number): Observable<Blob> {
    return this.http.get(`${this.URL}/commandes/${commandeId}/facture`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Envoyer facture par email
  envoyerFactureEmail(commandeId: number, email?: string): Observable<any> {
    return this.http.post(`${this.URL}/commandes/${commandeId}/envoyer-facture`, {
      email: email
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Statistiques des commandes (Admin)
  getStatistiques(periode?: string): Observable<any> {
    const params = periode ? `?periode=${periode}` : '';
    return this.http.get<any>(`${this.URL}/commandes/statistiques${params}`).pipe(
      catchError(this.handleError)
    );
  }

  // Rechercher commandes par critères
  rechercherCommandes(criteres: {
    client_id?: number;
    statut?: string;
    date_debut?: string;
    date_fin?: string;
    ville?: string;
    montant_min?: number;
    montant_max?: number;
  }): Observable<Commande[]> {
    return this.http.post<Commande[]>(`${this.URL}/commandes/recherche`, criteres).pipe(
      catchError(this.handleError)
    );
  }

  // Dupliquer une commande (Client)
  dupliquerCommande(commandeId: number): Observable<any> {
    return this.http.post(`${this.URL}/commandes/${commandeId}/dupliquer`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // Planifier une livraison (Employé/Admin)
  planifierLivraison(commandeId: number, data: {
    date_livraison: string;
    employe_id?: number;
    note?: string;
  }): Observable<any> {
    return this.http.post(`${this.URL}/commandes/${commandeId}/planifier-livraison`, data).pipe(
      catchError(this.handleError)
    );
  }

  // Confirmer réception de commande (Client)
  confirmerReception(commandeId: number, note?: string): Observable<any> {
    return this.http.post(`${this.URL}/commandes/${commandeId}/confirmer-reception`, {
      note: note
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Évaluer une commande livrée (Client)
  evaluerCommande(commandeId: number, evaluation: {
    note: number; // 1-5
    commentaire?: string;
    recommande?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.URL}/commandes/${commandeId}/evaluation`, evaluation).pipe(
      catchError(this.handleError)
    );
  }

  // Traitement des erreurs
  private handleError(error: any): Observable<never> {
    console.error('Erreur dans CommandesService:', error);
    let errorMessage = 'Une erreur est survenue';

    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.error && typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides';
          break;
        case 401:
          errorMessage = 'Vous devez être connecté pour effectuer cette action';
          break;
        case 403:
          errorMessage = 'Vous n\'avez pas les droits pour effectuer cette action';
          break;
        case 404:
          errorMessage = 'Commande non trouvée';
          break;
        case 409:
          errorMessage = 'Conflit: cette action n\'est pas possible actuellement';
          break;
        case 422:
          errorMessage = 'Données de validation invalides';
          break;
        case 500:
          errorMessage = 'Erreur serveur interne';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText || 'Erreur inconnue'}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  // Utilitaires pour les calculs
  static calculerTotalAvecPromo(produits: any[]): number {
    return produits.reduce((total, item) => {
      let prixUnitaire = item.prix_unitaire || item.prixU;
      
      if (item.promotion && item.promotion.reduction) {
        prixUnitaire = prixUnitaire * (1 - item.promotion.reduction / 100);
      }
      
      return total + (prixUnitaire * item.quantite);
    }, 0);
  }

  static calculerEconomies(produits: any[]): number {
    return produits.reduce((economies, item) => {
      if (item.promotion && item.promotion.reduction) {
        const prixOriginal = item.prix_unitaire || item.prixU;
        const reduction = prixOriginal * (item.promotion.reduction / 100);
        return economies + (reduction * item.quantite);
      }
      return economies;
    }, 0);
  }

  // Vérifier la disponibilité des produits avant commande
  verifierDisponibilite(produits: { produit_id: number; quantite: number }[]): Observable<any> {
    return this.http.post(`${this.URL}/produits/verifier-stock`, { produits }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtenir les créneaux de livraison disponibles
  getCreneauxLivraison(ville: string, date?: string): Observable<any[]> {
    const params = date ? `?date=${date}` : '';
    return this.http.get<any[]>(`${this.URL}/livraisons/creneaux/${ville}${params}`).pipe(
      catchError(this.handleError)
    );
  }
}