import { Injectable, signal } from '@angular/core'; // <-- AÑADIDO signal
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router'; // <-- AÑADIDO Router
import { Observable, throwError, of } from 'rxjs'; // <-- AÑADIDO throwError, of
import { tap, catchError } from 'rxjs/operators'; // <-- AÑADIDO catchError
import { jwtDecode } from 'jwt-decode'; // <-- AÑADIDO (recuerda instalarlo)

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/api/auth';

  // --- NUEVAS PROPIEDADES ---
  private decodedToken: any | null = null;
  private userRole = signal<string | null>(null); // Signal para el rol

  constructor(private http: HttpClient, private router: Router) { // <-- AÑADIDO Router
    this.loadToken(); // Cargar token al iniciar
  }

  // --- NUEVO MÉTODO ---
  private loadToken(): void {
    if (typeof localStorage !== 'undefined') {
      const token = this.getToken(); // Usa tu método existente
      if (token) {
        try {
          this.decodedToken = jwtDecode(token);
          // Decodifica el rol desde el token JWT
          const role = this.decodedToken.authorities?.[0]?.authority;
          if (role) {
            this.userRole.set(role); // Guardar el rol
          }
        } catch (Error) {
          console.error('Error al decodificar el token:', Error);
          this.logout(); // Llama a tu método logout si el token es inválido
        }
      }
    }
  }

  // --- MÉTODO LOGIN MODIFICADO ---
  login(username: string, password: string): Observable<any> { // Devolver 'any' para el error
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          // Decodificar y guardar rol
          try {
            this.decodedToken = jwtDecode(response.token);
            const role = this.decodedToken.authorities?.[0]?.authority;
            if (role) {
              this.userRole.set(role);
            }
          } catch (Error) {
            console.error('Error al decodificar nuevo token:', Error);
            this.userRole.set(null);
          }
        }),
        catchError((err: HttpErrorResponse) => { // <-- Añadido catchError
          this.userRole.set(null); // Limpiar rol en error
          return throwError(() => err); // Propagar el error
        })
      );
  }

  private saveToken(token: string): void {
    localStorage.setItem('authToken', token); // Usamos tu key 'authToken'
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // --- MÉTODO LOGOUT MODIFICADO ---
  logout(): void {
    localStorage.removeItem('authToken');
    this.decodedToken = null;
    this.userRole.set(null); // <-- Limpiar rol
    // El componente Main se encargará de navegar al login
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // --- NUEVOS MÉTODOS DE ROL ---
  /**
   * Devuelve el rol actual del usuario.
   */
  getRole(): string | null {
    return this.userRole();
  }

  /**
   * Comprueba si el usuario tiene alguno de los roles proporcionados.
   */
  hasAnyRole(roles: string[]): boolean {
    const currentRole = this.getRole();
    if (!currentRole) {
      return false;
    }
    return roles.includes(currentRole);
  }
}
