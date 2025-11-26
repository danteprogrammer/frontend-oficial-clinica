import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Medico } from './medico.service'; 

export interface Horario {
  idHorario: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

export interface HorarioRequest {
  idMedico: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = 'https://backend-clinica-saludvida.onrender.com/api/admin/horarios';

  constructor(private http: HttpClient) { }

  getHorarios(idMedico: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}/${idMedico}`).pipe(
      catchError(this.handleError)
    );
  }

  crearHorario(horario: HorarioRequest): Observable<Horario> {
    return this.http.post<Horario>(this.apiUrl, horario).pipe(
      catchError(this.handleError)
    );
  }

  eliminarHorario(idHorario: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idHorario}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 403) {
      errorMessage = 'No tiene permisos para esta acción.';
    }
    return throwError(() => new Error(errorMessage));
  }
}