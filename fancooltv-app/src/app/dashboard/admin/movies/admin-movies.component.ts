import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Movie, Category } from '../../../models/media.models';
import { debounceTime, distinctUntilChanged, fromEvent } from 'rxjs';

@Component({
  selector: 'app-admin-movies',
  templateUrl: './admin-movies.component.html',
  styleUrls: ['./admin-movies.component.scss']
})
export class AdminMoviesComponent implements OnInit {
  // Movies data
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  categories: Category[] = [];
  years: number[] = [];
  
  // Pagination
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 10;
  
  // UI states
  loading = false;
  noResults = false;
  
  // Search and filters
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  searchTerm = '';
  selectedCategory = '';
  selectedYear = '';
  
  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.loadMovies();
    this.loadCategories();
    this.setupSearchListener();
  }
  
  /**
   * Load movies from API with pagination and filters
   */
  loadMovies(page: number = 1): void {
    this.loading = true;
    
    const params: any = {
      page: page,
      limit: this.itemsPerPage
    };
    
    // Add filters if selected
    if (this.searchTerm) params.q = this.searchTerm;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.selectedYear) params.year = this.selectedYear;
    
    this.apiService.getMovies(params).subscribe({
      next: (response) => {
        if (page === 1) {
          this.movies = response.data;
        } else {
          this.movies = [...this.movies, ...response.data];
        }
        
        this.totalItems = response.meta?.total || 0;
        this.noResults = this.movies.length === 0;
        this.loading = false;
        
        // Extract unique years for filter
        if (page === 1) {
          this.extractYears();
        }
      },
      error: (error) => {
        console.error('Error loading movies:', error);
        this.loading = false;
        this.noResults = true;
      }
    });
  }
  
  /**
   * Load categories for filter dropdown
   */
  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }
  
  /**
   * Extract unique years from movies for year filter
   */
  extractYears(): void {
    const uniqueYears = new Set<number>();
    
    this.movies.forEach(movie => {
      if (movie.year) {
        uniqueYears.add(movie.year);
      }
    });
    
    this.years = Array.from(uniqueYears).sort((a, b) => b - a); // Sort descending
  }
  
  /**
   * Setup search input with debounce
   */
  setupSearchListener(): void {
    fromEvent(this.searchInput.nativeElement, 'input')
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.searchTerm = this.searchInput.nativeElement.value;
        this.currentPage = 1; // Reset to first page
        this.loadMovies();
      });
  }
  
  /**
   * Handle category filter change
   */
  onCategoryChange(event: any): void {
    this.selectedCategory = event.target.value;
    this.currentPage = 1;
    this.loadMovies();
  }
  
  /**
   * Handle year filter change
   */
  onYearChange(event: any): void {
    this.selectedYear = event.target.value;
    this.currentPage = 1;
    this.loadMovies();
  }
  
  /**
   * Handle search button click
   */
  onSearchClick(): void {
    this.searchTerm = this.searchInput.nativeElement.value;
    this.currentPage = 1;
    this.loadMovies();
  }
  
  /**
   * Load more movies (pagination)
   */
  loadMore(): void {
    if (this.loading || this.movies.length >= this.totalItems) return;
    
    this.currentPage++;
    this.loadMovies(this.currentPage);
  }
  
  /**
   * Get image URL with proper formatting
   */
  getImageUrl(path: string): string {
    return this.apiService.getImageUrl(path, 'poster');
  }
  
  /**
   * Handle image loading error
   */
  onImageError(event: any): void {
    event.target.classList.add('d-none');
    const placeholder = event.target.nextElementSibling;
    if (placeholder) {
      placeholder.classList.remove('d-none');
      placeholder.classList.add('d-flex');
    }
  }
  
  // Le funzioni per i modali sono state rimosse poiché ora utilizziamo pagine dedicate
  
  /**
   * Delete movie
   */
  deleteMovie(movieId: number): void {
    if (confirm('Are you sure you want to delete this movie?')) {
      this.apiService.deleteMovie(movieId).subscribe({
        next: () => {
          // Remove movie from the list
          this.movies = this.movies.filter(m => m.movie_id !== movieId);
          this.noResults = this.movies.length === 0;
        },
        error: (error: any) => {
          console.error('Error deleting movie:', error);
          alert('Error deleting movie. Please try again.');
        }
      });
    }
  }

  // Le funzioni per salvare e aggiornare i film sono state spostate nel componente movie-form-page
}
