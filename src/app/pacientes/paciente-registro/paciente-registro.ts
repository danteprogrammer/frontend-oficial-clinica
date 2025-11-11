import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Paciente, Paciente as PacienteService } from '../paciente';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

declare var Swal: any;

@Component({
  selector: 'app-paciente-registro',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './paciente-registro.html',
  styleUrl: './paciente-registro.css'
})
export class PacienteRegistro {
  registroForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private pacienteService: PacienteService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      dni: ['', [
        Validators.required,
        Validators.pattern('^[0-9]*$'),
        Validators.minLength(8),
        Validators.maxLength(8)
      ]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      sexo: ['', Validators.required],
      fechaNacimiento: ['', [Validators.required, this.fechaNacimientoValida()]],
      direccion: [''],
      telefono: ['', [
        Validators.required,
        Validators.pattern('^[9][0-9]*$'),
        Validators.minLength(9),
        Validators.maxLength(9)
      ]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private fechaNacimientoValida(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }

      try {
        const parts = control.value.split('-');
        const fechaIngresada = new Date(parts[0], parts[1] - 1, parts[2]);

        const hoy = new Date();
        const anioMinimo = new Date();

        fechaIngresada.setHours(0, 0, 0, 0);
        hoy.setHours(0, 0, 0, 0);
        anioMinimo.setHours(0, 0, 0, 0);

        anioMinimo.setFullYear(hoy.getFullYear() - 120);

        if (fechaIngresada > hoy) {
          return { fechaFutura: true };
        }

        if (fechaIngresada < anioMinimo) {
          return { fechaInvalida: true };
        }

        return null;
      } catch (e) {
        return { fechaInvalida: true };
      }
    };
  }

  get f() { return this.registroForm.controls; }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      Swal.fire({
        title: 'Formulario Incompleto',
        text: 'Por favor, revise y complete todos los campos marcados en rojo.',
        icon: 'error'
      });
      this.registroForm.markAllAsTouched();
      return;
    }

    this.pacienteService.registrarPaciente(this.registroForm.value).subscribe({
      next: (pacienteRegistrado) => {
        Swal.fire({
          title: '¡Paciente Registrado!',
          text: `El paciente ${pacienteRegistrado.nombres} ha sido registrado. Ahora será redirigido para programar su cita.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/cita/registrar'], { state: { nuevoPaciente: pacienteRegistrado } });
        });
      },
      error: (err) => {
        const mensajeError = err.error?.message || 'Ocurrió un error al registrar el paciente. Verifique que el DNI no esté duplicado.';
        Swal.fire({
          title: 'Error de Registro',
          text: mensajeError,
          icon: 'error'
        });
      }
    });
  }
}