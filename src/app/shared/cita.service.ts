import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = 'http://localhost:8080/api/citas';

  constructor(private http: HttpClient) { }

  /**
 * Obtiene todas las citas (público, sin token)
 */
  getCitasPublicas(): Observable<any[]> {
    // No incluimos headers ni token
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }


  /**
   * Obtiene todas las citas
   */
  getCitas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene una cita por ID
   */
  getCita(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Registra una nueva cita
   */
  registrarCita(cita: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cita).pipe(
      catchError(this.handleError)
    );
  }


  /**
   * Actualiza el estado de una cita
   */
  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado?estado=${ estado }`,{});
  }

  /**
   * Cancela una cita
   */
  cancelarCita(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cancelar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Completa una cita
   */
  completarCita(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/completar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una cita
   */
  eliminarCita(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene citas por fecha
   */
  getCitasPorFecha(fecha: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fecha/${fecha}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene citas por paciente
   */
  getCitasPorPaciente(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene citas por consultorio
   */
  getCitasPorConsultorio(consultorioId: number): Observable<any[]> {
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
