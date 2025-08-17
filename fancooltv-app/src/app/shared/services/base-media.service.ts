import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { ApiResponse, PaginationParams } from '../../models/api.models';
import { Category } from '../../models/media.models';

/**
 * Base interface for media items
 */
export interface BaseMediaItem {
  id: number;
  title: string;
  year: number;
  duration: number;
  imdb_rating: number;
  poster: string;
  description: string;
  backdrop: string;
  category: string; 
}

/**
 * Abstract base service for media management (Movies, TV Series, etc.)
 * Provides common functionality for pagination, filtering, search, and state management
 */
@Injectable()
export abstract class BaseMediaService<T extends BaseMediaItem> {
  // State management
  protected itemsSubject = new BehaviorSubject<T[]>([]);
  protected loadingSubject = new BehaviorSubject<boolean>(false);
  protected errorSubject = new BehaviorSubject<string | null>(null);
  protected categoriesSubject = new BehaviorSubject<Category[]>([]);
  
  // Pagination and filtering state
  protected currentPage = 1;
  protected itemsPerPage = 20;
  protected hasMorePages = true;
  protected currentSearch = '';
  protected currentCategory = '';
  protected currentYear = '';
  protected isLoading = false;

  // Public observables
  public items$ = this.itemsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();

  constructor(protected apiService: ApiService) {}

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract getApiEndpoint(): string;
  protected abstract getDetailsApiEndpoint(id: number): string;
  protected abstract mapApiResponse(response: any): T[];
  protected abstract mapDetailsResponse(response: any): T;
  protected abstract loadItems(reset?: boolean): Observable<T[]>;
  protected abstract loadItemDetails(id: number): Observable<T>;

  /**
   * Load categories for filtering
   */
  public loadCategories(): Observable<ApiResponse<Category[]>> {
    return this.apiService.getCategories().pipe(
      tap((response: ApiResponse<Category[]>) => {
        if (response && response.data) {
          this.categoriesSubject.next(response.data);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Search items by query
   */
  public search(query: string): void {
    console.log('BaseMediaService search called with query:', query); // Debug log
    this.currentSearch = query;
    this.resetPagination();
    this.loadItems(true).subscribe();
  }

  /**
   * Filter items by category
   */
  public filterByCategory(categoryId: string): void {
    this.currentCategory = categoryId;
    this.resetPagination();
    this.loadItems(true).subscribe();
  }

  /**
   * Filter items by year
   */
  public filterByYear(year: string): void {
    this.currentYear = year;
    this.resetPagination();
    this.loadItems(true).subscribe();
  }

  /**
   * Load more items (pagination)
   */
  public loadMore(): void {
    if (this.hasMorePages && !this.isLoading) {
      this.currentPage++;
      this.loadItems().subscribe();
    }
  }

  /**
   * Reset all filters and reload
   */
  public resetFilters(): void {
    this.currentSearch = '';
    this.currentCategory = '';
    this.currentYear = '';
    this.resetPagination();
    this.loadItems(true).subscribe();
  }

  /**
   * Reset pagination to first page
   */
  public resetPagination(): void {
    this.currentPage = 1;
    this.hasMorePages = true;
  }

  /**
   * Get current loading state
   */
  public getIsLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Get current items
   */
  public getCurrentItems(): T[] {
    return this.itemsSubject.getValue();
  }

  /**
   * Get current categories
   */
  public getCurrentCategories(): Category[] {
    return this.categoriesSubject.getValue();
  }

  /**
   * Get pagination info
   */
  public getHasMorePages(): boolean {
    return this.hasMorePages;
  }

  /**
   * Get current filters
   */
  public getCurrentFilters(): any {
    return {
      search: this.currentSearch,
      category: this.currentCategory,
      year: this.currentYear,
      page: this.currentPage
    };
  }

  /**
   * Handle API errors
   */
  protected handleError(error: any): Observable<never> {
    console.error('BaseMediaService error:', error);
    const errorMessage = error?.error?.message || error?.message || 'An error occurred';
    this.errorSubject.next(errorMessage);
    return throwError(() => error);
  }

  /**
   * Build API parameters
   */
  protected buildApiParams(params: any = {}): any {
    return {
      page: this.currentPage,
      per_page: this.itemsPerPage,
      search: this.currentSearch || undefined,
      category: this.currentCategory || undefined,
      year: this.currentYear || undefined,
      ...params
    };
  }

  /**
   * Update pagination info from API response
   */
  protected updatePaginationInfo(response: any): void {
    if (response.meta) {
      this.hasMorePages = response.meta.current_page < response.meta.last_page;
    } else if (response.pagination) {
      this.hasMorePages = response.pagination.current_page < response.pagination.total_pages;
    } else {
      this.hasMorePages = false;
    }
  }
}
