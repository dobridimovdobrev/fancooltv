import { Component, OnInit, OnDestroy, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../services/movie.service';
import { ApiService } from '../services/api.service';
import { Movie, Person } from '../models/media.models';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../services/auth.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CreditsService } from '../services/credits.service';
import { ModalService } from '../services/modal.service';
import { EventService } from '../services/event.service';
import { finalize } from 'rxjs/operators';

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
  private youtubePlayer: any = null;
  videoFiles: any[] = [];
  cast: Person[] = [];
  
  // Crediti
  canPlayVideo = false;
  checkingCredits = false;
  consumingCredits = false;
  creditsError = false;
  creditsErrorMessage = '';
  insufficientCredits = false;
  youtubeCreditsConsumed = false; // Flag per tracciare se i crediti per YouTube sono stati consumati
  private pauseVideoListener = (event: Event): void => {
    const videoElement = event.target as HTMLVideoElement;
    videoElement.pause();
    videoElement.currentTime = 0; // Riporta il video all'inizio
    console.log('[DEBUG] Intercettato tentativo di riproduzione con crediti insufficienti');
    // Forza nuovamente la visibilità dell'overlay
    this.forceOverlayVisibility();
  };
  
  /**
   * Forza la visibilità dell'overlay per crediti insufficienti
   */
  private forceOverlayVisibility(): void {
    // Forza il rendering dell'overlay immediatamente
    this.insufficientCredits = true;
    
    // Continua a forzare la visibilità dell'overlay per alcuni secondi
    // per assicurarsi che rimanga visibile anche dopo eventi asincroni
    const intervalId = setInterval(() => {
      this.insufficientCredits = true;
    }, 100);
    
    // Ferma l'intervallo dopo 3 secondi
    setTimeout(() => {
      clearInterval(intervalId);
    }, 3000);
  }
  
  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  modalRef?: BsModalRef;
  
  // Subscriptions
  private subscriptions: Subscription = new Subscription();
  private creditsUpdatedSubscription: Subscription | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    public authService: AuthService,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService,
    private apiService: ApiService,
    private creditsService: CreditsService,
    private userModalService: ModalService,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    // Reset delle variabili di stato (ma non youtubeCreditsConsumed per evitare problemi dopo l'acquisto crediti)
    
    // Verificare autenticazione
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Ottenere l'ID del film dall'URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadMovieDetails(+id);
      } else {
        this.router.navigate(['/movies']);
      }
    });
    
    // Se l'utente è admin, può sempre riprodurre i video
    if (this.authService.isAdmin()) {
      this.canPlayVideo = true;
    }
    
    // Nota: la verifica dei crediti verrà eseguita dopo il caricamento del film in loadMovieDetails()
    
    // Sottoscrizione agli aggiornamenti dei crediti
    this.creditsUpdatedSubscription = this.eventService.creditsUpdated$.subscribe(newBalance => {
      console.log('[DEBUG] Credits updated event received with balance:', newBalance);
      if (newBalance > 0) {
        // Se l'utente ha crediti, consentiamo la riproduzione del trailer YouTube
        this.youtubeCreditsConsumed = true;
        this.canPlayVideo = true;
        this.creditsError = false;
        this.insufficientCredits = false;
        console.log('[DEBUG] Credits updated: enabling YouTube trailer playback');
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
        
        // Verifica i crediti dopo che il film è stato caricato
        if (!this.authService.isAdmin()) {
          this.checkCredits();
        }
        
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
              // Store the trailer URL but only show it if user has sufficient credits
              // The actual display will be controlled by the canPlayVideo flag
              const sanitizedUrl = this.sanitizeTrailerUrl(youtubeTrailer.url);
              
              // Imposta sempre l'URL del trailer
              this.trailerUrl = sanitizedUrl;
              
              // Imposta insufficientCredits solo se l'utente non ha crediti sufficienti e non è admin
              if (!this.canPlayVideo && !this.authService.isAdmin()) {
                this.insufficientCredits = true;
              } else {
                this.insufficientCredits = false;
              }
              
              this.videoFiles = []; // Clear video files to hide HTML5 player
              console.log('🎥 Showing YouTube trailer (no uploaded videos found)');
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
    // Annulla tutte le sottoscrizioni
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
    
    // Clean up blob URLs to prevent memory leaks
    if (this.videoFiles) {
      this.videoFiles.forEach(video => {
        if (video.safeUrl && typeof video.safeUrl === 'string' && video.safeUrl.startsWith('blob:')) {
          URL.revokeObjectURL(video.safeUrl);
        }
      });
    }
    
    // Rimuovi eventuali event listener rimasti
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      video.removeEventListener('play', this.pauseVideoListener);
      video.removeEventListener('playing', this.pauseVideoListener);
      video.removeEventListener('timeupdate', this.pauseVideoListener);
    });
    
    // Annulla la sottoscrizione agli eventi di aggiornamento crediti
    if (this.creditsUpdatedSubscription) {
      this.creditsUpdatedSubscription.unsubscribe();
      this.creditsUpdatedSubscription = null;
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

  /**
   * Opens the credits modal for purchasing credits
   */
  openCreditsModal(): void {
    // Chiudi qualsiasi modal aperto prima di aprire il modal dei crediti
    if (this.modalRef) {
      this.modalRef.hide();
    }
    
    // Apri il modal dei crediti utilizzando il ModalService
    this.userModalService.openCreditsModal();
  }
  
  /**
   * Verifica se l'utente ha crediti sufficienti per riprodurre il video
   */
  checkCredits(): void {
    console.log('[DEBUG] movie-details.checkCredits() chiamato');
    
    // Skip per admin
    if (this.authService.isAdmin()) {
      console.log('[DEBUG] Utente admin: skip verifica crediti');
      this.canPlayVideo = true;
      return;
    }
    
    // Verifica che il film sia caricato e abbia un ID
    if (!this.movie) {
      console.error('[ERROR] Impossibile verificare i crediti: oggetto film non disponibile');
      this.creditsError = true;
      return;
    }
    
    if (!this.movie.movie_id) {
      console.error('[ERROR] Impossibile verificare i crediti: ID film non disponibile', this.movie);
      this.creditsError = true;
      return;
    }
    
    console.log(`[DEBUG] Verifico crediti per film ID: ${this.movie.movie_id}, titolo: ${this.movie.title}`);
    
    this.checkingCredits = true;
    this.creditsError = false;
    
    // Specifichiamo esplicitamente che stiamo verificando i crediti per un film e passiamo l'ID del film
    this.creditsService.canPlay('movie', this.movie.movie_id)
      .pipe(finalize(() => {
        console.log('[DEBUG] Finalize checkCredits - checkingCredits = false');
        this.checkingCredits = false;
      }))
      .subscribe({
        next: (canPlay) => {
          this.canPlayVideo = canPlay;
          console.log('[DEBUG] Credits check completed:', canPlay ? 'Sufficient credits' : 'Insufficient credits', canPlay);
          
          // Aggiorna anche il flag insufficientCredits in base al risultato
          if (canPlay) {
            this.insufficientCredits = false;
          } else {
            this.insufficientCredits = true;
          }
        },
        error: (error) => {
          console.error('[ERROR] Error during credits check:', error);
          this.creditsError = true;
          // In case of error, we still allow playback
          this.canPlayVideo = true;
        }
      });
  }
  
  /**
   * Consuma i crediti quando l'utente inizia la riproduzione del video
   */
  consumeCredits(videoElement: HTMLVideoElement): void {
    // Skip per admin
    if (this.authService.isAdmin()) {
      return;
    }
    
    // Verifica che il film sia caricato e abbia un ID
    if (!this.movie || !this.movie.movie_id) {
      console.error('[ERROR] Impossibile consumare i crediti: ID film non disponibile');
      return;
    }
    
    // Evita consumo multiplo di crediti
    if (this.consumingCredits) {
      return;
    }
    
    this.consumingCredits = true;
    
    // Specifichiamo esplicitamente che stiamo consumando crediti per un film e passiamo l'ID del film
    this.creditsService.consumeCredits('movie', this.movie.movie_id)
      .pipe(finalize(() => this.consumingCredits = false))
      .subscribe({
        next: (response) => {
          // Verifica se la risposta contiene un errore (gestito dal servizio)
          if (response.error) {
            console.warn(`[WARN] Errore gestito: ${response.message}`);
            
            // Se è un errore di crediti insufficienti (402)
            if (response.status === 402) {
              this.handleInsufficientCredits(videoElement, response.message);
              return;
            }
          }
          
          console.log('[DEBUG] Credits consumed successfully:', response);
        },
        error: (error) => {
          console.error('[ERROR] Error during credits consumption:', error);
          
          // Verifica se è un errore 402
          if (error.status === 402) {
            this.handleInsufficientCredits(videoElement, 'You don\'t have enough credits to play this video.');
            return;
          }
          
          // Per altri errori, permettiamo comunque la riproduzione
          videoElement.play().catch(playError => {
            console.error('[ERROR] Impossibile riprodurre il video dopo errore:', playError);
          });
        }
      });
  }
  
  /**
   * Gestisce il caso di crediti insufficienti, mantenendo il video in pausa e l'overlay visibile
   */
  handleInsufficientCredits(videoElement: HTMLVideoElement, errorMessage: string): void {
    console.log('[DEBUG] Gestione crediti insufficienti attivata');
    
    // Blocca immediatamente la riproduzione
    videoElement.pause();
    
    // Disabilita i controlli del video per impedire l'interazione
    videoElement.controls = false;
    
    // Aggiorna lo stato dei crediti
    this.canPlayVideo = false;
    this.insufficientCredits = true;
    this.creditsErrorMessage = errorMessage || 'You don\'t have enough credits to play this video.';
    
    // Rimuovi eventuali listener esistenti per evitare duplicati
    videoElement.removeEventListener('play', this.pauseVideoListener);
    videoElement.removeEventListener('playing', this.pauseVideoListener);
    videoElement.removeEventListener('timeupdate', this.pauseVideoListener);
    
    // Aggiungi listener per tutti gli eventi che potrebbero far partire il video
    videoElement.addEventListener('play', this.pauseVideoListener);
    videoElement.addEventListener('playing', this.pauseVideoListener);
    videoElement.addEventListener('timeupdate', this.pauseVideoListener);
    
    // Aggiorna l'UI
    this.checkCredits();
    
    // Forza il rendering dell'overlay e mantienilo visibile
    this.forceOverlayVisibility();
  }
  
  
  /**
   * Gestisce l'evento di play del video
   */
  onVideoPlay(event: Event): void {
    console.log('[DEBUG] movie-details.onVideoPlay() chiamato');
    const videoElement = event.target as HTMLVideoElement;
    
    // Verifica se l'utente è admin
    const isAdmin = this.authService.isAdmin();
    console.log(`[DEBUG] Utente admin: ${isAdmin}, canPlayVideo: ${this.canPlayVideo}`);
    
    // Se l'utente non è admin e non ha crediti sufficienti, blocca la riproduzione
    if (!isAdmin && !this.canPlayVideo) {
      console.log('[DEBUG] Bloccando riproduzione: crediti insufficienti');
      this.handleInsufficientCredits(videoElement, 'You don\'t have enough credits to play this video.');
      return;
    }
    
    // Consuma i crediti solo se non è admin
    if (!isAdmin) {
      console.log('[DEBUG] Chiamando consumeCredits() per utente non-admin');
      this.consumeCredits(videoElement);
    } else {
      console.log('[DEBUG] Skip consumeCredits per utente admin');
    }
  }
  
  /**
   * Consuma i crediti per i trailer YouTube
   * Questo metodo viene chiamato quando l'utente clicca sull'overlay del trailer YouTube
   */
  consumeCreditsForYouTube(): void {
    console.log('[DEBUG] movie-details.consumeCreditsForYouTube() chiamato');
    
    // Skip per admin
    if (this.authService.isAdmin()) {
      console.log('[DEBUG] Skip consumeCredits per utente admin');
      return;
    }
    
    // Verifica che il film sia caricato e abbia un ID
    if (!this.movie || !this.movie.movie_id) {
      console.error('[ERROR] Impossibile consumare i crediti: ID film non disponibile');
      return;
    }
    
    // Evita consumo multiplo di crediti
    if (this.consumingCredits) {
      return;
    }
    
    this.consumingCredits = true;
    
    // Specifichiamo esplicitamente che stiamo consumando crediti per un film e passiamo l'ID del film
    this.creditsService.consumeCredits('movie', this.movie.movie_id)
      .pipe(finalize(() => this.consumingCredits = false))
      .subscribe({
        next: (response) => {
          // Verifica se la risposta contiene un errore (gestito dal servizio)
          if (response.error) {
            console.warn(`[WARN] Errore gestito: ${response.message}`);
            
            // Se è un errore di crediti insufficienti (402)
            if (response.status === 402) {
              // Mostra il messaggio di crediti insufficienti
              this.insufficientCredits = true;
              this.canPlayVideo = false;
              this.creditsError = true;
              this.creditsErrorMessage = response.message;
              this.forceOverlayVisibility();
              return;
            }
          }
          
          console.log('[DEBUG] Credits consumed successfully for YouTube trailer:', response);
          
          // Crediti consumati con successo, rimuovi l'overlay per permettere la riproduzione
          this.canPlayVideo = true;
          this.creditsError = false;
          this.insufficientCredits = false;
          this.youtubeCreditsConsumed = true; // Imposta il flag per indicare che i crediti sono stati consumati
          
          // Avvia automaticamente la riproduzione del video YouTube
          this.playYouTubeVideo();
          
          // Aggiorna l'UI
          this.checkCredits();
        },
        error: (error) => {
          console.error('[ERROR] Error during credits consumption for YouTube trailer:', error);
          
          // Verifica se è un errore 402
          if (error.status === 402) {
            // Mostra il messaggio di crediti insufficienti
            this.insufficientCredits = true;
            this.canPlayVideo = false;
            this.creditsError = true;
            this.creditsErrorMessage = 'You don\'t have enough credits to play this video.';
            this.forceOverlayVisibility();
            return;
          }
        }
      });
  }
  
  /**
   * Avvia automaticamente la riproduzione del video YouTube dopo il consumo dei crediti
   */
  playYouTubeVideo(): void {
    console.log('[DEBUG] Tentativo di avviare automaticamente il video YouTube');
    
    try {
      // Trova l'iframe di YouTube nella pagina
      const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement;
      
      if (iframe) {
        // Memorizza il riferimento all'iframe
        this.youtubePlayer = iframe;
        
        // Ottieni l'URL corrente
        const currentSrc = iframe.src;
        
        // Aggiungi il parametro autoplay=1 all'URL se non è già presente
        if (!currentSrc.includes('autoplay=1')) {
          // Crea un nuovo URL con il parametro autoplay
          const separator = currentSrc.includes('?') ? '&' : '?';
          const newSrc = `${currentSrc}${separator}autoplay=1`;
          
          // Imposta il nuovo URL
          iframe.src = newSrc;
          console.log('[DEBUG] URL YouTube aggiornato con autoplay=1:', newSrc);
        } else {
          // Se autoplay è già presente, ricarica l'iframe per forzare la riproduzione
          iframe.src = iframe.src;
          console.log('[DEBUG] Ricaricato iframe YouTube per forzare la riproduzione');
        }
      } else {
        console.warn('[WARN] Impossibile trovare l\'iframe YouTube nella pagina');
      }
    } catch (error) {
      console.error('[ERROR] Errore durante l\'avvio automatico del video YouTube:', error);
    }
  }
}
