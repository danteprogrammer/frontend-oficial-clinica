import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Paciente {
  idPaciente?: number;
  dni: string;
  nombres: string;
  apellidos: string;
  sexo: 'Masculino' | 'Femenino'; 
  fechaNacimiento: string;
  direccion: string;
  telefono: string;
  email: string;
  estado?: 'Activo' | 'Inactivo'; 
  historiaClinica?: { 
        idHistoriaClinica: number;
    };
}

export interface PaginaPacientes {
  content: Paciente[];
  totalPages: number;
  totalElements: number;
  number: number; 
}

@Injectable({
  providedIn: 'root'
})
export class Paciente {
  private apiUrl = 'http://localhost:8080/api/pacientes';

  constructor(private http: HttpClient) { }

  registrarPaciente(paciente: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, paciente);
  }

  buscarPacientesActivos(termino: string, filtro: string, page: number, size: number): Observable<PaginaPacientes> {
    const params = new HttpParams()
      .set('termino', termino)
      .set('filtro', filtro)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginaPacientes>(`${this.apiUrl}/activos`, { params });
  }

  buscarPacientesInactivos(page: number, size: number): Observable<PaginaPacientes> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginaPacientes>(`${this.apiUrl}/inactivos`, { params });
  }

  inactivarPaciente(id: number): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.apiUrl}/${id}/inactivar`, {});
  }

  activarPaciente(id: number): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.apiUrl}/${id}/activar`, {});
  }

  obtenerPacientePorId(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.apiUrl}/${id}`);
  }

  modificarPaciente(id: number, datos: any): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.apiUrl}/${id}`, datos);
  }
}
