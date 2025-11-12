import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Especialidad } from './especialidad.model';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {
  private apiUrl = 'https://backend-oficial-clinica-production.up.railway.app/api/admin/especialidades';

  constructor(private http: HttpClient) { }

  getEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  crearEspecialidad(especialidad: { nombre: string, descripcion: string }): Observable<Especialidad> {
    return this.http.post<Especialidad>(this.apiUrl, especialidad).pipe(
      catchError(this.handleError)
    );
  }

  actualizarEspecialidad(id: number, especialidad: { nombre: string, descripcion: string }): Observable<Especialidad> {
    return this.http.put<Especialidad>(`${this.apiUrl}/${id}`, especialidad).pipe(
      catchError(this.handleError)
    );
  }

  eliminarEspecialidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 403) {
      errorMessage = 'No tiene permisos para esta acción.';
    } else if (error.status === 404) {
      errorMessage = 'No se encontró el recurso.';
    } else if (error.status === 400) {
      errorMessage = 'Solicitud incorrecta: ' + error.error?.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}