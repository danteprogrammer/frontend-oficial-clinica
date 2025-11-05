import { Component, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; // <-- Importar DatePipe
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { Paciente, PaginaPacientes, Paciente as PacienteServiceClase } from '../../pacientes/paciente'; // Renombrado
import { TriajeService } from '../../shared/triaje.service'; // <-- Importar TriajeService

// Importaciones de PDFMake
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMakeInstance: any = (pdfMake as any);
pdfMakeInstance.vfs = (pdfFonts as any).vfs;

declare var Swal: any;

@Injectable({ providedIn: 'root' })
export class ConsultaService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  registrarConsulta(idHistoriaClinica: number, consulta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultas/historia/${idHistoriaClinica}`, consulta);
  }

  obtenerHistoriaPorPacienteId(idPaciente: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/historias/paciente/${idPaciente}`);
  }
}

@Component({
  selector: 'app-registrar-consulta',
  imports: [ReactiveFormsModule, CommonModule, DatePipe],
  templateUrl: './registrar-consulta.html',
  styleUrl: './registrar-consulta.css'
})
export class RegistrarConsulta implements OnInit {
  consultaForm!: FormGroup;
  cargando = false;

  pacienteBusquedaControl = new FormControl();
  pacientesEncontrados: Paciente[] = [];
  pacienteSeleccionado: Paciente | null = null;
  idHistoriaClinicaSeleccionada: number | null = null;

  // Nuevas variables para Triaje
  ultimoTriaje: any = null;
  historialTriajes: any[] = [];
  cargandoTriaje: boolean = false;

  constructor(
    private fb: FormBuilder,
    private consultaService: ConsultaService,
    private pacienteService: PacienteServiceClase, // Usamos el nombre renombrado
    private triajeService: TriajeService, // <-- Inyectar TriajeService
    private datePipe: DatePipe // <-- Inyectar DatePipe
  ) { }

  ngOnInit(): void {
    // FORMULARIO MODIFICADO: Quitamos los signos vitales
    this.consultaForm = this.fb.group({
      motivo: ['', Validators.required],
      diagnostico: ['', Validators.required],
      tratamiento: [''],
      // Ya no necesitamos 'peso', 'altura', 'presionArterial', 'ritmoCardiaco'
      medico: [{ idMedico: 3 }] // Dejamos el ID del médico quemado por ahora
    });

    this.pacienteBusquedaControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        if (value && value.length > 2) {
          // Buscamos por DNI o nombre
          const filtro = /^\d+$/.test(value) ? 'DNI' : 'nombre';
          return this.pacienteService.buscarPacientesActivos(value, filtro, 0, 5);
        } else {
          this.pacientesEncontrados = [];
          return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
        }
      }),
      catchError(err => {
        console.error('Error buscando pacientes', err);
        return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
      })
    ).subscribe((pagina: PaginaPacientes) => {
      this.pacientesEncontrados = pagina.content;
    });
  }

  /**
   * MÉTODO MODIFICADO
   * Ahora también carga el historial de triaje.
   */
  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado = paciente;
    this.pacientesEncontrados = [];
    this.pacienteBusquedaControl.setValue(`${paciente.nombres} ${paciente.apellidos}`, { emitEvent: false });

    this.cargandoTriaje = true; // Inicia carga de triaje
    this.ultimoTriaje = null;
    this.historialTriajes = [];

    this.consultaService.obtenerHistoriaPorPacienteId(paciente.idPaciente!).subscribe({
      next: (historia) => {
        this.idHistoriaClinicaSeleccionada = historia.idHistoriaClinica;

        // Ahora, buscamos el triaje
        this.triajeService.getTriajesPorHistoria(historia.idHistoriaClinica).subscribe({
          next: (historial) => {
            this.mostrarDatosTriaje(historial);
            this.cargandoTriaje = false;
          },
          error: (err) => {
            Swal.fire('Error de Triaje', 'No se pudo cargar el historial de triaje.', 'error');
            this.cargandoTriaje = false;
          }
        });
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo obtener la historia clínica del paciente.', 'error');
        this.cargandoTriaje = false;
      }
    });
  }

  /**
   * NUEVO MÉTODO
   * Procesa el historial de triajes y selecciona el más reciente.
   */
  mostrarDatosTriaje(historial: any[]): void {
    this.historialTriajes = historial;
    if (historial && historial.length > 0) {
      // El historial ya viene ordenado por fecha (el más reciente primero)
      this.ultimoTriaje = historial[0];
    } else {
      this.ultimoTriaje = null;
    }
  }

  /**
   * MÉTODO MODIFICADO
   * Pregunta si se desea imprimir la receta al finalizar.
   */
  onSubmit(): void {
    if (this.consultaForm.invalid || !this.idHistoriaClinicaSeleccionada) {
      Swal.fire('Datos Incompletos', 'Debe seleccionar un paciente y completar el motivo y diagnóstico.', 'error');
      return;
    }

    this.cargando = true;
    this.consultaService.registrarConsulta(this.idHistoriaClinicaSeleccionada, this.consultaForm.value).subscribe({
      next: () => {
        this.cargando = false;

        Swal.fire({
          title: '¡Éxito!',
          text: 'La consulta ha sido registrada. ¿Desea imprimir la receta?',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '🖨️ Imprimir Receta',
          cancelButtonText: 'Finalizar'
        }).then((result: any) => {
          if (result.isConfirmed) {
            this.generarPdfReceta();
          }
          this.limpiarFormulario();
        });

      },
      error: (err) => {
        this.cargando = false;
        Swal.fire('Error', err.error?.message || 'No se pudo registrar la consulta.', 'error');
      }
    });
  }

  /**
   * NUEVO MÉTODO
   * Genera el PDF de la receta usando pdfMake.
   */
  generarPdfReceta(): void {
    if (!this.pacienteSeleccionado) return;

    const paciente = this.pacienteSeleccionado;
    const consulta = this.consultaForm.value;
    const fechaHoy = this.datePipe.transform(new Date(), 'dd/MM/yyyy');

    const docDefinition: any = {
      content: [
        {
          columns: [
            { text: 'Clínica SaludVida', style: 'header' },
            { text: `Fecha: ${fechaHoy}`, alignment: 'right', style: 'subheader' }
          ]
        },
        { text: 'Receta Médica', style: 'subheader', alignment: 'center' },
        {
          canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#999' }],
          margin: [0, 5, 0, 15]
        },

        // Datos del Paciente
        { text: 'Datos del Paciente', style: 'sectionHeader' },
        {
          table: {
            widths: ['auto', '*'],
            body: [
              [{ text: 'Paciente:', bold: true }, `${paciente.nombres} ${paciente.apellidos}`],
              [{ text: 'DNI:', bold: true }, paciente.dni],
            ]
          },
          layout: 'noBorders',
          margin: [0, 5, 0, 15]
        },

        // Datos de la Consulta
        { text: 'Diagnóstico', style: 'sectionHeader' },
        { text: consulta.diagnostico || 'No especificado', style: 'text' },

        { text: 'Tratamiento y Receta (R/.)', style: 'sectionHeader' },
        { text: consulta.tratamiento || 'No se indicaron medicamentos.', style: 'text' },

        // Si hay datos de triaje, los mostramos
        this.ultimoTriaje ? {
          stack: [
            { text: 'Signos Vitales (Referencial)', style: 'sectionHeader', margin: [0, 15, 0, 5] },
            {
              columns: [
                { text: [{ text: 'P.A.: ', bold: true }, this.ultimoTriaje.presionArterial || 'N/A'] },
                { text: [{ text: 'Peso: ', bold: true }, `${this.ultimoTriaje.peso || 'N/A'} kg`] },
                { text: [{ text: 'Temp: ', bold: true }, `${this.ultimoTriaje.temperatura || 'N/A'} °C`] },
                { text: [{ text: 'Sat O₂: ', bold: true }, `${this.ultimoTriaje.saturacionOxigeno || 'N/A'} %`] },
              ],
              style: 'text'
            }
          ]
        } : {},

        // Firma
        {
          table: {
            widths: ['*'],
            body: [
              [{ text: '\n\n\n\n_________________________', alignment: 'center', style: 'firma' }],
              [{ text: 'Dr. (Nombre del Médico)', alignment: 'center', style: 'firma' }], // Aquí iría el nombre del médico logueado
              [{ text: 'CMP: 123456', alignment: 'center', style: 'firma' }] // Aquí iría el CMP del médico logueado
            ]
          },
          layout: 'noBorders',
          margin: [0, 50, 0, 10]
        },

        { text: 'Av. Principal 123, Lima - Perú | Teléfono: (01) 234-5678', style: 'footer' }
      ],
      styles: {
        header: { fontSize: 20, bold: true, color: '#005792' },
        subheader: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#005792' },
        text: { margin: [0, 0, 0, 10], fontSize: 11, alignment: 'justify' },
        firma: { fontSize: 10, bold: false, color: '#333' },
        footer: { alignment: 'center', fontSize: 9, color: '#555', margin: [0, 20, 0, 0] }
      },
      defaultStyle: { fontSize: 10 }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  /**
   * MÉTODO MODIFICADO
   * Limpia también las variables de triaje.
   */
  limpiarFormulario(): void {
    this.consultaForm.reset();
    this.pacienteSeleccionado = null;
    this.idHistoriaClinicaSeleccionada = null;
    this.pacienteBusquedaControl.reset();
    this.consultaForm.patchValue({ medico: { idMedico: 3 } });

    // Limpiar variables de triaje
    this.ultimoTriaje = null;
    this.historialTriajes = [];
    this.cargandoTriaje = false;
  }
}
