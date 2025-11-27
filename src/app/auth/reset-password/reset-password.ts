import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../auth';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  token: string = '';
  message: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.errorMessage = 'Enlace inválido. Solicite uno nuevo.';
      this.resetForm.disable();
    }
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) return;

    const { newPassword, confirmPassword } = this.resetForm.value;

    if (newPassword !== confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden';
        return;
    }

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.message = 'Contraseña actualizada. Redirigiendo...';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error || 'Error al restablecer.';
      }
    });
  }
}