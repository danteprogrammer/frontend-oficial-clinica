import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { authGuard } from './auth/auth-guard';
import { Main } from './layout/main/main';
import { PacienteBusqueda } from './pacientes/paciente-busqueda/paciente-busqueda';
import { PacienteRegistro } from './pacientes/paciente-registro/paciente-registro';
import { PacienteModificar } from './pacientes/paciente-modificar/paciente-modificar';
import { PacienteInactivos } from './pacientes/paciente-inactivos/paciente-inactivos';
import { TurnoAsignacion } from './turno/turno-asignacion/turno-asignacion';
import { TurnoLista } from './turno/turno-lista/turno-lista';
import { TurnoRegistro } from './turno/turno-registro/turno-registro';
import { Consultorio } from './consultorio/consultorio';
import { CitaLista } from './cita/cita-lista/cita-lista';
import { CitaModificar } from './cita/cita-modificar/cita-modificar';
import { Dashboard } from './pages/dashboard/dashboard';
import { RegistrarConsulta } from './atencion/registrar-consulta/registrar-consulta';
import { ValidarSeguro } from './facturacion/validar-seguro/validar-seguro';
import { GenerarFactura } from './facturacion/generar-factura/generar-factura'; 
import { TriajeRegistro } from './atencion/triaje-registro/triaje-registro';
import { GestionPendientes } from './laboratorio/gestion-pendientes/gestion-pendientes';


export const routes: Routes = [
    { path: 'login', component: Login },
    {
        path: '',
        component: Main,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'pacientes/registrados', component: PacienteBusqueda },
            { path: 'pacientes/nuevo', component: PacienteRegistro },
            { path: 'pacientes/modificar/:id', component: PacienteModificar },
            { path: 'pacientes/inactivos', component: PacienteInactivos },
            { path: 'turno/asignar', component: TurnoAsignacion },
            { path: 'turno/proximos', component: TurnoLista },
            { path: 'cita/registrar', component: TurnoRegistro },
            { path: 'cita/lista', component: CitaLista },
            { path: 'cita/modificar/:id', component: CitaModificar },
            { path: 'consultorios', component: Consultorio },
            { path: 'atencion/registrar-consulta', component: RegistrarConsulta },
            { path: 'atencion/triaje', component: TriajeRegistro },
            { path: 'facturacion/generar-factura', component: GenerarFactura }, 
            { path: 'laboratorio/pendientes', component: GestionPendientes },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];
