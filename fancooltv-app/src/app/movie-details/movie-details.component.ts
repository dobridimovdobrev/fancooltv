import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../services/movie.service';
import { ApiService } from '../services/api.service';
import { Movie, Person } from '../models/media.models';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../services/auth.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.scss']
})
export class MovieDetailsComponent implements OnInit, OnDestroy {
  movie: Movie | null = null;
  loading = true;
  error = false;
  errorMessage = '';
  trailerUrl: SafeResourceUrl | null = null;
  videoFiles: any[] = [];
  cast: Person[] = [];
  
  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  modalRef?: BsModalRef;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService,
    private apiService: ApiService
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
        
        // Debug: Log movie data
        console.log('=== MOVIE DEBUG ===');
        
        // Filter actual uploaded video files (exclude YouTube trailers)
        const actualVideoFiles = movie.video_files ? movie.video_files.filter(video => {
          const videoUrl = video.public_stream_url || video.stream_url || video.url;
          return videoUrl && 
                 !videoUrl.includes('youtube.com') && 
                 !videoUrl.includes('youtu.be') &&
                 !videoUrl.includes('watch?v=');
        }) : [];

        // Check for uploaded video files first (prioritize uploaded videos over YouTube trailers)
        if (actualVideoFiles.length > 0) {
          // Show HTML5 video player - uploaded videos have priority
          this.videoFiles = actualVideoFiles.map(video => {
            // Use public_stream_url if available, otherwise fallback to authenticated URL
            const videoUrl = video.public_stream_url || video.stream_url || video.url;
            console.log('Processing uploaded video file:', video.title, 'URL:', videoUrl);
            
            return {
              title: video.title,
              url: videoUrl,
              safeUrl: this.sanitizer.bypassSecurityTrustUrl(videoUrl),
              loading: false
            };
          });
          this.trailerUrl = null; // Clear trailer to hide YouTube iframe
          console.log('🎬 Showing HTML5 video player (uploaded videos have priority)');
          console.log('Video files processed:', this.videoFiles);
        } else {
          // Show YouTube trailer if no actual uploaded video files
          const hasYouTubeTrailer = movie.trailers && movie.trailers.some((trailer: any) => 
            trailer.type === 'youtube' || 
            trailer.url.includes('youtube.com') || 
            trailer.url.includes('youtu.be')
          );
          
          if (hasYouTubeTrailer) {
            const youtubeTrailer = movie.trailers.find((trailer: any) => 
              trailer.type === 'youtube' || 
              trailer.url.includes('youtube.com') || 
              trailer.url.includes('youtu.be')
            );
            if (youtubeTrailer) {
              this.trailerUrl = this.sanitizeTrailerUrl(youtubeTrailer.url);
              this.videoFiles = []; // Clear video files to hide HTML5 player
              console.log('🎬 Showing YouTube trailer (no uploaded videos found)');
            }
          } else {
            console.log('No video content found');
          }
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
   * Navigate to edit movie form in admin dashboard
   */
  editMovie(): void {
    if (this.movie) {
      this.router.navigate(['/dashboard/admin/movies/edit', this.movie.movie_id]);
    }
  }

  /**
   * Show delete confirmation modal
   */
  deleteMovie(): void {
    if (this.movie) {
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
    if (this.movie) {
      this.loading = true;
      
      this.apiService.deleteMovie(this.movie.movie_id).subscribe({
        next: (response: any) => {
          console.log('Movie deleted successfully:', response);
          this.modalRef?.hide();
          this.loading = false;
          this.navigateToMovies();
        },
        error: (error: any) => {
          console.error('Error deleting movie:', error);
          this.loading = false;
          this.modalRef?.hide();
        }
      });
    }
  }

  /**
   * Cancel movie deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
  }

  /**
   * Navigate to movies page
   */
  navigateToMovies(): void {
    this.router.navigate(['/movies']);
  }

  /**
   * Ottiene l'URL per lo streaming video
   */
  getVideoStreamingUrl(streamUrl: string): string {
    if (!streamUrl) return '';
    return this.movieService.getVideoUrl(streamUrl);
  }

  /**
   * Carica un video come blob per l'autenticazione
   */
  loadVideoBlob(videoUrl: string, index: number): void {
    this.movieService.getVideoBlob(videoUrl).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.videoFiles[index] = {
          ...this.videoFiles[index],
          safeUrl: blobUrl,
          loading: false
        };
      },
      error: (error: any) => {
        console.error('Errore nel caricamento del video blob:', error);
        this.videoFiles[index] = {
          ...this.videoFiles[index],
          safeUrl: null,
          loading: false,
          error: true
        };
      }
    });
  }
  
  /**
   * Gestisce gli errori di caricamento dei video
   */
  onVideoError(event: any, videoIndex: number): void {
    console.error('Video loading error:', event);
    if (this.videoFiles && this.videoFiles[videoIndex]) {
      this.videoFiles[videoIndex].error = true;
    }
  }

  /**
   * Cleanup quando il componente viene distrutto
   */
  ngOnDestroy(): void {
    // Clean up blob URLs to prevent memory leaks
    if (this.videoFiles) {
      this.videoFiles.forEach(video => {
        if (video.safeUrl && typeof video.safeUrl === 'string' && video.safeUrl.startsWith('blob:')) {
          URL.revokeObjectURL(video.safeUrl);
        }
      });
    }
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
