import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private apiUrl = 'http://localhost:8080/api/turnos';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los turnos
   */
  getTurnos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2), // Reintentar hasta 2 veces en caso de error
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un turno por ID
   */
  getTurno(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Asigna un nuevo turno
   */
  asignarTurno(turno: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/asignar`, turno).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza el estado de un turno
   */
  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Cancela un turno
   */
  cancelarTurno(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cancelar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Completa un turno
   */
  completarTurno(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/completar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un turno
   */
  eliminarTurno(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene turnos por fecha
   */
  getTurnosPorFecha(fecha: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fecha/${fecha}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene turnos por paciente
   */
  getTurnosPorPaciente(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene turnos por consultorio
   */
  getTurnosPorConsultorio(consultorioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consultorio/${consultorioId}`).pipe(
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
      errorMessage = 'Turno no encontrado.';
    } else if (error.status === 409) {
      errorMessage = 'Conflicto: El turno ya existe o hay un problema con la asignación.';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
    } else {
      errorMessage = `Error del servidor: ${error.message}`;
    }

    console.error('Error en TurnoService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
