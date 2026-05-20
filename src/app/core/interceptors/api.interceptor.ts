import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {

  // Ajouter l'URL de base si ce n'est pas une URL absolue
  if (!req.url.startsWith('http')) {
    req = req.clone({
      url: `${environment.apiUrl}/${req.url}`
    });
  }

  const token = localStorage.getItem('token');

  // Headers de base
  let headers: { [key: string]: string } = {
    'Accept': 'application/json'
  };

  // ⚠️ Ne pas mettre Content-Type si FormData
  if (!(req.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Ajouter le token si présent
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  req = req.clone({
    setHeaders: headers,
    withCredentials: false
  });

  return next(req); // ← next(req) et non next.handle(req) en format fonction
};