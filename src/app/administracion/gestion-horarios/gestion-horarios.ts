// danteprogrammer/frontend-oficial-clinica/frontend-oficial-clinica-d73cc6d747f9a00ca287400c9b42abccd4bf9457/src/app/administracion/gestion-horarios.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms'; // Importar FormsModule
import { Medico, MedicoService } from '../../shared/medico.service';
import { Horario, HorarioService, HorarioRequest } from '../../shared/horario.service';

declare var Swal: any;

@Component({
  selector: 'app-gestion-horarios',
  // Asegúrate de importar CommonModule, ReactiveFormsModule y FormsModule
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './gestion-horarios.html',
  styleUrl: './gestion-horarios.css'
})
export class GestionHorarios implements OnInit {
  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = []; // Lista para la tabla filtrada
  horarios: Horario[] = [];

  medicoSeleccionado: Medico | null = null; // Objeto del médico seleccionado
  medicoSeleccionadoId: number | null = null; // ID (aún útil para el request)

  cargandoMedicos = true;
  cargandoHorarios = false;
  error: string | null = null;
  filtroMedicos: string = ''; // Término de búsqueda

  horarioForm: FormGroup;

  diasSemana = [
    { valor: 'MONDAY', nombre: 'Lunes' },
    { valor: 'TUESDAY', nombre: 'Martes' },
    { valor: 'WEDNESDAY', nombre: 'Miércoles' },
    { valor: 'THURSDAY', nombre: 'Jueves' },
    { valor: 'FRIDAY', nombre: 'Viernes' },
    { valor: 'SATURDAY', nombre: 'Sábado' },
    { valor: 'SUNDAY', nombre: 'Domingo' }
  ];

  constructor(
    private medicoService: MedicoService,
    private horarioService: HorarioService,
    private fb: FormBuilder
  ) {
    this.horarioForm = this.fb.group({
      diaSemana: [null, Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required]
    }, { validators: this.validarHoras });
  }

  ngOnInit(): void {
    this.medicoService.getMedicos().subscribe({
      next: (data) => {
        // Almacenamos solo médicos activos
        this.medicos = data.filter(m => m.estado === 'Activo');
        // Inicialmente, la lista filtrada es la lista completa
        this.medicosFiltrados = [...this.medicos];
        this.cargandoMedicos = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los médicos. ' + err.message;
        this.cargandoMedicos = false;
      }
    });
  }

  // Método para filtrar la tabla de médicos
  buscarMedicos(): void {
    const termino = this.filtroMedicos.toLowerCase();
    if (!termino) {
      this.medicosFiltrados = [...this.medicos];
      return;
    }

    this.medicosFiltrados = this.medicos.filter(m =>
      m.nombres.toLowerCase().includes(termino) ||
      m.apellidos.toLowerCase().includes(termino) ||
      m.dni.toLowerCase().includes(termino) ||
      m.especialidad.nombre.toLowerCase().includes(termino)
    );
  }

  // Se llama al hacer clic en "Seleccionar"
  seleccionarMedico(medico: Medico): void {
    this.medicoSeleccionado = medico;
    this.medicoSeleccionadoId = medico.idMedico!;
    this.horarios = [];
    this.error = null;
    this.cargarHorarios(medico.idMedico!);
  }

  // Se llama al hacer clic en "Cambiar Médico"
  cambiarMedico(): void {
    this.medicoSeleccionado = null;
    this.medicoSeleccionadoId = null;
    this.horarios = [];
    this.error = null;
    this.filtroMedicos = ''; // Limpiar filtro
    this.medicosFiltrados = [...this.medicos]; // Resetear tabla
  }


  cargarHorarios(idMedico: number): void {
    this.cargandoHorarios = true;
    this.horarioService.getHorarios(idMedico).subscribe({
      next: (data) => {
        this.horarios = data;
        this.cargandoHorarios = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los horarios. ' + err.message;
        this.cargandoHorarios = false;
      }
    });
  }

  onSubmit(): void {
    if (this.horarioForm.invalid || !this.medicoSeleccionadoId) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    const request: HorarioRequest = {
      idMedico: this.medicoSeleccionadoId,
      ...this.horarioForm.value
    };

    this.cargandoHorarios = true;
    this.horarioService.crearHorario(request).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Nuevo horario agregado.', 'success');
        this.horarioForm.reset({ diaSemana: null });
        if (this.medicoSeleccionadoId) this.cargarHorarios(this.medicoSeleccionadoId);
      },
      error: (err) => {
        Swal.fire('Error', err.message, 'error');
        this.cargandoHorarios = false;
      }
    });
  }

  eliminar(idHorario: number): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: "Este horario será eliminado permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.cargandoHorarios = true;
        this.horarioService.eliminarHorario(idHorario).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El horario ha sido eliminado.', 'success');
            if (this.medicoSeleccionadoId) this.cargarHorarios(this.medicoSeleccionadoId);
          },
          error: (err) => {
            Swal.fire('Error', err.message, 'error');
            this.cargandoHorarios = false;
          }
        });
      }
    });
  }

  validarHoras(group: FormGroup) {
    const inicio = group.get('horaInicio')?.value;
    const fin = group.get('horaFin')?.value;
    return (inicio && fin && inicio >= fin) ? { horaInvalida: true } : null;
  }

  traducirDia(diaValor: string): string {
    const dia = this.diasSemana.find(d => d.valor === diaValor);
    return dia ? dia.nombre : diaValor;
  }
}