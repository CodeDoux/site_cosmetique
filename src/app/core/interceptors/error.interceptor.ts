import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        // Erreur côté client
        errorMessage = `Erreur: ${error.error.message}`;

      } else {
        // Erreur côté serveur
        if (error.error && error.error.message) {
          errorMessage = error.error.message;

        } else if (error.status === 0) {
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';

        } else if (error.status === 401) {
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';

        } else if (error.status === 403) {
          errorMessage = 'Accès refusé.';

        } else if (error.status === 404) {
          errorMessage = 'Ressource non trouvée.';

        } else if (error.status === 422) {
          // Erreurs de validation Laravel
          errorMessage = 'Erreur de validation. Vérifiez les champs.';

          if (error.error && error.error.errors) {
            const validationErrors = error.error.errors;
            const firstErrorKey = Object.keys(validationErrors)[0];
            if (firstErrorKey && validationErrors[firstErrorKey][0]) {
              errorMessage = validationErrors[firstErrorKey][0];
            }
          }

        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        }else if (error.status === 429) {
          console.warn('Rate limit atteint, attendez avant de réessayer.');
          return throwError(() => error); // ← ne pas retry
        }
      }

      console.error('HTTP Error:', error);
      return throwError(() => ({ message: errorMessage, error }));
    })
  );
};