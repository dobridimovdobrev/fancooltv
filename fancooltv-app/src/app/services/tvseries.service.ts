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
    this.loadingSubject.next(true);
    return this.apiService.getTVSeries(params).pipe(
      map((response: ApiResponse<TVSeries[]>) => {
        if (response && response.data) {
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
    this.loadingSubject.next(true);
    return this.apiService.getTVSeriesDetails(seriesId).pipe(
      map((response: ApiResponse<TVSeries>) => {
        if (response && response.data) {
          return response.data;
        } else {
          throw new Error('Errore nel caricamento dei dettagli della serie TV');
        }
      }),
      catchError((error: any) => {
        console.error('Errore nel caricamento dei dettagli della serie TV:', error);
        return throwError(() => new Error('Errore nel caricamento dei dettagli della serie TV'));
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
