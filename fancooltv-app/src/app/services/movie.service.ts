import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { map, catchError, finalize, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Movie, Category } from '../models/media.models';
import { ApiResponse, PaginationParams } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  // BehaviorSubject per mantenere lo stato corrente dei film
  private moviesSubject = new BehaviorSubject<Movie[]>([]);
  public movies$ = this.moviesSubject.asObservable();

  // BehaviorSubject per le categorie
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  // Stato corrente della paginazione e filtri
  private currentPage = 1;
  private currentSearch = '';
  private currentCategory = '';
  private currentYear = '';
  private isLoading = false;
  private hasMorePages = true;

  // BehaviorSubject per lo stato di caricamento
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) { }

  /**
   * Carica i film con paginazione e filtri opzionali
   */
  public loadMovies(reset: boolean = false): Observable<ApiResponse<Movie[]>> {
    if (reset) {
      this.currentPage = 1;
      this.moviesSubject.next([]);
    }

    if (this.isLoading || (!this.hasMorePages && !reset)) {
      return new Observable(observer => observer.complete());
    }

    this.isLoading = true;
    this.loadingSubject.next(true);

    const params: PaginationParams = {
      page: this.currentPage
    };

    if (this.currentSearch) {
      params.q = this.currentSearch;
    }

    if (this.currentCategory) {
      params.category = this.currentCategory;
    }

    if (this.currentYear) {
      params.year = this.currentYear;
    }

    return this.apiService.getMovies(params).pipe(
      map(response => {
        // Filter out soft deleted movies
        const filteredMovies = response.data.filter(movie => !movie.deleted_at);
        return {
          ...response,
          data: filteredMovies
        } as ApiResponse<Movie[]>;
      }),
      tap(response => {
        console.log('API Response received:', {
          params,
          totalResults: response.data.length,
          firstFewResults: response.data.slice(0, 3).map(m => ({ title: m.title, category: m.category?.name, category_id: m.category_id }))
        }); // Debug log
        
        this.isLoading = false;
        this.loadingSubject.next(false);

        // Aggiorna lo stato della paginazione
        this.hasMorePages = response.meta.current_page < response.meta.last_page;
        
        // Aggiorna la lista dei film (append o reset)
        if (reset || this.currentPage === 1) {
          this.moviesSubject.next(response.data);
        } else {
          const currentMovies = this.moviesSubject.getValue();
          this.moviesSubject.next([...currentMovies, ...response.data]);
        }
      })
    );
  }

  /**
   * Get all active movies (for dashboard count)
   */
  public getAllMovies(): Observable<ApiResponse<Movie[]>> {
    return this.apiService.getMovies({ page: 1 }).pipe(
      map(response => {
        // Filter out soft deleted movies
        const filteredMovies = response.data.filter(movie => !movie.deleted_at);
        
        // Use the total count from meta if available, otherwise use filtered data length
        const totalCount = response.meta?.total || filteredMovies.length;
        
        console.log('Movies API response:', {
          totalFromAPI: response.data.length,
          filteredCount: filteredMovies.length,
          metaTotal: response.meta?.total,
          usingCount: totalCount
        });
        
        return {
          ...response,
          data: filteredMovies,
          meta: response.meta ? {
            ...response.meta,
            total: totalCount
          } : undefined
        } as ApiResponse<Movie[]>;
      })
    );
  }

  /**
   * Carica i dettagli di un film specifico
   */
  public getMovieDetails(id: number): Observable<ApiResponse<Movie>> {
    return this.apiService.getMovieDetails(id);
  }

  /**
   * Carica le categorie disponibili
   */
  public loadCategories(): Observable<ApiResponse<Category[]>> {
    return this.apiService.getCategories().pipe(
      tap(response => {
        if (response.data) {
          this.categoriesSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Imposta il filtro di ricerca e ricarica i film
   */
  public search(query: string): void {
    console.log('MovieService search called with query:', query); // Debug log
    this.currentSearch = query;
    this.loadMovies(true).subscribe();
  }

  /**
   * Imposta il filtro di categoria e ricarica i film
   */
  public filterByCategory(categoryId: string): void {
    console.log('MovieService filterByCategory called with:', categoryId); // Debug log
    this.currentCategory = categoryId;
    this.loadMovies(true).subscribe();
  }

  /**
   * Imposta il filtro di anno e ricarica i film
   */
  public filterByYear(year: string): void {
    this.currentYear = year;
    this.loadMovies(true).subscribe();
  }

  /**
   * Carica la pagina successiva di film
   */
  public loadMore(): void {
    if (!this.isLoading && this.hasMorePages) {
      this.currentPage++;
      this.loadMovies().subscribe();
    }
  }

  /**
   * Reset all filters and reload movies
   */
  public resetFilters(): void {
    this.currentSearch = '';
    this.currentCategory = '';
    this.currentYear = '';
    this.loadMovies(true).subscribe();
  }

  /**
   * Genera gli anni per il filtro (da 1900 all'anno corrente)
   */
  public getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  }

  /**
   * Ottiene l'URL dell'immagine
   */
  public getImageUrl(path: string, type: 'poster' | 'backdrop' = 'poster'): string {
    return this.apiService.getImageUrl(path, type);
  }

  /**
   * Ottiene l'URL per lo streaming video
   */
  public getVideoUrl(videoPath: string): string {
    return this.apiService.getVideoUrl(videoPath);
  }

  /**
   * Scarica un video come blob per l'autenticazione
   */
  public getVideoBlob(videoPath: string): Observable<Blob> {
    return this.apiService.getVideoBlob(videoPath);
  }

  /**
   * Carica i dettagli di un film specifico
   */
  loadMovieDetails(movieId: number): Observable<Movie> {
    this.loadingSubject.next(true);
    
    return this.apiService.getMovieDetails(movieId).pipe(
      map((response: ApiResponse<Movie>) => {
        // Verifica se la risposta contiene i dati del film
        if (response && response.data) {
          return response.data;
        } else {
          throw new Error('Errore nel caricamento dei dettagli del film');
        }
      }),
      catchError((error: any) => {
        console.error('Errore nel caricamento dei dettagli del film:', error);
        return throwError(() => new Error('Errore nel caricamento dei dettagli del film'));
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }
}
