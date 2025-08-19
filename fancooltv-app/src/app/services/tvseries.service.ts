import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { ApiService } from './api.service';
import { TVSeries } from '../models/tvseries.models';
import { ApiResponse, PaginationParams } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class TVSeriesService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) { }

  /**
   * Load TV series with pagination and filters
   */
  loadTVSeries(params: Partial<PaginationParams> = { page: 1 }): Observable<TVSeries[]> {
    console.log('TVSeriesService.loadTVSeries called with params:', params);
    this.loadingSubject.next(true);
    return this.apiService.getTVSeries(params).pipe(
      map((response: ApiResponse<TVSeries[]>) => {
        console.log('TVSeriesService received response:', response);
        if (response && response.data) {
          console.log('TVSeriesService returning data:', response.data);
          // Restituisci direttamente i dati
          return response.data;
        } else {
          throw new Error('Errore nel caricamento delle serie TV');
        }
      }),
      catchError((error: any) => {
        console.error('Errore nel caricamento delle serie TV:', error);
        return throwError(() => new Error('Errore nel caricamento delle serie TV'));
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Load TV series details by ID
   */
  loadTVSeriesDetails(seriesId: number): Observable<TVSeries> {
    console.log('TVSeriesService.loadTVSeriesDetails called with ID:', seriesId);
    this.loadingSubject.next(true);
    return this.apiService.getTVSeriesDetails(seriesId).pipe(
      map((response: any) => {
        console.log('TVSeriesService details response:', response);
        console.log('Response structure:', JSON.stringify(response, null, 2));
        
        // Check if response has ApiResponse wrapper structure
        if (response && response.data) {
          console.log('TVSeriesService returning wrapped data:', response.data);
          const data = response.data;
          if (!data.description && !data.backdrop && !data.persons && !data.trailers) {
            console.warn('Backend returned incomplete TV series data - missing relations');
            // Add default values for missing relations to prevent template errors
            data.persons = data.persons || [];
            data.trailers = data.trailers || [];
            data.seasons = data.seasons || [];
            data.description = data.description || 'Descrizione non disponibile';
            data.backdrop = data.backdrop || null;
          }
          return response.data;
        } 
        // Handle direct response without wrapper (current backend behavior)
        else if (response && response.tv_series_id) {
          console.log('TVSeriesService returning direct data:', response);
          if (!response.description && !response.backdrop && !response.persons && !response.trailers) {
            console.warn('Backend returned incomplete TV series data - missing relations');
            // Add default values for missing relations to prevent template errors
            response.persons = response.persons || [];
            response.trailers = response.trailers || [];
            response.seasons = response.seasons || [];
            response.description = response.description || 'Descrizione non disponibile';
            response.backdrop = response.backdrop || null;
          }
          return response as TVSeries;
        } 
        else {
          console.error('Invalid response structure:', response);
          throw new Error('Errore nel caricamento dei dettagli della serie TV');
        }
      }),
      catchError((error: any) => {
        console.error('Errore nel caricamento dei dettagli della serie TV:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        
        let errorMessage = 'Errore nel caricamento dei dettagli della serie TV';
        if (error.status === 500) {
          errorMessage = 'Errore interno del server. Controlla i log del backend.';
        } else if (error.status === 404) {
          errorMessage = 'Serie TV non trovata.';
        } else if (error.status === 403) {
          errorMessage = 'Non autorizzato a visualizzare questa serie TV.';
        }
        
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Get YouTube embed URL from any YouTube URL format
   */
  getYouTubeEmbedUrl(url: string): string {
    if (!url) return '';
    
    // Handle both normal and shortened links
    const videoId = url.includes('youtu.be/') 
      ? url.split('youtu.be/')[1]
      : url.split('v=')[1]?.split('&')[0];

    if (!videoId) return '';
    
    // Add parameters needed for embed
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  }
}
