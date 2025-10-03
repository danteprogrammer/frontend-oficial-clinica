import { Component, Injectable, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { Paciente, PaginaPacientes, Paciente as PacienteService } from '../../pacientes/paciente';

declare var Swal: any;

@Injectable({ providedIn: 'root' })
export class SeguroService {
  private apiUrl = 'http://localhost:8080/api/seguros';

  constructor(private http: HttpClient) { }

  validarSeguro(idPaciente: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/validar/paciente/${idPaciente}`);
  }
}

@Component({
  selector: 'app-validar-seguro',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './validar-seguro.html',
  styleUrl: './validar-seguro.css'
})
export class ValidarSeguro implements OnInit {
  cargando = false;
  pacienteBusquedaControl = new FormControl();
  pacientesEncontrados: Paciente[] = [];
  pacienteSeleccionado: Paciente | null = null;

  constructor(
    private seguroService: SeguroService,
    private pacienteService: PacienteService
  ) { }

  ngOnInit(): void {
    this.pacienteBusquedaControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        if (value && value.length > 2) {
          return this.pacienteService.buscarPacientesActivos(value, 'nombre', 0, 5);
        }
        this.pacientesEncontrados = [];
        // **CORRECCIÓN 1: Devolver un objeto PaginaPacientes completo y vacío**
        return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
      }),
      catchError(err => {
        console.error('Error buscando pacientes', err);
        // **CORRECCIÓN 2: Devolver un objeto PaginaPacientes completo y vacío también en caso de error**
        return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
      })
    ).subscribe((pagina: PaginaPacientes) => {
      this.pacientesEncontrados = pagina.content;
    });
  }

  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado = paciente;
    this.pacientesEncontrados = [];
    this.pacienteBusquedaControl.setValue(`${paciente.nombres} ${paciente.apellidos}`, { emitEvent: false });
  }

  validarSeguro(): void {
    if (!this.pacienteSeleccionado) return;

    this.cargando = true;
    this.seguroService.validarSeguro(this.pacienteSeleccionado.idPaciente!).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.estado === 'Válido') {
          Swal.fire({
            title: 'Seguro Válido',
            html: `
              <p style="text-align: left; margin-left: 20px;">${response.mensaje}</p>
              <hr>
              <p style="text-align: left; margin-left: 20px;">
                <strong>Aseguradora:</strong> ${response.datosSeguro.nombreAseguradora}<br>
                <strong>Póliza:</strong> ${response.datosSeguro.numeroPoliza}<br>
                <strong>Cobertura:</strong> ${response.datosSeguro.cobertura}
              </p>
            `,
            icon: 'success'
          });
        } else {
          Swal.fire({
            title: `Seguro ${response.estado}`,
            text: response.mensaje,
            icon: 'warning'
          });
        }
      },
      error: (err) => {
        this.cargando = false;
        Swal.fire('Error de Comunicación', err.error?.message || 'No se pudo conectar con el servicio de validación.', 'error');
      }
    });
  }
}
