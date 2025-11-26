import { Injectable, signal } from '@angular/core'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode'; 

export interface MedicoInfo {
  id: number;
  nombres: string;
  apellidos: string;
  cmp: string;
  sexo: string;
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
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          this.saveToken(response.token);

          try {
            this.decodedToken = jwtDecode(response.token);
            const role = this.decodedToken.authorities?.[0]?.authority;
            if (role) {
              this.userRole.set(role);
            }

            const medico = this.decodedToken.medicoInfo;
            if (medico) {
              this.medicoInfo.set(medico);
            }
          } catch (Error) {
            console.error('Error al decodificar nuevo token:', Error);
            this.userRole.set(null);
            this.medicoInfo.set(null);
          }
        }),
        catchError((err: HttpErrorResponse) => {
          this.userRole.set(null);
          this.medicoInfo.set(null); 
          return throwError(() => err);
        })
      );
  }

  private saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.decodedToken = null;
    this.userRole.set(null);
    this.medicoInfo.set(null);

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
