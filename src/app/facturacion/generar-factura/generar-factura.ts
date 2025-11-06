import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { CitaParaFacturacionDto, FacturacionService } from '../../shared/facturacion.service';
import { SeguroService } from '../validar-seguro/validar-seguro';
import { PdfService } from '../../shared/pdf.service';

declare var Swal: any;

@Component({
  selector: 'app-generar-factura',
  imports: [ReactiveFormsModule, CommonModule, DatePipe],
  templateUrl: './generar-factura.html',
  styleUrls: ['./generar-factura.css'],
  providers: [DatePipe, TitleCasePipe]
})
export class GenerarFactura implements OnInit {

  currentDate = new Date();
  busquedaForm: FormGroup;
  pagoForm: FormGroup;
  citasPendientes: CitaParaFacturacionDto[] = [];
  citaSeleccionada: CitaParaFacturacionDto | null = null;
  cargando = false;
  mensajeError: string | null = null;
  seguroValidado: boolean | null = null;
  modoPago: 'seguro' | 'directo' = 'directo';
  intentoValidacion = false;

  constructor(
    private fb: FormBuilder,
    private facturacionService: FacturacionService,
    private seguroService: SeguroService,
    private pdfService: PdfService,
    private datePipe: DatePipe,
    private titleCasePipe: TitleCasePipe
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

    const dni = this.busquedaForm.value.dni;
    this.facturacionService.getCitasPendientesPorDni(dni).subscribe({
      next: (citas) => {
        this.citasPendientes = citas;
        if (citas.length === 0) {
          this.mensajeError = 'El paciente no tiene citas pendientes de pago.';
        }
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = err.message;
        this.cargando = false;
      }
    });
  }

  seleccionarCita(cita: CitaParaFacturacionDto): void {
    this.citaSeleccionada = cita;
    this.seguroValidado = null;
    this.intentoValidacion = false;
    this.modoPago = cita.tieneSeguro ? 'seguro' : 'directo';
    this.pagoForm.reset({
      tipoComprobante: 'boleta',
      metodoPago: 'efectivo',
      nombreAseguradora: '',
      numeroPoliza: '',
      cobertura: ''
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
    const tipoComprobante = this.pagoForm.value.tipoComprobante;
    const metodoPago = (this.modoPago === 'seguro' && this.seguroValidado)
      ? 'seguro'
      : this.pagoForm.value.metodoPago;

    this.facturacionService.registrarPago(this.citaSeleccionada!.idCita, metodoPago, tipoComprobante).subscribe({
      next: (citaActualizada) => {
        this.cargando = false;

        const pagoInfo = {
          tipoComprobante: tipoComprobante,
          metodoPago: metodoPago,
          nombreAseguradora: this.pagoForm.value.nombreAseguradora,
          numeroPoliza: this.pagoForm.value.numeroPoliza
        };

        this.citaSeleccionada!.metodoPago = metodoPago;
        this.citaSeleccionada!.tipoComprobante = tipoComprobante;

        Swal.fire({
          title: '¡Pago Registrado!',
          text: `Se ha generado la ${tipoComprobante}. ¿Desea imprimirla ahora?`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '🖨️ Imprimir Comprobante',
          cancelButtonText: '✅ Finalizar sin Imprimir',
          allowOutsideClick: false
        }).then((result: any) => {
          if (result.isConfirmed) {
            this.pdfService.generarComprobante(this.citaSeleccionada!, pagoInfo);
          }
          this.limpiarTrasPago();
        });
      },
      error: (err) => {
        this.cargando = false;
        Swal.fire('Error al Pagar', 'No se pudo registrar el pago. ' + err.message, 'error');
      }
    });
  }

  limpiarTrasPago(): void {
    this.busquedaForm.reset();
    this.citasPendientes = [];
    this.citaSeleccionada = null;
    this.modoPago = 'directo';
    this.seguroValidado = null;
    this.intentoValidacion = false;
    this.pagoForm.reset({
      tipoComprobante: 'boleta',
      metodoPago: 'efectivo'
    });
  }
}