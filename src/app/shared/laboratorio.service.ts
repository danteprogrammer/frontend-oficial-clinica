import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface OrdenLaboratorioResponseDto {
  idOrden: number;
  pacienteNombreCompleto: string;
  pacienteDni: string;
  medicoNombreCompleto: string;
  fechaOrden: string;
  estado: string; 
  examenesSolicitados: string;
  resultados: string | null;
  fechaResultados: string | null; 
  idHistoriaClinica: number;
}

@Injectable({
  providedIn: 'root'
})
export class LaboratorioService {
  private apiUrl = 'http://localhost:8080/api/laboratorio';

  constructor(private http: HttpClient) { }

  crearOrden(orden: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ordenar`, orden).pipe(
      catchError(this.handleError)
    );
  }

  getOrdenesPorHistoria(idHistoria: number): Observable<OrdenLaboratorioResponseDto[]> {
    return this.http.get<OrdenLaboratorioResponseDto[]>(`${this.apiUrl}/historia/${idHistoria}`).pipe(
      catchError(this.handleError)
    );
  }


  getOrdenesPendientes(): Observable<OrdenLaboratorioResponseDto[]> {
    return this.http.get<OrdenLaboratorioResponseDto[]>(`${this.apiUrl}/pendientes`).pipe(
      catchError(this.handleError)
    );
  }

  actualizarEstado(idOrden: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${idOrden}/estado`, { estado }).pipe(
      catchError(this.handleError)
    );
  }

  registrarResultados(idOrden: number, resultados: string): Observable<any> {
    const payload = { resultados: resultados };
    return this.http.put<any>(`${this.apiUrl}/${idOrden}/resultados`, payload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido en el módulo de laboratorio.';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 403) {
      errorMessage = 'No tiene permisos para esta acción.';
    } else if (error.status === 404) {
      errorMessage = 'No se encontró el recurso solicitado.';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor. Verifica el backend.';
    }
    return throwError(() => new Error(errorMessage));
  }
}