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
    this.turnoAsignadoSubscription = this.comunicacionService.getTurnoAsignado$()
      .subscribe((turnoData: any) => {
        console.log('TurnoLista: Recibida notificación de turno asignado:', turnoData);
        this.onTurnoAsignado(turnoData);
      });
  }

  private onTurnoAsignado(turnoData: any): void {
    console.log('Procesando turno asignado:', turnoData);

    this.agregarTurno(turnoData);

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

    const turnoDni = turnoData.dniPaciente || turnoData.paciente?.dni;

    if (turnoDni) {
      this.pacientesSinTurno = this.pacientesSinTurno.filter(paciente =>
        paciente.dni !== turnoDni
      );
      console.log(`Paciente con DNI ${turnoDni} removido de la lista de pacientes sin turno`);
    } else {
      console.warn('No se pudo identificar el DNI del paciente en los datos del turno:', turnoData);
    }

    this.recargarPacientesSinTurno();

    this.mensajeExito = 'Se ha asignado un nuevo turno correctamente ✅';
  }

  private recargarPacientesSinTurno(): void {
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

    this.cargarTurnos();
    this.cargarPacientesSinTurno();
  }

  private cargarTurnos(): void {
    this.turnoService.getTurnos().subscribe({
      next: (data: any[]) => {
        this.turnos = data || [];
        console.log('Turnos cargados desde API:', this.turnos);
        this.cargarInformacionConsultorios();
      },
      error: (error: any) => {
        console.error('Error al cargar turnos:', error);
        this.handleError(error, 'turnos');
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

    const consultorioObservables = turnosConConsultorio.map(turno =>
      this.consultorioService.getConsultorio(turno.id_consultorio)
    );

    forkJoin(consultorioObservables).subscribe({
      next: (consultorios: any[]) => {
        console.log('Consultorios cargados:', consultorios);

        turnosConConsultorio.forEach((turno, index) => {
          turno.consultorio = consultorios[index];
          console.log(`Asociado consultorio ${consultorios[index]?.numero} al turno #${turno.idTurno}`);
        });

        console.log('Información de consultorios cargada exitosamente');
      },
      error: (error: any) => {
        console.error('Error al cargar información de consultorios:', error);
      }
    });
  }

  private cargarPacientesSinTurno(): void {
    this.pacienteService.getPacientes().subscribe({
      next: (response: any) => {
        const pacientes = response.content || response || [];
        console.log('=== DEBUG: TODOS LOS PACIENTES CARGADOS ===');
        console.log('Total pacientes:', pacientes.length);
        pacientes.forEach((p: any) => console.log(`- ID:${p.idPaciente} | DNI:${p.dni} | ${p.nombres} ${p.apellidos}`));

        console.log('=== DEBUG: TURNOS ACTUALES ===');
        console.log('Total turnos:', this.turnos.length);
        this.turnos.forEach(t => {
          console.log(`- Turno #${t.idTurno} | DNI:${t.dniPaciente || t.paciente?.dni || 'N/A'} | Paciente ID:${t.pacienteId || t.paciente?.idPaciente || 'N/A'}`);
        });

        this.pacientesSinTurno = pacientes.filter((paciente: any) => {
          if (!paciente || !paciente.dni) {
            console.log(`Paciente sin DNI válido:`, paciente);
            return false;
          }

          const tieneTurno = this.turnos.some((turno: any) => {
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

  asignarTurno(paciente: any): void {
    console.log('Navegando a asignar turno para paciente:', paciente);
    this.router.navigate(['/turno/asignar'], {
      state: { pacienteSeleccionado: paciente }
    });
  }
}
