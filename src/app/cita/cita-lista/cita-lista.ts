import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CitaService } from '../../shared/cita.service';
import { PacienteService } from '../../shared/paciente.service';
import { MedicoService } from '../../shared/medico.service';
import { ConsultorioService } from '../../shared/consultorio.service';

@Component({
  selector: 'app-cita-lista',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './cita-lista.html',
  styleUrls: ['./cita-lista.css']
})
export class CitaLista implements OnInit {
  busquedaForm: FormGroup;
  citas: any[] = [];
  busquedaRealizada = false;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;

  cargando: boolean = false;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private citaService: CitaService,
    private pacienteService: PacienteService,
    private medicoService: MedicoService,
    private consultorioService: ConsultorioService,
    private router: Router
  ) {
    this.busquedaForm = this.fb.group({
      termino: [''],
      filtro: ['paciente'],
      fechaDesde: [''],
      fechaHasta: ['']
    });
  }

  ngOnInit(): void {
    // Cargar citas directamente - el backend permite acceso público
    this.buscarCitas();
  }

  buscarCitas(): void {
    this.cargando = true;
    this.mensajeError = null;

    const { termino, filtro, fechaDesde, fechaHasta } = this.busquedaForm.value;

    // Si no hay filtros específicos, cargar todas las citas
    if (!termino && !fechaDesde && !fechaHasta) {
      this.cargarTodasLasCitas();
    } else {
      this.cargarCitasFiltradas(termino, filtro, fechaDesde, fechaHasta);
    }
  }

  private cargarTodasLasCitas(): void {
    this.citaService.getCitas().subscribe({
      next: (response: any) => {
        this.citas = response.content || response || [];
        this.totalPages = Math.ceil(this.citas.length / this.pageSize);
        this.busquedaRealizada = true;
        this.cargando = false;
        this.cargarInformacionAdicional();
      },
      error: (error: any) => {
        console.error('Error al cargar citas:', error);
        this.handleError(error, 'citas');
        this.cargando = false;
      }
    });
  }

  private cargarCitasFiltradas(termino: string, filtro: string, fechaDesde: string, fechaHasta: string): void {
    // Por ahora, filtrar en el frontend hasta que el backend tenga endpoints de búsqueda
    this.citaService.getCitas().subscribe({
      next: (response: any) => {
        let todasLasCitas = response.content || response || [];

        // Aplicar filtros
        if (termino) {
          const terminoLower = termino.toLowerCase();
          todasLasCitas = todasLasCitas.filter((cita: any) => {
            switch (filtro) {
              case 'paciente':
                return cita.paciente?.nombres?.toLowerCase().includes(terminoLower) ||
                       cita.paciente?.apellidos?.toLowerCase().includes(terminoLower) ||
                       cita.paciente?.dni?.includes(termino);
              case 'medico':
                return cita.medico?.nombres?.toLowerCase().includes(terminoLower) ||
                       cita.medico?.apellidos?.toLowerCase().includes(terminoLower);
              case 'fecha':
                return cita.fecha?.includes(termino);
              default:
                return false;
            }
          });
        }

        if (fechaDesde) {
          todasLasCitas = todasLasCitas.filter((cita: any) => cita.fecha >= fechaDesde);
        }

        if (fechaHasta) {
          todasLasCitas = todasLasCitas.filter((cita: any) => cita.fecha <= fechaHasta);
        }

        this.citas = todasLasCitas;
        this.totalPages = Math.ceil(this.citas.length / this.pageSize);
        this.busquedaRealizada = true;
        this.cargando = false;
        this.cargarInformacionAdicional();
      },
      error: (error: any) => {
        console.error('Error al cargar citas:', error);
        this.handleError(error, 'citas');
        this.cargando = false;
      }
    });
  }

  private cargarInformacionAdicional(): void {
    // Cargar información adicional de pacientes, médicos y consultorios si no viene incluida
    this.citas.forEach(cita => {
      if (cita.paciente?.idPaciente && !cita.paciente?.nombres) {
        this.pacienteService.getPaciente(cita.paciente.idPaciente).subscribe({
          next: (paciente: any) => {
            cita.paciente = { ...cita.paciente, ...paciente };
          },
          error: (error: any) => {
            console.error('Error al cargar información del paciente:', error);
          }
        });
      }

      if (cita.medico?.idMedico && !cita.medico?.nombres) {
        this.medicoService.getMedico(cita.medico.idMedico).subscribe({
          next: (medico: any) => {
            cita.medico = { ...cita.medico, ...medico };
          },
          error: (error: any) => {
            console.error('Error al cargar información del médico:', error);
          }
        });
      }

      if (cita.consultorio?.idConsultorio && !cita.consultorio?.numero) {
        this.consultorioService.getConsultorio(cita.consultorio.idConsultorio).subscribe({
          next: (consultorio: any) => {
            cita.consultorio = { ...cita.consultorio, ...consultorio };
          },
          error: (error: any) => {
            console.error('Error al cargar información del consultorio:', error);
          }
        });
      }
    });
  }

  irAPagina(pagina: number): void {
    this.currentPage = pagina;
    this.buscarCitas();
  }

  cancelarCita(cita: any): void {
    if (confirm(`¿Está seguro que desea cancelar la cita del paciente ${cita.paciente?.nombres} ${cita.paciente?.apellidos} para el ${cita.fecha} a las ${cita.hora}?`)) {
      this.citaService.cancelarCita(cita.idCita).subscribe({
        next: () => {
          cita.estado = 'Cancelada';
          this.mensajeExito = 'Cita cancelada con éxito ✅';
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error: any) => {
          console.error('Error al cancelar cita:', error);
          this.mensajeError = 'No se pudo cancelar la cita ❌';
          setTimeout(() => this.mensajeError = null, 3000);
        }
      });
    }
  }

  completarCita(cita: any): void {
    if (confirm(`¿Está seguro que desea marcar como completada la cita del paciente ${cita.paciente?.nombres} ${cita.paciente?.apellidos}?`)) {
      this.citaService.completarCita(cita.idCita).subscribe({
        next: () => {
          cita.estado = 'Completada';
          this.mensajeExito = 'Cita marcada como completada ✅';
          setTimeout(() => this.mensajeExito = null, 3000);
        },
        error: (error: any) => {
          console.error('Error al completar cita:', error);
          this.mensajeError = 'No se pudo completar la cita ❌';
          setTimeout(() => this.mensajeError = null, 3000);
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'estado-pendiente';
      case 'Confirmada': return 'estado-confirmado';
      case 'EnProceso': return 'estado-proceso';
      case 'Completada': return 'estado-completado';
      case 'Cancelada': return 'estado-cancelada';
      default: return '';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'Pendiente';
      case 'Confirmada': return 'Confirmada';
      case 'EnProceso': return 'En Proceso';
      case 'Completada': return 'Completada';
      case 'Cancelada': return 'Cancelada';
      default: return 'Desconocida';
    }
  }

  private handleError(error: any, context: string): void {
    console.log('CitaLista - Handling error:', {
      message: error.message
    });

    // Simplified error handling - no authentication checks needed
    if (error.message && error.message.includes('conectar al servidor')) {
      this.mensajeError = `No se puede conectar al servidor. Verifica que el backend esté ejecutándose en http://localhost:8080`;
    } else if (error.message && error.message.includes('404')) {
      this.mensajeError = `No se encontraron ${context}.`;
    } else {
      this.mensajeError = `Error al cargar ${context}: ${error.message}`;
    }
  }

  limpiarMensajes(): void {
    this.mensajeExito = null;
    this.mensajeError = null;
  }
}
