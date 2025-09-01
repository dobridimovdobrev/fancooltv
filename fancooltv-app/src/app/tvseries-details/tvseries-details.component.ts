import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TVSeries } from '../models/tvseries.models';
import { TVSeriesService } from '../services/tvseries.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CreditsService } from '../services/credits.service';
import { ModalService } from '../services/modal.service';
import { EventService } from '../services/event.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-tvseries-details',
  templateUrl: './tvseries-details.component.html',
  styleUrls: ['./tvseries-details.component.scss']
})
export class TvseriesDetailsComponent implements OnInit, OnDestroy {
  series: TVSeries | null = null;
  loading = true;
  error = false;
  errorMessage = '';
  trailerUrl: SafeResourceUrl | null = null;
  videoUrl: SafeResourceUrl | null = null;
  expandedSeasons: Set<number> = new Set<number>();
  modalRef?: BsModalRef;
  private subscriptions: Subscription = new Subscription();
  
  // Crediti
  canPlayVideo = false;
  checkingCredits = false;
  consumingCredits = false;
  creditsError = false;
  creditsErrorMessage = '';
  insufficientCredits = false;
  creditsAlreadyConsumed = false; // Flag per tracciare se i crediti sono già stati consumati per questa sessione
  lastPlayedVideoSrc: string = ''; // Memorizza l'URL dell'ultimo video riprodotto per evitare doppio consumo
  youtubeCreditsConsumed: boolean = false;
  
  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  @ViewChild('videoPlayer') videoPlayer: any;
  
  // Episodes pagination
  episodesPerPage = 10;
  visibleEpisodes: Map<number, number> = new Map<number, number>();
  
  // Seasons pagination
  seasonsPerPage = 10;
  visibleSeasonsCount = 10;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private router: Router,
    private tvSeriesService: TVSeriesService,
    private apiService: ApiService,
    public authService: AuthService,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService,
    private creditsService: CreditsService,
    private userModalService: ModalService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadSeriesDetails(+id);
      } else {
        this.router.navigate(['/tvseries']);
      }
    });
    
    // Verifica se l'utente può riprodurre video
    if (!this.authService.isAdmin()) {
      this.checkCredits();
    }
    
    // Sottoscrizione agli aggiornamenti dei crediti
    this.subscriptions.add(
      this.eventService.creditsUpdated$.subscribe(newBalance => {
        console.log('Credits updated event received in tvseries-details, new balance:', newBalance);
        // Aggiorna lo stato dei crediti
        this.checkCredits();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.videoUrl && typeof this.videoUrl === 'object') {
      const urlString = this.videoUrl.toString();
      if (urlString.startsWith('blob:')) {
        URL.revokeObjectURL(urlString);
      }
    }
    
    // Pulisci l'intervallo dell'overlay se esiste
    if (this.overlayInterval) {
      clearInterval(this.overlayInterval);
      this.overlayInterval = null;
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
   * Load TV series details from the API
   */
  loadSeriesDetails(seriesId: number): void {
    console.log('TvseriesDetailsComponent.loadSeriesDetails called with ID:', seriesId);
    this.loading = true;
    this.error = false;
    
    // Se l'utente è admin, può sempre riprodurre i video
    if (this.authService.isAdmin()) {
      this.canPlayVideo = true;
    }
    
    this.subscriptions.add(
      this.tvSeriesService.loadTVSeriesDetails(seriesId).subscribe({
        next: (series) => {
          console.log('TvseriesDetailsComponent received series data:', series);
          this.series = series;
          this.loading = false;
          
          // Verifica i crediti dopo che la serie è stata caricata
          if (!this.authService.isAdmin()) {
            this.checkCredits();
          }
          
          // Debug: Log series data like movie-details does
          // console.log('=== TV SERIES DEBUG ===');
          // console.log('Full TV Series object:', JSON.stringify(series, null, 2));
          // console.log('TV Series video_files:', (series as any).video_files);
          // console.log('TV Series video_files length:', (series as any).video_files?.length || 0);
          // console.log('TV Series trailers:', series.trailers);
          // console.log('TV Series trailers length:', series.trailers?.length || 0);
          // console.log('hasTrailer() result before processing:', this.hasTrailer());
          
          // Process video_files to ensure proper URLs like movie-details does
          if ((series as any).video_files && (series as any).video_files.length > 0) {
            (series as any).video_files = (series as any).video_files.map((video: any) => {
              // Use public_stream_url if available, otherwise fallback to authenticated URL
              const videoUrl = video.public_stream_url || video.stream_url || video.url;
              // console.log('Processing TV series video file:', video.title, 'URL:', videoUrl);
              return {
                ...video,
                url: videoUrl // Ensure url property uses the correct URL
              };
            });
            
            // Debug trailer detection after processing
            // console.log('After processing - hasTrailer() result:', this.hasTrailer());
          }
          
          // Process episodes to ensure proper video URLs
          if (series.seasons && series.seasons.length > 0) {
            series.seasons.forEach((season: any, seasonIndex: number) => {
              if (season.episodes && season.episodes.length > 0) {
                season.episodes.forEach((episode: any, episodeIndex: number) => {
                  if (episode.public_stream_url) {
                    // console.log(`Episode S${season.season_number}E${episode.episode_number} video URL:`, episode.public_stream_url);
                  }
                });
              }
            });
          }
          
          if (series.trailers && series.trailers.length > 0) {
            this.trailerUrl = this.sanitizeTrailerUrl(series.trailers[0].url);
          }
        },
        error: (error) => {
          this.error = true;
          this.errorMessage = 'Error loading TV series details';
          this.loading = false;
          console.error('TvseriesDetailsComponent API Error:', error);
        }
      })
    );
  }

  /**
   * Toggle the expansion of a season
   */
  toggleSeason(seasonNumber: number): void {
    if (this.expandedSeasons.has(seasonNumber)) {
      this.expandedSeasons.delete(seasonNumber);
    } else {
      this.expandedSeasons.add(seasonNumber);
      // Initialize visible episodes count for this season
      if (!this.visibleEpisodes.has(seasonNumber)) {
        this.visibleEpisodes.set(seasonNumber, this.episodesPerPage);
      }
    }
  }

  /**
   * Check if a season is expanded
   */
  isSeasonExpanded(seasonNumber: number): boolean {
    return this.expandedSeasons.has(seasonNumber);
  }

  /**
   * Get visible episodes for a season
   */
  getVisibleEpisodes(season: any): any[] {
    if (!season.episodes) return [];
    const visibleCount = this.visibleEpisodes.get(season.season_number) || this.episodesPerPage;
    return season.episodes.slice(0, visibleCount);
  }

  /**
   * Check if there are more episodes to load for a season
   */
  hasMoreEpisodes(season: any): boolean {
    if (!season.episodes) return false;
    const visibleCount = this.visibleEpisodes.get(season.season_number) || this.episodesPerPage;
    return season.episodes.length > visibleCount;
  }

  /**
   * Load more episodes for a season
   */
  loadMoreEpisodes(seasonNumber: number): void {
    const currentVisible = this.visibleEpisodes.get(seasonNumber) || this.episodesPerPage;
    this.visibleEpisodes.set(seasonNumber, currentVisible + this.episodesPerPage);
  }

  /**
   * Get visible seasons (first N seasons based on pagination)
   */
  getVisibleSeasons(): any[] {
    if (!this.series?.seasons) return [];
    return this.series.seasons.slice(0, this.visibleSeasonsCount);
  }

  /**
   * Check if there are more seasons to load
   */
  hasMoreSeasons(): boolean {
    if (!this.series?.seasons) return false;
    return this.series.seasons.length > this.visibleSeasonsCount;
  }

  /**
   * Load more seasons
   */
  loadMoreSeasons(): void {
    this.visibleSeasonsCount += this.seasonsPerPage;
  }

  /**
   * Open the trailer modal with the specified URL
   * If no trailer URL is provided, it will use the first trailer of the series if available
   */
  openTrailerModal(template: TemplateRef<any>, trailerUrl?: string): void {
    let url = trailerUrl;
    // console.log('DEBUG: openTrailerModal called with URL:', trailerUrl);
    
    // Reset del flag di consumo crediti quando si apre un nuovo trailer
    this.creditsAlreadyConsumed = false;
    
    // Se l'utente non è admin e non ha crediti sufficienti, blocca la riproduzione
    if (!this.authService.isAdmin() && !this.canPlayVideo) {
      // Non mostrare alert ma impostare lo stato per mostrare l'overlay
      this.insufficientCredits = true;
      this.creditsErrorMessage = 'You don\'t have enough credits to play this content';
      return;
    }
    
    // If no URL provided, try to find one from the series data
    if (!url && this.series) {
      // console.log('DEBUG: No URL provided, searching in series data');
      
      // Check video_files for trailer FIRST (prioritize uploaded videos)
      if ((this.series as any).video_files && (this.series as any).video_files.length > 0) {
        const trailerVideo = (this.series as any).video_files.find((video: any) => 
          video.title && video.title.toLowerCase().includes('trailer')
        );
        if (trailerVideo) {
          url = trailerVideo.public_stream_url || trailerVideo.stream_url;
          // console.log('DEBUG: Found trailer in video_files (PRIORITY):', url);
        }
      }
      // THEN check traditional trailers array if no uploaded video found
      if (!url && this.series.trailers && this.series.trailers.length > 0) {
        url = this.series.trailers[0].url;
        // console.log('DEBUG: Found trailer in trailers array (FALLBACK):', trailerUrl);
      }
    }
    
    // console.log('DEBUG: Final trailer URL:', trailerUrl);
    if (url) {
      // Check if it's a local video file (MP4) or YouTube URL
      if (url.includes('.mp4') || url.includes('stream-video') || url.includes('public-video')) {
        // Local video file - use video element instead of iframe
        // console.log('DEBUG: Using video element for local file');
        this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        
        // I crediti verranno consumati nel metodo onVideoPlay quando l'utente fa play
        
        this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
      } else {
        // YouTube URL - use iframe
        // console.log('DEBUG: Using iframe for YouTube URL');
        this.trailerUrl = this.sanitizeTrailerUrl(url);
        
        // I crediti verranno consumati nel metodo onVideoPlay quando l'utente fa play
        
        this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
      }
    } else {
      // console.log('No trailer available for this content');
    }
  }

  /**
   * Close the trailer modal and reset the trailer URL
   */
  closeTrailerModal(): void {
    console.log('[DEBUG] tvseries-details.closeTrailerModal() chiamato');
    if (this.modalRef) {
      this.modalRef.hide();
    }
    this.trailerUrl = null;
    // Non resettiamo canPlayVideo qui per permettere di aprire altri episodi
    // this.canPlayVideo = false;
    
    // Reset dei flag per YouTube
    this.youtubeCreditsConsumed = false;
    
    // Pulisci l'intervallo dell'overlay se esiste
    if (this.overlayInterval) {
      clearInterval(this.overlayInterval);
      this.overlayInterval = null;
    }
  }

  /**
   * Open the episode content - handles both episodes with video files and those without
   * If the episode has video files, it will play those. Otherwise, it will play the series trailer.
   */
  @ViewChild('trailerModal') trailerModalTemplate!: TemplateRef<any>;
  
  openEpisodeContent(template: TemplateRef<any>, episode: any): void {
    console.log('DEBUG: openEpisodeContent called for episode:', episode.title);
    
    // Reset del flag di consumo crediti quando si apre un nuovo episodio
    this.creditsAlreadyConsumed = false;
    
    // Verifica se l'utente ha crediti sufficienti e imposta lo stato appropriato
    // Non blocchiamo più l'apertura del modal, ma mostriamo l'overlay se necessario
    if (!this.authService.isAdmin() && !this.canPlayVideo) {
      this.insufficientCredits = true;
      this.creditsErrorMessage = 'You don\'t have enough credits to play this content';
    } else {
      this.insufficientCredits = false;
    }
    
    // Check if the episode has video files
    if (episode.video_files && episode.video_files.length > 0) {
      // Use the episode's video file
      const videoUrl = episode.video_files[0].public_stream_url || episode.video_files[0].stream_url;
      this.openVideoModal(template, videoUrl);
    } else {
      // No video files for this episode, use the series trailer instead
      console.log('DEBUG: No video files for episode, using series trailer');
      
      // Usa il template trailerModal invece di videoModal
      if (this.series && this.series.trailers && this.series.trailers.length > 0) {
        // Usa il template trailerModal esplicitamente
        this.openTrailerModal(this.trailerModalTemplate);
      } else if ((this.series as any).video_files && (this.series as any).video_files.length > 0) {
        // Se ci sono video_files nella serie, usa quelli
        this.openTrailerModal(this.trailerModalTemplate);
      } else {
        console.log('DEBUG: No trailer available for this series');
        alert('No video content available for this episode');
      }
    }
  }
  
  /**
   * Open the video modal with the specified video URL for episodes
   */
  openVideoModal(template: TemplateRef<any>, videoUrl: string): void {
    console.log('DEBUG: openVideoModal called with URL:', videoUrl);
    
    // Verifica se l'utente ha crediti sufficienti e imposta lo stato appropriato
    // Non blocchiamo più l'apertura del modal, ma mostriamo l'overlay se necessario
    if (!this.authService.isAdmin() && !this.canPlayVideo) {
      this.insufficientCredits = true;
      this.creditsErrorMessage = 'You don\'t have enough credits to play this content';
    } else {
      this.insufficientCredits = false;
    }
    
    if (videoUrl) {
      // Verifica se è un URL pubblico o autenticato
      const isPublicUrl = videoUrl.includes('public-video');
      const isAuthenticatedUrl = videoUrl.includes('stream-video') || videoUrl.includes('authenticated') || videoUrl.includes('api/video');
      
      console.log(`DEBUG: URL type - Public: ${isPublicUrl}, Authenticated: ${isAuthenticatedUrl}`);
      
      if (isAuthenticatedUrl) {
        // Per URL autenticati, carica come blob per una riproduzione più affidabile
        console.log('DEBUG: Loading authenticated URL as blob');
        this.loadVideoBlob(videoUrl).then((blobUrl) => {
          this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(blobUrl);
          console.log('DEBUG: Setting sanitized blob URL to:', this.videoUrl);
          
          // I crediti verranno consumati nel metodo onVideoPlay quando l'utente fa play
          
          this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
        }).catch((error) => {
          console.error('ERROR: Failed to load video as blob:', error);
          // Fallback al metodo standard in caso di errore
          this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(videoUrl);
          this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
        });
      } else {
        // Per URL pubblici o altri tipi di URL, usa direttamente l'URL sanitizzato
        console.log('DEBUG: Using direct sanitized URL for public video');
        this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(videoUrl);
        console.log('DEBUG: Setting sanitized public URL to:', this.videoUrl);
        
        // I crediti verranno consumati nel metodo onVideoPlay quando l'utente fa play
        
        this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
      }
    } else {
      console.log('No video URL available for this episode');
    }
  }
  
  /**
   * Carica un video come blob per l'autenticazione e riproduzione affidabile
   */
  loadVideoBlob(url: string): Promise<string> {
    console.log('[DEBUG] Caricamento video come blob da URL:', url);
    return new Promise((resolve, reject) => {
      this.apiService.getVideoBlob(url).subscribe({
        next: (blob: Blob) => {
          console.log('[DEBUG] Blob ricevuto con successo, dimensione:', blob.size, 'bytes');
          const blobUrl = URL.createObjectURL(blob);
          console.log('[DEBUG] Blob URL creato:', blobUrl);
          resolve(blobUrl);
        },
        error: (error: any) => {
          console.error('[ERROR] Errore durante il caricamento del video come blob:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Close the video modal and reset the video URL
   */
  closeVideoModal(): void {
    if (this.modalRef) {
      this.modalRef.hide();
    }
    this.videoUrl = null;
    // Non resettiamo canPlayVideo qui per permettere di aprire altri episodi
    // this.canPlayVideo = false;
    
    // Reset del flag di consumo crediti
    this.creditsAlreadyConsumed = false;
    
    // Pulisci l'intervallo dell'overlay se esiste
    if (this.overlayInterval) {
      clearInterval(this.overlayInterval);
      this.overlayInterval = null;
    }
  }

  /**
   * Sanitize the trailer URL for safe embedding
   */
  sanitizeTrailerUrl(url: string): SafeResourceUrl {
    const embedUrl = this.tvSeriesService.getYouTubeEmbedUrl(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /**
   * Get the image URL with proper formatting
   */
  getImageUrl(imageData: any, type: 'cast' | 'poster' | 'backdrop' | 'still' = 'poster'): string {
    if (!imageData) return '';
    
    if (imageData && imageData.url) {
      return imageData.url;
    }
    if (imageData && imageData.sizes && imageData.sizes.original) {
      return imageData.sizes.original;
    }
    if (typeof imageData === 'string') {
      return this.apiService.getImageUrl(imageData, type);
    }
    return '';
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
   * Navigate to TV series edit page
   */
  editSeries(): void {
    if (this.series) {
      this.router.navigate(['/dashboard/admin/tvseries/edit', this.series.tv_series_id]);
    }
  }

  /**
   * Show delete confirmation modal
   */
  deleteSeries(): void {
    if (this.series) {
      // Open the delete confirmation modal
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-lg modal-dialog-centered',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Confirm TV series deletion
   */
  confirmDelete(): void {
    if (this.series) {
      this.loading = true;
      
      this.apiService.deleteTVSeries(this.series.tv_series_id).subscribe({
        next: (response: any) => {
          console.log('TV Series deleted successfully:', response);
          this.modalRef?.hide();
          this.loading = false;
          this.navigateToTVSeries();
        },
        error: (error: any) => {
          console.error('Error deleting TV series:', error);
          this.loading = false;
          this.modalRef?.hide();
        }
      });
    }
  }

  /**
   * Cancel TV series deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
  }

  /**
   * Navigate to TV series list
   * Navigate to TV series page
   */
  navigateToTVSeries(): void {
    this.router.navigate(['/tvseries']);
  }

  /**
   * Check if series has trailer (either in trailers array or video_files)
   */
  hasTrailer(): boolean {
    if (!this.series) return false;
    
    // Check traditional trailers array
    if (this.series.trailers && this.series.trailers.length > 0) {
      return true;
    }
    
    // Check video_files for trailer
    if ((this.series as any).video_files && (this.series as any).video_files.length > 0) {
      console.log('DEBUG: Checking video_files for trailer:', (this.series as any).video_files);
      const hasTrailerVideo = (this.series as any).video_files.some((video: any) => {
        const titleLower = video.title ? video.title.toLowerCase() : '';
        console.log('DEBUG: Video title:', video.title, 'lowercase:', titleLower, 'includes trailer:', titleLower.includes('trailer'));
        return video.title && titleLower.includes('trailer');
      });
      console.log('DEBUG: hasTrailerVideo result:', hasTrailerVideo);
      return hasTrailerVideo;
    }
    
    return false;
  }
  
  /**
   * Verifica se l'utente ha crediti sufficienti per riprodurre il video
   */
  checkCredits(): void {
    console.log('[DEBUG] tvseries-details.checkCredits() chiamato');
    
    // Skip per admin
    if (this.authService.isAdmin()) {
      console.log('[DEBUG] Utente admin: skip verifica crediti');
      this.canPlayVideo = true;
      this.creditsError = false; // Assicuriamoci che non ci siano errori visualizzati
      return;
    }
    
    // Verifica che la serie TV sia caricata e abbia un ID
    if (!this.series) {
      console.error('[ERROR] Impossibile verificare i crediti: oggetto serie TV non disponibile');
      this.creditsError = true;
      return;
    }
    
    if (!this.series.tv_series_id) {
      console.error('[ERROR] Impossibile verificare i crediti: ID serie TV non disponibile', this.series);
      this.creditsError = true;
      return;
    }
    
    console.log(`[DEBUG] Verifico crediti per serie TV ID: ${this.series.tv_series_id}, titolo: ${this.series.title}`);
    
    this.checkingCredits = true;
    this.creditsError = false; // Reset dell'errore prima della verifica
    
    // Specifichiamo esplicitamente che stiamo verificando i crediti per una serie TV e passiamo l'ID della serie
    this.creditsService.canPlay('tvseries', this.series.tv_series_id)
      .pipe(finalize(() => {
        console.log('[DEBUG] Finalize checkCredits - checkingCredits = false');
        this.checkingCredits = false;
      }))
      .subscribe({
        next: (canPlay) => {
          this.canPlayVideo = canPlay;
          console.log('[DEBUG] Controllo crediti completato:', canPlay ? 'Crediti sufficienti' : 'Crediti insufficienti', canPlay);
          
          // Se l'utente ha crediti sufficienti, assicuriamoci che i pulsanti di riproduzione siano abilitati
          if (canPlay) {
            console.log('[DEBUG] Abilitando pulsanti di riproduzione per crediti sufficienti');
          }
          
          // Importante: crediti insufficienti NON è un errore, quindi non mostriamo il messaggio di errore
          this.creditsError = false;
        },
        error: (error) => {
          // Solo errori di rete o del server sono veri errori, non crediti insufficienti
          console.error('[ERROR] Errore durante il controllo dei crediti:', error);
          
          // Mostriamo l'errore solo se è un vero errore di sistema, non per crediti insufficienti
          if (error.status !== 402) {
            this.creditsError = true;
          } else {
            this.creditsError = false;
            // Crediti insufficienti non è un errore di sistema
            console.log('[INFO] Crediti insufficienti (non è un errore di sistema)');
          }
          
          // In caso di errore di sistema, permettiamo comunque la riproduzione
          // ma in caso di crediti insufficienti, non permettiamo la riproduzione
          this.canPlayVideo = (error.status !== 402);
        }
      });
  }
  
  /**
   * Consuma i crediti quando l'utente inizia la riproduzione del video
   */
  consumeCredits(videoElement?: HTMLVideoElement): void {
    console.log('[DEBUG] tvseries-details.consumeCredits() chiamato');
    
    // Skip per admin
    if (this.authService.isAdmin()) {
      console.log('[DEBUG] Utente admin: skip consumo crediti');
      return;
    }
    
    // Verifica che la serie TV sia caricata e abbia un ID
    if (!this.series) {
      console.error('[ERROR] Impossibile consumare i crediti: oggetto serie TV non disponibile');
      return;
    }
    
    if (!this.series.tv_series_id) {
      console.error('[ERROR] Impossibile consumare i crediti: ID serie TV non disponibile', this.series);
      return;
    }
    
    // Evita consumo multiplo di crediti
    if (this.consumingCredits) {
      console.log('[DEBUG] Consumo crediti già in corso, skip');
      return;
    }
    
    // Evita doppio consumo di crediti
    if (this.creditsAlreadyConsumed) {
      console.log('[DEBUG] Crediti già consumati per questa sessione, skip');
      return;
    }
    
    console.log(`[DEBUG] Consumo crediti per serie TV ID: ${this.series.tv_series_id}, titolo: ${this.series.title}`);
    
    this.consumingCredits = true;
    
    // Specifichiamo esplicitamente che stiamo consumando crediti per una serie TV e passiamo l'ID della serie
    this.creditsService.consumeCredits('tvseries', this.series.tv_series_id)
      .pipe(finalize(() => {
        console.log('[DEBUG] Finalize consumeCredits - consumingCredits = false');
        this.consumingCredits = false;
      }))
      .subscribe({
        next: (response) => {
          // Verifica se la risposta contiene un errore (gestito dal servizio)
          if (response.error) {
            console.warn(`[WARN] Errore gestito: ${response.message}`);
            
            // Se è un errore di crediti insufficienti (402)
            if (response.status === 402) {
              // Aggiorna lo stato dei crediti
              this.canPlayVideo = false;
              this.insufficientCredits = true;
              this.creditsErrorMessage = response.message || 'You don\'t have enough credits to play this video.';
              // Blocca la riproduzione se c'è un elemento video
              if (videoElement) {
                videoElement.pause();
              }
              // Aggiorna l'UI se necessario
              this.checkCredits(); // Ricontrolla i crediti per aggiornare l'UI
              return;
            }
          }
          
          console.log('[DEBUG] Crediti consumati con successo:', response);
          // Imposta il flag per evitare il doppio consumo
          this.creditsAlreadyConsumed = true;
        },
        error: (error) => {
          console.error('[ERROR] Errore durante il consumo dei crediti:', error);
          
          // Verifica se è un errore 402
          if (error.status === 402) {
            // Aggiorna lo stato dei crediti
            this.canPlayVideo = false;
            this.insufficientCredits = true;
            this.creditsErrorMessage = 'You don\'t have enough credits to play this video.';
            // Blocca la riproduzione se c'è un elemento video
            if (videoElement) {
              videoElement.pause();
            }
            return;
          }
          
          // Per altri errori, permettiamo comunque la riproduzione se c'è un elemento video
          if (videoElement) {
            videoElement.play().catch(playError => {
              console.error('[ERROR] Impossibile riprodurre il video dopo errore:', playError);
            });
          }
        }
      });
  }
  
  /**
   * Gestisce l'evento di play del video
   */
  onVideoPlay(event: Event): void {
    console.log('[DEBUG] tvseries-details.onVideoPlay() chiamato');
    const videoElement = event.target as HTMLVideoElement;
    
    // Reset del flag di consumo crediti quando si inizia una nuova riproduzione
    // Questo è necessario solo se il video è cambiato o se è la prima riproduzione
    const currentSrc = videoElement.src;
    if (currentSrc && currentSrc !== this.lastPlayedVideoSrc) {
      console.log('[DEBUG] Nuovo video rilevato, reset flag creditsAlreadyConsumed');
      this.creditsAlreadyConsumed = false;
      this.lastPlayedVideoSrc = currentSrc;
    }
    
    // Verifica se l'utente è admin
    const isAdmin = this.authService.isAdmin();
    console.log(`[DEBUG] Utente admin: ${isAdmin}, canPlayVideo: ${this.canPlayVideo}`);
    
    // Se l'utente non è admin e non ha crediti sufficienti, blocca la riproduzione
    if (!isAdmin && !this.canPlayVideo) {
      console.log('[DEBUG] Bloccando riproduzione: crediti insufficienti');
      videoElement.pause();
      alert('You don\'t have enough credits to play this video.');
      return;
    }
    
    // Verifica se stiamo usando un URL diretto o un URL blob
    console.log('[DEBUG] URL video corrente:', currentSrc);
    
    // Verifica se è un URL pubblico o autenticato
    const isPublicUrl = currentSrc.includes('public-video');
    const isAuthenticatedUrl = !currentSrc.startsWith('blob:') && 
                              (currentSrc.includes('stream-video') || 
                               currentSrc.includes('authenticated') || 
                               currentSrc.includes('api/video'));
    
    console.log(`[DEBUG] URL type - Public: ${isPublicUrl}, Authenticated: ${isAuthenticatedUrl}`);
    
    // Se è un URL autenticato e non è già un blob, carica il video come blob
    if (isAuthenticatedUrl) {
      console.log('[DEBUG] Caricamento video come blob per URL autenticato');
      videoElement.pause(); // Pausa il video durante il caricamento del blob
      
      // Carica il video come blob usando l'URL corrente
      this.loadVideoBlob(currentSrc).then(blobUrl => {
        console.log('[DEBUG] Blob URL creato con successo:', blobUrl);
        // Aggiorna l'URL del video con il blob URL
        this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(blobUrl);
        // Assegna il nuovo URL al video element
        videoElement.src = blobUrl;
        
        // Consuma i crediti solo se non è admin
        if (!isAdmin) {
          console.log('[DEBUG] Chiamando consumeCredits() per utente non-admin');
          this.consumeCredits(videoElement);
        } else {
          console.log('[DEBUG] Skip consumeCredits per utente admin');
        }
        
        // Riprendi la riproduzione
        videoElement.play().catch(error => {
          console.error('[ERROR] Errore durante la riproduzione del video dopo il caricamento del blob:', error);
        });
      }).catch(error => {
        console.error('[ERROR] Errore durante il caricamento del video come blob:', error);
        // In caso di errore, prova a riprodurre il video con l'URL originale
        if (!isAdmin) {
          this.consumeCredits(videoElement);
        }
      });
    } else {
      // Per URL pubblici o blob già caricati, consuma solo i crediti
      console.log('[DEBUG] URL pubblico o blob già caricato, skip caricamento blob');
      
      // Consuma i crediti solo se non è admin
      if (!isAdmin) {
        console.log('[DEBUG] Chiamando consumeCredits() per utente non-admin');
        this.consumeCredits(videoElement);
      } else {
        console.log('[DEBUG] Skip consumeCredits per utente admin');
      }
    }
  }

  /**
   * Consuma i crediti specificamente per i trailer YouTube
   * Questo metodo viene chiamato quando l'utente clicca sull'overlay del trailer YouTube
   */
  consumeCreditsForYouTube(): void {
    console.log('[DEBUG] tvseries-details.consumeCreditsForYouTube() chiamato');
    
    // Skip per admin
    if (this.authService.isAdmin()) {
      console.log('[DEBUG] Utente admin: skip consumo crediti per YouTube');
      this.youtubeCreditsConsumed = true;
      this.playYouTubeVideo();
      return;
    }
    
    // Verifica che la serie TV sia caricata e abbia un ID
    if (!this.series || !this.series.tv_series_id) {
      console.error('[ERROR] Impossibile consumare i crediti: oggetto serie TV non disponibile o ID mancante');
      return;
    }
    
    // Evita consumo multiplo di crediti
    if (this.consumingCredits) {
      console.log('[DEBUG] Consumo crediti già in corso, skip');
      return;
    }
    
    console.log(`[DEBUG] Consumo crediti per trailer YouTube della serie TV ID: ${this.series.tv_series_id}`);
    
    this.consumingCredits = true;
    
    // Specifichiamo esplicitamente che stiamo consumando crediti per una serie TV e passiamo l'ID della serie
    this.creditsService.consumeCredits('tvseries', this.series.tv_series_id)
      .pipe(finalize(() => {
        console.log('[DEBUG] Finalize consumeCreditsForYouTube - consumingCredits = false');
        this.consumingCredits = false;
      }))
      .subscribe({
        next: (response) => {
          // Verifica se la risposta contiene un errore (gestito dal servizio)
          if (response.error && response.status === 402) {
            console.warn(`[WARN] Errore crediti insufficienti: ${response.message}`);
            
            // Aggiorna lo stato dei crediti
            this.canPlayVideo = false;
            this.insufficientCredits = true;
            this.creditsError = true;
            this.creditsErrorMessage = response.message || 'You don\'t have enough credits to play this video.';
            this.forceOverlayVisibility();
            return;
          }
          
          console.log('[DEBUG] Crediti consumati con successo per YouTube:', response);
          this.canPlayVideo = true;
          this.creditsError = false;
          this.insufficientCredits = false;
          this.youtubeCreditsConsumed = true;
          this.playYouTubeVideo();
          this.checkCredits(); // Aggiorna l'UI dei crediti
        },
        error: (error) => {
          console.error('[ERROR] Errore durante il consumo dei crediti per YouTube:', error);
          
          // Verifica se è un errore 402
          if (error.status === 402) {
            // Aggiorna lo stato dei crediti
            this.canPlayVideo = false;
            this.insufficientCredits = true;
            this.creditsError = true;
            this.creditsErrorMessage = 'You don\'t have enough credits to play this video.';
            this.forceOverlayVisibility();
            return;
          }
        }
      });
  }

  /**
   * Riproduce il video YouTube dopo che i crediti sono stati consumati
   * Rimuove l'overlay e permette la riproduzione del video
   */
  playYouTubeVideo(): void {
    console.log('[DEBUG] tvseries-details.playYouTubeVideo() chiamato');
    // Rimuovi l'overlay per permettere l'interazione con l'iframe di YouTube
    this.youtubeCreditsConsumed = true;
    this.insufficientCredits = false;
  }

  /**
   * Forza la visibilità dell'overlay quando i crediti sono insufficienti
   * Questo impedisce all'utente di bypassare il controllo dei crediti
   */
  private overlayInterval: any;
  
  forceOverlayVisibility(): void {
    console.log('[DEBUG] tvseries-details.forceOverlayVisibility() chiamato');
    this.insufficientCredits = true;
    this.youtubeCreditsConsumed = false;
    
    // Cancella qualsiasi intervallo esistente
    if (this.overlayInterval) {
      clearInterval(this.overlayInterval);
    }
    
    // Imposta un intervallo per mantenere l'overlay visibile
    this.overlayInterval = setInterval(() => {
      if (this.insufficientCredits && !this.authService.isAdmin()) {
        // Assicurati che l'overlay rimanga visibile
        this.insufficientCredits = true;
        
        // Se c'è un elemento video, assicurati che sia in pausa e resettato
        if (this.videoPlayer && this.videoPlayer.nativeElement) {
          const video = this.videoPlayer.nativeElement;
          if (!video.paused) {
            video.pause();
          }
          // Resetta il video a tempo 0
          video.currentTime = 0;
        }
      } else {
        // Se non ci sono più problemi di crediti, cancella l'intervallo
        clearInterval(this.overlayInterval);
        this.overlayInterval = null;
      }
    }, 200); // Controlla ogni 200ms
  }
  
  /**
   * Gestisce l'evento playing del video
   * Questo viene chiamato quando il video inizia effettivamente la riproduzione
   */
  onVideoPlaying(event: Event): void {
    console.log('[DEBUG] tvseries-details.onVideoPlaying() chiamato');
    const videoElement = event.target as HTMLVideoElement;
    
    // Se l'utente non è admin e non ha crediti sufficienti, blocca la riproduzione
    if (!this.authService.isAdmin() && this.insufficientCredits) {
      console.log('[DEBUG] Bloccando riproduzione in playing: crediti insufficienti');
      videoElement.pause();
      videoElement.currentTime = 0;
      this.forceOverlayVisibility();
    }
  }
  
  /**
   * Gestisce l'evento timeupdate del video
   * Questo viene chiamato periodicamente durante la riproduzione del video
   */
  onVideoTimeUpdate(event: Event): void {
    // Se l'utente non è admin e non ha crediti sufficienti, blocca la riproduzione
    if (!this.authService.isAdmin() && this.insufficientCredits) {
      const videoElement = event.target as HTMLVideoElement;
      if (!videoElement.paused) {
        console.log('[DEBUG] Bloccando riproduzione in timeupdate: crediti insufficienti');
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    }
  }
}
