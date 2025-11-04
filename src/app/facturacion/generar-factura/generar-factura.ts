import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule,DatePipe,TitleCasePipe } from '@angular/common';
import { FacturacionService } from '../../shared/facturacion.service';
import { SeguroService } from '../validar-seguro/validar-seguro'; // Reutilizamos el servicio de seguro

declare var Swal: any;

@Component({
  selector: 'app-generar-factura',
  imports: [ReactiveFormsModule, CommonModule, DatePipe, TitleCasePipe],
  templateUrl: './generar-factura.html',
  styleUrl: './generar-factura.css'
})
export class GenerarFactura implements OnInit {

  currentDate = new Date(); // Añade esta propiedad
  busquedaForm: FormGroup;
  pagoForm: FormGroup;
  citasPendientes: any[] = [];
  citaSeleccionada: any = null;
  cargando = false;
  mensajeError: string | null = null;
  seguroValidado: boolean | null = null; // Cambiado a null para estado inicial
  modoPago: 'seguro' | 'directo' = 'directo'; // Nueva propiedad para controlar la vista
  intentoValidacion: boolean = false; // Nueva propiedad para saber si se intentó validar

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
    this.seguroValidado = null; // Reiniciar estado de validación
    this.intentoValidacion = false;
    // Establecer modo inicial basado en si tiene seguro o no
    this.modoPago = cita.tieneSeguro ? 'seguro' : 'directo';
    this.pagoForm.reset({
      tipoComprobante: 'boleta',
      metodoPago: 'efectivo'
      // Los campos de seguro se llenarán manualmente
    });
  }

  cambiarModoPago(modo: 'seguro' | 'directo'): void {
    if (modo === 'seguro' && !this.citaSeleccionada.tieneSeguro) {
        Swal.fire('Información', 'El paciente indicó no tener seguro al registrar la cita.', 'info');
        return;
    }
    this.modoPago = modo;
    this.intentoValidacion = false; // Resetear intento al cambiar manualmente
    this.seguroValidado = null; // Resetear estado de validación
    // Opcional: Limpiar campos del otro modo
    if (modo === 'directo') {
        this.pagoForm.patchValue({ nombreAseguradora: '', numeroPoliza: '', cobertura: '' });
    } else {
        // Si tuvieramos datos de seguro precargados, los pondríamos aquí
        // this.pagoForm.patchValue({ metodoPago: 'efectivo' }); // Opcional resetear método
    }
}

validarSeguro(): void {
    if (!this.citaSeleccionada || !this.citaSeleccionada.idPaciente) return;

    // Extraer los datos del seguro del formulario
    const datosSeguro = {
        nombreAseguradora: this.pagoForm.value.nombreAseguradora,
        numeroPoliza: this.pagoForm.value.numeroPoliza,
        cobertura: this.pagoForm.value.cobertura
    };

    // Verificar que al menos se haya ingresado la aseguradora si se intenta validar
    if (!datosSeguro.nombreAseguradora) {
         Swal.fire('Información', 'Ingrese al menos el nombre de la aseguradora para validar.', 'info');
         return;
    }


    this.cargando = true;
    this.intentoValidacion = true;
    // Enviar los datos al servicio
    this.seguroService.validarSeguro(this.citaSeleccionada.idPaciente, datosSeguro).subscribe({
        next: (response) => {
            this.cargando = false;
             // Actualizar el formulario con los datos devueltos (pueden ser los ingresados o los de la BD)
             if (response.datosSeguro) {
                 this.pagoForm.patchValue({
                     nombreAseguradora: response.datosSeguro.nombreAseguradora,
                     numeroPoliza: response.datosSeguro.numeroPoliza,
                     cobertura: response.datosSeguro.cobertura
                 }, { emitEvent: false }); // Evitar bucles
             }

            if (response.estado === 'Válido') {
                this.seguroValidado = true;
                Swal.fire('Seguro Válido', response.mensaje, 'success');
            } else {
                this.seguroValidado = false;
                Swal.fire('Seguro Inválido', response.mensaje, 'warning');
                this.modoPago = 'directo'; // Cambiar automáticamente a pago directo si falla
            }
        },
        error: (err) => {
            this.cargando = false;
            this.seguroValidado = false; // Asegurarse de ponerlo en false en error
            Swal.fire('Error de Validación', err.message || 'No se pudo conectar con el servicio.', 'error');
            this.modoPago = 'directo'; // Cambiar a pago directo en error
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

    this.currentDate = new Date();

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
    }).then((result:any) => {
           if (result.isConfirmed) {
               // Lógica de impresión del navegador
               // Usamos setTimeout para dar tiempo a Angular a renderizar la sección imprimible
               setTimeout(() => {
                   window.print(); // Llamar a imprimir DESPUÉS de un breve instante
                   // Limpiar DESPUÉS de que la impresión se complete o cancele
                   this.limpiarTrasPago();
               }, 100); // 100 milisegundos suelen ser suficientes
           } else {
               // Si no imprime, limpiar inmediatamente
              this.limpiarTrasPago();
           }
       });
   } // Fin de generarComprobante

   // NUEVO MÉTODO para limpiar el estado después del pago
   limpiarTrasPago(): void {
        this.busquedaForm.reset();
        this.citasPendientes = [];
        this.citaSeleccionada = null;
        this.modoPago = 'directo'; // Resetear modo de pago
        this.seguroValidado = null;
        this.intentoValidacion = false;
        this.pagoForm.reset({ // Resetear también el form de pago
            tipoComprobante: 'boleta',
            metodoPago: 'efectivo'
        });
   }
}
