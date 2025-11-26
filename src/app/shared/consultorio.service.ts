import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Especialidad } from './especialidad.model';
import { Auth } from '../auth/auth';

export interface Consultorio {
  idConsultorio: number;
  numero: string;
  piso: number;
  descripcion: string;
  especialidad: Especialidad;
  estado: 'Disponible' | 'Ocupado' | 'Mantenimiento';
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultorioService {
  private apiUrl = 'https://backend-clinica-saludvida.onrender.com/api/consultorios';

  constructor(private http: HttpClient, private authService: Auth) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken(); 
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getConsultorios(): Observable<Consultorio[]> {
    return this.http.get<Consultorio[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  getConsultorio(id: number): Observable<Consultorio> {
    return this.http.get<Consultorio>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getConsultoriosDisponibles(): Observable<Consultorio[]> {
    return this.http.get<Consultorio[]>(`${this.apiUrl}/disponibles`, { headers: this.getHeaders() }).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  actualizarEstado(id: number, estado: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}/estado`, { estado }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  crearConsultorio(consultorio: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, consultorio, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  actualizarConsultorio(id: number, consultorio: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, consultorio, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  eliminarConsultorio(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';

    if (error.status === 403) {
      errorMessage = 'Error de autorización. Verifica que estés logueado correctamente.';
    } else if (error.status === 404) {
      errorMessage = 'No se encontró el recurso solicitado.';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error del servidor: ${error.message}`;
      }
    }

    console.error('Error en ConsultorioService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
