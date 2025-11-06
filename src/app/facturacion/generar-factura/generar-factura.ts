import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FacturacionService } from '../../shared/facturacion.service';
import { SeguroService } from '../validar-seguro/validar-seguro';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

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

    const subtotal = cita.precioConsulta || 0;
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const montoPagado = esSeguro ? 0.00 : total;

    const metodoPago = esSeguro
      ? `Seguro: ${this.pagoForm.value.nombreAseguradora || 'N/A'} (Póliza: ${this.pagoForm.value.numeroPoliza || 'N/A'})`
      : new TitleCasePipe().transform(this.pagoForm.value.metodoPago);

    const hLine = {
      canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#999999' }],
      margin: [0, 5, 0, 10]
    };

    const docDefinition: any = {
      content: [
        { text: 'CLINICA SALUDVIDA', style: 'header' },
        { text: 'COMPROBANTE de PAGO', style: 'subheader' },
        hLine,

        {
          columns: [
            {
              stack: [
                { text: [{ text: 'Fecha de Emisión: ', bold: true }, pipeFecha.transform(this.currentDate, 'dd/MM/yyyy HH:mm') || ''] },
                { text: [{ text: 'N° Comprobante: ', bold: true }, `${cita.idCita}-${this.currentDate.getTime()}`] }
              ]
            },
            {
              stack: [
                { text: 'Clínica SaludVida', bold: true, alignment: 'right' },
                { text: 'RUC: 20123456789', alignment: 'right' },
                { text: 'Av. Principal 123, Lima - Perú', alignment: 'right' }
              ]
            }
          ],
          margin: [0, 10, 0, 0]
        },
        hLine,

        { text: 'Datos del Paciente', style: 'sectionHeader' },
        { text: [{ text: 'DNI: ', bold: true }, cita.dniPaciente || 'N/A'] },
        { text: [{ text: 'Nombre Completo: ', bold: true }, `${cita.nombresPaciente} ${cita.apellidosPaciente}`] },
        hLine,

        { text: 'Detalle de la Atención', style: 'sectionHeader' },
        { text: [{ text: 'Fecha de Cita: ', bold: true }, `${pipeFecha.transform(cita.fecha, 'fullDate')} a las ${cita.hora}`] },
        { text: [{ text: 'Especialidad: ', bold: true }, cita.especialidad] },
        { text: [{ text: 'Médico Tratante: ', bold: true }, cita.medico] },
        { text: [{ text: 'Consultorio: ', bold: true }, `${cita.consultorioNumero} - ${cita.consultorioDescripcion}`] },
        hLine,

        { text: 'Detalle del Pago', style: 'sectionHeader' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [{ text: 'Descripción', bold: true, style: 'tableHeader' }, { text: 'Cantidad', bold: true, style: 'tableHeader' }, { text: 'P. Unit.', bold: true, style: 'tableHeader' }, { text: 'Total', bold: true, style: 'tableHeader' }],
              [`Consulta - ${cita.especialidad}`, '1', `S/ ${subtotal.toFixed(2)}`, `S/ ${subtotal.toFixed(2)}`]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 10]
        },

        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              alignment: 'right',
              stack: [
                { text: [{ text: 'Subtotal: ' }, `S/ ${subtotal.toFixed(2)}`] },
                { text: [{ text: 'IGV (18%): ' }, `S/ ${igv.toFixed(2)}`] },
                {
                  text: [
                    { text: 'TOTAL: ', bold: true, fontSize: 12 },
                    { text: `S/ ${total.toFixed(2)}`, bold: true, fontSize: 12 }
                  ],
                  margin: [0, 5, 0, 0]
                }
              ]
            }
          ],
          margin: [0, 10, 0, 10]
        },

        {
          style: 'paymentMethod',
          fillColor: '#f0f0f0',
          stack: [
            { text: [{ text: 'Método de Pago: ', bold: true }, metodoPago] },
            { text: [{ text: 'Monto Pagado: ', bold: true }, `S/ ${montoPagado.toFixed(2)} ${esSeguro ? '(Cubierto por seguro)' : ''}`] }
          ]
        },
        hLine,

        { text: '¡Gracias por su preferencia!', style: 'footer' },
        { text: '(Conservar este comprobante para cualquier reclamo)', style: 'footerSmall' },
        { text: 'Este es un comprobante de pago, no tiene validez fiscal.', style: 'footerSmall' }
      ],

      styles: {
        header: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 5], color: '#005792' },
        subheader: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
        sectionHeader: { fontSize: 12, bold: true, margin: [0, 8, 0, 5], color: '#005792' },
        tableHeader: { color: '#005792' },
        paymentMethod: { margin: [0, 5, 0, 5], padding: 8, border: [false, false, false, false] },
        footer: { alignment: 'center', margin: [0, 20, 0, 5], italics: true },
        footerSmall: { alignment: 'center', fontSize: 9, color: '#777777', italics: true }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    pdfMake.createPdf(docDefinition).print();
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
