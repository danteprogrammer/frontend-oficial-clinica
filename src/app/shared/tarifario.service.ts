import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Tarifario {
  id?: number;
  especialidad: string;
  precio: number;
}

@Injectable({
  providedIn: 'root'
})
export class TarifarioService {
  private apiUrl = 'http://localhost:8080/api/tarifario';

  constructor(private http: HttpClient) { }

  getTarifarios(): Observable<Tarifario[]> {
    return this.http.get<Tarifario[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  crearTarifario(tarifario: Tarifario): Observable<Tarifario> {
    return this.http.post<Tarifario>(this.apiUrl, tarifario).pipe(
      catchError(this.handleError)
    );
  }

  actualizarTarifario(id: number, tarifario: Tarifario): Observable<Tarifario> {
    return this.http.put<Tarifario>(`${this.apiUrl}/${id}`, tarifario).pipe(
      catchError(this.handleError)
    );
  }

  eliminarTarifario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
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
    }
    return throwError(() => new Error(errorMessage));
  }
}