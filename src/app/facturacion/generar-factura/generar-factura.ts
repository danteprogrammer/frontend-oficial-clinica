import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FacturacionService } from '../../shared/facturacion.service';
import { SeguroService } from '../validar-seguro/validar-seguro';

declare var Swal: any;

@Component({
  selector: 'app-generar-factura',
  imports: [ReactiveFormsModule, CommonModule, DatePipe, TitleCasePipe],
  templateUrl: './generar-factura.html',
  styleUrl: './generar-factura.css'
})
export class GenerarFactura implements OnInit {

  currentDate = new Date();
  busquedaForm: FormGroup;
  pagoForm: FormGroup;
  citasPendientes: any[] = [];
  citaSeleccionada: any = null;
  cargando = false;
  mensajeError: string | null = null;
  seguroValidado: boolean | null = null;
  modoPago: 'seguro' | 'directo' = 'directo';
  intentoValidacion: boolean = false;
  
  // Nueva propiedad para controlar si se debe mostrar el recibo
  mostrarRecibo: boolean = false;

  constructor(
    private fb: FormBuilder,
    private facturacionService: FacturacionService,
    private seguroService: SeguroService,
    private cd: ChangeDetectorRef
  ) {
    this.busquedaForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });

    this.pagoForm = this.fb.group({
      tipoComprobante: ['boleta', Validators.required],
      nombreAseguradora: [''],
      numeroPoliza: [''],
      cobertura: [''],
      metodoPago: ['efectivo']
    });
  }

  ngOnInit(): void { }

  buscarCitas(): void {
    if (this.busquedaForm.invalid) {
      this.mensajeError = 'Por favor, ingrese un DNI válido de 8 dígitos.';
      return;
    }
    this.cargando = true;
    this.mensajeError = null;
    this.citasPendientes = [];
    this.citaSeleccionada = null;
    this.mostrarRecibo = false;

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
    this.seguroValidado = null;
    this.intentoValidacion = false;
    this.mostrarRecibo = false;
    this.modoPago = cita.tieneSeguro ? 'seguro' : 'directo';
    this.pagoForm.reset({
      tipoComprobante: 'boleta',
      metodoPago: 'efectivo'
    });
  }

  cambiarModoPago(modo: 'seguro' | 'directo'): void {
    this.modoPago = modo;
    this.intentoValidacion = false;
    this.seguroValidado = null;
    if (modo === 'directo') {
      this.pagoForm.patchValue({ nombreAseguradora: '', numeroPoliza: '', cobertura: '' });
    }
  }

  validarSeguro(): void {
    if (!this.citaSeleccionada || !this.citaSeleccionada.idPaciente) return;

    const datosSeguro = {
      nombreAseguradora: this.pagoForm.value.nombreAseguradora,
      numeroPoliza: this.pagoForm.value.numeroPoliza,
      cobertura: this.pagoForm.value.cobertura
    };

    if (!datosSeguro.nombreAseguradora) {
      Swal.fire('Información', 'Ingrese al menos el nombre de la aseguradora para validar.', 'info');
      return;
    }

    this.cargando = true;
    this.intentoValidacion = true;
    this.seguroService.validarSeguro(this.citaSeleccionada.idPaciente, datosSeguro).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.datosSeguro) {
          this.pagoForm.patchValue({
            nombreAseguradora: response.datosSeguro.nombreAseguradora,
            numeroPoliza: response.datosSeguro.numeroPoliza,
            cobertura: response.datosSeguro.cobertura
          }, { emitEvent: false });
        }

        if (response.estado === 'Válido') {
          this.seguroValidado = true;
          Swal.fire('Seguro Válido', response.mensaje, 'success');
        } else {
          this.seguroValidado = false;
          Swal.fire('Seguro Inválido', response.mensaje, 'warning');
          this.modoPago = 'directo';
        }
      },
      error: (err) => {
        this.cargando = false;
        this.seguroValidado = false;
        Swal.fire('Error de Validación', err.message || 'No se pudo conectar con el servicio.', 'error');
        this.modoPago = 'directo';
      }
    });
  }

  generarComprobante(): void {
    if (this.pagoForm.invalid) {
      Swal.fire('Error', 'Debe seleccionar un tipo de comprobante.', 'error');
      return;
    }
    if (this.modoPago === 'seguro' && !this.seguroValidado) {
      Swal.fire('Error', 'Debe validar el seguro antes de generar el comprobante.', 'error');
      return;
    }

    this.cargando = true;
    this.facturacionService.registrarPago(this.citaSeleccionada.idCita).subscribe({
      next: (citaActualizada) => {
        this.cargando = false;
        this.currentDate = new Date();
        this.citaSeleccionada.estado = citaActualizada.estado;
        this.citaSeleccionada.estadoPago = citaActualizada.estadoPago;
        
        // CLAVE: Activar la visibilidad del recibo ANTES de detectar cambios
        this.mostrarRecibo = true;
        
        // Forzar múltiples ciclos de detección de cambios
        this.cd.detectChanges();
        
        // Debug: Verificar que el contenido está en el DOM
        console.log('=== DEBUG IMPRESIÓN ===');
        console.log('Mostrar recibo:', this.mostrarRecibo);
        console.log('Cita seleccionada:', this.citaSeleccionada);
        console.log('Fecha actual:', this.currentDate);
        
        // Delay más largo para asegurar el renderizado completo
        setTimeout(() => {
          // Segundo ciclo de detección
          this.cd.detectChanges();
          
          // Verificar que el elemento existe en el DOM
          const reciboElement = document.querySelector('.printable-receipt');
          console.log('Elemento recibo encontrado:', reciboElement);
          console.log('Clases del recibo:', reciboElement?.className);
          console.log('Contenido HTML del recibo:', reciboElement?.innerHTML.substring(0, 200));
          
          Swal.fire({
            title: '¡Pago Registrado!',
            text: `Se ha generado la ${this.pagoForm.value.tipoComprobante} para la cita.`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Imprimir y Finalizar',
            cancelButtonText: 'Finalizar sin Imprimir'
          }).then((result: any) => {
            if (result.isConfirmed) {
              // Último ciclo antes de imprimir
              this.cd.detectChanges();
              
              // Pequeño delay antes de imprimir
              setTimeout(() => {
                console.log('Iniciando impresión...');
                window.print();
                
                // Limpiar después de imprimir
                setTimeout(() => {
                  this.limpiarTrasPago();
                }, 500);
              }, 200);
            } else {
              this.limpiarTrasPago();
            }
          });
        }, 300);
      },
      error: (err) => {
        this.cargando = false;
        Swal.fire('Error al Pagar', 'No se pudo registrar el pago en el sistema. ' + err.message, 'error');
      }
    });
  }

  limpiarTrasPago(): void {
    this.busquedaForm.reset();
    this.citasPendientes = [];
    this.citaSeleccionada = null;
    this.mostrarRecibo = false;
    this.modoPago = 'directo';
    this.seguroValidado = null;
    this.intentoValidacion = false;
    this.pagoForm.reset({
      tipoComprobante: 'boleta',
      metodoPago: 'efectivo'
    });
  }
}