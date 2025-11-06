import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FacturacionService, CitaParaFacturacionDto } from '../../shared/facturacion.service';
import { PdfService } from '../../shared/pdf.service';

@Component({
  selector: 'app-historial-pagos',
  imports: [CommonModule, DatePipe],
  templateUrl: './historial-pagos.html',
  styleUrl: './historial-pagos.css',
  providers: [DatePipe]
})
export class HistorialPagos implements OnInit {
  historial: CitaParaFacturacionDto[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private facturacionService: FacturacionService,
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {
    this.cargando = true;
    this.facturacionService.getHistorialPagos().subscribe({
      next: (data) => {
        this.historial = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el historial de pagos. ' + err.message;
        this.cargando = false;
      }
    });
  }

  verPdf(cita: CitaParaFacturacionDto): void {
    const pagoInfo = {
      tipoComprobante: cita.tipoComprobante,
      metodoPago: cita.metodoPago
    };
    this.pdfService.generarComprobante(cita, pagoInfo);
  }
}