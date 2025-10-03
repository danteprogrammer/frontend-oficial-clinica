import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Paciente } from '../paciente';
import { CommonModule } from '@angular/common';

declare var Swal: any;

@Component({
  selector: 'app-paciente-modificar',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './paciente-modificar.html',
  styleUrl: './paciente-modificar.css'
})
export class PacienteModificar implements OnInit {
  modificarForm: FormGroup;
  pacienteId!: number;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;
  dniPaciente: string = '';

  constructor(
    private fb: FormBuilder,
    private paciente: Paciente,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.modificarForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      sexo: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      direccion: [''],
      telefono: ['', [Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.email]],
      alergias: [''],
      antecedentes: [''],
      enfermedadesCronicas: ['']
    });
  }

  ngOnInit(): void {
    this.pacienteId = this.route.snapshot.params['id'];
    this.paciente.obtenerPacientePorId(this.pacienteId).subscribe(data => {
      this.modificarForm.patchValue(data);
    });
  }

  onGuardarCambios(): void {
    if (this.modificarForm.invalid) {
      Swal.fire('Error', 'Por favor, revise los campos del formulario.', 'error');
      return;
    }
    this.paciente.modificarPaciente(this.pacienteId, this.modificarForm.value).subscribe({
      next: () => {
        Swal.fire('¡Actualizado!', 'Los datos del paciente han sido actualizados.', 'success');
      },
      error: (err) => {
        Swal.fire('Error', 'Ocurrió un error al guardar los cambios.', 'error');
        console.error(err);
      }
    });
  }

  inactivar(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas inactivar a este paciente?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, inactivar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.paciente.inactivarPaciente(this.pacienteId).subscribe(() => {
          Swal.fire('¡Inactivado!', 'El paciente ha sido inactivado.', 'success')
            .then(() => this.router.navigate(['/pacientes/registrados']));
        });
      }
    });
  }

  volver(): void {
    this.router.navigate(['/pacientes/registrados']);
  }
}
