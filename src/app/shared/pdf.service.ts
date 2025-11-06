import { Injectable } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { CitaParaFacturacionDto } from './facturacion.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { MedicoInfo } from '../auth/auth';
import { Paciente } from '../pacientes/paciente';

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

  // --- AÑADIR ESTE MÉTODO COMPLETO (basado en tu registrar-consulta.ts) ---
  /**
   * Genera un PDF de Receta Médica
   * @param paciente El objeto Paciente
   * @param consultaFormValue El valor del formulario de consulta (para diagnósticos, etc.)
   * @param medicoInfo La información del médico logueado
   */
  public generarPdfReceta(paciente: Paciente, consultaFormValue: any, medicoInfo: MedicoInfo | null): void {

    const fechaHoy = this.datePipe.transform(new Date(), 'dd/MM/yyyy');

    const tituloMedico = medicoInfo?.sexo.toUpperCase() === 'FEMENINO' ? 'Dra.' : 'Dr.';
    const nombreMedico = medicoInfo ? `${tituloMedico} ${medicoInfo.nombres} ${medicoInfo.apellidos}` : 'Dr. (Nombre del Médico)';
    const cmpMedico = medicoInfo ? `CMP: ${medicoInfo.cmp}` : 'CMP: (Número de Colegiatura)';

    const recetaItems = consultaFormValue.receta.map((med: any) => {
      return [
        { text: med.medicamento, bold: true, style: 'recetaText' },
        { text: med.cantidad, style: 'recetaText' },
        { text: med.dosis, style: 'recetaText' },
        { text: med.posologia, style: 'recetaText' }
      ];
    });

    const recetaBody = [
      [{ text: 'Medicamento', style: 'tableHeader' }, { text: 'Cant.', style: 'tableHeader' }, { text: 'Dosis/Presentación', style: 'tableHeader' }, { text: 'Indicaciones (Posología)', style: 'tableHeader' }],
      ...recetaItems
    ];

    const docDefinition: any = {
      content: [
        {
          columns: [
            {
              stack: [
                { text: 'Clínica SaludVida', style: 'headerReceta' },
                { text: nombreMedico, style: 'subheaderReceta' },
                { text: cmpMedico, style: 'subheaderReceta' }
              ]
            },
            {
              text: `Fecha: ${fechaHoy}`,
              alignment: 'right',
              style: 'text'
            }
          ],
          margin: [0, 0, 0, 15]
        },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#00355d' }], margin: [0, 0, 0, 15] },

        { text: 'Datos del Paciente', style: 'sectionHeader' },
        {
          columns: [
            { text: `Paciente: ${paciente.nombres} ${paciente.apellidos}`, style: 'text' },
            { text: `DNI: ${paciente.dni}`, style: 'text' }
          ],
          margin: [0, 0, 0, 15]
        },

        { text: 'Motivo de Consulta', style: 'sectionHeader' },
        { text: consultaFormValue.motivo || 'No especificado.', style: 'text' },

        { text: 'Diagnóstico (CIE-10)', style: 'sectionHeader' },
        { text: consultaFormValue.diagnostico || 'No especificado.', style: 'text' },

        { text: 'Indicaciones Generales', style: 'sectionHeader' },
        { text: consultaFormValue.indicaciones || 'Ninguna indicación.', style: 'text' },

        { text: 'Receta Médica (R/.)', style: 'sectionHeader' },
        consultaFormValue.receta.length > 0 ? {
          table: {
            widths: ['*', 'auto', 'auto', '*'],
            body: recetaBody
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15]
        } : { text: 'No se indicaron medicamentos.', style: 'text' },

        {
          stack: [
            { text: '_________________________', style: 'firma' },
            { text: nombreMedico, style: 'firma' },
            { text: cmpMedico, style: 'firma' }
          ],
          alignment: 'center',
          margin: [0, 70, 0, 0]
        }

      ],
      styles: {
        header: { fontSize: 24, bold: true, color: '#00355d' },
        subheader: { fontSize: 10, color: '#6c757d' },
        comprobanteHeader: { fontSize: 13, bold: true, alignment: 'center', color: '#343a40' },
        comprobanteNumero: { fontSize: 12, alignment: 'center', color: '#343a40' },
        totalText: { fontSize: 10, alignment: 'right' },
        totalValor: { fontSize: 10, alignment: 'right' },
        totalHeader: { fontSize: 12, bold: true, alignment: 'right' },
        totalValorHeader: { fontSize: 12, bold: true, alignment: 'right' },
        footer: { fontSize: 10, alignment: 'center', italics: true, color: '#6c757d', margin: [0, 40, 0, 0] },

        headerReceta: { fontSize: 20, bold: true, color: '#00355d' },
        subheaderReceta: { fontSize: 12, color: '#333' },
        sectionHeader: { fontSize: 12, bold: true, color: '#00355d', margin: [0, 10, 0, 5] },
        text: { fontSize: 10, margin: [0, 2] },
        tableHeader: { fontSize: 10, bold: true, margin: [0, 2, 0, 2], color: '#00355d' },
        recetaText: { fontSize: 10, margin: [0, 2, 0, 2] },
        firma: { fontSize: 11, bold: true, color: '#333', margin: [0, 2] }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    pdfMake.createPdf(docDefinition).print();
  }
}