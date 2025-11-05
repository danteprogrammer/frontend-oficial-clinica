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
  mostrarRecibo: boolean = false; // Mostrar el recibo tras generar comprobante

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

    // ✅ Listeners para el diálogo de impresión
    window.addEventListener('beforeprint', () => {
      console.log('🖨️ Diálogo de impresión abierto');
    });

    window.addEventListener('afterprint', () => {
      console.log('✅ Diálogo de impresión cerrado');
      // Aquí puedes agregar lógica extra si lo necesitas
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
      this.pagoForm.patchValue({
        nombreAseguradora: '',
        numeroPoliza: '',
        cobertura: ''
      });
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

        this.mostrarRecibo = true;
        this.cd.detectChanges();

        console.log('=== DEBUG IMPRESIÓN ===');
        console.log('Recibo activado:', this.mostrarRecibo);

        // Esperar para renderizado completo
        setTimeout(() => {
          this.cd.detectChanges();

          Swal.fire({
            title: '¡Pago Registrado!',
            text: `Se ha generado la ${this.pagoForm.value.tipoComprobante} para la cita.`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: '🖨️ Imprimir Comprobante',
            cancelButtonText: '✅ Finalizar sin Imprimir',
            allowOutsideClick: false
          }).then((result: any) => {
            if (result.isConfirmed) {
              this.cd.detectChanges();

              requestAnimationFrame(() => {
                try {
                  console.log('🖨️ Intentando imprimir...');
                  window.print();
                  console.log('✅ window.print() ejecutado');
                  setTimeout(() => this.limpiarTrasPago(), 1000);
                } catch (error) {
                  console.error('❌ Error en impresión:', error);
                  this.imprimirComprobante();
                  setTimeout(() => this.limpiarTrasPago(), 1000);
                }
              });
            } else {
              Swal.fire({
                title: 'Comprobante Guardado',
                text: '¿Desea imprimir el comprobante ahora? También puede presionar Ctrl+P',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '🖨️ Sí, Imprimir',
                cancelButtonText: 'No, Gracias'
              }).then((printResult: any) => {
                if (printResult.isConfirmed) {
                  this.imprimirComprobante();
                  setTimeout(() => this.limpiarTrasPago(), 1000);
                } else {
                  this.limpiarTrasPago();
                }
              });
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

  imprimirComprobante(): void {
    console.log('🖨️ Método alternativo de impresión');

    window.focus();

    setTimeout(() => {
      try {
        const recibo = document.querySelector('.printable-receipt.ready-to-print');
        if (!recibo) {
          console.error('❌ Recibo no encontrado en el DOM');
          Swal.fire('Error', 'No se pudo preparar el recibo para impresión', 'error');
          return;
        }

        console.log('✅ Recibo encontrado, iniciando impresión...');
        window.print();
        console.log('✅ Comando de impresión ejecutado');
      } catch (error) {
        console.error('❌ Error en imprimirComprobante:', error);
        Swal.fire({
          title: 'Error al Imprimir',
          text: 'No se pudo abrir el diálogo de impresión automáticamente. Por favor presione Ctrl+P (Windows) o Cmd+P (Mac).',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
      }
    }, 100);
  }
}
