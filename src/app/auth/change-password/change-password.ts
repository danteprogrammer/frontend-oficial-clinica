import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css'
})
export class ChangePassword {
  changeForm: FormGroup;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: Auth, private router: Router) {
    this.changeForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.changeForm.invalid) return;

    const { newPassword, confirmPassword } = this.changeForm.value;

    if (newPassword !== confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden';
        return;
    }

    this.authService.changePassword(newPassword).subscribe({
      next: () => {
        alert('Contraseña actualizada. Bienvenido.');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage = 'Error al actualizar la contraseña.';
      }
    });
  }
}