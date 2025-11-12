import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConsultorioService, Consultorio } from '../../shared/consultorio.service';
import { EspecialidadService } from '../../shared/especialidad.service'; 
import { Especialidad } from '../../shared/especialidad.model'; 

export interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
}

@Component({
  selector: 'app-gestion-consultorios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-consultorios.html',
  styleUrls: ['./gestion-consultorios.css']
})
export class GestionConsultorios { 

  consultorios: Consultorio[] = [];
  especialidades: Especialidad[] = [];
  consultorioForm: FormGroup;

  mostrarModal = false;
  modoEdicion = false;
  consultorioIdActual: number | null = null;

  cargando = false;
  error: string | null = null;
  errorFormulario: string | null = null;

  constructor(
    private consultorioService: ConsultorioService,
    private especialidadService: EspecialidadService,
    private fb: FormBuilder
  ) {
    this.consultorioForm = this.fb.group({
      numero: ['', Validators.required],
      piso: [null, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      especialidadId: [null, Validators.required],
      estado: ['Disponible', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarConsultorios();
    this.cargarEspecialidades();
  }

  cargarConsultorios(): void {
    this.cargando = true;
    this.error = null;
    this.consultorioService.getConsultorios().subscribe({
      next: (data) => {
        this.consultorios = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      }
    });
  }

  cargarEspecialidades(): void {
    this.especialidadService.getEspecialidades().subscribe({
      next: (data) => {
        this.especialidades = data;
      },
      error: (err) => {
        console.error("Error al cargar especialidades: ", err.message);
        this.errorFormulario = "No se pudieron cargar las especialidades. Recargue la página.";
      }
    });
  }

  abrirModal(consultorio?: Consultorio): void {
    this.errorFormulario = null;
    this.mostrarModal = true;
    if (consultorio) {
      this.modoEdicion = true;
      this.consultorioIdActual = consultorio.idConsultorio;
      this.consultorioForm.setValue({
        numero: consultorio.numero,
        piso: consultorio.piso,
        descripcion: consultorio.descripcion,
        especialidadId: consultorio.especialidad.idEspecialidad, 
        estado: consultorio.estado
      });
    } else {
      this.modoEdicion = false;
      this.consultorioIdActual = null;
      this.consultorioForm.reset({
        estado: 'Disponible',
        especialidadId: null
      });
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.consultorioForm.reset();
  }

  guardarConsultorio(): void {
    if (this.consultorioForm.invalid) {
      this.errorFormulario = "Por favor, complete todos los campos requeridos.";
      return;
    }
    this.errorFormulario = null;

    const datosFormulario = this.consultorioForm.value;
    const datosConsultorio = {
      numero: datosFormulario.numero,
      piso: datosFormulario.piso,
      descripcion: datosFormulario.descripcion,
      estado: datosFormulario.estado,
      especialidad: {
        idEspecialidad: datosFormulario.especialidadId 
      }
    };

    if (this.modoEdicion && this.consultorioIdActual !== null) {
      this.consultorioService.actualizarConsultorio(this.consultorioIdActual, datosConsultorio).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.cargarConsultorios();
            this.cerrarModal();
          } else {
            this.errorFormulario = response.message;
          }
        },
        error: (err) => this.errorFormulario = err.message
      });
    } else {
      this.consultorioService.crearConsultorio(datosConsultorio).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.cargarConsultorios();
            this.cerrarModal();
          } else {
            this.errorFormulario = response.message;
          }
        },
        error: (err) => this.errorFormulario = err.message
      });
    }
  }

  confirmarEliminacion(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este consultorio? Esta acción no se puede deshacer.')) {
      this.consultorioService.eliminarConsultorio(id).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.cargarConsultorios();
          } else {
            alert("Error: " + response.message);
          }
        },
        error: (err) => alert("Error al eliminar: " + err.message)
      });
    }
  }
}