import { Component, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { Paciente, PaginaPacientes } from '../../pacientes/paciente';

declare var Swal: any;

@Injectable({ providedIn: 'root' })
export class ConsultaService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  registrarConsulta(idHistoriaClinica: number, consulta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultas/historia/${idHistoriaClinica}`, consulta);
  }

  obtenerHistoriaPorPacienteId(idPaciente: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historias/paciente/${idPaciente}`);
  }
}

@Component({
  selector: 'app-registrar-consulta',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registrar-consulta.html',
  styleUrl: './registrar-consulta.css'
})
export class RegistrarConsulta implements OnInit {
  consultaForm!: FormGroup;
  cargando = false;
  
  pacienteBusquedaControl = new FormControl();
  pacientesEncontrados: Paciente[] = [];
  pacienteSeleccionado: Paciente | null = null;
  idHistoriaClinicaSeleccionada: number | null = null;


  constructor(
    private fb: FormBuilder,
    private consultaService: ConsultaService,
    private pacienteService: Paciente 
  ) { }

  ngOnInit(): void {
    this.consultaForm = this.fb.group({
      motivo: ['', Validators.required],
      diagnostico: ['', Validators.required],
      tratamiento: [''],
      peso: [null, [Validators.min(1)]],
      altura: [null, [Validators.min(1)]],
      presionArterial: [''],
      ritmoCardiaco: [null, [Validators.min(1)]],
      medico: [{ idMedico: 3 }] 
    });

    this.pacienteBusquedaControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        if (value && value.length > 2) {
          return this.pacienteService.buscarPacientesActivos(value, 'nombre', 0, 5);
        } else {
          this.pacientesEncontrados = [];
          return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
        }
      }),
      catchError(err => {
        console.error('Error buscando pacientes', err);
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

    this.consultaService.obtenerHistoriaPorPacienteId(paciente.idPaciente!).subscribe({
      next: (historia) => {
        this.idHistoriaClinicaSeleccionada = historia.idHistoriaClinica;
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo obtener la historia clínica del paciente.', 'error');
      }
    });
  }

  onSubmit(): void {
    if (this.consultaForm.invalid || !this.idHistoriaClinicaSeleccionada) {
      Swal.fire('Datos Incompletos', 'Debe seleccionar un paciente y completar el motivo y diagnóstico.', 'error');
      return;
    }

    this.cargando = true;
    this.consultaService.registrarConsulta(this.idHistoriaClinicaSeleccionada, this.consultaForm.value).subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire('¡Éxito!', 'La consulta ha sido registrada.', 'success');
        this.limpiarFormulario();
      },
      error: (err) => {
        this.cargando = false;
        Swal.fire('Error', err.error?.message || 'No se pudo registrar la consulta.', 'error');
      }
    });
  }

  limpiarFormulario(): void {
    this.consultaForm.reset();
    this.pacienteSeleccionado = null;
    this.idHistoriaClinicaSeleccionada = null;
    this.pacienteBusquedaControl.reset();
    this.consultaForm.patchValue({ medico: { idMedico: 3 } });
  }
}
