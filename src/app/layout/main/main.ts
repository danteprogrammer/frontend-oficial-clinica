import { Component } from '@angular/core';
import { Router ,RouterModule} from '@angular/router';
import { Auth } from '../../auth/auth'; 
import { CommonModule } from '@angular/common';

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

  isPacientesMenuOpen = false;
  isCitasMenuOpen = false;
  isTurnosMenuOpen = false;

  constructor(private authService: Auth, private router: Router) {}

  togglePacientesMenu(): void {
    this.isPacientesMenuOpen = !this.isPacientesMenuOpen;
    // Cerrar otros menús
    this.isCitasMenuOpen = false;
    this.isTurnosMenuOpen = false;
  }

  toggleCitasMenu(): void {
    this.isCitasMenuOpen = !this.isCitasMenuOpen;
    // Cerrar otros menús
    this.isPacientesMenuOpen = false;
    this.isTurnosMenuOpen = false;
  }

  toggleTurnosMenu(): void {
    this.isTurnosMenuOpen = !this.isTurnosMenuOpen;
    // Cerrar otros menús
    this.isPacientesMenuOpen = false;
    this.isCitasMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
