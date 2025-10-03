import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Paciente } from '../paciente';
import { CommonModule } from '@angular/common';

declare var Swal: any;

@Component({
  selector: 'app-paciente-registro',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './paciente-registro.html',
  styleUrl: './paciente-registro.css'
})
export class PacienteRegistro {
  registroForm: FormGroup;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  constructor(private fb: FormBuilder, private paciente: Paciente) {
    this.registroForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      sexo: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      direccion: [''],
      telefono: ['', [Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      Swal.fire({
        title: 'Formulario Incompleto',
        text: 'Por favor, complete todos los campos requeridos correctamente.',
        icon: 'error'
      });
      return;
    }

    this.paciente.registrarPaciente(this.registroForm.value).subscribe({
      next: (pacienteRegistrado) => {
        Swal.fire({
          title: '¡Registrado!',
          text: `El paciente ${pacienteRegistrado.nombres} ${pacienteRegistrado.apellidos} ha sido registrado con éxito.`,
          icon: 'success'
        });
        this.registroForm.reset();
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'Ocurrió un error al registrar el paciente.',
          icon: 'error'
        });
        console.error(err);
      }
    });
  }
}
