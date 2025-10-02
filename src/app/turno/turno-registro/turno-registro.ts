import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../shared/paciente.service';
import { MedicoService } from '../../shared/medico.service';
import { ConsultorioService } from '../../shared/consultorio.service';
import { CitaService } from '../../shared/cita.service';
import { ComunicacionService } from '../../shared/comunicacion.service';

@Component({
  selector: 'app-turno-registro',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './turno-registro.html',
  styleUrls: ['./turno-registro.css']
})
export class TurnoRegistro implements OnInit {

  registroForm!: FormGroup;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;
  cargando: boolean = false;

  // Datos que se cargarán desde la API
  pacientes: any[] = [];
  medicos: any[] = [];
  consultorios: any[] = [];

  // Síntomas disponibles
  sintomasDisponibles = [
    { id: 'fiebre', label: 'Fiebre' },
    { id: 'dolor_pecho', label: 'Dolor de pecho' },
    { id: 'tos_persistente', label: 'Tos persistente' },
    { id: 'erupciones', label: 'Erupciones en la piel' }
  ];

  constructor(
    private fb: FormBuilder,
    private pacienteService: PacienteService,
    private medicoService: MedicoService,
    private consultorioService: ConsultorioService,
    private citaService: CitaService,
    private comunicacionService: ComunicacionService
  ) { }

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      pacienteId: ['', [Validators.required]],
      medicoId: ['', [Validators.required]],
      tipoConsulta: ['paciente_existente', [Validators.required]],
      tieneSeguro: [false, [Validators.required]],
      fecha: ['', [Validators.required]],
      hora: ['', [Validators.required]],
      motivo: ['', [Validators.required, Validators.minLength(10)]],
      fiebre: [false],
      dolor_pecho: [false],
      tos_persistente: [false],
      erupciones: [false],
      alergico: [false, [Validators.required]],
      consultorioId: ['', [Validators.required]]
    });

    this.cargarDatosIniciales();
  }

  private cargarDatosIniciales(): void {
    this.cargando = true;
    this.cargarPacientes();
    this.cargarMedicos();
    this.cargarConsultorios();
  }

  private cargarPacientes(): void {
    this.pacienteService.getPacientes().subscribe({
      next: (response: any) => {
        this.pacientes = response.content || response || [];
        console.log('Pacientes cargados:', this.pacientes);
      },
      error: (error: any) => {
        console.error('Error al cargar pacientes:', error);
        this.handleError(error, 'pacientes');
      }
    });
  }

  private cargarMedicos(): void {
    this.medicoService.getMedicos().subscribe({
      next: (data: any[]) => {
        this.medicos = data || [];
        console.log('Médicos cargados:', this.medicos);
      },
      error: (error: any) => {
        console.error('Error al cargar médicos:', error);
        this.handleError(error, 'médicos');
      }
    });
  }

  private cargarConsultorios(): void {
    this.consultorioService.getConsultoriosDisponibles().subscribe({
      next: (data: any[]) => {
        this.consultorios = (data || []).filter(c => c.estado === 'Disponible');
        console.log('Consultorios disponibles cargados:', this.consultorios);
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar consultorios:', error);
        this.handleError(error, 'consultorios');
        this.cargando = false;
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
    if (this.registroForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos obligatorios correctamente.';
      return;
    }

    this.cargando = true;
    this.mensajeExito = null;
    this.mensajeError = null;

    // Preparar los datos para enviar al backend
    const formData = this.registroForm.value;
    const sintomasSeleccionados = Object.entries({
      fiebre: formData.fiebre,
      dolor_pecho: formData.dolor_pecho,
      tos_persistente: formData.tos_persistente,
      erupciones: formData.erupciones
    })
      .filter(([key, value]) => value)
      .map(([key, value]) => key);

    const datosParaBackend = {
      paciente: { idPaciente: formData.pacienteId },
      medico: { idMedico: formData.medicoId },
      consultorio: { idConsultorio: formData.consultorioId },
      tipoConsulta: formData.tipoConsulta === 'paciente_existente' ? 'Paciente_Existente' : 'Paciente_Nuevo',
      tieneSeguro: formData.tieneSeguro,
      fecha: formData.fecha,
      hora: formData.hora,
      motivo: formData.motivo,
      sintomas: JSON.stringify(sintomasSeleccionados), // backend espera String, no array
      alergico: formData.alergico,
      estado: 'Pendiente'
    };


    console.log('Datos enviados al backend:', datosParaBackend);

    this.citaService.registrarCita(datosParaBackend)
      .subscribe({
        next: (response: any) => {
          console.log('Respuesta del backend:', response);

          // Verificar si la respuesta indica éxito
          if (response && (response.success === true || response.success === 'true' ||
              response.status === 'success' || response.estado === 'exitoso' ||
              response.message?.includes('exitoso') || response.message?.includes('registrado'))) {

            this.mensajeExito = 'Cita registrada correctamente ✅';
            this.registroForm.reset();
            this.registroForm.patchValue({
              tipoConsulta: 'paciente_existente',
              tieneSeguro: false,
              alergico: false
            });

            // Notificar a otros componentes que se registró una nueva cita
            this.comunicacionService.notificarTurnoAsignado(datosParaBackend);
          } else if (response && response.message) {
            // Si hay un mensaje específico del backend, mostrarlo
            this.mensajeError = response.message;
          } else {
            // Si no hay indicadores claros, asumir que fue exitoso
            // ya que el usuario confirmó que se registra en la BD
            this.mensajeExito = 'Cita registrada correctamente ✅';
            this.registroForm.reset();
            this.registroForm.patchValue({
              tipoConsulta: 'paciente_existente',
              tieneSeguro: false,
              alergico: false
            });
            this.comunicacionService.notificarTurnoAsignado(datosParaBackend);
          }
          this.cargando = false;
        },
        error: (err: any) => {
          console.error('Error al registrar cita:', err);

          // Solo mostrar error si realmente hay un problema HTTP
          if (err.status === 403) {
            this.mensajeError = 'No tienes permisos para realizar esta acción. Verifica que estés logueado.';
          } else if (err.status === 409) {
            this.mensajeError = 'Conflicto: Ya existe una cita en esa fecha y hora.';
          } else if (err.status === 0 || err.status >= 500) {
            this.mensajeError = 'Error del servidor. La cita podría no haberse registrado correctamente.';
          } else {
            // Para otros errores, mostrar mensaje genérico pero no bloquear
            this.mensajeError = 'Posible error al registrar. Verifica en la base de datos si se registró correctamente.';
          }
          this.cargando = false;
        }
      });
  }

  limpiarFormulario(): void {
    this.registroForm.reset();
    this.registroForm.patchValue({
      tipoConsulta: 'paciente_existente',
      tieneSeguro: false,
      alergico: false
    });
    this.mensajeExito = null;
    this.mensajeError = null;
  }
}
