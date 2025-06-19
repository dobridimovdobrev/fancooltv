import { Component, OnInit, OnDestroy } from '@angular/core';
import { TVSeriesService } from '../services/tvseries.service';
import { ApiService } from '../services/api.service';
import { TVSeries } from '../models/tvseries.models';
import { Subscription } from 'rxjs';
import { Category } from '../models/media.models';
import { PaginationParams } from '../models/api.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tvseries',
  templateUrl: './tvseries.component.html',
  styleUrls: ['./tvseries.component.scss']
})
export class TvseriesComponent implements OnInit, OnDestroy {
  // Series data
  series: TVSeries[] = [];
  loading = false;
  error = false;
  errorMessage = '';
  
  // Pagination
  currentPage = 1;
  hasMorePages = true;
  
  // Filters
  currentSearch = '';
  currentGenre = '';
  currentYear = '';
  
  // Categories and years for filters
  categories: Category[] = [];
  years: number[] = [];
  
  // Subscriptions
  private subscriptions: Subscription = new Subscription();
  
  constructor(
    private tvSeriesService: TVSeriesService,
    private apiService: ApiService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.initialize();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Initialize the component
   */
  initialize(): void {
    this.loadTVSeries();
    this.loadCategories();
    this.generateYears();
  }
  
  /**
   * Load TV series with current filters and pagination
   */
  loadTVSeries(): void {
    this.loading = true;
    this.error = false;
    
    const params: Partial<PaginationParams> = {
      page: this.currentPage,
      q: this.currentSearch || undefined,
      category: this.currentGenre || undefined,
      year: this.currentYear || undefined
    };
    
    const subscription = this.tvSeriesService.loadTVSeries(params).subscribe({
      next: (data) => {
        if (this.currentPage === 1) {
          this.series = data;
        } else {
          this.series = [...this.series, ...data];
        }
        
        this.hasMorePages = data.length > 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = true;
        this.errorMessage = err.message || 'Errore nel caricamento delle serie TV';
        this.loading = false;
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  /**
   * Load more series (next page)
   */
  loadMore(): void {
    if (this.loading || !this.hasMorePages) return;
    
    this.currentPage++;
    this.loadTVSeries();
  }
  
  /**
   * Search series by query
   */
  search(query: string): void {
    this.currentSearch = query;
    this.currentPage = 1;
    this.loadTVSeries();
  }
  
  /**
   * Filter series by genre
   */
  filterByGenre(genre: string): void {
    this.currentGenre = genre;
    this.currentPage = 1;
    this.loadTVSeries();
  }
  
  /**
   * Filter series by year
   */
  filterByYear(year: string): void {
    this.currentYear = year;
    this.currentPage = 1;
    this.loadTVSeries();
  }
  
  /**
   * Navigate to series details
   */
  viewDetails(seriesId: number): void {
    this.router.navigate(['/tvseries-details', seriesId]);
  }
  
  /**
   * Get image URL from API
   */
  getImageUrl(path: string): string {
    return this.apiService.getImageUrl(path);
  }
  
  /**
   * Load categories for filter
   */
  private loadCategories(): void {
    const subscription = this.apiService.getCategories().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.categories = response.data;
        }
      },
      error: (err) => {
        console.error('Errore nel caricamento delle categorie:', err);
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  /**
   * Generate years for filter (from 1950 to current year)
   */
  private generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1950; year--) {
      this.years.push(year);
    }
  }
}
