import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface Medico {
  idMedico?: number;
  dni: string;
  nombres: string;
  apellidos: string;
  sexo: 'Masculino' | 'Femenino';
  especialidad: string;
  telefono: string;
  email: string;
  licenciaMedica: string;
  estado: 'Activo' | 'Inactivo' | 'Licencia';
}

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private apiUrl = 'http://localhost:8080/api/medicos';

  constructor(private http: HttpClient) { }

  getMedicos(): Observable<Medico[]> { 
    return this.http.get<Medico[]>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  getMedico(id: number): Observable<Medico> { 
    return this.http.get<Medico>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getEspecialidades(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/especialidades`).pipe(
      catchError(this.handleError)
    );
  }

  getMedicosPorEspecialidad(especialidad: string): Observable<Medico[]> { 
    return this.http.get<Medico[]>(`${this.apiUrl}/especialidad/${especialidad}`).pipe(
      catchError(this.handleError)
    );
  }

  getHorarioMedico(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/horario`).pipe(
      catchError(this.handleError)
    );
  }

  getMedicosDisponibles(): Observable<Medico[]> { 
    return this.http.get<Medico[]>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  crearMedico(medico: Medico): Observable<any> { 
    return this.http.post<any>(this.apiUrl, medico).pipe(
      catchError(this.handleError)
    );
  }

  actualizarMedico(id: number, medico: Medico): Observable<any> { 
    return this.http.put<any>(`${this.apiUrl}/${id}`, medico).pipe(
      catchError(this.handleError)
    );
  }

  eliminarMedico(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  inactivarMedico(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/inactivar`, {}).pipe(
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