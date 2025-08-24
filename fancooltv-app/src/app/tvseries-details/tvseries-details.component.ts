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
  
  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  
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
        console.log('[DEBUG] Revoca URL blob:', urlString);
        URL.revokeObjectURL(urlString);
      }
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
          console.log('=== TV SERIES DEBUG ===');
          console.log('Full TV Series object:', JSON.stringify(series, null, 2));
          console.log('TV Series video_files:', (series as any).video_files);
          console.log('TV Series video_files length:', (series as any).video_files?.length || 0);
          console.log('TV Series trailers:', series.trailers);
          console.log('TV Series trailers length:', series.trailers?.length || 0);
          console.log('hasTrailer() result before processing:', this.hasTrailer());
          
          // Process video_files to ensure proper URLs like movie-details does
          if ((series as any).video_files && (series as any).video_files.length > 0) {
            (series as any).video_files = (series as any).video_files.map((video: any) => {
              // Use public_stream_url if available, otherwise fallback to authenticated URL
              const videoUrl = video.public_stream_url || video.stream_url || video.url;
              console.log('Processing TV series video file:', video.title, 'URL:', videoUrl);
              return {
                ...video,
                url: videoUrl // Ensure url property uses the correct URL
              };
            });
            
            // Debug trailer detection after processing
            console.log('After processing - hasTrailer() result:', this.hasTrailer());
          }
          
          // Process episodes to ensure proper video URLs
          if (series.seasons && series.seasons.length > 0) {
            series.seasons.forEach((season: any, seasonIndex: number) => {
              if (season.episodes && season.episodes.length > 0) {
                season.episodes.forEach((episode: any, episodeIndex: number) => {
                  if (episode.public_stream_url) {
                    console.log(`Episode S${season.season_number}E${episode.episode_number} video URL:`, episode.public_stream_url);
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
    console.log('DEBUG: openTrailerModal called with URL:', trailerUrl);
    
    // Se l'utente non è admin e non ha crediti sufficienti, blocca la riproduzione
    if (!this.authService.isAdmin() && !this.canPlayVideo) {
      // Non mostrare alert ma impostare lo stato per mostrare l'overlay
      this.insufficientCredits = true;
      this.creditsErrorMessage = 'You don\'t have enough credits to play this content';
      return;
    }
    
    // If no URL provided, try to find one from the series data
    if (!url && this.series) {
      console.log('DEBUG: No URL provided, searching in series data');
      
      // Check video_files for trailer FIRST (prioritize uploaded videos)
      if ((this.series as any).video_files && (this.series as any).video_files.length > 0) {
        const trailerVideo = (this.series as any).video_files.find((video: any) => 
          video.title && video.title.toLowerCase().includes('trailer')
        );
        if (trailerVideo) {
          url = trailerVideo.public_stream_url || trailerVideo.stream_url;
          console.log('DEBUG: Found trailer in video_files (PRIORITY):', url);
        }
      }
      // THEN check traditional trailers array if no uploaded video found
      if (!url && this.series.trailers && this.series.trailers.length > 0) {
        url = this.series.trailers[0].url;
        console.log('DEBUG: Found trailer in trailers array (FALLBACK):', url);
      }
    }
    
    console.log('DEBUG: Final trailer URL:', url);
    if (url) {
      // Check if it's a local video file (MP4) or YouTube URL
      if (url.includes('.mp4') || url.includes('stream-video') || url.includes('public-video')) {
        // Local video file - use video element instead of iframe
        console.log('DEBUG: Using video element for local file');
        this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        
        // Consuma i crediti solo se non è admin
        if (!this.authService.isAdmin()) {
          this.consumeCredits();
        }
        
        this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
      } else {
        // YouTube URL - use iframe
        console.log('DEBUG: Using iframe for YouTube URL');
        this.trailerUrl = this.sanitizeTrailerUrl(url);
        
        // Consuma i crediti solo se non è admin
        if (!this.authService.isAdmin()) {
          this.consumeCredits();
        }
        
        this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
      }
    } else {
      console.log('No trailer available for this content');
    }
  }

  /**
   * Close the trailer modal and reset the trailer URL
   */
  closeTrailerModal(): void {
    if (this.modalRef) {
      this.modalRef.hide();
    }
    this.trailerUrl = null;
    this.videoUrl = null;
  }

  /**
   * Open the episode content - handles both episodes with video files and those without
   * If the episode has video files, it will play those. Otherwise, it will play the series trailer.
   */
  @ViewChild('trailerModal') trailerModalTemplate!: TemplateRef<any>;
  
  openEpisodeContent(template: TemplateRef<any>, episode: any): void {
    console.log('DEBUG: openEpisodeContent called for episode:', episode.title);
    
    // Se l'utente non è admin e non ha crediti sufficienti, blocca la riproduzione
    if (!this.authService.isAdmin() && !this.canPlayVideo) {
      // Non mostrare alert ma impostare lo stato per mostrare l'overlay
      this.insufficientCredits = true;
      this.creditsErrorMessage = 'You don\'t have enough credits to play this content';
      return;
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
        this.openTrailerModal(this.trailerModalTemplate || template);
      } else if ((this.series as any).video_files && (this.series as any).video_files.length > 0) {
        // Se ci sono video_files nella serie, usa quelli
        this.openTrailerModal(this.trailerModalTemplate || template);
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
    
    // Se l'utente non è admin e non ha crediti sufficienti, blocca la riproduzione
    if (!this.authService.isAdmin() && !this.canPlayVideo) {
      // Non mostrare alert ma impostare lo stato per mostrare l'overlay
      this.insufficientCredits = true;
      this.creditsErrorMessage = 'You don\'t have enough credits to play this content';
      return;
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
          
          // Consuma i crediti solo se non è admin
          if (!this.authService.isAdmin()) {
            this.consumeCredits();
          }
          
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
        
        // Consuma i crediti solo se non è admin
        if (!this.authService.isAdmin()) {
          this.consumeCredits();
        }
        
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
    this.creditsError = false;
    
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
        },
        error: (error) => {
          console.error('[ERROR] Errore durante il controllo dei crediti:', error);
          this.creditsError = true;
          // In caso di errore, permettiamo comunque la riproduzione
          this.canPlayVideo = true;
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
    const currentSrc = videoElement.src;
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
}
