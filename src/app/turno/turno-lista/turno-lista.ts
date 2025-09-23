import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TurnoService } from '../../shared/turno.service';
import { PacienteService } from '../../shared/paciente.service';
import { ConsultorioService } from '../../shared/consultorio.service';
import { ComunicacionService } from '../../shared/comunicacion.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-turno-lista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turno-lista.html',
  styleUrls: ['./turno-lista.css']
})
export class TurnoLista implements OnInit {

  // Datos que se cargarán desde la API
  turnos: any[] = [];
  pacientesSinTurno: any[] = [];

  cargando: boolean = false;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  private turnoAsignadoSubscription?: Subscription;

  constructor(
    private turnoService: TurnoService,
    private pacienteService: PacienteService,
    private consultorioService: ConsultorioService,
    private router: Router,
    private comunicacionService: ComunicacionService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.suscribirseANotificaciones();
  }

  ngOnDestroy(): void {
    if (this.turnoAsignadoSubscription) {
      this.turnoAsignadoSubscription.unsubscribe();
    }
  }

  private suscribirseANotificaciones(): void {
    // Escuchar cuando se asigna un nuevo turno
    this.turnoAsignadoSubscription = this.comunicacionService.getTurnoAsignado$()
      .subscribe((turnoData: any) => {
        console.log('TurnoLista: Recibida notificación de turno asignado:', turnoData);
        this.onTurnoAsignado(turnoData);
      });
  }

  private onTurnoAsignado(turnoData: any): void {
    console.log('Procesando turno asignado:', turnoData);

    // Agregar el nuevo turno a la lista de turnos
    this.agregarTurno(turnoData);

    // Si el turno tiene id_consultorio, cargar la información del consultorio
    if (turnoData.id_consultorio) {
      this.consultorioService.getConsultorio(turnoData.id_consultorio).subscribe({
        next: (consultorio: any) => {
          turnoData.consultorio = consultorio;
          console.log(`Consultorio ${consultorio.numero} asociado al nuevo turno #${turnoData.idTurno}`);
        },
        error: (error: any) => {
          console.error('Error al cargar consultorio para nuevo turno:', error);
        }
      });
    }

    // Remover el paciente de la lista de pacientes sin turno
    // Buscar por DNI del paciente (ya que el backend no devuelve el ID)
    const turnoDni = turnoData.dniPaciente || turnoData.paciente?.dni;

    if (turnoDni) {
      this.pacientesSinTurno = this.pacientesSinTurno.filter(paciente =>
        paciente.dni !== turnoDni
      );
      console.log(`Paciente con DNI ${turnoDni} removido de la lista de pacientes sin turno`);
    } else {
      console.warn('No se pudo identificar el DNI del paciente en los datos del turno:', turnoData);
    }

    // Recalcular la lista de pacientes sin turno para asegurar consistencia
    this.recargarPacientesSinTurno();

    // Mostrar mensaje de éxito
    this.mensajeExito = 'Se ha asignado un nuevo turno correctamente ✅';
  }

  private recargarPacientesSinTurno(): void {
    // NO recalcular desde la API - esto sobrescribe la lista filtrada correctamente
    // En su lugar, solo hacer un debug de la lista actual
    console.log('=== DEBUG: LISTA ACTUAL DE PACIENTES SIN TURNO ===');
    console.log('Total pacientes sin turno:', this.pacientesSinTurno.length);
    this.pacientesSinTurno.forEach((p: any) => {
      console.log(`- ${p.nombres} ${p.apellidos} (DNI:${p.dni})`);
    });
    console.log('=== FIN DEBUG ===');
  }

  private cargarDatosIniciales(): void {
    this.cargando = true;
    this.mensajeError = null;

    // Cargar turnos y pacientes sin turno en paralelo
    this.cargarTurnos();
    this.cargarPacientesSinTurno();
  }

  private cargarTurnos(): void {
    this.turnoService.getTurnos().subscribe({
      next: (data: any[]) => {
        this.turnos = data || [];
        console.log('Turnos cargados desde API:', this.turnos);

        // Cargar información de consultorios para turnos que tienen consultorioId
        this.cargarInformacionConsultorios();
      },
      error: (error: any) => {
        console.error('Error al cargar turnos:', error);
        this.handleError(error, 'turnos');
        // Si hay error 403, intentar con retry automático después de 2 segundos
        if (error.message && error.message.includes('403')) {
          setTimeout(() => {
            console.log('Reintentando cargar turnos...');
            this.cargarTurnos();
          }, 2000);
        }
      }
    });
  }

  private cargarInformacionConsultorios(): void {
    const turnosConConsultorio = this.turnos.filter(turno => turno.id_consultorio);

    if (turnosConConsultorio.length === 0) {
      console.log('No hay turnos con id_consultorio, omitiendo carga de consultorios');
      return;
    }

    console.log(`Cargando información de consultorios para ${turnosConConsultorio.length} turnos...`);

    // Crear observables para cargar cada consultorio
    const consultorioObservables = turnosConConsultorio.map(turno =>
      this.consultorioService.getConsultorio(turno.id_consultorio)
    );

    // Ejecutar todas las llamadas en paralelo
    forkJoin(consultorioObservables).subscribe({
      next: (consultorios: any[]) => {
        console.log('Consultorios cargados:', consultorios);

        // Asociar cada consultorio a su turno correspondiente
        turnosConConsultorio.forEach((turno, index) => {
          turno.consultorio = consultorios[index];
          console.log(`Asociado consultorio ${consultorios[index]?.numero} al turno #${turno.idTurno}`);
        });

        console.log('Información de consultorios cargada exitosamente');
      },
      error: (error: any) => {
        console.error('Error al cargar información de consultorios:', error);
        // No mostrar error al usuario ya que los turnos siguen funcionando sin el nombre del consultorio
      }
    });
  }

  private cargarPacientesSinTurno(): void {
    // Obtener todos los pacientes y filtrar los que no tienen turno
    this.pacienteService.getPacientes().subscribe({
      next: (response: any) => {
        // El backend devuelve una respuesta paginada
        const pacientes = response.content || response || [];
        console.log('=== DEBUG: TODOS LOS PACIENTES CARGADOS ===');
        console.log('Total pacientes:', pacientes.length);
        pacientes.forEach((p: any) => console.log(`- ID:${p.idPaciente} | DNI:${p.dni} | ${p.nombres} ${p.apellidos}`));

        console.log('=== DEBUG: TURNOS ACTUALES ===');
        console.log('Total turnos:', this.turnos.length);
        this.turnos.forEach(t => {
          console.log(`- Turno #${t.idTurno} | DNI:${t.dniPaciente || t.paciente?.dni || 'N/A'} | Paciente ID:${t.pacienteId || t.paciente?.idPaciente || 'N/A'}`);
        });

        // Filtrar pacientes que no tienen turno asignado
        this.pacientesSinTurno = pacientes.filter((paciente: any) => {
          if (!paciente || !paciente.dni) {
            console.log(`Paciente sin DNI válido:`, paciente);
            return false;
          }

          // Buscar si el paciente tiene algún turno asignado
          const tieneTurno = this.turnos.some((turno: any) => {
            // Verificar múltiples formas de identificar al paciente
            const turnoDni = turno.dniPaciente || turno.paciente?.dni;
            const pacienteDni = paciente.dni;

            const tieneTurnoAsignado = turnoDni === pacienteDni;

            if (tieneTurnoAsignado) {
              console.log(`✅ MATCH: Paciente ${paciente.nombres} ${paciente.apellidos} (DNI:${pacienteDni}) TIENE turno asignado:`, turno);
            }

            return tieneTurnoAsignado;
          });

          if (!tieneTurno) {
            console.log(`❌ Paciente ${paciente.nombres} ${paciente.apellidos} (DNI:${paciente.dni}) SIN TURNO`);
          }

          return !tieneTurno;
        });

        console.log('=== DEBUG: RESULTADO FINAL ===');
        console.log('Pacientes sin turno calculados:', this.pacientesSinTurno.length);
        this.pacientesSinTurno.forEach((p: any) => console.log(`- ${p.nombres} ${p.apellidos} (DNI:${p.dni})`));
      },
      error: (error: any) => {
        console.error('Error al cargar pacientes:', error);
        this.handleError(error, 'pacientes');
      }
    });
  }

  private handleError(error: any, context: string): void {
    this.cargando = false;

    if (error.message && error.message.includes('403')) {
      this.mensajeError = `Error de autorización al cargar ${context}. Verifica que estés logueado correctamente.`;
    } else if (error.message && error.message.includes('conectar al servidor')) {
      this.mensajeError = `No se puede conectar al servidor. Verifica que el backend esté ejecutándose.`;
    } else {
      this.mensajeError = `Error al cargar ${context}: ${error.message}`;
    }
  }

  // Método para agregar un nuevo turno a la lista (se puede llamar desde otros componentes)
  agregarTurno(nuevoTurno: any): void {
    this.turnos.push(nuevoTurno);
    this.turnos.sort((a, b) => {
      const fechaCompare = a.fecha.localeCompare(b.fecha);
      return fechaCompare !== 0 ? fechaCompare : a.hora.localeCompare(b.hora);
    });
  }

  cambiarEstadoTurno(turno: any, nuevoEstado: string): void {
    this.turnoService.actualizarEstado(turno.idTurno, nuevoEstado)
      .subscribe({
        next: () => {
          turno.estado = nuevoEstado;
          this.mensajeExito = `El turno #${turno.idTurno} ahora está en estado ${this.getEstadoLabel(nuevoEstado)} ✅`;
        },
        error: (err: any) => {
          console.error('Error al cambiar estado del turno', err);
          this.mensajeError = 'No se pudo actualizar el estado del turno ❌';
        }
      });
  }

  cancelarTurno(turno: any): void {
    this.turnoService.cancelarTurno(turno.idTurno)
      .subscribe({
        next: () => {
          turno.estado = 'Cancelado';
          this.mensajeExito = `El turno #${turno.idTurno} fue cancelado.`;
        },
        error: (err: any) => {
          console.error('Error al cancelar turno', err);
          this.mensajeError = 'No se pudo cancelar el turno ❌';
        }
      });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'estado-pendiente';
      case 'Confirmado': return 'estado-confirmado';
      case 'EnProceso': return 'estado-proceso';
      case 'Completado': return 'estado-completado';
      case 'Cancelado': return 'estado-cancelado';
      default: return '';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'Pendiente';
      case 'Confirmado': return 'Confirmado';
      case 'EnProceso': return 'En Proceso';
      case 'Completado': return 'Completado';
      case 'Cancelado': return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  // Método para navegar al componente de asignación de turnos con datos del paciente
  asignarTurno(paciente: any): void {
    console.log('Navegando a asignar turno para paciente:', paciente);
    // Navegar al componente de asignación de turnos
    this.router.navigate(['/turno/asignar'], {
      state: { pacienteSeleccionado: paciente }
    });
  }
}
