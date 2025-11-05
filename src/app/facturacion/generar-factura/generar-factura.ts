import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { FacturacionService } from '../../shared/facturacion.service';
import { SeguroService } from '../validar-seguro/validar-seguro';

// ✅ Importaciones correctas para PDFMake en Angular moderno
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// ✅ Solución: crear instancia editable en lugar de modificar import
const pdfMakeInstance: any = (pdfMake as any);
pdfMakeInstance.vfs = (pdfFonts as any).vfs;

declare var Swal: any;

@Component({
  selector: 'app-generar-factura',
  imports: [ReactiveFormsModule, CommonModule, DatePipe],
  templateUrl: './generar-factura.html',
  styleUrls: ['./generar-factura.css']
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
  intentoValidacion = false;

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
          this.mensajeError = 'El paciente no tiene citas pendientes de pago para hoy.';
        }
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

        Swal.fire({
          title: '¡Pago Registrado!',
          text: `Se ha generado la ${this.pagoForm.value.tipoComprobante}. ¿Desea imprimirla ahora?`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '🖨️ Imprimir Comprobante',
          cancelButtonText: '✅ Finalizar sin Imprimir',
          allowOutsideClick: false
        }).then((result: any) => {
          if (result.isConfirmed) {
            this.generarPDF(this.citaSeleccionada);
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

  private generarPDF(cita: any) {
    const tipoComprobante = this.pagoForm.value.tipoComprobante.toUpperCase();
    const esSeguro = (this.modoPago === 'seguro' && this.seguroValidado);
    const pipeFecha = new DatePipe('es-ES');

    const precio = cita.precioConsulta || 0;
    const total = precio;
    const montoPagado = esSeguro ? 0.00 : total;
    const metodoPago = esSeguro
      ? `Seguro: ${this.pagoForm.value.nombreAseguradora || 'N/A'} (Póliza: ${this.pagoForm.value.numeroPoliza || 'N/A'})`
      : this.pagoForm.value.metodoPago.charAt(0).toUpperCase() + this.pagoForm.value.metodoPago.slice(1);

    const docDefinition: any = {
      content: [
        { text: 'Clínica SaludVida', style: 'header' },
        { text: `${tipoComprobante} DE VENTA`, style: 'subheader' },
        {
          columns: [
            { text: `Fecha: ${pipeFecha.transform(this.currentDate, 'dd/MM/yyyy HH:mm')}`, alignment: 'left' },
            { text: `N° ${cita.idCita}`, alignment: 'right' }
          ]
        },
        { text: '\nDatos del Paciente', style: 'sectionHeader' },
        { text: `DNI: ${cita.dniPaciente}` },
        { text: `Nombre: ${cita.nombresPaciente} ${cita.apellidosPaciente}` },
        { text: '\nDetalle de la Atención', style: 'sectionHeader' },
        { text: `Especialidad: ${cita.especialidad}` },
        { text: `Médico: ${cita.medico}` },
        { text: '\nDetalle del Pago', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              ['Descripción', 'Cant.', 'Total'],
              [`Consulta - ${cita.especialidad}`, '1', `S/ ${total.toFixed(2)}`]
            ]
          },
          layout: 'lightHorizontalLines'
        },
        { text: `\nMétodo de Pago: ${metodoPago}` },
        { text: `Monto Pagado: S/ ${montoPagado.toFixed(2)}` },
        { text: '\n¡Gracias por su preferencia!', alignment: 'center', margin: [0, 20, 0, 0] }
      ],
      styles: {
        header: { fontSize: 18, bold: true, alignment: 'center', color: '#005792' },
        subheader: { fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 13, bold: true, color: '#005792', margin: [0, 10, 0, 5] }
      }
    };

    pdfMakeInstance.createPdf(docDefinition).print();
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
