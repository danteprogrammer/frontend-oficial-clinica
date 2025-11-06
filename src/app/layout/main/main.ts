import { Component, OnInit } from '@angular/core'; // <-- AÑADIR OnInit
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../auth/auth'; // <-- IMPORTA TU CLASE 'Auth'
import { CommonModule } from '@angular/common';

// 1. Modificar la interfaz para incluir roles
interface NavMenu {
  name: string;
  icon: string;
  path?: string;
  isOpen?: boolean;
  submenus?: { name: string; path: string; roles: string[] }[]; // <-- roles en submenus
  roles: string[]; // <-- roles en menu principal
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
export class Main implements OnInit { // <-- IMPLEMENTAR OnInit

  // 2. Este es tu menú, pero ahora lo llamamos 'allMenus' y añadimos los roles
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
        // Esta ruta la añadiremos en el siguiente paso
        { name: 'Gestión de Usuarios', path: '/admin/usuarios', roles: ['ADMIN'] },
      ]
    }
  ];

  // 3. El menú que realmente se va a mostrar
  navMenus: NavMenu[] = [];

  constructor(private authService: Auth, private router: Router) { }

  // 4. Nuevo método OnInit
  ngOnInit(): void {
    this.filtrarMenuPorRol();
  }

  // 5. Nueva lógica de filtrado
  filtrarMenuPorRol(): void {
    const userRole = this.authService.getRole();
    if (!userRole) {
      this.navMenus = [];
      return;
    }

    // 1. Filtra los menús principales
    this.navMenus = this.allMenus
      .filter(menu => menu.roles.includes(userRole))
      .map(menu => {
        // 2. Si el menú tiene submenús, fíltralos también
        if (menu.submenus) {
          const submenusVisibles = menu.submenus.filter(submenu =>
            submenu.roles.includes(userRole)
          );
          // Devuelve una copia del menú con los submenús filtrados
          return { ...menu, submenus: submenusVisibles };
        }
        return menu; // Devuelve el menú si no tiene submenús
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
