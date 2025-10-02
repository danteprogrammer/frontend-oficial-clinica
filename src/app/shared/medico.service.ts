import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private apiUrl = 'http://localhost:8080/api/medicos';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los médicos
   */
  getMedicos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2), // Reintentar hasta 2 veces en caso de error
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un médico por ID
   */
  getMedico(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene médicos disponibles
   */
  getMedicosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo médico
   */
  crearMedico(medico: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, medico).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un médico existente
   */
  actualizarMedico(id: number, medico: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, medico).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un médico
   */
  eliminarMedico(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';

    if (error.status === 403) {
      errorMessage = 'Error de autorización. Verifica que estés logueado correctamente.';
    } else if (error.status === 404) {
      errorMessage = 'Médico no encontrado.';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
    } else {
      errorMessage = `Error del servidor: ${error.message}`;
    }

    console.error('Error en MedicoService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
