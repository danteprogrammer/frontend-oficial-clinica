import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EspecialidadService } from '../../shared/especialidad.service';
import { Especialidad } from '../../shared/especialidad.model';

declare var Swal: any;

@Component({
  selector: 'app-gestion-especialidades',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-especialidades.html',
  styleUrl: './gestion-especialidades.css'
})
export class GestionEspecialidades implements OnInit {

  especialidades: Especialidad[] = [];
  cargando = true;
  error: string | null = null;
  especialidadForm: FormGroup;
  modoEdicion = false;
  idEditar: number | null = null;

  constructor(
    private especialidadService: EspecialidadService,
    private fb: FormBuilder
  ) {
    this.especialidadForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.cargarEspecialidades();
  }

  cargarEspecialidades(): void {
    this.cargando = true;
    this.especialidadService.getEspecialidades().subscribe({
      next: (data) => {
        this.especialidades = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las especialidades. ' + err.message;
        this.cargando = false;
      }
    });
  }

  onSubmit(): void {
    if (this.especialidadForm.invalid) {
      this.especialidadForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const data = this.especialidadForm.value;

    const request = this.modoEdicion && this.idEditar
      ? this.especialidadService.actualizarEspecialidad(this.idEditar, data)
      : this.especialidadService.crearEspecialidad(data);

    request.subscribe({
      next: () => {
        Swal.fire('¡Éxito!', `Especialidad ${this.modoEdicion ? 'actualizada' : 'creada'} con éxito.`, 'success');
        this.resetFormulario();
      },
      error: (err) => {
        Swal.fire('Error', err.message, 'error');
        this.cargando = false;
      }
    });
  }

  cargarParaEditar(especialidad: Especialidad): void {
    this.modoEdicion = true;
    this.idEditar = especialidad.idEspecialidad;
    this.especialidadForm.patchValue({
      nombre: especialidad.nombre,
      descripcion: especialidad.descripcion
    });
    window.scrollTo(0, 0);
  }

  eliminar(id: number): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción eliminará la especialidad. Esto podría fallar si está en uso por médicos o tarifarios.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.especialidadService.eliminarEspecialidad(id).subscribe({
          next: () => {
            Swal.fire('¡Eliminada!', 'La especialidad ha sido eliminada.', 'success');
            this.cargarEspecialidades();
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
    this.especialidadForm.reset();
    this.modoEdicion = false;
    this.idEditar = null;
    this.cargando = true;
    this.cargarEspecialidades();
  }

  get f() { return this.especialidadForm.controls; }

  esCampoInvalido(campo: string): boolean {
    const control = this.f[campo];
    return control.invalid && (control.dirty || control.touched);
  }
}