import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComunicacionService {
  private turnoAsignadoSubject = new Subject<any>();
  private turnoActualizadoSubject = new Subject<any>();

  /**
   * Observable para escuchar cuando se asigna un nuevo turno
   */
  getTurnoAsignado$(): Observable<any> {
    return this.turnoAsignadoSubject.asObservable();
  }

  /**
   * Observable para escuchar cuando se actualiza un turno
   */
  getTurnoActualizado$(): Observable<any> {
    return this.turnoActualizadoSubject.asObservable();
  }

  /**
   * Notifica que se ha asignado un nuevo turno
   */
  notificarTurnoAsignado(turnoData: any): void {
    console.log('ComunicacionService: Notificando turno asignado:', turnoData);
    this.turnoAsignadoSubject.next(turnoData);
  }

  /**
   * Notifica que se ha actualizado un turno
   */
  notificarTurnoActualizado(turnoData: any): void {
    console.log('ComunicacionService: Notificando turno actualizado:', turnoData);
    this.turnoActualizadoSubject.next(turnoData);
  }
}
