import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../auth/auth';
import { CommonModule } from '@angular/common';

// Interfaz para definir la estructura de nuestro menú
interface NavMenu {
  name: string;
  icon: string; // Añadimos un campo para el ícono
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

  // Estructura de menú definitiva y lógica
  navMenus: NavMenu[] = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    {
      name: 'Pacientes',
      icon: '👥',
      isOpen: true, // Abierto por defecto
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
        { name: 'Programar Cita', path: '/citas/programar' },
        { name: 'Asignar Turno', path: '/turnos/asignar' },
        { name: 'Próximos Turnos', path: '/turnos/proximos' },
      ]
    },
    {
      name: 'Administración',
      icon: '⚙️',
      isOpen: false,
      submenus: [
        { name: 'Consultorios', path: '/consultorios' },
      ]
    }
  ];

  constructor(private authService: Auth, private router: Router) { }

  toggleMenu(clickedMenu: NavMenu): void {
    // Si el menú no tiene submenús, no hace nada más
    if (!clickedMenu.submenus) {
      // Cierra todos los demás menús al navegar a un link principal
      this.navMenus.forEach(menu => menu.isOpen = false);
      return;
    }

    // Cierra los otros menús desplegables
    this.navMenus.forEach(menu => {
      if (menu !== clickedMenu) {
        menu.isOpen = false;
      }
    });

    // Abre o cierra el menú clickeado
    clickedMenu.isOpen = !clickedMenu.isOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
