import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConsultorioService {
  private apiUrl = 'http://localhost:8080/api/consultorios';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los consultorios
   */
  getConsultorios(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2), // Reintentar hasta 2 veces en caso de error
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un consultorio por ID
   */
  getConsultorio(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene consultorios disponibles
   */
  getConsultoriosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza el estado de un consultorio
   */
  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo consultorio
   */
  crearConsultorio(consultorio: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, consultorio).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un consultorio existente
   */
  actualizarConsultorio(id: number, consultorio: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, consultorio).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un consultorio
   */
  eliminarConsultorio(id: number): Observable<any> {
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
      errorMessage = 'Consultorio no encontrado.';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
    } else {
      errorMessage = `Error del servidor: ${error.message}`;
    }

    console.error('Error en ConsultorioService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
