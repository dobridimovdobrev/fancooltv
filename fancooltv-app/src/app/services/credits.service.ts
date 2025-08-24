import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root'
})
export class CreditsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private eventService: EventService
  ) { }

  /**
   * Verifica se l'utente può riprodurre un video (senza consumare crediti)
   * @param mediaType Tipo di media ('movie', 'tvseries', 'episode', 'trailer')
   * @param mediaId ID del media specifico
   * @returns Observable con risposta booleana
   */
  canPlay(mediaType: string = 'movie', mediaId?: number): Observable<boolean> {
    // Prima prova l'endpoint can-play
    let params = new HttpParams().set('media_type', mediaType);
    
    // Aggiungi media_id se disponibile
    if (mediaId) {
      params = params.set('media_id', mediaId.toString());
    }
    
    console.log(`Verifico crediti per media_type: ${mediaType}${mediaId ? ', media_id: ' + mediaId : ''}`);
    
    return this.http.get<any>(`${this.apiUrl}/api/v1/credits/can-play`, {
      params: params,
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('canPlay response:', response);
        // Verifica se la risposta contiene un messaggio di successo
        if (response.status === 'success') {
          return true;
        }
        // Verifica il campo can_play nella struttura data
        if (response.data && response.data.can_play !== undefined) {
          return response.data.can_play;
        }
        // Se non troviamo can_play, assumiamo che l'utente possa riprodurre il video
        return true;
      }),
      catchError((error: any) => {
        console.error('Error in canPlay API:', error);
        
        // Se l'endpoint can-play non esiste (404), fallback su getBalance
        if (error.status === 404) {
          console.log('canPlay endpoint not found, falling back to getBalance');
          return this.getBalance().pipe(
            map(balance => {
              // Se il saldo è maggiore di 0, l'utente può riprodurre il video
              const canPlay = balance > 0;
              console.log(`Determined canPlay from balance: ${canPlay} (balance: ${balance})`);
              return canPlay;
            })
          );
        }
        
        // Per altri errori, ritorna false
        return of(false);
      })
    );
  }

  /**
   * Consuma crediti per la riproduzione di un video (20 crediti)
   * @param mediaType Tipo di media ('movie', 'tvseries', 'episode', 'trailer')
   * @param mediaId ID del media specifico
   * @returns Observable con risposta di successo
   */
  consumeCredits(mediaType: string = 'movie', mediaId?: number): Observable<any> {
    console.log(`[DEBUG] CreditsService.consumeCredits chiamato per ${mediaType} con ID ${mediaId}`);
    
    // Prepara il payload con media_type e media_id se disponibile
    const payload: any = { media_type: mediaType };
    if (mediaId) {
      payload.media_id = mediaId;
    }
    
    console.log(`[DEBUG] Chiamata API: POST ${this.apiUrl}/api/v1/credits/consume con payload:`, payload);
    
    return this.http.post<any>(`${this.apiUrl}/api/v1/credits/consume`, payload, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log(`[DEBUG] Risposta consumeCredits ricevuta:`, response);
        
        // Estrai il nuovo saldo se disponibile e notifica l'aggiornamento
        let newBalance;
        if (response.data && response.data.remaining_credits !== undefined) {
          newBalance = response.data.remaining_credits;
        } else if (response.remaining_credits !== undefined) {
          newBalance = response.remaining_credits;
        } else if (response.message && response.message.remaining_credits !== undefined) {
          newBalance = response.message.remaining_credits;
        }
        
        if (newBalance !== undefined) {
          this.eventService.notifyCreditsUpdated(newBalance);
        }
      }),
      map(response => {
        return response;
      }),
      catchError((error: any) => {
        console.error('[ERROR] Errore durante il consumo dei crediti:', error);
        
        // Gestione specifica dell'errore 402 Payment Required
        if (error.status === 402) {
          console.warn('[WARN] Crediti insufficienti (402 Payment Required)');
          // Ritorna un oggetto con informazioni sull'errore invece di propagare l'errore
          return of({
            error: true,
            status: 402,
            message: 'You don\'t have enough credits to play this content',
            can_play: false,
            errorType: 'insufficient_credits'
          });
        }
        
        // Per altri errori, propaga l'errore
        return throwError(() => error);
      })
    );
  }

  /**
   * Ottiene il saldo crediti dell'utente
   * @returns Observable con il saldo crediti
   */
  getBalance(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/credits/balance`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        // Log della risposta per debug
        console.log('Risposta API getBalance:', response);
        
        // Gestione di diverse possibili strutture di risposta
        let balance = 0;
        if (response.data && response.data.balance !== undefined) {
          balance = response.data.balance;
        } else if (response.remaining_credits !== undefined) {
          balance = response.remaining_credits;
        } else if (response.message && response.message.remaining_credits !== undefined) {
          balance = response.message.remaining_credits;
        } else {
          console.warn('Struttura risposta API getBalance non riconosciuta:', response);
        }
        
        return balance;
      }),
      tap(balance => {
        // Notifica a tutti i componenti che i crediti sono stati aggiornati
        this.eventService.notifyCreditsUpdated(balance);
      })
    );
  }
  
  /**
   * Aggiunge crediti al saldo dell'utente
   * @param amount Quantità di crediti da aggiungere
   * @returns Observable con risposta di successo e saldo aggiornato
   */
  addCredits(amount: number): Observable<{success: boolean, newBalance?: number}> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/credits`, { total_credits: amount }, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        // Log della risposta per debug
        console.log('Risposta API addCredits:', response);
        
        // Estrai il nuovo saldo se disponibile
        let newBalance;
        if (response.data && response.data.remaining_credits !== undefined) {
          newBalance = response.data.remaining_credits;
        } else if (response.remaining_credits !== undefined) {
          newBalance = response.remaining_credits;
        } else if (response.message && response.message.remaining_credits !== undefined) {
          newBalance = response.message.remaining_credits;
        }
        
        // Notifica a tutti i componenti che i crediti sono stati aggiornati
        if (newBalance !== undefined) {
          this.eventService.notifyCreditsUpdated(newBalance);
        }
        
        return {
          success: true,
          newBalance: newBalance
        };
      })
    );
  }

  /**
   * Get headers for API requests with authentication if available
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
}
