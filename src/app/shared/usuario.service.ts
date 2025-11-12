import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Rol } from './rol.model';
import { Medico } from './medico.service'; 

export interface UsuarioResponse {
  idUsuario: number;
  nombreUsuario: string;
  nombres: string;
  apellidos: string;
  estado: string;
  rolNombre: string;
  idRol: number;
  medicoAsociado: string;
  idMedicoAsociado: number | null;
}

export interface UsuarioRequest {
  nombreUsuario: string;
  clave?: string | null; 
  nombres: string;
  apellidos: string;
  estado: string;
  idRol: number;
  idMedico: number | null; 
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'https://backend-oficial-clinica-production.up.railway.app/api/admin/usuarios';

  constructor(private http: HttpClient) { }

  listarUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  listarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`).pipe(
      catchError(this.handleError)
    );
  }

  crearUsuario(usuario: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.apiUrl, usuario).pipe(
      catchError(this.handleError)
    );
  }

  actualizarUsuario(id: number, usuario: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}`, usuario).pipe(
      catchError(this.handleError)
    );
  }

  inactivarUsuario(id: number): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}/inactivar`, {}).pipe(
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