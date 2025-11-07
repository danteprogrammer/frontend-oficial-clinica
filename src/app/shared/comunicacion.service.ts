import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComunicacionService {
  private turnoAsignadoSubject = new Subject<any>();
  private turnoActualizadoSubject = new Subject<any>();

  getTurnoAsignado$(): Observable<any> {
    return this.turnoAsignadoSubject.asObservable();
  }

  getTurnoActualizado$(): Observable<any> {
    return this.turnoActualizadoSubject.asObservable();
  }

  notificarTurnoAsignado(turnoData: any): void {
    console.log('ComunicacionService: Notificando turno asignado:', turnoData);
    this.turnoAsignadoSubject.next(turnoData);
  }

  notificarTurnoActualizado(turnoData: any): void {
    console.log('ComunicacionService: Notificando turno actualizado:', turnoData);
    this.turnoActualizadoSubject.next(turnoData);
  }
}
