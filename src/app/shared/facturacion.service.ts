import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CitaParaFacturacionDto {
  idCita: number;
  idPaciente: number;
  nombresPaciente: string;
  apellidosPaciente: string;
  dniPaciente: string;
  especialidad: string;
  medico: string;
  consultorioNumero: string;
  consultorioDescripcion: string;
  fecha: string; 
  hora: string; 
  tieneSeguro: boolean;
  precioConsulta: number;
  estadoPago: string; 
  pacienteDireccion: string;
  pacienteTelefono: string;
  metodoPago: string;
  tipoComprobante: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private apiUrl = 'http://localhost:8080/api/facturacion';

  constructor(private http: HttpClient) { }

  getCitasPendientesPorDni(dni: string): Observable<CitaParaFacturacionDto[]> {
    return this.http.get<CitaParaFacturacionDto[]>(`${this.apiUrl}/citas-pendientes/${dni}`).pipe(
      catchError(this.handleError)
    );
  }

  registrarPago(idCita: number, metodoPago: string, tipoComprobante: string): Observable<any> {
    const payload = {
      metodoPago: metodoPago,
      tipoComprobante: tipoComprobante
    };
    return this.http.put(`${this.apiUrl}/registrar-pago/${idCita}`, payload).pipe(
      catchError(this.handleError)
    );
  }

  getHistorialPagos(): Observable<CitaParaFacturacionDto[]> {
    return this.http.get<CitaParaFacturacionDto[]>(`${this.apiUrl}/citas-pagadas`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 404) {
        errorMessage = (typeof error.error === 'string' && error.error.length < 100) ? error.error : 'No se encontraron citas pendientes para el DNI proporcionado.';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos para realizar esta acción.';
      } else {
        errorMessage = `Error del servidor: ${error.status}, ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}