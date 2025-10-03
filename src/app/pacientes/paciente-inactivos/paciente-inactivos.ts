import { Component, OnInit } from '@angular/core';
import { Paciente } from '../paciente';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

declare var Swal: any;

@Component({
  selector: 'app-paciente-inactivos',
  imports: [CommonModule, RouterModule],
  templateUrl: './paciente-inactivos.html',
  styleUrl: './paciente-inactivos.css'
})
export class PacienteInactivos implements OnInit {
  pacientes: Paciente[] = [];

  currentPage = 0;
  pageSize = 6;
  totalPages = 0;

  constructor(private paciente: Paciente) { }

  ngOnInit(): void {
    this.cargarInactivos(); 
  }

  cargarInactivos(): void {
    this.paciente.buscarPacientesInactivos(this.currentPage, this.pageSize)
      .subscribe(pagina => {
        this.pacientes = pagina.content;
        this.totalPages = pagina.totalPages;
      });
  }

  irAPagina(pagina: number): void {
    this.currentPage = pagina;
    this.cargarInactivos();
  }

  activar(paciente: Paciente): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas volver a activar a ${paciente.nombres} ${paciente.apellidos}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, activar'
    }).then((result:any) => {
      if (result.isConfirmed) {
        this.paciente.activarPaciente(paciente.idPaciente!).subscribe(() => {
          Swal.fire('¡Activado!', 'El paciente ha sido activado con éxito.', 'success');
          this.cargarInactivos();
        }, () => {
          Swal.fire('Error', 'No se pudo activar al paciente.', 'error');
        });
      }
    });
  }
}
