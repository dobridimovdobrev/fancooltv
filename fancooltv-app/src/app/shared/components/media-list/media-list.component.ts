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
  items: BaseMediaItem[] = [];
  categories: Category[] = [];
  years: number[] = [];
  loading = false;
  error = false;
  errorMessage = '';
  noResults = false;
  
  // Filter and pagination state
  searchQuery = '';
  selectedCategory = '';
  selectedYear = '';
  currentPage = 1;
  itemsPerPage = 20;

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
      this.loadItems(true);
    } catch (error) {
      console.error('Error during initial data loading:', error);
      this.error = true;
      this.errorMessage = 'Failed to load data. Please try again.';
    }
  }

  /**
   * Load items from service
   */
  private loadItems(reset: boolean = false): void {
    this.loading = true;
    this.error = false;
    this.errorMessage = '';

    try {
      if (reset) {
        // Reset filters and load fresh data
        this.mediaService.resetFilters();
      } else {
        // Load more items (pagination)
        this.mediaService.loadMore();
      }
    } catch (error) {
      console.error('Error loading items:', error);
      this.error = true;
      this.errorMessage = `Failed to load ${this.mediaType === 'movie' ? 'movies' : 'TV series'}. Please try again.`;
      this.loading = false;
    }
  }

  /**
   * Handle search query changes
   */
  onSearchQuery(query: string): void {
    this.searchQuery = query;
    this.resetPagination();
    this.loadItems();
  }

  /**
   * Handle search click
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
   * Handle load more button click
   */
  onLoadMore(): void {
    this.mediaService.loadMore();
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
    this.loadItems(true);
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
   * Check if has more pages for load more button
   */
  get hasMorePages(): boolean {
    return this.mediaService.getHasMorePages();
  }

  /**
   * Check if currently loading for load more button state
   */
  get isLoadingMore(): boolean {
    return this.mediaService.getIsLoading();
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
