import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.errorMessage = null;
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        if (response.requiereCambioPassword) {
          this.router.navigate(['/auth/change-password']);
        } else {
          const role = this.authService.getRole();
          
          switch (role) {
            case 'ADMIN':
              this.router.navigate(['/dashboard']);
              break;
            case 'MEDICO':
              this.router.navigate(['/atencion/registrar-consulta']);
              break;
            case 'RECEPCIONISTA':
              this.router.navigate(['/pacientes/registrados']);
              break;
            case 'TRIAJE':
              this.router.navigate(['/atencion/triaje']);
              break;
            case 'LABORATORIO':
              this.router.navigate(['/laboratorio/pendientes']);
              break;
            case 'CAJA':
              this.router.navigate(['/facturacion/generar-factura']);
              break;
            default:
              this.router.navigate(['/dashboard']);
              break;
          }
        }
      },
      error: (err) => {
        this.errorMessage = 'Usuario o contraseña incorrectos. Intente de nuevo.';
        console.error(err);
      }
    });
  }
}