import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Paciente, PacienteServiceClase, PaginaPacientes } from '../../shared/paciente.service';
import { ConsultaService, HistorialConsulta } from '../../shared/consulta.service'; 
import { LaboratorioService, OrdenLaboratorioResponseDto } from '../../shared/laboratorio.service';
import { Auth, MedicoInfo } from '../../auth/auth';
import { PdfService } from '../../shared/pdf.service';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Subject, of } from 'rxjs'; 

declare var Swal: any;

@Component({
  selector: 'app-historial-consultas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './historial-consultas.html',
  styleUrl: './historial-consultas.css',
  providers: [DatePipe]
})
export class HistorialConsultas implements OnInit {

  pacienteBusquedaControl = new FormControl('');
  pacientesEncontrados: Paciente[] = [];
  pacienteSeleccionado: Paciente | null = null;
  idHistoriaClinicaSeleccionada: number | null = null;
  private termBusqueda$ = new Subject<string>();

  consultas: HistorialConsulta[] = []; 
  ordenesLab: OrdenLaboratorioResponseDto[] = []; 

  cargandoHistorial = false;
  error: string | null = null;

  medicoInfo: MedicoInfo | null;

  constructor(
    private pacienteService: PacienteServiceClase,
    private consultaService: ConsultaService,
    private laboratorioService: LaboratorioService,
    private authService: Auth,
    private pdfService: PdfService
  ) {
    this.medicoInfo = this.authService.getMedicoInfo();
  }

  ngOnInit(): void {
    this.termBusqueda$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (term && term.length > 2) {
          const filtro = /^\d+$/.test(term) ? 'DNI' : 'nombre';
          return this.pacienteService.buscarPacientesActivos(term, filtro, 0, 5);
        } else {
          this.pacientesEncontrados = [];
          return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
        }
      }),
      tap(() => this.error = null)
    ).subscribe({
      next: (pagina: PaginaPacientes) => {
        this.pacientesEncontrados = pagina.content;
      },
      error: (err) => {
        this.error = 'Error al buscar pacientes: ' + err.message;
        this.pacientesEncontrados = [];
      }
    });

    this.pacienteBusquedaControl.valueChanges.pipe(
      tap(value => {
        if (!value) this.pacientesEncontrados = [];
      })
    ).subscribe(value => {
      if (value && value.length > 2) {
        this.termBusqueda$.next(value);
      }
    });
  }

  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado = paciente;
    this.pacientesEncontrados = []; 
    this.pacienteBusquedaControl.setValue(`${paciente.nombres} ${paciente.apellidos} (DNI: ${paciente.dni})`, { emitEvent: false });

    this.cargandoHistorial = true;
    this.consultaService.obtenerHistoriaPorPacienteId(paciente.idPaciente!).subscribe({
      next: (historia) => {
        this.idHistoriaClinicaSeleccionada = historia.idHistoriaClinica;

        this.consultas = [];
        this.ordenesLab = [];
        this.error = null;

        if (this.idHistoriaClinicaSeleccionada) {
          Promise.all([
            this.consultaService.getConsultasPorHistoria(this.idHistoriaClinicaSeleccionada).toPromise(),
            this.laboratorioService.getOrdenesPorHistoria(this.idHistoriaClinicaSeleccionada).toPromise()
          ]).then(([consultasData, ordenesData]) => {
            this.consultas = consultasData || [];
            this.ordenesLab = ordenesData || [];
            this.cargandoHistorial = false;
          }).catch(err => {
            this.error = 'Error al cargar el historial: ' + err.message;
            this.cargandoHistorial = false;
          });

        } else {
          this.error = "Este paciente no tiene una historia clínica registrada.";
          this.cargandoHistorial = false;
        }
      },
      error: (err) => {
        this.error = "Error al obtener la historia clínica: " + err.message;
        this.cargandoHistorial = false;
      }
    });
  }

  limpiarPaciente(): void {
    this.pacienteSeleccionado = null;
    this.idHistoriaClinicaSeleccionada = null;
    this.pacienteBusquedaControl.reset();
    this.consultas = [];
    this.ordenesLab = [];
    this.error = null;
  }

  verReceta(consulta: HistorialConsulta): void {
    if (!this.pacienteSeleccionado) return;

    const consultaFormValue = {
      motivoConsulta: consulta.motivo, 
      diagnostico: consulta.diagnostico,
      indicaciones: this.extraerIndicaciones(consulta.tratamiento),
      receta: this.parseReceta(consulta.tratamiento)
    };

    const medicoConsulta: MedicoInfo = {
      id: consulta.medico.idMedico!,
      nombres: consulta.medico.nombres,
      apellidos: consulta.medico.apellidos,
      cmp: consulta.medico.licenciaMedica,
      sexo: consulta.medico.sexo.toString() 
    };

    this.pdfService.generarPdfReceta(this.pacienteSeleccionado, consultaFormValue, medicoConsulta);
  }

  private extraerIndicaciones(tratamiento: string): string {
    if (!tratamiento) return 'Ninguna indicación.';
    const recetaMarker = '--- RECETA MÉDICA ---';
    const markerIndex = tratamiento.indexOf(recetaMarker);
    if (markerIndex === -1) {
      return tratamiento; 
    }
    return tratamiento.substring(0, markerIndex).trim();
  }

  private parseReceta(tratamiento: string): any[] {
    if (!tratamiento) return [];
    const recetaMarker = '--- RECETA MÉDICA ---';
    const markerIndex = tratamiento.indexOf(recetaMarker);
    if (markerIndex === -1) {
      return []; 
    }

    const recetaTexto = tratamiento.substring(markerIndex + recetaMarker.length).trim();
    const lineas = recetaTexto.split('\n');
    const recetaParseada: any[] = [];

    lineas.forEach(linea => {
      linea = linea.replace(/^- /, ''); 
      const match = linea.match(/(.*) \(Cant: (.*)\) \((.*)\): (.*)/);

      if (match) {
        recetaParseada.push({
          medicamento: match[1].trim(),
          cantidad: match[2].trim(),
          dosis: match[3].trim(),
          posologia: match[4].trim()
        });
      }
    });
    return recetaParseada;
  }

  transformDateToAge(value: string | Date): number {
    if (!value) return 0;
    const today = new Date();
    const birthDate = new Date(value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}