import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PacienteService } from '../../shared/paciente.service';
import { MedicoService } from '../../shared/medico.service';
import { ConsultorioService } from '../../shared/consultorio.service';
import { CitaService } from '../../shared/cita.service';

@Component({
  selector: 'app-cita-modificar',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cita-modificar.html',
  styleUrls: ['./cita-modificar.css']
})
export class CitaModificar implements OnInit {

  modificarForm!: FormGroup;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;
  cargando: boolean = false;

  // Datos que se cargarán desde la API
  pacientes: any[] = [];
  medicos: any[] = [];
  consultorios: any[] = [];
  citaOriginal: any = null;

  // Síntomas disponibles
  sintomasDisponibles = [
    { id: 'fiebre', label: 'Fiebre' },
    { id: 'dolor_pecho', label: 'Dolor de pecho' },
    { id: 'tos_persistente', label: 'Tos persistente' },
    { id: 'erupciones', label: 'Erupciones en la piel' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private pacienteService: PacienteService,
    private medicoService: MedicoService,
    private consultorioService: ConsultorioService,
    private citaService: CitaService
  ) { }

  ngOnInit(): void {
    this.modificarForm = this.fb.group({
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
      consultorioId: ['', [Validators.required]],
      estado: ['Pendiente', [Validators.required]]
    });

    this.cargarDatosIniciales();
    this.cargarCita();
  }

  private cargarDatosIniciales(): void {
    this.cargando = true;
    this.cargarPacientes();
    this.cargarMedicos();
    this.cargarConsultorios();
  }

  private cargarCita(): void {
    const citaId = this.route.snapshot.params['id'];
    if (citaId) {
      this.citaService.getCita(citaId).subscribe({
        next: (cita: any) => {
          this.citaOriginal = cita;
          this.cargarFormulario(cita);
        },
        error: (error: any) => {
          console.error('Error al cargar cita:', error);
          this.mensajeError = 'No se pudo cargar la cita para modificar';
          this.cargando = false;
        }
      });
    }
  }

  private cargarFormulario(cita: any): void {
    // Parsear síntomas si vienen como string
    let sintomasSeleccionados = {
      fiebre: false,
      dolor_pecho: false,
      tos_persistente: false,
      erupciones: false
    };

    if (cita.sintomas) {
      try {
        const sintomasArray = JSON.parse(cita.sintomas);
        sintomasSeleccionados = {
          fiebre: sintomasArray.includes('fiebre'),
          dolor_pecho: sintomasArray.includes('dolor_pecho'),
          tos_persistente: sintomasArray.includes('tos_persistente'),
          erupciones: sintomasArray.includes('erupciones')
        };
      } catch (e) {
        console.warn('Error al parsear síntomas:', e);
      }
    }

    this.modificarForm.patchValue({
      pacienteId: cita.paciente?.idPaciente || cita.pacienteId,
      medicoId: cita.medico?.idMedico || cita.medicoId,
      tipoConsulta: cita.tipoConsulta === 'Paciente_Existente' ? 'paciente_existente' : 'paciente_nuevo',
      tieneSeguro: cita.tieneSeguro || false,
      fecha: cita.fecha,
      hora: cita.hora,
      motivo: cita.motivo,
      alergico: cita.alergico || false,
      consultorioId: cita.consultorio?.idConsultorio || cita.consultorioId,
      estado: cita.estado || 'Pendiente',
      ...sintomasSeleccionados
    });
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
    if (this.modificarForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos obligatorios correctamente.';
      return;
    }

    this.cargando = true;
    this.mensajeExito = null;
    this.mensajeError = null;

    // Preparar los datos para enviar al backend
    const formData = this.modificarForm.value;
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
      sintomas: JSON.stringify(sintomasSeleccionados),
      alergico: formData.alergico,
      estado: formData.estado
    };

    console.log('Datos enviados al backend:', datosParaBackend);

    // Usar el método de actualizar del servicio
    this.citaService.actualizarEstado(this.citaOriginal.idCita, formData.estado)
      .subscribe({
        next: (response: any) => {
          this.mensajeExito = 'Cita actualizada correctamente ✅';
          this.cargando = false;

          // Navegar de vuelta a la lista después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/cita/lista']);
          }, 2000);
        },
        error: (err: any) => {
          console.error('Error al actualizar cita:', err);
          if (err.message && err.message.includes('403')) {
            this.mensajeError = 'No tienes permisos para realizar esta acción. Verifica que estés logueado.';
          } else if (err.message && err.message.includes('409')) {
            this.mensajeError = 'Conflicto: Ya existe una cita en esa fecha y hora.';
          } else if (err.message && err.message.includes('conectar al servidor')) {
            this.mensajeError = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
          } else {
            this.mensajeError = err.message || 'Hubo un problema al actualizar la cita ❌';
          }
          this.cargando = false;
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/cita/lista']);
  }
}
