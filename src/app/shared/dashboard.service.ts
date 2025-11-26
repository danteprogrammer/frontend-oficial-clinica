import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse , HttpParams } from '@angular/common/http';
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
  private apiUrl = 'https://backend-clinica-saludvida.onrender.com/api/dashboard';

  constructor(private http: HttpClient) { }

  getStats(fecha?: string): Observable<DashboardStats> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, { params }).pipe(
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
