import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Medico } from './medico.service';

export interface Consulta {
  idConsulta?: number;
  historiaClinica: { idHistoriaClinica: number };
  medico: { idMedico: number };
  fechaConsulta?: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  peso?: number;
  altura?: number;
  imc?: number;
}

export interface HistorialConsulta {
  idConsulta: number;
  fechaConsulta: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  peso: number;
  altura: number;
  imc: number;
  medico: Medico;
  historiaClinica: {
    idHistoriaClinica: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  registrarConsulta(idHistoriaClinica: number, consulta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultas/historia/${idHistoriaClinica}`, consulta).pipe(
      catchError(this.handleError)
    );
  }

  obtenerHistoriaPorPacienteId(idPaciente: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historias/paciente/${idPaciente}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- NUEVO MÉTODO ---
  /**
   * Obtiene el historial de consultas de un paciente
   * @param idHistoriaClinica ID de la historia clínica
   */
  getConsultasPorHistoria(idHistoriaClinica: number): Observable<HistorialConsulta[]> {
    return this.http.get<HistorialConsulta[]>(`${this.apiUrl}/consultas/historial/${idHistoriaClinica}`).pipe(
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
      errorMessage = 'No se encontró el recurso solicitado.';
    }
    return throwError(() => new Error(errorMessage));
  }
}