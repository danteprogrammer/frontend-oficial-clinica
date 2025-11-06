import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private apiUrl = 'http://localhost:8080/api/facturacion';
  constructor(private http: HttpClient) { }
  getCitasPendientesPorDni(dni: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/citas-pendientes/${dni}`).pipe(
      catchError(this.handleError)
    );
  }

  registrarPago(idCita: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/registrar-pago/${idCita}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 404) {
        errorMessage = error.error || 'No se encontraron citas pendientes para el DNI proporcionado.';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos para realizar esta acción.';
      } else {
        errorMessage = `Error del servidor: ${error.status}, ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
