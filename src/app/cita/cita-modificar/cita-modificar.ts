import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicoService } from '../../shared/medico.service';
import { CitaService } from '../../shared/cita.service';

declare var Swal: any;

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
  cargando: boolean = true;
  citaOriginal: any = null;

  medicos: any[] = [];
  horarioMedico: any = null;
  diasDisponibles: string[] = [];
  horasDisponibles: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private medicoService: MedicoService,
    private citaService: CitaService
  ) { }

  ngOnInit(): void {
    this.modificarForm = this.fb.group({
      pacienteInfo: [{ value: '', disabled: true }],
      medicoId: ['', [Validators.required]],
      fecha: ['', [Validators.required]],
      hora: ['', [Validators.required]],
      estado: ['', [Validators.required]]
    });

    this.cargarDatosCita();
  }

  private cargarDatosCita(): void {
    const citaId = this.route.snapshot.params['id'];
    this.citaService.getCita(citaId).subscribe({
      next: (cita) => {
        this.citaOriginal = cita;
        this.modificarForm.patchValue({
          pacienteInfo: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
          medicoId: cita.medico.idMedico,
          fecha: cita.fecha,
          hora: cita.hora,
          estado: cita.estado
        });

        this.cargarMedicosPorEspecialidad(cita.medico.especialidad);
        this.cargarHorarioMedico(cita.medico.idMedico);

        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = 'No se pudo cargar la información de la cita.';
        this.cargando = false;
      }
    });
  }

  private cargarMedicosPorEspecialidad(especialidad: string): void {
    this.medicoService.getMedicosPorEspecialidad(especialidad).subscribe({
      next: (data) => this.medicos = data,
      error: (err) => this.mensajeError = "No se pudieron cargar los médicos."
    });
  }

  private cargarHorarioMedico(medicoId: number): void {
    this.medicoService.getHorarioMedico(medicoId).subscribe({
      next: (data) => {
        this.horarioMedico = data;
        this.diasDisponibles = Object.keys(data).sort();
        this.onFechaChange(); 
      },
      error: (err) => this.mensajeError = "No se pudo cargar el horario del médico."
    });
  }

  onMedicoChange(): void {
    const medicoId = this.modificarForm.get('medicoId')?.value;
    this.horarioMedico = null;
    this.diasDisponibles = [];
    this.horasDisponibles = [];
    this.modificarForm.patchValue({ fecha: '', hora: '' });
    if (medicoId) {
      this.cargarHorarioMedico(medicoId);
    }
  }

  onFechaChange(): void {
    const fecha = this.modificarForm.get('fecha')?.value;
    this.horasDisponibles = [];
    if (this.modificarForm.get('hora')?.value !== this.citaOriginal.hora || fecha !== this.citaOriginal.fecha) {
      this.modificarForm.patchValue({ hora: '' });
    }
    if (fecha && this.horarioMedico) {
      this.horasDisponibles = this.horarioMedico[fecha] || [];
    }
  }

  onSubmit(): void {
    if (this.modificarForm.invalid) {
      this.mensajeError = 'Por favor, complete todos los campos.';
      return;
    }

    this.cargando = true;
    const formData = this.modificarForm.value;

    const datosActualizados = {
      ...this.citaOriginal,
      medico: { idMedico: formData.medicoId },
      fecha: formData.fecha,
      hora: formData.hora,
      estado: formData.estado
    };

    this.citaService.actualizarCita(this.citaOriginal.idCita, datosActualizados).subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire('¡Cita Actualizada!', 'Los cambios en la cita se guardaron correctamente.', 'success');
        this.router.navigate(['/cita/lista']);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.message || 'Ocurrió un error al actualizar la cita.';
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/cita/lista']);
  }
}
