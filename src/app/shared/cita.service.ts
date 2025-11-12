import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = 'https://backend-oficial-clinica-production.up.railway.app/api/citas';

  constructor(private http: HttpClient) { }

  getCitasPublicas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  getCitas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  getCita(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }


  registrarCita(cita: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cita).pipe(
      catchError(this.handleError)
    );
  }

  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado?estado=${estado}`, {});
  }

  cancelarCita(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cancelar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  completarCita(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/completar`, {}).pipe(
      catchError(this.handleError)
    );
  }


  eliminarCita(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getCitasPorFecha(fecha: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fecha/${fecha}`).pipe(
      catchError(this.handleError)
    );
  }

  getCitasPorPaciente(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}`).pipe(
      catchError(this.handleError)
    );
  }

  getCitasPorConsultorio(consultorioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consultorio/${consultorioId}`).pipe(
      catchError(this.handleError)
    );
  }

  actualizarCita(id: number, cita: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, cita).pipe(
      catchError(this.handleError)
    );
  }

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
