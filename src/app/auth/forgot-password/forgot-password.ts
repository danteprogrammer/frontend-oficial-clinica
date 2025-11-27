import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../auth';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  forgotForm: FormGroup;
  message: string | null = null;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: Auth) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.isLoading = true;
    this.message = null;
    this.errorMessage = null;

    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: () => {
        this.message = 'Si el correo existe, recibirás un enlace para recuperar tu cuenta.';
        this.isLoading = false;
        this.forgotForm.reset();
      },
      error: () => {
        this.errorMessage = 'Error al procesar la solicitud.';
        this.isLoading = false;
      }
    });
  }
}