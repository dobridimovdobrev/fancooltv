import { Component, OnInit } from '@angular/core';
import { MovieService } from '../../services/movie.service';
import { MovieServiceRefactored } from '../../shared/services/movie.service.refactored';
import { BaseMediaService } from '../../shared/services/base-media.service';
import { Category } from '../../models/media.models';

@Component({
  selector: 'app-movies-list-wrapper',
  templateUrl: './movies-list-wrapper.component.html',
  styleUrls: ['./movies-list-wrapper.component.scss']
})
export class MoviesListWrapperComponent implements OnInit {
  // MediaListComponent configuration
  mediaType: 'movie' = 'movie';
  title = 'Movies';
  searchPlaceholder = 'Search movies...';
  mediaService: BaseMediaService<any>;

  constructor(
    private movieService: MovieService,
    private movieServiceRefactored: MovieServiceRefactored
  ) {
    // Use the refactored service for the new component
    this.mediaService = this.movieServiceRefactored;
  }

  ngOnInit(): void {
    // Initialize the service if needed
    this.initializeService();
  }

  /**
   * Initialize the movie service
   */
  private initializeService(): void {
    // Load initial categories and years for filters
    this.loadCategories();
    this.loadYears();
  }

  /**
   * Load movie categories for filters
   */
  private loadCategories(): void {
    this.movieService.categories$.subscribe({
      next: (categories: Category[]) => {
        // Categories will be handled by MediaListComponent
        console.debug('Categories loaded for movies:', categories.length);
      },
      error: (error: any) => {
        console.error('Error loading movie categories:', error);
      }
    });
  }

  /**
   * Load available years for filters
   */
  private loadYears(): void {
    // Generate years from current year back to 1900
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    
    // Years will be handled by MediaListComponent
    console.debug('Years generated for movies:', years.length);
  }
}
