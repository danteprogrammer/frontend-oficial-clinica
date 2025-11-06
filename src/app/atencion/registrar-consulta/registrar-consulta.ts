import { Component, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { Paciente, PaginaPacientes, Paciente as PacienteServiceClase } from '../../pacientes/paciente'; 
import { TriajeService } from '../../shared/triaje.service'; 
import { LaboratorioService } from '../../shared/laboratorio.service';

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
  styleUrl: './registrar-consulta.css',
  providers: [DatePipe]
})
export class RegistrarConsulta implements OnInit {
  consultaForm!: FormGroup;
  cargando = false;

  pacienteBusquedaControl = new FormControl();
  pacientesEncontrados: Paciente[] = [];
  pacienteSeleccionado: Paciente | null = null;
  idHistoriaClinicaSeleccionada: number | null = null;

  ultimoTriaje: any = null;
  historialTriajes: any[] = [];
  cargandoTriaje: boolean = false;

  historialLaboratorio: any[] = [];
  cargandoLaboratorio: boolean = false;
  idMedicoLogueado: number = 3; 

  constructor(
    private fb: FormBuilder,
    private consultaService: ConsultaService,
    private pacienteService: PacienteServiceClase, 
    private triajeService: TriajeService, 
    private laboratorioService: LaboratorioService, 
    private datePipe: DatePipe 
  ) { }

  ngOnInit(): void {
    this.consultaForm = this.fb.group({
      motivo: ['', Validators.required],
      diagnostico: ['', Validators.required],
      indicaciones: [''], 
      receta: this.fb.array([]), 
      medico: [{ idMedico: 3 }]
    });

    this.pacienteBusquedaControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        if (value && value.length > 2) {
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

  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado = paciente;
    this.pacientesEncontrados = [];
    this.pacienteBusquedaControl.setValue(`${paciente.nombres} ${paciente.apellidos}`, { emitEvent: false });

    this.cargandoTriaje = true;
    this.cargandoLaboratorio = true; 
    this.ultimoTriaje = null;
    this.historialTriajes = [];
    this.historialLaboratorio = []; 

    this.consultaService.obtenerHistoriaPorPacienteId(paciente.idPaciente!).subscribe({
      next: (historia) => {
        this.idHistoriaClinicaSeleccionada = historia.idHistoriaClinica;

        this.triajeService.getTriajesPorHistoria(historia.idHistoriaClinica).subscribe({
          next: (historial) => {
            this.mostrarDatosTriaje(historial);
            this.cargandoTriaje = false;
          },
          error: (err) => {
            console.error('Error cargando triaje:', err);
            this.cargandoTriaje = false;
          }
        });

        this.cargarHistorialLaboratorio();
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo obtener la historia clínica del paciente.', 'error');
        this.cargandoTriaje = false;
        this.cargandoLaboratorio = false; 
      }
    });
  }

  mostrarDatosTriaje(historial: any[]): void {
    this.historialTriajes = historial;
    if (historial && historial.length > 0) {
      this.ultimoTriaje = historial[0];
    } else {
      this.ultimoTriaje = null;
    }
  }

  get prescripciones() {
    return this.consultaForm.get('receta') as FormArray;
  }

  agregarMedicamento() {
    const prescripcionForm = this.fb.group({
      medicamento: ['', Validators.required],
      cantidad: ['', Validators.required],
      dosis: [''], 
      posologia: ['', Validators.required] 
    });
    this.prescripciones.push(prescripcionForm);
  }

  quitarMedicamento(index: number) {
    this.prescripciones.removeAt(index);
  }

  onSubmit(): void {
    if (this.consultaForm.invalid || !this.idHistoriaClinicaSeleccionada) {
      Swal.fire('Datos Incompletos', 'Debe seleccionar un paciente y completar el motivo y diagnóstico.', 'error');
      return;
    }

    this.cargando = true;
    const formValue = this.consultaForm.value;

    let recetaTexto = '';
    if (formValue.receta.length > 0) {
      recetaTexto = '\n\n--- RECETA MÉDICA ---\n';
      formValue.receta.forEach((med: any) => {
        recetaTexto += `- ${med.medicamento} (Cant: ${med.cantidad || 'N/A'}) (${med.dosis || 'N/A'}): ${med.posologia}\n`;
      });
    }

    const tratamientoCompleto = (formValue.indicaciones || 'Ninguna indicación.') + recetaTexto;

    const payload = {
      motivo: formValue.motivo,
      diagnostico: formValue.diagnostico,
      tratamiento: tratamientoCompleto, 
      medico: formValue.medico
    };

    this.consultaService.registrarConsulta(this.idHistoriaClinicaSeleccionada!, payload).subscribe({
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

  generarPdfReceta(): void {
    if (!this.pacienteSeleccionado) return;

    const paciente = this.pacienteSeleccionado;
    const consulta = this.consultaForm.value; 
    const fechaHoy = this.datePipe.transform(new Date(), 'dd/MM/yyyy');

    const recetaItems = consulta.receta.map((med: any) => {
      return [
        { text: med.medicamento, bold: true, style: 'recetaText' },
        { text: med.cantidad, style: 'recetaText' },
        { text: med.dosis, style: 'recetaText' },
        { text: med.posologia, style: 'recetaText' }
      ];
    });

    const recetaBody = [
      [{ text: 'Medicamento', style: 'tableHeader' }, { text: 'Cant.', style: 'tableHeader' }, { text: 'Dosis/Presentación', style: 'tableHeader' }, { text: 'Indicaciones (Posología)', style: 'tableHeader' }],
      ...recetaItems
    ];

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

        { text: 'Diagnóstico', style: 'sectionHeader' },
        { text: consulta.diagnostico || 'No especificado', style: 'text' },

        { text: 'Indicaciones Generales', style: 'sectionHeader' },
        { text: consulta.indicaciones || 'No se indicaron recomendaciones.', style: 'text' },

        { text: 'Receta Médica (R/.)', style: 'sectionHeader' },
        consulta.receta.length > 0 ? {
          table: {
            widths: ['*', 'auto', 'auto', '*'], 
            body: recetaBody
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15]
        } : { text: 'No se indicaron medicamentos.', style: 'text' },

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

        {
          table: {
            widths: ['*'],
            body: [
              [{ text: '\n\n\n\n_________________________', alignment: 'center', style: 'firma' }],
              [{ text: 'Dr. (Nombre del Médico)', alignment: 'center', style: 'firma' }],
              [{ text: 'CMP: 123456', alignment: 'center', style: 'firma' }]
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
        tableHeader: { fontSize: 10, bold: true, margin: [0, 2, 0, 2], color: '#00355d' },
        recetaText: { fontSize: 10, margin: [0, 2, 0, 2] },
        firma: { fontSize: 10, bold: false, color: '#333' },
        footer: { alignment: 'center', fontSize: 9, color: '#555', margin: [0, 20, 0, 0] }
      },
      defaultStyle: { fontSize: 10 }
    };

    pdfMake.createPdf(docDefinition).print();
  }

  cargarHistorialLaboratorio(): void {
    if (!this.idHistoriaClinicaSeleccionada) return;

    this.cargandoLaboratorio = true;
    this.laboratorioService.getOrdenesPorHistoria(this.idHistoriaClinicaSeleccionada).subscribe({
      next: (data) => {
        this.historialLaboratorio = data;
        this.cargandoLaboratorio = false;
      },
      error: (err) => {
        console.error('Error cargando historial de laboratorio:', err);
        this.cargandoLaboratorio = false;
      }
    });
  }

  async generarOrdenLaboratorio() {
    if (!this.idHistoriaClinicaSeleccionada) return;

    const { value: examenes } = await Swal.fire({
      title: 'Generar Orden de Laboratorio',
      html: `
        <p>Escriba los exámenes solicitados, separados por comas.</p>
        <textarea id="swal-examenes" class="swal2-textarea" placeholder="Ej: Hemograma, Glucosa, Perfil Lipídico"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Generar Orden',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const examenesTexto = (document.getElementById('swal-examenes') as HTMLTextAreaElement).value;
        if (!examenesTexto) {
          Swal.showValidationMessage('Debe ingresar al menos un examen.');
          return false;
        }
        return examenesTexto;
      }
    });

    if (examenes) {
      this.cargando = true;
      const request = {
        idHistoriaClinica: this.idHistoriaClinicaSeleccionada,
        idMedico: this.idMedicoLogueado,
        examenesSolicitados: examenes
      };

      this.laboratorioService.crearOrden(request).subscribe({
        next: () => {
          this.cargando = false;
          Swal.fire('Orden Generada', 'La orden de laboratorio se envió correctamente.', 'success');
          this.cargarHistorialLaboratorio(); 
        },
        error: (err) => {
          this.cargando = false;
          Swal.fire('Error', err.message, 'error');
        }
      });
    }
  }

  getEstadoOrdenClass(estado: string): string {
    if (estado === 'PENDIENTE') return 'lab-pendiente';
    if (estado === 'EN_PROCESO') return 'lab-en-proceso';
    if (estado === 'COMPLETADO') return 'lab-completado';
    return '';
  }

  limpiarFormulario(): void {
    this.consultaForm.reset();
    this.pacienteSeleccionado = null;
    this.idHistoriaClinicaSeleccionada = null;
    this.pacienteBusquedaControl.reset();
    this.consultaForm.patchValue({ medico: { idMedico: 3 } });
    this.prescripciones.clear(); 
    this.ultimoTriaje = null;
    this.historialTriajes = [];
    this.cargandoTriaje = false;
    this.historialLaboratorio = []; 
    this.cargandoLaboratorio = false; 
  }
}
