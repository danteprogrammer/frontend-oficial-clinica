import { Injectable } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { CitaParaFacturacionDto } from './facturacion.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMakeInstance: any = (pdfMake as any);
pdfMakeInstance.vfs = (pdfFonts as any).vfs;

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(
    private datePipe: DatePipe,
    private titleCasePipe: TitleCasePipe
  ) { }

  public generarComprobante(cita: CitaParaFacturacionDto, pagoInfo: { tipoComprobante: string, metodoPago: string, nombreAseguradora?: string, numeroPoliza?: string }): void {

    const tipoComprobante = pagoInfo.tipoComprobante.toUpperCase();
    const esSeguro = pagoInfo.metodoPago === 'seguro';
    const fechaEmision = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');

    let docClienteLabel = "DNI";
    let docClienteValor = cita.dniPaciente;
    if (tipoComprobante === 'FACTURA') {
      docClienteLabel = "RUC";
      docClienteValor = "S/R";
    }

    const total = cita.precioConsulta;
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    const montoPagado = esSeguro ? 0.00 : total;

    let metodoPago = "Pago Directo";
    if (esSeguro) {
      metodoPago = `Seguro: ${pagoInfo.nombreAseguradora || 'N/A'} (Póliza: ${pagoInfo.numeroPoliza || 'N/A'})`;
    } else {
      metodoPago = this.titleCasePipe.transform(pagoInfo.metodoPago);
    }

    const hLine = {
      canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#999999' }],
      margin: [0, 5, 0, 10]
    };

    const docDefinition: any = {
      content: [
        { text: 'CLINICA SALUDVIDA', style: 'header' },
        { text: 'COMPROBANTE DE PAGO', style: 'subheader' },
        hLine,

        {
          columns: [
            {
              stack: [
                { text: [{ text: 'Fecha de Emisión: ', bold: true }, fechaEmision || ''] },
                { text: [{ text: 'N° Comprobante: ', bold: true }, `${cita.idCita}-${new Date().getTime()}`] }
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
        { text: [{ text: `${docClienteLabel}: `, bold: true }, docClienteValor || 'N/A'] },
        { text: [{ text: 'Nombre Completo: ', bold: true }, `${cita.nombresPaciente} ${cita.apellidosPaciente}`] },
        { text: [{ text: 'Dirección: ', bold: true }, cita.pacienteDireccion || 'No registrada'] },
        { text: [{ text: 'Teléfono: ', bold: true }, cita.pacienteTelefono || 'No registrado'] },
        hLine,

        { text: 'Detalle de la Atención', style: 'sectionHeader' },
        { text: [{ text: 'Fecha de Cita: ', bold: true }, `${this.datePipe.transform(cita.fecha, 'fullDate')} a las ${cita.hora}`] },
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
}