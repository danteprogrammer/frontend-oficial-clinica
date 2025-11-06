import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../auth/auth';
import { CommonModule } from '@angular/common';

interface NavMenu {
  name: string;
  icon: string;
  path?: string;
  isOpen?: boolean;
  submenus?: { name: string; path: string; }[];
}

@Component({
  selector: 'app-main',
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {

  navMenus: NavMenu[] = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    {
      name: 'Pacientes',
      icon: '👥',
      isOpen: false,
      submenus: [
        { name: 'Listado de Pacientes', path: '/pacientes/registrados' },
        { name: 'Registrar Paciente', path: '/pacientes/nuevo' }
      ]
    },
    {
      name: 'Agenda',
      icon: '📅',
      isOpen: false,
      submenus: [
        { name: 'Programar Cita', path: '/cita/registrar' },
        { name: 'Listado de Citas', path: '/cita/lista' }
      ]
    },
    {
      name: 'Atención Médica',
      icon: '⚕️',
      isOpen: false,
      submenus: [
        { name: 'Registrar Consulta', path: '/atencion/registrar-consulta' },
        { name: 'Registrar Triaje', path: '/atencion/triaje' }
      ]
    },
    // --- AÑADIR NUEVO MENÚ ---
    {
      name: 'Laboratorio',
      icon: '🔬',
      isOpen: false,
      submenus: [
        { name: 'Órdenes Pendientes', path: '/laboratorio/pendientes' }
      ]
    },
    {
      name: 'Caja y Facturación',
      icon: '💰',
      isOpen: false,
      submenus: [
        { name: 'Generar Factura', path: '/facturacion/generar-factura' },
      ]
    },
    {
      name: 'Administración',
      icon: '⚙️',
      isOpen: false,
      submenus: [
        { name: 'Gestión de Médicos', path: '/admin/medicos' },
        { name: 'Gestión de Consultorios', path: '/consultorios' },
        { name: 'Gestión de Tarifario', path: '/admin/tarifario' },
        { name: 'Roles y Permisos', path: '/admin/roles' },
      ]
    }
  ];

  constructor(private authService: Auth, private router: Router) { }

  toggleMenu(clickedMenu: NavMenu): void {
    if (!clickedMenu.submenus) {
      this.navMenus.forEach(menu => menu.isOpen = false);
      return;
    }

    this.navMenus.forEach(menu => {
      if (menu !== clickedMenu) {
        menu.isOpen = false;
      }
    });

    clickedMenu.isOpen = !clickedMenu.isOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
