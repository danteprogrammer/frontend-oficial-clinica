import { Component, OnInit } from '@angular/core'; 
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../auth/auth'; 
import { CommonModule } from '@angular/common';

interface NavMenu {
  name: string;
  icon: string;
  path?: string;
  isOpen?: boolean;
  submenus?: { name: string; path: string; roles: string[] }[]; 
  roles: string[]; 
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
export class Main implements OnInit { 

  private allMenus: NavMenu[] = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠', roles: ['ADMIN'] },
    {
      name: 'Pacientes',
      icon: '👥',
      isOpen: false,
      roles: ['RECEPCIONISTA'],
      submenus: [
        { name: 'Listado de Pacientes', path: '/pacientes/registrados', roles: ['RECEPCIONISTA'] },
        { name: 'Registrar Paciente', path: '/pacientes/nuevo', roles: ['RECEPCIONISTA'] }
      ]
    },
    {
      name: 'Agenda',
      icon: '📅',
      isOpen: false,
      roles: ['RECEPCIONISTA'],
      submenus: [
        { name: 'Programar Cita', path: '/cita/registrar', roles: ['RECEPCIONISTA'] },
        { name: 'Listado de Citas', path: '/cita/lista', roles: ['RECEPCIONISTA'] }
      ]
    },
    {
      name: 'Atención Médica',
      icon: '⚕️',
      isOpen: false,
      roles: ['MEDICO', 'TRIAJE'],
      submenus: [
        { name: 'Registrar Consulta', path: '/atencion/registrar-consulta', roles: ['MEDICO'] },
        { name: 'Registrar Triaje', path: '/atencion/triaje', roles: ['TRIAJE'] }
      ]
    },
    {
      name: 'Laboratorio',
      icon: '🔬',
      isOpen: false,
      roles: ['LABORATORIO'],
      submenus: [
        { name: 'Órdenes Pendientes', path: '/laboratorio/pendientes', roles: ['LABORATORIO'] }
      ]
    },
    {
      name: 'Caja y Facturación',
      icon: '💰',
      isOpen: false,
      roles: ['CAJA'],
      submenus: [
        { name: 'Generar Factura', path: '/facturacion/generar-factura', roles: ['CAJA'] },
      ]
    },
    {
      name: 'Administración',
      icon: '⚙️',
      isOpen: false,
      roles: ['ADMIN'],
      submenus: [
        { name: 'Gestión de Médicos', path: '/admin/medicos', roles: ['ADMIN'] },
        { name: 'Gestión de Consultorios', path: '/consultorios', roles: ['ADMIN'] },
        { name: 'Gestión de Tarifario', path: '/admin/tarifario', roles: ['ADMIN'] },
        { name: 'Gestión de Usuarios', path: '/admin/usuarios', roles: ['ADMIN'] },
        { name: 'Gestión de Horarios', path: '/admin/horarios', roles: ['ADMIN'] },
      ]
    }
  ];

  navMenus: NavMenu[] = [];

  constructor(private authService: Auth, private router: Router) { }

  ngOnInit(): void {
    this.filtrarMenuPorRol();
    this.redirectOnLogin(); 
  }

  private redirectOnLogin(): void {
    if (this.router.url === '/' || this.router.url === '/dashboard') {
      const role = this.authService.getRole();

      switch (role) {
        case 'ADMIN':
          this.router.navigate(['/dashboard']);
          break;
        case 'RECEPCIONISTA':
          this.router.navigate(['/pacientes/registrados']);
          break;
        case 'MEDICO':
          this.router.navigate(['/atencion/registrar-consulta']);
          break;
        case 'CAJA':
          this.router.navigate(['/facturacion/generar-factura']);
          break;
        case 'TRIAJE':
          this.router.navigate(['/atencion/triaje']);
          break;
        case 'LABORATORIO':
          this.router.navigate(['/laboratorio/pendientes']);
          break;
        default:
          this.logout();
          break;
      }
    }
  }

  filtrarMenuPorRol(): void {
    const userRole = this.authService.getRole();
    if (!userRole) {
      this.navMenus = [];
      return;
    }

    this.navMenus = this.allMenus
      .filter(menu => menu.roles.includes(userRole))
      .map(menu => {
        if (menu.submenus) {
          const submenusVisibles = menu.submenus.filter(submenu =>
            submenu.roles.includes(userRole)
          );
          return { ...menu, submenus: submenusVisibles };
        }
        return menu;
      });
  }

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
