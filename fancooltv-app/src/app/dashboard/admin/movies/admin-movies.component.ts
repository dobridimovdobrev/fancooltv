import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Movie, Category } from '../../../models/media.models';
import { debounceTime, distinctUntilChanged, fromEvent } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

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
  
  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  modalRef?: BsModalRef;
  movieToDelete: Movie | null = null;
  
  constructor(
    private apiService: ApiService,
    private modalService: BsModalService
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
   * Handle search input change (for real-time updates)
   */
  onSearchInputChange(): void {
    // Update searchTerm from input - no automatic search, only on Enter or Search button
    // This is just to keep the model in sync for the clear button visibility
  }

  /**
   * Clear search input and reload all movies
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchInput.nativeElement.value = '';
    this.selectedCategory = '';
    this.selectedYear = '';
    // Reset filter selects
    const categorySelect = document.querySelector('.filter-select') as HTMLSelectElement;
    const yearSelect = document.querySelectorAll('.filter-select')[1] as HTMLSelectElement;
    if (categorySelect) categorySelect.value = '';
    if (yearSelect) yearSelect.value = '';
    // Reset pagination and reload all movies
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
  getImageUrl(path: string | any): string {
    // Handle poster/backdrop object format from API
    if (path && typeof path === 'object' && path.url) {
      return path.url;
    }
    // Handle string format
    if (typeof path === 'string') {
      return this.apiService.getImageUrl(path, 'poster');
    }
    // Return empty string for null/undefined
    return '';
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
   * Show delete confirmation modal
   */
  openDeleteModal(movieId: number): void {
    // Find the movie to delete
    this.movieToDelete = this.movies.find(m => m.movie_id === movieId) || null;
    
    if (this.movieToDelete) {
      // Open the delete confirmation modal
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-md modal-dialog-centered',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Confirm movie deletion
   */
  confirmDelete(): void {
    if (this.movieToDelete) {
      this.loading = true;
      
      this.apiService.deleteMovie(this.movieToDelete.movie_id).subscribe({
        next: (response) => {
          console.log('Movie deleted successfully:', response);
          // Remove movie from the list
          this.movies = this.movies.filter(m => m.movie_id !== this.movieToDelete!.movie_id);
          this.noResults = this.movies.length === 0;
          this.modalRef?.hide();
          this.movieToDelete = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting movie:', error);
          this.loading = false;
          this.modalRef?.hide();
          this.movieToDelete = null;
        }
      });
    }
  }

  /**
   * Cancel movie deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
    this.movieToDelete = null;
  }

  // Le funzioni per salvare e aggiornare i film sono state spostate nel componente movie-form-page
}
