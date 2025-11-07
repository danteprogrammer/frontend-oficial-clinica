import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LaboratorioService, OrdenLaboratorioResponseDto } from '../../shared/laboratorio.service';
import { RouterModule } from '@angular/router';

declare var Swal: any;

@Component({
  selector: 'app-historial-resultados',
  imports: [CommonModule, ReactiveFormsModule, DatePipe, RouterModule],
  templateUrl: './historial-resultados.html',
  styleUrl: './historial-resultados.css',
  providers: [DatePipe]
})
export class HistorialResultados implements OnInit {

  ordenesCompletadas: OrdenLaboratorioResponseDto[] = [];
  ordenesFiltradas: OrdenLaboratorioResponseDto[] = [];
  cargando = true;
  error: string | null = null;
  filtroForm: FormGroup;

  constructor(
    private laboratorioService: LaboratorioService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.filtroForm = this.fb.group({
      termino: [''],
      fecha: ['']
    });
  }

  ngOnInit(): void {
    this.cargarHistorial();

    this.filtroForm.valueChanges.subscribe(values => {
      this.filtrarOrdenes(values);
    });
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.error = null;
    this.laboratorioService.getOrdenesCompletadas().subscribe({
      next: (data) => {
        this.ordenesCompletadas = data;
        this.ordenesFiltradas = data; 
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar el historial de resultados. ' + err.message;
        this.cargando = false;
      }
    });
  }

  filtrarOrdenes(values: { termino: string, fecha: string }): void {
    const termino = values.termino.toLowerCase();
    const fecha = values.fecha;

    this.ordenesFiltradas = this.ordenesCompletadas.filter(orden => {
      const paciente = orden.historiaClinica.paciente;
      const nombreCompleto = `${paciente.nombres} ${paciente.apellidos}`.toLowerCase();
      const dni = paciente.dni;

      const matchTermino = termino ? (nombreCompleto.includes(termino) || dni.includes(termino)) : true;

      const matchFecha = fecha ? (orden.fechaResultados === fecha) : true;

      return matchTermino && matchFecha;
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({ termino: '', fecha: '' });
  }

  verResultados(orden: OrdenLaboratorioResponseDto): void {
    Swal.fire({
      title: `Resultados de Orden #${orden.idOrden}`,
      html: `
        <div style="text-align: left; padding: 0 1rem;">
          <p><strong>Paciente:</strong> ${orden.historiaClinica.paciente.nombres} ${orden.historiaClinica.paciente.apellidos}</p>
          <p><strong>DNI:</strong> ${orden.historiaClinica.paciente.dni}</p>
          <p><strong>Exámenes:</strong> ${orden.examenesSolicitados}</p>
          <hr>
          <p><strong>Resultados:</strong></p>
          <pre style="white-space: pre-wrap; background: #f9f9f9; border: 1px solid #eee; padding: 10px; border-radius: 4px;">${orden.resultados || 'Sin resultados.'}</pre>
        </div>
      `,
      confirmButtonText: 'Cerrar'
    });
  }
}