import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../services/movie.service';
import { Movie, Person } from '../models/media.models';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.scss']
})
export class MovieDetailsComponent implements OnInit {
  movie: Movie | null = null;
  loading = true;
  error = false;
  errorMessage = '';
  trailerUrl: SafeResourceUrl | null = null;
  cast: Person[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    // Verificare autenticazione
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Ottenere l'ID del film dall'URL
    this.route.paramMap.subscribe(params => {
      const movieId = params.get('id');
      if (movieId) {
        this.loadMovieDetails(+movieId);
      } else {
        this.error = true;
        this.errorMessage = 'ID film non valido';
        this.loading = false;
      }
    });
  }
  
  /**
   * Carica i dettagli del film
   */
  loadMovieDetails(movieId: number): void {
    this.loading = true;
    this.error = false;
    
    this.movieService.loadMovieDetails(movieId).subscribe({
      next: (movie) => {
        this.movie = movie;
        this.loading = false;
        
        // Preparare l'URL del trailer se disponibile
        if (movie.trailers && movie.trailers.length > 0) {
          this.trailerUrl = this.sanitizeTrailerUrl(movie.trailers[0].url);
        }
        
        // Preparare il cast
        if (movie.persons && movie.persons.length > 0) {
          this.cast = movie.persons;
        }
      },
      error: (err) => {
        console.error('Errore nel caricamento dei dettagli del film:', err);
        this.error = true;
        this.errorMessage = 'Si è verificato un errore durante il caricamento dei dettagli del film.';
        this.loading = false;
      }
    });
  }
  
  /**
   * Sanitizza l'URL del trailer per l'embedding sicuro
   */
  sanitizeTrailerUrl(url: string): SafeResourceUrl {
    // Converti URL di YouTube in formato embed
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) {
        url = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop();
      if (videoId) {
        url = `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  /**
   * Ottiene l'URL dell'immagine
   */
  getImageUrl(path: string | undefined | any, type: string = 'poster'): string {
    // Handle poster/backdrop object format from API
    if (path && typeof path === 'object' && path.url) {
      return path.url;
    }
    // Handle string format
    if (typeof path === 'string') {
      return this.movieService.getImageUrl(path, type as any);
    }
    // Return empty string for null/undefined
    return '';
  }
  
  /**
   * Torna alla pagina dei film
   */
  goBack(): void {
    this.router.navigate(['/movies']);
  }
  
  /**
   * Gestisce gli errori di caricamento delle immagini
   */
  onImageError(event: Event, placeholderSrc: string): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = placeholderSrc;
    }
  }
}
