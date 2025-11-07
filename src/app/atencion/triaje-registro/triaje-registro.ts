import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { Paciente, PaginaPacientes, Paciente as PacienteServiceClase } from '../../pacientes/paciente';
import { ConsultaService } from '../../shared/consulta.service';
import { TriajeService } from '../../shared/triaje.service'; 

declare var Swal: any;

@Component({
  selector: 'app-triaje-registro',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, DatePipe],
  templateUrl: './triaje-registro.html',
  styleUrl: './triaje-registro.css'
})
export class TriajeRegistro implements OnInit {

  pacienteBusquedaControl = new FormControl();
  pacientesEncontrados: Paciente[] = [];
  pacienteSeleccionado: Paciente | null = null;
  idHistoriaClinica: number | null = null;

  triajeForm!: FormGroup;
  imcCalculado: number | null = null;

  historialTriajes: any[] = [];
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private pacienteService: PacienteServiceClase, 
    private consultaService: ConsultaService,  
    private triajeService: TriajeService 
  ) { }

  ngOnInit(): void {
    this.triajeForm = this.fb.group({
      peso: [null, [Validators.required, Validators.min(1)]],
      altura: [null, [Validators.required, Validators.min(50)]],
      presionSistolica: [null, [Validators.required, Validators.min(50), Validators.max(300)]], 
      presionDiastolica: [null, [Validators.required, Validators.min(30), Validators.max(200)]], 
      temperatura: [null, [Validators.required, Validators.min(30), Validators.max(45)]],
      saturacionOxigeno: [null, [Validators.required, Validators.min(70), Validators.max(100)]]
    });

    this.pacienteBusquedaControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        if (value && value.length > 2) {
          const filtro = /^\d+$/.test(value) ? 'DNI' : 'nombre';
          return this.pacienteService.buscarPacientesActivos(value, filtro, 0, 5);
        }
        this.pacientesEncontrados = [];
        return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
      }),
      catchError(err => {
        console.error('Error buscando pacientes', err);
        return of({ content: [], totalPages: 0, totalElements: 0, number: 0 } as PaginaPacientes);
      })
    ).subscribe((pagina: PaginaPacientes) => {
      this.pacientesEncontrados = pagina.content;
    });

    this.triajeForm.get('peso')?.valueChanges.subscribe(() => this.calcularIMC());
    this.triajeForm.get('altura')?.valueChanges.subscribe(() => this.calcularIMC());
  }

  seleccionarPaciente(paciente: Paciente): void {
    this.cargando = true;
    this.pacienteSeleccionado = paciente;
    this.pacientesEncontrados = [];
    this.pacienteBusquedaControl.setValue(`${paciente.nombres} ${paciente.apellidos} (DNI: ${paciente.dni})`, { emitEvent: false });
    this.historialTriajes = [];
    this.idHistoriaClinica = null;

    this.consultaService.obtenerHistoriaPorPacienteId(paciente.idPaciente!).subscribe({
      next: (historia) => {
        this.idHistoriaClinica = historia.idHistoriaClinica;
        this.cargarHistorial();
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo obtener la historia clínica del paciente.', 'error');
        this.cargando = false;
      }
    });
  }

  cargarHistorial(): void {
    if (!this.idHistoriaClinica) return;

    this.triajeService.getTriajesPorHistoria(this.idHistoriaClinica).subscribe({
      next: (historial) => {
        this.historialTriajes = historial;
        this.cargando = false;
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo cargar el historial de triajes.', 'error');
        this.cargando = false;
      }
    });
  }

  calcularIMC(): void {
    const peso = this.triajeForm.get('peso')?.value;
    const altura = this.triajeForm.get('altura')?.value;

    if (peso > 0 && altura > 0) {
      const alturaMetros = altura / 100;
      const imc = peso / (alturaMetros * alturaMetros);
      this.imcCalculado = parseFloat(imc.toFixed(2));
    } else {
      this.imcCalculado = null;
    }
  }

  onSubmit(): void {
    if (this.triajeForm.invalid || !this.idHistoriaClinica) {
      Swal.fire('Datos Incompletos', 'Debe seleccionar un paciente y completar todos los campos de signos vitales.', 'error');
      this.triajeForm.markAllAsTouched();
      return;
    }

    this.cargando = true;

    const formValue = this.triajeForm.value;
    const presionArterialCombinada = `${formValue.presionSistolica}/${formValue.presionDiastolica}`;

    const datosTriaje = {
      peso: formValue.peso,
      altura: formValue.altura,
      presionArterial: presionArterialCombinada, 
      temperatura: formValue.temperatura,
      saturacionOxigeno: formValue.saturacionOxigeno
    };

    this.triajeService.registrarTriaje(this.idHistoriaClinica, datosTriaje).subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire('¡Éxito!', 'Triaje registrado correctamente.', 'success');
        this.limpiarFormulario();
        this.cargarHistorial(); 
      },
      error: (err) => {
        this.cargando = false;
        Swal.fire('Error', err.message || 'No se pudo registrar el triaje.', 'error');
      }
    });
  }

  limpiarFormulario(): void {
    this.triajeForm.reset();
    this.imcCalculado = null;
  }

  limpiarPaciente(): void {
    this.pacienteSeleccionado = null;
    this.idHistoriaClinica = null;
    this.historialTriajes = [];
    this.pacienteBusquedaControl.setValue('');
    this.pacienteBusquedaControl.enable();
    this.limpiarFormulario();
  }

  get f() { return this.triajeForm.controls; }
}