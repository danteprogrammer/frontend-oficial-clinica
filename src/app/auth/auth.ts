import { Injectable, signal } from '@angular/core'; // <-- AÑADIDO signal
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router'; // <-- AÑADIDO Router
import { Observable, throwError, of } from 'rxjs'; // <-- AÑADIDO throwError, of
import { tap, catchError } from 'rxjs/operators'; // <-- AÑADIDO catchError
import { jwtDecode } from 'jwt-decode'; // <-- AÑADIDO (recuerda instalarlo)

// --- NUEVA INTERFAZ (OPCIONAL PERO RECOMENDADA) ---
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
  private apiUrl = 'http://localhost:8080/api/auth';

  private decodedToken: any | null = null;
  private userRole = signal<string | null>(null);
  private medicoInfo = signal<MedicoInfo | null>(null); // <-- NUEVO SIGNAL

  constructor(private http: HttpClient, private router: Router) {
    this.loadToken();
  }

  private loadToken(): void {
    if (typeof localStorage !== 'undefined') {
      const token = this.getToken();
      if (token) {
        try {
          this.decodedToken = jwtDecode(token);

          // --- LÓGICA DE ROL Y DATOS DE MÉDICO ---
          const role = this.decodedToken.authorities?.[0]?.authority;
          if (role) {
            this.userRole.set(role);
          }

          const medico = this.decodedToken.medicoInfo;
          if (medico) {
            this.medicoInfo.set(medico);
          }
          // --- FIN LÓGICA ---

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

          // --- LÓGICA DE ROL Y DATOS DE MÉDICO ---
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
          // --- FIN LÓGICA ---
        }),
        catchError((err: HttpErrorResponse) => {
          this.userRole.set(null);
          this.medicoInfo.set(null); // <-- LIMPIAR
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
    this.medicoInfo.set(null); // <-- LIMPIAR
    // this.router.navigate(['/login']); // Main.ts se encargará de esto
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    return this.userRole();
  }

  // --- NUEVO MÉTODO ---
  /**
   * Devuelve la información del médico logueado, si existe.
   */
  getMedicoInfo(): MedicoInfo | null {
    return this.medicoInfo();
  }
  // --- FIN NUEVO MÉTODO ---

  hasAnyRole(roles: string[]): boolean {
    const currentRole = this.getRole();
    if (!currentRole) {
      return false;
    }
    return roles.includes(currentRole);
  }
}
