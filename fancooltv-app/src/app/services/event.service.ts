import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private creditsUpdatedSource = new Subject<number>();
  
  // Observable che i componenti possono sottoscrivere
  creditsUpdated$: Observable<number> = this.creditsUpdatedSource.asObservable();
  
  constructor() { }
  
  /**
   * Notifica a tutti i componenti che i crediti sono stati aggiornati
   * @param newBalance Il nuovo saldo crediti
   */
  notifyCreditsUpdated(newBalance: number): void {
    console.log('EventService: notifying credits updated to', newBalance);
    this.creditsUpdatedSource.next(newBalance);
  }
}
