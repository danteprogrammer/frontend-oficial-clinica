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
import { Consultorio } from './consultorio/consultorio';


export const routes: Routes = [
    { path: 'login', component: Login },
    {
        path: '', 
        component: Main,
        canActivate: [authGuard], 
        children: [
            { path: 'pacientes/registrados', component: PacienteBusqueda },
            { path: 'pacientes/nuevo', component: PacienteRegistro },
            { path: 'pacientes/modificar/:id', component: PacienteModificar },
            { path: 'pacientes/inactivos', component: PacienteInactivos },
            { path: 'turno/asignar', component: TurnoAsignacion },
            { path: 'turno/proximos', component: TurnoLista },
            { path: 'consultorios', component: Consultorio },
            { path: '', redirectTo: 'dashboard/turnos', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' } 
];
