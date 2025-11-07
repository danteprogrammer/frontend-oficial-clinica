import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Tarifario, TarifarioService } from '../../shared/tarifario.service';

declare var Swal: any;

@Component({
  selector: 'app-gestion-tarifario',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-tarifario.html',
  styleUrl: './gestion-tarifario.css',
})
export class GestionTarifario implements OnInit {
  tarifas: Tarifario[] = [];
  cargando = true;
  error: string | null = null;
  tarifaForm: FormGroup;
  modoEdicion = false;
  idTarifaEditar: number | null = null;

  constructor(
    private tarifarioService: TarifarioService,
    private fb: FormBuilder
  ) {
    this.tarifaForm = this.fb.group({
      especialidad: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+(\.[0-9]{1,2})?$')]]
    });
  }

  ngOnInit(): void {
    this.cargarTarifas();
  }

  cargarTarifas(): void {
    this.cargando = true;
    this.tarifarioService.getTarifarios().subscribe({
      next: (data) => {
        this.tarifas = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las tarifas. ' + err.message;
        this.cargando = false;
      }
    });
  }

  onSubmit(): void {
    if (this.tarifaForm.invalid) {
      this.tarifaForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const tarifaData = this.tarifaForm.value;

    if (this.modoEdicion && this.idTarifaEditar) {
      this.tarifarioService.actualizarTarifario(this.idTarifaEditar, tarifaData).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'Tarifa actualizada con éxito.', 'success');
          this.resetFormulario();
        },
        error: (err) => {
          Swal.fire('Error', err.message, 'error');
          this.cargando = false;
        }
      });
    } else {
      this.tarifarioService.crearTarifario(tarifaData).subscribe({
        next: () => {
          Swal.fire('¡Creada!', 'Nueva tarifa registrada con éxito.', 'success');
          this.resetFormulario();
        },
        error: (err) => {
          Swal.fire('Error', err.message, 'error');
          this.cargando = false;
        }
      });
    }
  }

  cargarTarifaParaEditar(tarifa: Tarifario): void {
    this.modoEdicion = true;
    this.idTarifaEditar = tarifa.id!;
    this.tarifaForm.patchValue({
      especialidad: tarifa.especialidad,
      precio: tarifa.precio
    });
    window.scrollTo(0, 0); 
  }

  eliminarTarifa(id: number): void {
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
        this.tarifarioService.eliminarTarifario(id).subscribe({
          next: (response) => {
            Swal.fire('¡Eliminada!', response.message, 'success');
            this.cargarTarifas();
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
    this.tarifaForm.reset();
    this.modoEdicion = false;
    this.idTarifaEditar = null;
    this.cargando = false;
    this.cargarTarifas();
  }

  get f() { return this.tarifaForm.controls; }

  esCampoInvalido(campo: string): boolean {
    const control = this.f[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  getMensajeError(campo: string): string {
    const control = this.f[campo];
    if (control.errors?.['required']) {
      return 'Este campo es obligatorio.';
    }
    if (control.errors?.['min']) {
      return 'El precio no puede ser negativo.';
    }
    if (control.errors?.['pattern']) {
      return 'Debe ser un número válido (ej: 150.00 o 150).';
    }
    return 'Campo inválido.';
  }
}
