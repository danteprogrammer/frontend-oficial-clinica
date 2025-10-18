import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FacturacionService } from '../../shared/facturacion.service';
import { SeguroService } from '../validar-seguro/validar-seguro'; // Reutilizamos el servicio de seguro

declare var Swal: any;

@Component({
  selector: 'app-generar-factura',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './generar-factura.html',
  styleUrl: './generar-factura.css'
})
export class GenerarFactura implements OnInit {

  busquedaForm: FormGroup;
  pagoForm: FormGroup;
  citasPendientes: any[] = [];
  citaSeleccionada: any = null;
  cargando = false;
  mensajeError: string | null = null;
  seguroValidado = false;

  constructor(
    private fb: FormBuilder,
    private facturacionService: FacturacionService,
    private seguroService: SeguroService
  ) {
    this.busquedaForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });

    this.pagoForm = this.fb.group({
      tipoComprobante: ['boleta', Validators.required],
      // Campos de seguro
      nombreAseguradora: [''],
      numeroPoliza: [''],
      cobertura: [''],
      // Campos de pago sin seguro
      metodoPago: ['efectivo']
    });
  }

  ngOnInit(): void {}

  buscarCitas(): void {
    if (this.busquedaForm.invalid) {
      this.mensajeError = 'Por favor, ingrese un DNI válido de 8 dígitos.';
      return;
    }
    this.cargando = true;
    this.mensajeError = null;
    this.citasPendientes = [];
    this.citaSeleccionada = null;

    const dni = this.busquedaForm.value.dni;
    this.facturacionService.getCitasPendientesPorDni(dni).subscribe({
      next: (citas) => {
        if (citas.length === 0) {
          this.mensajeError = 'El paciente no tiene citas pendientes de pago para hoy.';
        }
        this.citasPendientes = citas;
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = err.message;
        this.cargando = false;
      }
    });
  }

  seleccionarCita(cita: any): void {
    this.citaSeleccionada = cita;
    this.seguroValidado = false; // Reiniciar estado de validación
    this.pagoForm.reset({
      tipoComprobante: 'boleta',
      metodoPago: 'efectivo'
    });
  }

  validarSeguro(): void {
    if (!this.citaSeleccionada) return;
    this.cargando = true;
    // Simulamos la validación que ya tenías
    this.seguroService.validarSeguro(this.citaSeleccionada.idPaciente).subscribe({
        next: (response) => {
            this.cargando = false;
            if (response.estado === 'Válido') {
                this.seguroValidado = true;
                Swal.fire('Seguro Válido', response.mensaje, 'success');
            } else {
                this.seguroValidado = false;
                Swal.fire('Seguro Inválido', response.mensaje, 'warning');
            }
        },
        error: (err) => {
            this.cargando = false;
            Swal.fire('Error de Validación', err.message, 'error');
        }
    });
  }

  generarComprobante(): void {
    if (this.pagoForm.invalid) {
        Swal.fire('Error', 'Debe seleccionar un tipo de comprobante.', 'error');
        return;
    }

    // Lógica para procesar el pago...
    console.log('Generando comprobante para:', this.citaSeleccionada);
    console.log('Datos de pago:', this.pagoForm.value);

    Swal.fire({
        title: '¡Pago Registrado!',
        text: `Se ha generado la ${this.pagoForm.value.tipoComprobante} para la cita.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Imprimir y Finalizar',
        cancelButtonText: 'Finalizar sin Imprimir'
    }).then((result: any) => {
        if (result.isConfirmed) {
            // Lógica de impresión
            window.print();
        }
        // Limpiar todo para la siguiente facturación
        this.busquedaForm.reset();
        this.citasPendientes = [];
        this.citaSeleccionada = null;
    });
  }
}
