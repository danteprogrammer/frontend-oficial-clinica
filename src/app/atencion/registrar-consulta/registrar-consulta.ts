import { Component, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, switchMap, catchError, tap, distinctUntilChanged } from 'rxjs/operators';
import { Paciente, PaginaPacientes, Paciente as PacienteServiceClase } from '../../pacientes/paciente';
import { TriajeService } from '../../shared/triaje.service';
import { LaboratorioService, OrdenLaboratorioResponseDto } from '../../shared/laboratorio.service';
import { ConsultaService } from '../../shared/consulta.service';
import { Auth, MedicoInfo } from '../../auth/auth';
import { PdfService } from '../../shared/pdf.service';

declare var Swal: any;

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

  pacienteBusquedaControl = new FormControl('');
  pacientesEncontrados: Paciente[] = [];
  pacienteSeleccionado: Paciente | null = null;
  idHistoriaClinicaSeleccionada: number | null = null;

  ultimoTriaje: any = null;
  historialTriajes: any[] = [];
  cargandoTriaje: boolean = false;

  historialLaboratorio: OrdenLaboratorioResponseDto[] = [];
  cargandoLaboratorio: boolean = false;

  idMedicoLogueado: number | null = null;
  medicoInfo: MedicoInfo | null = null;

  private termBusqueda$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private consultaService: ConsultaService,
    private pacienteService: PacienteServiceClase,
    private triajeService: TriajeService,
    private laboratorioService: LaboratorioService,
    private datePipe: DatePipe,
    private authService: Auth,
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {
    this.medicoInfo = this.authService.getMedicoInfo();
    this.idMedicoLogueado = this.medicoInfo?.id || null;

    this.consultaForm = this.fb.group({
      motivo: ['', Validators.required],
      diagnostico: ['', Validators.required],
      indicaciones: [''],
      receta: this.fb.array([]),
    });

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
      catchError(err => {
        console.error('Error buscando pacientes', err);
        return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
      })
    ).subscribe((pagina: PaginaPacientes) => {
      this.pacientesEncontrados = pagina.content;
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

  buscarPaciente(event: Event): void {
  }

  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado = paciente;
    this.pacientesEncontrados = [];
    this.pacienteBusquedaControl.setValue(`${paciente.nombres} ${paciente.apellidos} (DNI: ${paciente.dni})`, { emitEvent: false }); // <-- Añadido DNI

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
      this.consultaForm.markAllAsTouched();
      return;
    }

    if (!this.idMedicoLogueado) {
      Swal.fire('Error de Autenticación', 'No se pudo identificar al médico. Por favor, inicie sesión de nuevo.', 'error');
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
      peso: this.ultimoTriaje?.peso,
      altura: this.ultimoTriaje?.altura,
      imc: this.ultimoTriaje?.imc,
      medico: { idMedico: this.idMedicoLogueado }
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
            this.lanzarPdfReceta();
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

  private lanzarPdfReceta(): void {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'No hay un paciente seleccionado para generar la receta.', 'error');
      return;
    }

    const consultaFormValue = {
      ...this.consultaForm.value,
      motivo: this.consultaForm.value.motivo,
    };

    this.pdfService.generarPdfReceta(
      this.pacienteSeleccionado,
      consultaFormValue,
      this.medicoInfo
    );
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
      html:
        '<p>Escriba los exámenes solicitados, separados por comas.</p>' +
        '<textarea id="swal-examenes" class="swal2-textarea" placeholder="Ej: Hemograma, Glucosa, Perfil Lipídico"></textarea>',
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
    this.prescripciones.clear();
    this.ultimoTriaje = null;
    this.historialTriajes = [];
    this.cargandoTriaje = false;
    this.historialLaboratorio = [];
    this.cargandoLaboratorio = false;
  }
}