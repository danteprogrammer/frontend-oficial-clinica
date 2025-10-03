import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Paciente } from '../paciente';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
declare var Swal: any; 

@Component({
  selector: 'app-paciente-busqueda',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './paciente-busqueda.html',
  styleUrl: './paciente-busqueda.css'
})
export class PacienteBusqueda implements OnInit {
  busquedaForm: FormGroup;
  pacientes: Paciente[] = [];
  busquedaRealizada = false;

  currentPage = 0;
  pageSize = 6;
  totalPages = 0;

  constructor(private fb: FormBuilder, private paciente: Paciente) {
    this.busquedaForm = this.fb.group({
      termino: [''],
      filtro: ['nombre']
    });
  }

  ngOnInit(): void {
    this.buscarPacientes();
  }

  buscarPacientes(): void {
    const { termino, filtro } = this.busquedaForm.value;
    this.paciente.buscarPacientesActivos(termino, filtro, this.currentPage, this.pageSize)
      .subscribe(pagina => {
        this.pacientes = pagina.content;
        this.totalPages = pagina.totalPages;
        this.busquedaRealizada = true;
      });
  }

  limpiarBusqueda(): void {
    this.busquedaForm.reset({ termino: '', filtro: 'nombre' });
    this.buscarPacientes();
  }

  irAPagina(pagina: number): void {
    this.currentPage = pagina;
    this.buscarPacientes();
  }

inactivar(paciente: Paciente): void {
  Swal.fire({
    title: '¿Estás seguro?',
    text: `¿Deseas inactivar a ${paciente.nombres} ${paciente.apellidos}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, inactivar'
  }).then((result: any) => {
    if (result.isConfirmed) {
      this.paciente.inactivarPaciente(paciente.idPaciente!).subscribe(() => {
        Swal.fire(
          '¡Inactivado!',
          'El paciente ha sido inactivado.',
          'success'
        );
        this.buscarPacientes();
      }, () => {
        Swal.fire(
          'Error',
          'No se pudo inactivar al paciente.',
          'error'
        );
      });
    }
  });
}
  
}
