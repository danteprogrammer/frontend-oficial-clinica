import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Especialidad } from './especialidad.model';

export interface Consultorio {
  idConsultorio: number;
  numero: string;
  piso: number;
  descripcion: string;
  especialidad: Especialidad;
  estado: 'Disponible' | 'Ocupado' | 'Mantenimiento';
}

@Injectable({
  providedIn: 'root'
})
export class ConsultorioService {
  private apiUrl = 'http://localhost:8080/api/consultorios';

  constructor(private http: HttpClient) { }

  getConsultorios(): Observable<Consultorio[]> { 
    return this.http.get<Consultorio[]>(this.apiUrl).pipe( 
      retry(2),
      catchError(this.handleError)
    );
  }

  getConsultorio(id: number): Observable<Consultorio> { 
    return this.http.get<Consultorio>(`${this.apiUrl}/${id}`).pipe( 
      catchError(this.handleError)
    );
  }

  getConsultoriosDisponibles(): Observable<Consultorio[]> { 
    return this.http.get<Consultorio[]>(this.apiUrl).pipe( 
      retry(2),
      catchError(this.handleError)
    );
  }

  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      catchError(this.handleError)
    );
  }

  crearConsultorio(consultorio: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, consultorio).pipe(
      catchError(this.handleError)
    );
  }

  actualizarConsultorio(id: number, consultorio: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, consultorio).pipe(
      catchError(this.handleError)
    );
  }

  eliminarConsultorio(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

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
