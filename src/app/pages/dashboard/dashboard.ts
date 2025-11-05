import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { BaseChartDirective } from 'ng2-charts'; // <-- 1. Importar
import { ChartConfiguration, ChartData, ChartType } from 'chart.js'; // <-- 1. Importar
import { DashboardService, DashboardStats } from '../../shared/dashboard.service'; // <-- 1. Importar

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit { // <-- 2. Implementar OnInit

  cargando = true;
  error: string | null = null;
  stats: DashboardStats = { // <-- 3. Inicializar stats
    ingresosHoy: 0,
    pacientesAtendidosHoy: 0,
    consultasPorEspecialidadHoy: []
  };

  // --- 4. Configuración del Gráfico de Pastel ---
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
    },
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#005792', '#0090c1', '#63bce5', '#f8b400', '#f58220', '#e44d26',
        '#a7c957', '#6a994e', '#386641', '#bc4749'
      ],
      hoverBackgroundColor: [
        '#004879', '#007ca8', '#4fa9d8', '#e0a400', '#de751c', '#cf4521',
        '#96b54e', '#5a8542', '#2e5636', '#a94042'
      ],
      borderWidth: 1,
    }]
  };
  public pieChartType: ChartType = 'pie';
  // --- Fin Configuración Gráfico ---

  // 5. Inyectar el servicio
  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.cargarStats();
  }

  cargarStats(): void {
    this.cargando = true;
    this.error = null;
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.actualizarGrafico(data.consultasPorEspecialidadHoy);
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      }
    });
  }

  actualizarGrafico(data: { especialidad: string; cantidad: number }[]): void {
    const labels = data.map(item => item.especialidad);
    const cantidades = data.map(item => item.cantidad);

    this.pieChartData = {
      labels: labels,
      datasets: [{
        ...this.pieChartData.datasets[0], // Mantener colores
        data: cantidades
      }]
    };
  }

  // Función para formatear moneda
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
