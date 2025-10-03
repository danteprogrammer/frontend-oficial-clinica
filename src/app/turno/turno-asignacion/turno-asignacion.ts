import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConsultorioService } from '../../shared/consultorio.service';
import { PacienteService } from '../../shared/paciente.service';
import { TurnoService } from '../../shared/turno.service';
import { ComunicacionService } from '../../shared/comunicacion.service';

declare var Swal: any;

@Component({
  selector: 'app-turno-asignacion',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './turno-asignacion.html',
  styleUrls: ['./turno-asignacion.css']
})
export class TurnoAsignacion implements OnInit {

  asignacionForm!: FormGroup;
  cargando: boolean = false;
  consultorios: any[] = [];
  pacientes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private consultorioService: ConsultorioService,
    private pacienteService: PacienteService,
    private turnoService: TurnoService,
    private comunicacionService: ComunicacionService
  ) {}

  ngOnInit(): void {
    this.asignacionForm = this.fb.group({
      pacienteNombre: ['', [Validators.required, Validators.minLength(2)]],
      consultorioId: ['', [Validators.required]],
      fecha: ['', [Validators.required]],
      hora: ['', [Validators.required]],
      motivo: ['', [Validators.required, Validators.minLength(3)]],
      observaciones: ['']
    });

    this.cargarConsultorios();
    this.cargarPacientes();
  }

  private cargarConsultorios(): void {
    this.cargando = true;
    this.consultorioService.getConsultoriosDisponibles().subscribe({
      next: (data: any[]) => {
        this.consultorios = (data || []).filter(c => c.estado === 'Disponible');
        this.cargando = false;
      },
      error: (error: any) => {
        Swal.fire('Error', `No se pudieron cargar los consultorios: ${error.message}`, 'error');
        this.cargando = false;
      }
    });
  }

  private cargarPacientes(): void {
    this.pacienteService.getPacientes().subscribe({
      next: (response: any) => {
        this.pacientes = response.content || response || [];
      },
      error: (error: any) => {
        Swal.fire('Error', `No se pudieron cargar los pacientes: ${error.message}`, 'error');
      }
    });
  }
  
  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.asignacionForm.invalid) {
      Swal.fire('Formulario Incompleto', 'Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    this.cargando = true;
    const pacienteNombre = this.asignacionForm.value.pacienteNombre;
    const pacienteEncontrado = this.pacientes.find(p =>
      `${p.nombres} ${p.apellidos}`.toLowerCase().includes(pacienteNombre.toLowerCase())
    );

    if (!pacienteEncontrado) {
      Swal.fire('Paciente no encontrado', `No se encontró ningún paciente con el nombre: "${pacienteNombre}".`, 'warning');
      this.cargando = false;
      return;
    }

    const datosParaBackend = {
      pacienteId: pacienteEncontrado.idPaciente,
      consultorioId: this.asignacionForm.value.consultorioId,
      fecha: this.asignacionForm.value.fecha,
      hora: this.asignacionForm.value.hora,
      motivo: this.asignacionForm.value.motivo,
      observaciones: this.asignacionForm.value.observaciones
    };

    this.turnoService.asignarTurno(datosParaBackend).subscribe({
      next: (response: any) => {
        if (response.success) {
          Swal.fire('¡Turno Asignado!', 'El turno ha sido asignado correctamente.', 'success');
          this.asignacionForm.reset();
          const notificacionCompleta = { ...datosParaBackend, dniPaciente: pacienteEncontrado.dni, paciente: pacienteEncontrado };
          this.comunicacionService.notificarTurnoAsignado(notificacionCompleta);
        } else {
          Swal.fire('Error', response.message || 'Hubo un problema al asignar el turno.', 'error');
        }
        this.cargando = false;
      },
      error: (err: any) => {
        Swal.fire('Error', err.message || 'Hubo un problema al asignar el turno.', 'error');
        this.cargando = false;
      }
    });
  }
}
