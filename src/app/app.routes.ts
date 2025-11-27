import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
    { 
        path: 'login', 
        loadComponent: () => import('./auth/login/login').then(m => m.Login) 
    },
    { 
        path: 'forgot-password', 
        loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPassword) 
    },
    { 
        path: 'reset-password', 
        loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword) 
    },
    { 
        path: 'auth/change-password', 
        loadComponent: () => import('./auth/change-password/change-password').then(m => m.ChangePassword),
        canActivate: [authGuard] 
    },
    {
        path: '',
        loadComponent: () => import('./layout/main/main').then(m => m.Main),
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
            { path: 'pacientes/registrados', loadComponent: () => import('./pacientes/paciente-busqueda/paciente-busqueda').then(m => m.PacienteBusqueda) },
            { path: 'pacientes/nuevo', loadComponent: () => import('./pacientes/paciente-registro/paciente-registro').then(m => m.PacienteRegistro) },
            { path: 'pacientes/modificar/:id', loadComponent: () => import('./pacientes/paciente-modificar/paciente-modificar').then(m => m.PacienteModificar) },
            { path: 'pacientes/inactivos', loadComponent: () => import('./pacientes/paciente-inactivos/paciente-inactivos').then(m => m.PacienteInactivos) },
            { path: 'cita/registrar', loadComponent: () => import('./turno/turno-registro/turno-registro').then(m => m.TurnoRegistro) },
            { path: 'cita/lista', loadComponent: () => import('./cita/cita-lista/cita-lista').then(m => m.CitaLista) },
            { path: 'cita/modificar/:id', loadComponent: () => import('./cita/cita-modificar/cita-modificar').then(m => m.CitaModificar) },
            { path: 'consultorios', loadComponent: () => import('./consultorio/consultorio').then(m => m.Consultorio) },
            { path: 'atencion/registrar-consulta', loadComponent: () => import('./atencion/registrar-consulta/registrar-consulta').then(m => m.RegistrarConsulta) },
            { path: 'atencion/triaje', loadComponent: () => import('./atencion/triaje-registro/triaje-registro').then(m => m.TriajeRegistro) },
            { path: 'atencion/historial', loadComponent: () => import('./atencion/historial-consultas/historial-consultas').then(m => m.HistorialConsultas) },
            { path: 'facturacion/generar-factura', loadComponent: () => import('./facturacion/generar-factura/generar-factura').then(m => m.GenerarFactura) },
            { path: 'facturacion/historial', loadComponent: () => import('./facturacion/historial-pagos/historial-pagos').then(m => m.HistorialPagos) },
            { path: 'laboratorio/pendientes', loadComponent: () => import('./laboratorio/gestion-pendientes/gestion-pendientes').then(m => m.GestionPendientes) },
            { path: 'laboratorio/historial', loadComponent: () => import('./laboratorio/historial-resultados/historial-resultados').then(m => m.HistorialResultados) },
            { path: 'admin/medicos', loadComponent: () => import('./administracion/gestion-medicos/gestion-medicos').then(m => m.GestionMedicos) },
            { path: 'admin/tarifario', loadComponent: () => import('./administracion/gestion-tarifario/gestion-tarifario').then(m => m.GestionTarifario) },
            { path: 'admin/usuarios', loadComponent: () => import('./administracion/gestion-usuarios/gestion-usuarios').then(m => m.GestionUsuarios) },
            { path: 'admin/horarios', loadComponent: () => import('./administracion/gestion-horarios/gestion-horarios').then(m => m.GestionHorarios) },
            { path: 'admin/especialidades', loadComponent: () => import('./administracion/gestion-especialidades/gestion-especialidades').then(m => m.GestionEspecialidades) },
            { path: 'admin/consultorios', loadComponent: () => import('./administracion/gestion-consultorios/gestion-consultorios').then(m => m.GestionConsultorios) },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];