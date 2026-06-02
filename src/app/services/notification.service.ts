import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  // ── Récupérer toutes les notifications ──
  getAll(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // ── Marquer une notification comme lue ──
  marquerLu(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/lire`, {});
  }

  // ── Marquer toutes comme lues ──
  marquerToutLu(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/lire-tout`, {});
  }
}