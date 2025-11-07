import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface DashboardStats {
  ingresosHoy: number;
  pacientesAtendidosHoy: number;
  consultasPorEspecialidadHoy: { especialidad: string; cantidad: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) { }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error al cargar los datos del dashboard.';
    if (error.status === 403) {
      errorMessage = 'No tiene permisos para ver el dashboard.';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor.';
    }
    return throwError(() => new Error(errorMessage));
  }
}
