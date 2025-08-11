import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { BaseMediaService, BaseMediaItem } from './base-media.service';
import { ApiService } from '../../services/api.service';
import { ImageService } from './image.service';
import { Movie } from '../../models/media.models';
import { ApiResponse } from '../../models/api.models';

// Extended interface for Movie items with BaseMediaItem compatibility
// Use Omit to avoid category conflict, then add our own category as string
interface MovieItem extends Omit<Movie, 'category'>, BaseMediaItem {
  id: number; // Maps to movie_id
  category: string; // Override category as string for BaseMediaItem compatibility
}

@Injectable({
  providedIn: 'root'
})
export class MovieServiceRefactored extends BaseMediaService<MovieItem> {
  // Expose movies$ as an alias to items$ for backward compatibility
  public get movies$(): Observable<MovieItem[]> {
    return this.items$;
  }

  constructor(
    protected override apiService: ApiService,
    private imageService: ImageService
  ) {
    super(apiService);
  }

  /**
   * Get API endpoint for movies
   */
  protected getApiEndpoint(): string {
    return '/api/v1/movies';
  }

  /**
   * Get API endpoint for movie details
   */
  protected getDetailsApiEndpoint(id: number): string {
    return `/api/v1/movies/${id}`;
  }

  /**
   * Map API response to MovieItem array
   */
  protected mapApiResponse(response: ApiResponse<MovieItem[]>): MovieItem[] {
    if (!response.data) return [];
    
    return response.data.map(movie => ({
      ...movie,
      id: movie.movie_id || movie.id // Ensure id is set
    }));
  }

  /**
   * Map details API response to MovieItem
   */
  protected mapDetailsResponse(response: ApiResponse<MovieItem>): MovieItem {
    const movie = response.data;
    return {
      ...movie,
      id: movie.movie_id || movie.id // Ensure id is set
    };
  }

  /**
   * Load movies with pagination and filters (backward compatibility)
   */
  public loadMovies(reset: boolean = false): Observable<MovieItem[]> {
    return this.loadItems(reset);
  }

  /**
   * Get movie details by ID (backward compatibility)
   */
  public getMovieDetails(id: number): Observable<MovieItem> {
    return this.loadItemDetails(id);
  }

  /**
   * Load movie details with error handling (backward compatibility)
   */
  public loadMovieDetails(movieId: number): Observable<MovieItem> {
    return this.loadItemDetails(movieId);
  }

  /**
   * Get YouTube embed URL from any YouTube URL format
   */
  public getYouTubeEmbedUrl(url: string): string {
    if (!url) return '';
    
    // Handle both normal and shortened links
    const videoId = url.includes('youtu.be/') 
      ? url.split('youtu.be/')[1]
      : url.split('v=')[1]?.split('&')[0];

    if (!videoId) return '';
    
    // Add parameters needed for embed
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  }

  /**
   * Get movie duration in formatted string
   */
  public getFormattedDuration(minutes: number): string {
    if (!minutes) return '';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Check if movie is recently released (within last 30 days)
   */
  public isRecentlyReleased(movie: MovieItem): boolean {
    if (!movie.premiere_date) return false;
    
    const releaseDate = new Date(movie.premiere_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return releaseDate >= thirtyDaysAgo;
  }

  /**
   * Get movie status badge color
   */
  public getStatusBadgeColor(status: string): string {
    const statusColors = {
      'published': 'success',
      'draft': 'secondary',
      'scheduled': 'warning',
      'coming soon': 'info'
    };
    
    return statusColors[status as keyof typeof statusColors] || 'secondary';
  }

  /**
   * Filter movies by rating range
   */
  public filterByRating(minRating: number, maxRating: number = 10): void {
    // This would need to be implemented in the API
    // For now, we can filter client-side after loading
    this.items$.subscribe(movies => {
      const filteredMovies = movies.filter(movie => 
        movie.imdb_rating >= minRating && movie.imdb_rating <= maxRating
      );
      this.itemsSubject.next(filteredMovies);
    });
  }

  /**
   * Get movies by specific category
   */
  public getMoviesByCategory(categoryId: number): Observable<MovieItem[]> {
    this.filterByCategory(categoryId.toString());
    return this.items$;
  }

  /**
   * Search movies with advanced filters
   */
  public advancedSearch(filters: {
    query?: string;
    category?: string;
    year?: string;
    minRating?: number;
    maxRating?: number;
  }): void {
    if (filters.query) this.search(filters.query);
    if (filters.category) this.filterByCategory(filters.category);
    if (filters.year) this.filterByYear(filters.year);
    if (filters.minRating && filters.maxRating) {
      this.filterByRating(filters.minRating, filters.maxRating);
    }
  }

  /**
   * Implementation of abstract method from BaseMediaService
   * Load movie items with pagination and filters
   */
  public loadItems(resetPagination: boolean = false): Observable<MovieItem[]> {
    if (resetPagination) {
      this.currentPage = 1;
    }

    // Build query parameters using BaseMediaService method
    const params = this.buildApiParams();

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getMovies(params).pipe(
      map((response: ApiResponse<Movie[]>) => {
        // Convert Movie[] to MovieItem[]
        const mappedItems = response.data?.map(movie => ({
          ...movie,
          id: movie.movie_id,
          category: typeof movie.category === 'string' ? movie.category : movie.category?.name || 'Unknown'
        } as MovieItem)) || [];
        
        if (resetPagination) {
          this.itemsSubject.next(mappedItems);
        } else {
          // Append to existing items for pagination
          const currentItems = this.itemsSubject.value;
          const newItems = [...currentItems, ...mappedItems];
          this.itemsSubject.next(newItems);
        }

        // Update pagination info using BaseMediaService method
        this.updatePaginationInfo(response);
        
        return mappedItems;
      }),
      catchError(error => {
        return this.handleError(error);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Implementation of abstract method from BaseMediaService
   * Load movie details by ID
   */
  public loadItemDetails(id: number): Observable<MovieItem> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getMovieDetails(id).pipe(
      map((response: ApiResponse<Movie>) => {
        // Map Movie to MovieItem
        const movie = response.data;
        return {
          ...movie,
          id: movie.movie_id,
          category: typeof movie.category === 'string' ? movie.category : movie.category?.name || 'Unknown'
        } as MovieItem;
      }),
      catchError(error => {
        return this.handleError(error);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }
}
