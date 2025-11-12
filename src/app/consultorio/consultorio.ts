import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultorioService, Consultorio as ConsultorioModel } from '../shared/consultorio.service';

@Component({
  selector: 'app-consultorio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consultorio.html',
  styleUrl: './consultorio.css'
})
export class Consultorio implements OnInit {

  consultorios: ConsultorioModel[] = [];

  loading: boolean = false;
  error: string | null = null;

  private apiUrl = 'https://backend-oficial-clinica-production.up.railway.app/api/consultorios';

  constructor(private consultorioService: ConsultorioService) { }

  ngOnInit(): void {
    this.cargarConsultorios();
  }

  private cargarConsultorios(): void {
    this.loading = true;
    this.error = null;

    this.consultorioService.getConsultorios().subscribe({
      next: (data: ConsultorioModel[]) => {
        this.consultorios = data || [];
        console.log('Consultorios cargados desde API:', this.consultorios);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar consultorios:', error);
        this.handleError(error);
        this.loading = false;

        if (error.message && error.message.includes('403')) {
          setTimeout(() => {
            console.log('Reintentando cargar consultorios...');
            this.cargarConsultorios();
          }, 2000);
        }
      }
    });
  }

  private handleError(error: any): void {
    if (error.message && error.message.includes('403')) {
      this.error = 'Error de autorización. Verifica que estés logueado correctamente.';
    } else if (error.message && error.message.includes('conectar al servidor')) {
      this.error = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
    } else {
      this.error = `Error al cargar consultorios: ${error.message}`;
    }
  }

  recargarDatos(): void {
    this.cargarConsultorios();
  }

  filtroEstado: string = 'Todos';

  get consultoriosFiltrados(): ConsultorioModel[] {
    if (this.filtroEstado === 'Todos') {
      return this.consultorios;
    }
    return this.consultorios.filter(c => c.estado === this.filtroEstado);
  }

  getCountByEstado(estado: string): number {
    return this.consultorios.filter(c => c.estado === estado).length;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Disponible': return 'estado-disponible';
      case 'Ocupado': return 'estado-ocupado';
      case 'Mantenimiento': return 'estado-mantenimiento';
      default: return 'estado-desconocido';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'Disponible': return '✅';
      case 'Ocupado': return '⛔';
      case 'Mantenimiento': return '🛠️';
      default: return '❓';
    }
  }
}