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

  /**
   * Obtiene las citas pendientes de pago para un paciente por su DNI
   */
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

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend retornó un código de error
      if (error.status === 404) {
        errorMessage = 'No se encontraron citas pendientes para el DNI proporcionado.';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos para realizar esta acción.';
      } else {
        errorMessage = `Error del servidor: ${error.status}, ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
