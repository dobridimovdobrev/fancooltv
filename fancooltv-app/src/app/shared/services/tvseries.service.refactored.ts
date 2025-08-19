import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { BaseMediaService, BaseMediaItem } from './base-media.service';
import { ApiService } from '../../services/api.service';
import { TVSeriesService } from '../../services/tvseries.service';
import { TVSeries } from '../../models/tvseries.models';
import { ApiResponse } from '../../models/api.models';

// Extended interface for TV Series items with BaseMediaItem compatibility
interface TVSeriesItem extends Omit<TVSeries, 'category' | 'poster' | 'backdrop' | 'description'>, BaseMediaItem {
  id: number; // Maps to tv_series_id
  category: string; // Override category to be string instead of Category object
}

@Injectable({
  providedIn: 'root'
})
export class TVSeriesServiceRefactored extends BaseMediaService<TVSeriesItem> {
  // Expose series$ as an alias to items$ for backward compatibility
  public get series$(): Observable<TVSeriesItem[]> {
    return this.items$;
  }

  constructor(
    protected override apiService: ApiService,
    private tvseriesService: TVSeriesService
  ) {
    super(apiService);
  }

  /**
   * Get API endpoint for TV series
   */
  protected getApiEndpoint(): string {
    return '/api/v1/tvseries';
  }

  /**
   * Get API endpoint for TV series details
   */
  protected getDetailsApiEndpoint(id: number): string {
    return `/api/v1/tvseries/${id}`;
  }

  /**
   * Map API response to TVSeriesItem array
   */
  protected mapApiResponse(response: ApiResponse<TVSeriesItem[]>): TVSeriesItem[] {
    if (!response.data) return [];
    
    return response.data.map(series => ({
      ...series,
      id: series.tv_series_id || series.id // Ensure id is set
    }));
  }

  /**
   * Map details API response to TVSeriesItem
   */
  protected mapDetailsResponse(response: ApiResponse<TVSeriesItem>): TVSeriesItem {
    const series = response.data;
    return {
      ...series,
      id: series.tv_series_id || series.id // Ensure id is set
    };
  }

  /**
   * Load TV series with pagination and filters (backward compatibility)
   */
  public loadTVSeries(params: any = { page: 1 }): Observable<TVSeriesItem[]> {
    // Set filters from params
    if (params.q) this.search(params.q);
    if (params.category) this.filterByCategory(params.category);
    if (params.year) this.filterByYear(params.year);
    
    return new Observable(observer => {
      this.loadItems(params.page === 1).subscribe({
        next: (items) => {
          observer.next(items);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Load TV series details by ID (backward compatibility)
   */
  public loadTVSeriesDetails(seriesId: number): Observable<TVSeriesItem> {
    return this.loadItemDetails(seriesId);
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
   * Get formatted seasons text
   */
  public getFormattedSeasons(totalSeasons: number): string {
    if (!totalSeasons) return '';
    
    return totalSeasons === 1 ? '1 Season' : `${totalSeasons} Seasons`;
  }

  /**
   * Get formatted episodes text for a season
   */
  public getFormattedEpisodes(episodeCount: number): string {
    if (!episodeCount) return '';
    
    return episodeCount === 1 ? '1 Episode' : `${episodeCount} Episodes`;
  }

  /**
   * Check if series is currently airing
   */
  public isCurrentlyAiring(series: TVSeriesItem): boolean {
    if (!series.status) return false;
    
    const airingStatuses = ['airing', 'returning', 'ongoing'];
    return airingStatuses.includes(series.status.toLowerCase());
  }

  /**
   * Check if series is completed
   */
  public isCompleted(series: TVSeriesItem): boolean {
    if (!series.status) return false;
    
    const completedStatuses = ['ended', 'completed', 'finished'];
    return completedStatuses.includes(series.status.toLowerCase());
  }

  /**
   * Get series status badge color
   */
  public getStatusBadgeColor(status: string): string {
    const statusColors = {
      'airing': 'success',
      'returning': 'info',
      'ongoing': 'primary',
      'ended': 'secondary',
      'completed': 'secondary',
      'finished': 'secondary',
      'cancelled': 'danger',
      'upcoming': 'warning'
    };
    
    return statusColors[status?.toLowerCase() as keyof typeof statusColors] || 'secondary';
  }

  /**
   * Get next air date if available
   */
  public getNextAirDate(series: TVSeriesItem): Date | null {
    // This would typically come from the API
    // For now, return null as placeholder
    return null;
  }

  /**
   * Get estimated total runtime for entire series
   */
  public getEstimatedTotalRuntime(series: TVSeriesItem): number {
    if (!series.total_seasons || !series.duration) return 0;
    
    // Estimate based on average episodes per season (typically 10-24)
    const avgEpisodesPerSeason = 15;
    return series.total_seasons * avgEpisodesPerSeason * series.duration;
  }

  /**
   * Get formatted total runtime
   */
  public getFormattedTotalRuntime(series: TVSeriesItem): string {
    const totalMinutes = this.getEstimatedTotalRuntime(series);
    if (!totalMinutes) return '';
    
    const hours = Math.floor(totalMinutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${totalMinutes}m`;
  }

  /**
   * Filter series by status
   */
  public filterByStatus(status: string): void {
    // This would need to be implemented in the API
    // For now, we can filter client-side after loading
    this.items$.subscribe(series => {
      const filteredSeries = series.filter(item => 
        item.status?.toLowerCase() === status.toLowerCase()
      );
      this.itemsSubject.next(filteredSeries);
    });
  }

  /**
   * Get series by specific genre/category
   */
  public getSeriesByCategory(categoryId: number): Observable<TVSeriesItem[]> {
    this.filterByCategory(categoryId.toString());
    return this.items$;
  }

  /**
   * Search series with advanced filters
   */
  public advancedSearch(filters: {
    query?: string;
    category?: string;
    year?: string;
    status?: string;
    minRating?: number;
    maxRating?: number;
  }): void {
    if (filters.query) this.search(filters.query);
    if (filters.category) this.filterByCategory(filters.category);
    if (filters.year) this.filterByYear(filters.year);
    if (filters.status) this.filterByStatus(filters.status);
    if (filters.minRating && filters.maxRating) {
      // Filter by rating range (client-side)
      this.items$.subscribe(series => {
        const filteredSeries = series.filter(item => 
          item.imdb_rating >= filters.minRating! && 
          item.imdb_rating <= filters.maxRating!
        );
        this.itemsSubject.next(filteredSeries);
      });
    }
  }

  /**
   * Load TV series items with pagination and filters
   * Uses BaseMediaService properties and methods correctly
   */
  public loadItems(resetPagination: boolean = false): Observable<TVSeriesItem[]> {
    if (resetPagination) {
      this.currentPage = 1;
    }

    // Build query parameters using BaseMediaService method
    const params = this.buildApiParams();

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getTVSeries(params).pipe(
      map((response: ApiResponse<TVSeries[]>) => {
        // Convert TVSeries[] to TVSeriesItem[]
        const mappedItems = response.data?.map(series => ({
          ...series,
          id: series.tv_series_id,
          category: typeof series.category === 'string' ? series.category : series.category?.name || 'Unknown',
          duration: 45, // Default episode duration for TV series
          poster: series.poster?.url || '',
          backdrop: series.backdrop?.url || '',
          description: series.description || ''
        } as TVSeriesItem)) || [];
        
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
   * Load TV series details by ID
   * Uses BaseMediaService error handling
   */
  public loadItemDetails(id: number): Observable<TVSeriesItem> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getTVSeriesDetails(id).pipe(
      map((response: ApiResponse<TVSeries>) => {
        // Map TVSeries to TVSeriesItem
        const series = response.data;
        return {
          ...series,
          id: series.tv_series_id,
          category: typeof series.category === 'string' ? series.category : series.category?.name || 'Unknown',
          duration: 45, // Default episode duration for TV series
          poster: series.poster?.url || '',
          backdrop: series.backdrop?.url || '',
          description: series.description || ''
        } as TVSeriesItem;
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
