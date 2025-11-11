import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { authGuard } from './auth/auth-guard';
import { Main } from './layout/main/main';
import { PacienteBusqueda } from './pacientes/paciente-busqueda/paciente-busqueda';
import { PacienteRegistro } from './pacientes/paciente-registro/paciente-registro';
import { PacienteModificar } from './pacientes/paciente-modificar/paciente-modificar';
import { PacienteInactivos } from './pacientes/paciente-inactivos/paciente-inactivos';
import { TurnoRegistro } from './turno/turno-registro/turno-registro';
import { Consultorio } from './consultorio/consultorio';
import { CitaLista } from './cita/cita-lista/cita-lista';
import { CitaModificar } from './cita/cita-modificar/cita-modificar';
import { Dashboard } from './pages/dashboard/dashboard';
import { RegistrarConsulta } from './atencion/registrar-consulta/registrar-consulta';
import { GenerarFactura } from './facturacion/generar-factura/generar-factura'; 
import { TriajeRegistro } from './atencion/triaje-registro/triaje-registro';
import { GestionPendientes } from './laboratorio/gestion-pendientes/gestion-pendientes';
import { GestionMedicos } from './administracion/gestion-medicos/gestion-medicos';
import { GestionTarifario } from './administracion/gestion-tarifario/gestion-tarifario';
import { GestionUsuarios } from './administracion/gestion-usuarios/gestion-usuarios';
import { GestionHorarios } from './administracion/gestion-horarios/gestion-horarios';
import { HistorialPagos } from './facturacion/historial-pagos/historial-pagos';
import { HistorialConsultas } from './atencion/historial-consultas/historial-consultas';
import { HistorialResultados } from './laboratorio/historial-resultados/historial-resultados';
import { GestionEspecialidades } from './administracion/gestion-especialidades/gestion-especialidades';


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
            { path: 'cita/registrar', component: TurnoRegistro },
            { path: 'cita/lista', component: CitaLista },
            { path: 'cita/modificar/:id', component: CitaModificar },
            { path: 'consultorios', component: Consultorio },
            { path: 'atencion/registrar-consulta', component: RegistrarConsulta },
            { path: 'atencion/triaje', component: TriajeRegistro },
            { path: 'atencion/historial', component: HistorialConsultas },
            { path: 'facturacion/generar-factura', component: GenerarFactura },
            { path: 'facturacion/historial', component: HistorialPagos }, 
            { path: 'laboratorio/pendientes', component: GestionPendientes },
            { path: 'laboratorio/historial', component: HistorialResultados },
            { path: 'admin/medicos', component: GestionMedicos },
            { path: 'admin/tarifario', component: GestionTarifario },
            { path: 'admin/usuarios', component: GestionUsuarios },
            { path: 'admin/horarios', component: GestionHorarios },
            { path: 'admin/especialidades', component: GestionEspecialidades },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];