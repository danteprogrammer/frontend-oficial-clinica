import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TriajeService {
  private apiUrl = 'https://backend-clinica-saludvida.onrender.com/api/triajes';

  constructor(private http: HttpClient) { }

  getTriajesPorHistoria(idHistoriaClinica: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/historia/${idHistoriaClinica}`).pipe(
      catchError(this.handleError)
    );
  }

  registrarTriaje(idHistoriaClinica: number, datosTriaje: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/historia/${idHistoriaClinica}`, datosTriaje).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 403) {
        errorMessage = 'No tiene permisos para esta acción (Triaje).';
      } else if (error.status === 404) {
        errorMessage = 'No se encontró la historia clínica o el paciente.';
      } else {
        errorMessage = `Error del servidor: ${error.status}, ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}