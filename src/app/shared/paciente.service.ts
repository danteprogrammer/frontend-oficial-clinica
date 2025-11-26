import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { PaginaPacientes } from '../pacientes/paciente'; 

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
private apiUrl = 'https://backend-clinica-saludvida.onrender.com/api/pacientes';

  constructor(private http: HttpClient) {}

  getPacientes(): Observable<any> { 
    return this.http.get<any>(this.apiUrl).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  buscarPacientesActivos(termino: string, filtro: string, page: number, size: number): Observable<PaginaPacientes> {
    const params = new HttpParams()
      .set('termino', termino)
      .set('filtro', filtro)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginaPacientes>(`${this.apiUrl}/activos`, { params }).pipe(
      catchError(this.handleError)
    );
  }


  getPaciente(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }


  crearPaciente(paciente: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, paciente).pipe(
      catchError(this.handleError)
    );
  }


  actualizarPaciente(id: number, paciente: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, paciente).pipe(
      catchError(this.handleError)
    );
  }


  eliminarPaciente(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }


  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';

    if (error.status === 403) {
      errorMessage = 'Error de autorización. Verifica que estés logueado correctamente.';
    } else if (error.status === 404) {
      errorMessage = 'Paciente no encontrado.';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
    } else {
      errorMessage = `Error del servidor: ${error.message}`;
    }

    console.error('Error en PacienteService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
