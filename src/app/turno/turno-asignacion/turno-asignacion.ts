import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConsultorioService } from '../../shared/consultorio.service';
import { PacienteService } from '../../shared/paciente.service';
import { TurnoService } from '../../shared/turno.service';
import { ComunicacionService } from '../../shared/comunicacion.service';

@Component({
  selector: 'app-turno-asignacion',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './turno-asignacion.html',
  styleUrls: ['./turno-asignacion.css']
})
export class TurnoAsignacion implements OnInit {

  asignacionForm!: FormGroup;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;
  cargando: boolean = false;

  // Datos que se cargarán desde la API
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
    this.mensajeError = null;

    this.consultorioService.getConsultoriosDisponibles().subscribe({
      next: (data: any[]) => {
        // Filtrar solo consultorios disponibles
        this.consultorios = (data || []).filter(c => c.estado === 'Disponible');
        console.log('Consultorios disponibles cargados desde API:', this.consultorios);
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar consultorios:', error);
        this.handleError(error, 'consultorios');
        this.cargando = false;

        // Si hay error 403, intentar con retry automático después de 2 segundos
        if (error.message && error.message.includes('403')) {
          setTimeout(() => {
            console.log('Reintentando cargar consultorios...');
            this.cargarConsultorios();
          }, 2000);
        }
      }
    });
  }

  private cargarPacientes(): void {
    this.pacienteService.getPacientes().subscribe({
      next: (response: any) => {
        // El backend devuelve una respuesta paginada
        this.pacientes = response.content || response || [];
        console.log('Pacientes cargados desde API:', this.pacientes);
      },
      error: (error: any) => {
        console.error('Error al cargar pacientes:', error);
        this.handleError(error, 'pacientes');
      }
    });
  }

  private handleError(error: any, context: string): void {
    if (error.message && error.message.includes('403')) {
      this.mensajeError = `Error de autorización al cargar ${context}. Verifica que estés logueado correctamente.`;
    } else if (error.message && error.message.includes('conectar al servidor')) {
      this.mensajeError = `No se puede conectar al servidor. Verifica que el backend esté ejecutándose.`;
    } else {
      this.mensajeError = `Error al cargar ${context}: ${error.message}`;
    }
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }



  onSubmit(): void {
    if (this.asignacionForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    this.cargando = true;
    this.mensajeExito = null;
    this.mensajeError = null;

    // Buscar el paciente por nombre
    const pacienteNombre = this.asignacionForm.value.pacienteNombre;
    const pacienteEncontrado = this.pacientes.find(p =>
      p.nombres.toLowerCase().includes(pacienteNombre.toLowerCase()) ||
      p.apellidos.toLowerCase().includes(pacienteNombre.toLowerCase()) ||
      `${p.nombres} ${p.apellidos}`.toLowerCase().includes(pacienteNombre.toLowerCase())
    );

    if (!pacienteEncontrado) {
      this.mensajeError = `No se encontró ningún paciente con el nombre: "${pacienteNombre}". Verifica que el nombre esté escrito correctamente.`;
      this.cargando = false;
      return;
    }

    // Preparar los datos para enviar al backend
    const datosParaBackend = {
      pacienteId: pacienteEncontrado.idPaciente,
      consultorioId: this.asignacionForm.value.consultorioId,
      fecha: this.asignacionForm.value.fecha,
      hora: this.asignacionForm.value.hora,
      motivo: this.asignacionForm.value.motivo,
      observaciones: this.asignacionForm.value.observaciones
    };

    console.log('Datos enviados al backend:', datosParaBackend);

    this.turnoService.asignarTurno(datosParaBackend)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.mensajeExito = 'Turno asignado correctamente ✅';
            this.asignacionForm.reset();

            // Notificar a otros componentes que se asignó un turno
            // Incluir el DNI del paciente para que TurnoLista pueda filtrar correctamente
            const notificacionCompleta = {
              ...datosParaBackend,
              dniPaciente: pacienteEncontrado.dni,
              paciente: {
                idPaciente: pacienteEncontrado.idPaciente,
                dni: pacienteEncontrado.dni,
                nombres: pacienteEncontrado.nombres,
                apellidos: pacienteEncontrado.apellidos
              }
            };
            this.comunicacionService.notificarTurnoAsignado(notificacionCompleta);
          } else {
            this.mensajeError = response.message || 'Hubo un problema al asignar el turno ❌';
          }
          this.cargando = false;
        },
        error: (err: any) => {
          console.error('Error al asignar turno:', err);
          if (err.message && err.message.includes('403')) {
            this.mensajeError = 'No tienes permisos para realizar esta acción. Verifica que estés logueado.';
          } else if (err.message && err.message.includes('409')) {
            this.mensajeError = 'Conflicto: El turno ya existe o hay un problema con la asignación.';
          } else if (err.message && err.message.includes('conectar al servidor')) {
            this.mensajeError = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
          } else {
            this.mensajeError = err.message || 'Hubo un problema al asignar el turno ❌';
          }
          this.cargando = false;
        }
      });
  }
}
