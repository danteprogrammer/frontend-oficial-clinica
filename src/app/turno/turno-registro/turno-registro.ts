import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PacienteService } from '../../shared/paciente.service';
import { MedicoService } from '../../shared/medico.service';
import { CitaService } from '../../shared/cita.service';
import { ConsultorioService } from '../../shared/consultorio.service';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

declare var Swal: any;

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

  // Nuevas propiedades para el flujo dinámico
  pacienteBusquedaControl = new FormControl();
  pacientesEncontrados: any[] = [];
  pacienteSeleccionado: any = null;

  consultorios: any[] = [];
  especialidades: string[] = [];
  medicos: any[] = [];
  horarioMedico: any = null;
  diasDisponibles: string[] = [];
  horasDisponibles: string[] = [];

  constructor(
    private fb: FormBuilder,
    private pacienteService: PacienteService,
    private medicoService: MedicoService,
    private citaService: CitaService,
    private consultorioService: ConsultorioService,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.pacienteSeleccionado = navigation?.extras?.state?.['nuevoPaciente'];
  }

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      pacienteId: ['', [Validators.required]],
      tieneSeguro: [false, [Validators.required]],
      especialidad: ['', [Validators.required]],
      medicoId: ['', [Validators.required]],
      fecha: ['', [Validators.required]],
      hora: ['', [Validators.required]],
      consultorioId: ['', [Validators.required]]
    });

    if (this.pacienteSeleccionado) {
      this.registroForm.patchValue({ pacienteId: this.pacienteSeleccionado.idPaciente });
      this.pacienteBusquedaControl.setValue(`${this.pacienteSeleccionado.nombres} ${this.pacienteSeleccionado.apellidos} (DNI: ${this.pacienteSeleccionado.dni})`, { emitEvent: false });
      this.pacienteBusquedaControl.disable();
    }

    this.cargarEspecialidades();
    this.setupPacienteSearch();
    this.cargarConsultorios();
  }

  private cargarConsultorios(): void {
    this.consultorioService.getConsultoriosDisponibles().subscribe({
      next: (data) => {
        this.consultorios = data.filter(c => c.estado === 'Disponible');
      },
      error: (err) => this.mensajeError = "No se pudieron cargar los consultorios."
    });
  }
  
  private setupPacienteSearch(): void {
    this.pacienteBusquedaControl.valueChanges.pipe(
      debounceTime(400),
      switchMap(value => {
        if (value && value.length > 2) {
          this.cargando = true;
          return this.pacienteService.buscarPacientesActivos(value, 'DNI', 0, 5)
            .pipe(catchError(() => of({ content: [] })));
        }
        this.pacientesEncontrados = [];
        return of(null);
      })
    ).subscribe(response => {
      this.cargando = false;
      if (response) {
        this.pacientesEncontrados = response.content;
      }
    });
  }

  seleccionarPaciente(paciente: any): void {
    this.pacienteSeleccionado = paciente;
    this.registroForm.patchValue({ pacienteId: paciente.idPaciente });
    this.pacienteBusquedaControl.setValue(`${paciente.nombres} ${paciente.apellidos} (DNI: ${paciente.dni})`, { emitEvent: false });
    this.pacientesEncontrados = [];
  }

  private cargarEspecialidades(): void {
    this.medicoService.getEspecialidades().subscribe({
      next: (data) => this.especialidades = data,
      error: (err) => this.mensajeError = "No se pudieron cargar las especialidades."
    });
  }

  onEspecialidadChange(): void {
    const especialidad = this.registroForm.get('especialidad')?.value;
    this.medicos = [];
    this.horarioMedico = null;
    this.diasDisponibles = [];
    this.horasDisponibles = [];
    this.registroForm.patchValue({ medicoId: '', fecha: '', hora: '' });

    if (especialidad) {
      this.medicoService.getMedicosPorEspecialidad(especialidad).subscribe({
        next: (data) => this.medicos = data,
        error: (err) => this.mensajeError = "No se pudieron cargar los médicos."
      });
    }
  }

  onMedicoChange(): void {
    const medicoId = this.registroForm.get('medicoId')?.value;
    this.horarioMedico = null;
    this.diasDisponibles = [];
    this.horasDisponibles = [];
    this.registroForm.patchValue({ fecha: '', hora: '' });

    if (medicoId) {
      this.medicoService.getHorarioMedico(medicoId).subscribe({
        next: (data) => {
          this.horarioMedico = data;
          this.diasDisponibles = Object.keys(data).sort();
        },
        error: (err) => this.mensajeError = "No se pudo cargar el horario del médico."
      });
    }
  }

  onFechaChange(): void {
    const fecha = this.registroForm.get('fecha')?.value;
    this.horasDisponibles = [];
    this.registroForm.patchValue({ hora: '' });

    if (fecha && this.horarioMedico) {
      this.horasDisponibles = this.horarioMedico[fecha] || [];
    }
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    this.cargando = true;
    const formData = this.registroForm.value;

    const datosParaBackend = {
      paciente: { idPaciente: formData.pacienteId },
      medico: { idMedico: formData.medicoId },
      // El consultorio ahora se podría asignar en el backend o dejarlo para un paso posterior (triaje)
      // Por ahora lo omitimos para simplificar el formulario como se pidió.
      // consultorio: { idConsultorio: 1 }, // ID de consultorio de ejemplo
      consultorio: { idConsultorio: formData.consultorioId },
      tieneSeguro: formData.tieneSeguro,
      fecha: formData.fecha,
      hora: formData.hora,
      motivo: 'Consulta en ' + formData.especialidad, // Motivo autogenerado
      estado: 'Pendiente'
    };

    this.citaService.registrarCita(datosParaBackend).subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire('¡Cita Registrada!', 'La cita se ha programado correctamente. El paciente debe dirigirse a caja.', 'success');
        this.limpiarFormulario();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.message || 'Ocurrió un error al registrar la cita.';
      }
    });
  }

  limpiarFormulario(): void {
    this.registroForm.reset({
      tieneSeguro: false
    });
    this.pacienteSeleccionado = null;
    this.pacienteBusquedaControl.enable();
    this.pacienteBusquedaControl.reset();
    this.medicos = [];
    this.horarioMedico = null;
    this.diasDisponibles = [];
    this.horasDisponibles = [];
  }
}
