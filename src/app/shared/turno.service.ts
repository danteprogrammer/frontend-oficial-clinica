import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private apiUrl = 'https://backend-oficial-clinica-production.up.railway.app/api/turnos';

  constructor(private http: HttpClient) {}

  getTurnos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2), 
      catchError(this.handleError)
    );
  }

  getTurno(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  asignarTurno(turno: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/asignar`, turno).pipe(
      catchError(this.handleError)
    );
  }

  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      catchError(this.handleError)
    );
  }

  cancelarTurno(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cancelar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  completarTurno(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/completar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  eliminarTurno(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getTurnosPorFecha(fecha: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fecha/${fecha}`).pipe(
      catchError(this.handleError)
    );
  }

  getTurnosPorPaciente(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}`).pipe(
      catchError(this.handleError)
    );
  }

  getTurnosPorConsultorio(consultorioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consultorio/${consultorioId}`).pipe(
      catchError(this.handleError)
    );
  }

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
