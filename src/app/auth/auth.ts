import { Injectable, signal } from '@angular/core'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode'; 

export interface MedicoInfo {
  id: number;
  nombres: string;
  apellidos: string;
  cmp: string;
  sexo: string;
}

export interface LoginResponse {
  token: string;
  requiereCambioPassword: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'https://backend-clinica-saludvida.onrender.com/api/auth';

  private decodedToken: any | null = null;
  private userRole = signal<string | null>(null);
  private medicoInfo = signal<MedicoInfo | null>(null); 

  constructor(private http: HttpClient, private router: Router) {
    this.loadToken();
  }

  private loadToken(): void {
    if (typeof localStorage !== 'undefined') {
      const token = this.getToken();
      if (token) {
        this.decodeAndSetUser(token);
      }
    }
  }

  private decodeAndSetUser(token: string): void {
    try {
      this.decodedToken = jwtDecode(token);

      const role = this.decodedToken.authorities?.[0]?.authority;
      if (role) {
        this.userRole.set(role);
      }

      const medico = this.decodedToken.medicoInfo;
      if (medico) {
        this.medicoInfo.set(medico);
      }

    } catch (Error) {
      console.error('Error al decodificar el token:', Error);
      this.logout();
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          this.decodeAndSetUser(response.token);
        }),
        catchError((err: HttpErrorResponse) => {
          this.userRole.set(null);
          this.medicoInfo.set(null); 
          return throwError(() => err);
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  changePassword(newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { newPassword });
  }

  private saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    this.decodedToken = null;
    this.userRole.set(null);
    this.medicoInfo.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    return this.userRole();
  }

  getMedicoInfo(): MedicoInfo | null {
    return this.medicoInfo();
  }

  hasAnyRole(roles: string[]): boolean {
    const currentRole = this.getRole();
    if (!currentRole) {
      return false;
    }
    return roles.includes(currentRole);
  }
}