import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LaboratorioService } from '../../shared/laboratorio.service';
import { FormsModule } from '@angular/forms'; // Necesario para el textarea de resultados

declare var Swal: any;

@Component({
  selector: 'app-gestion-pendientes',
  imports: [CommonModule, DatePipe, FormsModule], // Añadir FormsModule
  templateUrl: './gestion-pendientes.html',
  styleUrl: './gestion-pendientes.css'
})
export class GestionPendientes implements OnInit {
  ordenes: any[] = [];
  cargando = true;
  error: string | null = null;
  resultadosTexto: string = ''; // Para el modal

  constructor(private laboratorioService: LaboratorioService) { }

  ngOnInit(): void {
    this.cargarOrdenes();
  }

  cargarOrdenes(): void {
    this.cargando = true;
    this.error = null;
    this.laboratorioService.getOrdenesPendientes().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      }
    });
  }

  marcarEnProceso(orden: any): void {
    this.laboratorioService.actualizarEstado(orden.idOrden, 'EN_PROCESO').subscribe({
      next: (ordenActualizada) => {
        orden.estado = ordenActualizada.estado;
        Swal.fire('Actualizado', 'La orden está ahora EN PROCESO.', 'success');
      },
      error: (err) => Swal.fire('Error', err.message, 'error')
    });
  }

  async abrirModalResultados(orden: any) {
    this.resultadosTexto = orden.resultados || ''; // Cargar resultados si ya existen

    const { value: formValues } = await Swal.fire({
      title: 'Registrar Resultados',
      html: `
        <p><b>Paciente:</b> ${orden.historiaClinica.paciente.nombres} ${orden.historiaClinica.paciente.apellidos}</p>
        <p><b>Exámenes:</b> ${orden.examenesSolicitados}</p>
        <textarea id="swal-resultados" class="swal2-textarea" placeholder="Escriba los resultados aquí...">${this.resultadosTexto}</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar y Completar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const resultados = (document.getElementById('swal-resultados') as HTMLTextAreaElement).value;
        if (!resultados) {
          Swal.showValidationMessage('Debe ingresar los resultados para completar la orden.');
          return false;
        }
        return resultados;
      }
    });

    if (formValues) {
      this.cargando = true;
      this.laboratorioService.registrarResultados(orden.idOrden, formValues).subscribe({
        next: () => {
          Swal.fire('Guardado', 'Resultados guardados y orden completada.', 'success');
          this.cargarOrdenes(); // Recarga la lista (la orden completada desaparecerá)
        },
        error: (err) => Swal.fire('Error', err.message, 'error'),
        complete: () => this.cargando = false
      });
    }
  }

  getEstadoClass(estado: string): string {
    if (estado === 'PENDIENTE') return 'estado-pendiente';
    if (estado === 'EN_PROCESO') return 'estado-en-proceso';
    return 'estado-desconocido';
  }
}