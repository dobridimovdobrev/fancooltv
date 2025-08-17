import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { BaseMediaService, BaseMediaItem } from '../../services/base-media.service';
import { ImageService } from '../../services/image.service';
import { Category } from '../../../models/media.models';

export type MediaType = 'movie' | 'tvseries';

@Component({
  selector: 'app-media-list',
  templateUrl: './media-list.component.html',
  styleUrls: ['./media-list.component.scss']
})
export class MediaListComponent implements OnInit, OnDestroy {
  @Input() mediaType: MediaType = 'movie';
  @Input() title: string = '';
  @Input() searchPlaceholder: string = 'Search...';
  @Input() mediaService!: BaseMediaService<any>;

  // Component state
  items: any[] = [];
  categories: Category[] = [];
  years: number[] = [];
  loading = false;
  error = false;
  errorMessage = '';
  noResults = false;
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;

  // Filter and pagination state
  searchQuery = '';
  selectedCategory = '';
  selectedYear = '';

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize component with authentication check and data loading
   */
  private initializeComponent(): void {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Validate required inputs
    if (!this.mediaService) {
      console.error('MediaListComponent: mediaService is required');
      this.error = true;
      this.errorMessage = 'Configuration error: media service not provided';
      return;
    }

    // Set default title if not provided
    if (!this.title) {
      this.title = this.mediaType === 'movie' ? 'Movies' : 'TV Series';
    }

    // Set default search placeholder if not provided
    if (this.searchPlaceholder === 'Search...') {
      this.searchPlaceholder = this.mediaType === 'movie' ? 'Search movies...' : 'Search TV series...';
    }

    this.setupSubscriptions();
    this.loadInitialData();
  }

  /**
   * Setup reactive subscriptions
   */
  private setupSubscriptions(): void {
    // Subscribe to items
    const itemsSubscription = this.mediaService.items$.subscribe(items => {
      this.items = items;
      this.noResults = items.length === 0 && !this.loading;
    });

    // Subscribe to categories
    const categoriesSubscription = this.mediaService.categories$.subscribe(categories => {
      this.categories = categories;
    });

    // Subscribe to loading state
    const loadingSubscription = this.mediaService.loading$.subscribe(loading => {
      this.loading = loading;
    });

    this.subscriptions.add(itemsSubscription);
    this.subscriptions.add(categoriesSubscription);
    this.subscriptions.add(loadingSubscription);
  }

  /**
   * Load initial data
   */
  private loadInitialData(): void {
    try {
      // Generate years for filter (create years array manually)
      const currentYear = new Date().getFullYear();
      this.years = [];
      for (let year = currentYear; year >= 1900; year--) {
        this.years.push(year);
      }

      // Load categories
      this.mediaService.loadCategories().subscribe({
        error: (error) => {
          console.warn('Failed to load categories:', error);
          // Don't show error to user for categories, it's not critical
        }
      });

      // Load initial items
      this.loadItems(1);
    } catch (error) {
      console.error('Error during initial data loading:', error);
      this.error = true;
      this.errorMessage = 'Failed to load data. Please try again.';
    }
  }

  /**
   * Load items from service - using same logic as admin dashboard
   */
  private loadItems(page: number = 1): void {
    this.loading = true;
    this.error = false;
    this.errorMessage = '';

    const params: any = {
      page: page,
      limit: this.itemsPerPage,
      sort_by: 'created_at',
      sort_direction: 'desc'
    };

    // Add filters if selected - same as admin
    if (this.searchQuery) params.q = this.searchQuery;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.selectedYear) params.year = this.selectedYear;

    // Use ApiService directly like admin dashboard - call correct API based on mediaType
    const apiCall = this.mediaType === 'movie' 
      ? (this.mediaService as any).apiService.getMovies(params)
      : (this.mediaService as any).apiService.getTVSeries(params);
    
    apiCall.subscribe({
      next: (response: any) => {
        if (page === 1) {
          this.items = response.data.map((item: any) => this.transformToMediaItem(item));
        } else {
          this.items = [...this.items, ...response.data.map((item: any) => this.transformToMediaItem(item))];
        }
        
        // Update pagination info from response - same as admin components
        this.totalItems = response.meta?.total || 0;
        
        this.noResults = this.items.length === 0;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading items:', error);
        this.error = true;
        this.errorMessage = `Failed to load ${this.mediaType === 'movie' ? 'movies' : 'TV series'}. Please try again.`;
        this.loading = false;
      }
    });
  }

  /**
   * Handle search query changes - DISABLED for manual search only
   */
  onSearchQuery(query: string): void {
    // Disabled instant search - only search on click/enter
    this.searchQuery = query;
  }

  /**
   * Handle search button click
   */
  onSearchClick(query: string): void {
    this.searchQuery = query;
    this.resetPagination();
    this.loadItems();
  }

  /**
   * Handle category filter changes
   */
  onCategoryChange(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.resetPagination();
    this.loadItems();
  }

  /**
   * Handle year filter changes
   */
  onYearChange(year: string): void {
    this.selectedYear = year;
    this.resetPagination();
    this.loadItems();
  }

  /**
   * Handle load more button click - same logic as admin components
   */
  onLoadMore(): void {
    if (this.loading || this.items.length >= this.totalItems) return;
    
    this.currentPage++;
    this.loadItems(this.currentPage);
  }

  /**
   * Handle media card click for navigation
   */
  onCardClick(itemId: number): void {
    const route = this.mediaType === 'movie' 
      ? ['/movie-details', itemId]
      : ['/tvseries-details', itemId];
    
    this.router.navigate(route);
  }

  /**
   * Handle image error from MediaCardComponent
   */
  onImageError(event: Event): void {
    // Error handling is already done in MediaCardComponent
    // This is just for additional logging if needed
    console.debug('Image loading error handled by MediaCardComponent');
  }

  /**
   * Handle error dismissal
   */
  onErrorDismiss(): void {
    this.error = false;
    this.errorMessage = '';
  }

  /**
   * Retry loading data
   */
  retryLoading(): void {
    this.loadItems(1);
  }

  /**
   * Get image URL for media item
   */
  getImageUrl(path: string | any): string {
    // Handle both string and object formats for image paths
    if (typeof path === 'object' && path?.url) {
      return this.imageService.getImageUrl(path.url, 'poster');
    }
    return this.imageService.getImageUrl(path, 'poster');
  }

  /**
   * Reset pagination to first page
   */
  resetPagination(): void {
    this.currentPage = 1;
    this.items = [];
  }

  /**
   * Check if has more pages - same logic as admin components
   */
  get hasMorePages(): boolean {
    return this.items.length < this.totalItems;
  }

  /**
   * Check if currently loading for load more button state
   */
  get isLoadingMore(): boolean {
    return this.loading;
  }

  /**
   * Get current filter state for debugging
   */
  getCurrentFilters(): any {
    return this.mediaService.getCurrentFilters();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.mediaService.resetFilters();
  }

  /**
   * Transform media item for MediaCardComponent
   */
  transformToMediaItem(item: any): any {
    return {
      ...item,
      id: this.mediaType === 'movie' ? item.movie_id || item.id : item.tv_series_id || item.id,
      poster: this.getImageUrl(item.poster),
      // Map duration for movies and total_seasons for TV series
      duration: this.mediaType === 'movie' ? item.duration : undefined,
      total_seasons: this.mediaType === 'tvseries' ? item.total_seasons : undefined
    };
  }

  /**
   * TrackBy function for ngFor performance optimization
   */
  trackByItemId(index: number, item: any): any {
    return this.mediaType === 'movie' 
      ? item.movie_id || item.id 
      : item.tv_series_id || item.id;
  }
}
