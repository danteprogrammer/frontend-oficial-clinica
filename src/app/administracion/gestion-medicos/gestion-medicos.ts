import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicoService } from '../../shared/medico.service';
import { Medico } from '../../shared/medico.service'; // Asegúrate de tener la interfaz Medico

declare var Swal: any;

@Component({
  selector: 'app-gestion-medicos',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-medicos.html',
  styleUrl: './gestion-medicos.css',
})
export class GestionMedicos implements OnInit {
  medicos: Medico[] = [];
  cargando = true;
  error: string | null = null;
  medicoForm: FormGroup;
  modoEdicion = false;
  idMedicoEditar: number | null = null;

  constructor(
    private medicoService: MedicoService,
    private fb: FormBuilder
  ) {
    this.medicoForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      sexo: ['Masculino', Validators.required],
      especialidad: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]],
      licenciaMedica: ['', Validators.required],
      estado: ['Activo', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarMedicos();
  }

  cargarMedicos(): void {
    this.cargando = true;
    this.medicoService.getMedicos().subscribe({
      next: (data) => {
        this.medicos = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los médicos. ' + err.message;
        this.cargando = false;
      }
    });
  }

  onSubmit(): void {
    if (this.medicoForm.invalid) {
      this.medicoForm.markAllAsTouched(); // Marcar todos los campos para mostrar errores
      return;
    }

    this.cargando = true;
    const medicoData = this.medicoForm.value;

    if (this.modoEdicion && this.idMedicoEditar) {
      // --- MODO ACTUALIZAR ---
      this.medicoService.actualizarMedico(this.idMedicoEditar, medicoData).subscribe({
        next: (response) => {
          Swal.fire('¡Actualizado!', response.message, 'success');
          this.resetFormulario();
        },
        error: (err) => {
          Swal.fire('Error', err.message, 'error');
          this.cargando = false;
        }
      });
    } else {
      // --- MODO CREAR ---
      this.medicoService.crearMedico(medicoData).subscribe({
        next: (response) => {
          Swal.fire('¡Creado!', response.message, 'success');
          this.resetFormulario();
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || err.message, 'error');
          this.cargando = false;
        }
      });
    }
  }

  cargarMedicoParaEditar(medico: Medico): void {
    this.modoEdicion = true;
    this.idMedicoEditar = medico.idMedico!;
    this.medicoForm.patchValue({
      dni: medico.dni,
      nombres: medico.nombres,
      apellidos: medico.apellidos,
      sexo: medico.sexo,
      especialidad: medico.especialidad,
      telefono: medico.telefono,
      email: medico.email,
      licenciaMedica: medico.licenciaMedica,
      estado: medico.estado
    });
    window.scrollTo(0, 0); // Subir al formulario
  }

  eliminarMedico(id: number): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: "No podrá revertir esta acción.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.medicoService.eliminarMedico(id).subscribe({
          next: (response) => {
            Swal.fire('¡Eliminado!', response.message, 'success');
            this.cargarMedicos();
          },
          error: (err) => {
            Swal.fire('Error', err.message, 'error');
            this.cargando = false;
          }
        });
      }
    });
  }

  resetFormulario(): void {
    this.medicoForm.reset({
      sexo: 'Masculino',
      estado: 'Activo'
    });
    this.modoEdicion = false;
    this.idMedicoEditar = null;
    this.cargando = false;
    this.cargarMedicos();
  }

  // --- Funciones de ayuda para mostrar errores de validación ---
  get f() { return this.medicoForm.controls; }

  esCampoInvalido(campo: string): boolean {
    const control = this.f[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  getMensajeError(campo: string): string {
    const control = this.f[campo];
    if (control.errors?.['required']) {
      return 'Este campo es obligatorio.';
    }
    if (control.errors?.['minlength']) {
      return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    }
    if (control.errors?.['pattern']) {
      if (campo === 'dni') return 'Debe ser un DNI de 8 dígitos.';
      if (campo === 'telefono') return 'Debe ser un teléfono de 9 dígitos.';
    }
    if (control.errors?.['email']) {
      return 'Debe ser un email válido.';
    }
    return 'Campo inválido.';
  }
}
