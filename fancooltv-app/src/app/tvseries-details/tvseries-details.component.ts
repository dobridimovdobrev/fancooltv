import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TVSeries } from '../models/tvseries.models';
import { TVSeriesService } from '../services/tvseries.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

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
    private router: Router,
    private tvSeriesService: TVSeriesService,
    private apiService: ApiService,
    public authService: AuthService,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadSeriesDetails(+id);
        } else {
          this.router.navigate(['/tvseries']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load TV series details from the API
   */
  loadSeriesDetails(seriesId: number): void {
    console.log('TvseriesDetailsComponent.loadSeriesDetails called with ID:', seriesId);
    this.loading = true;
    this.error = false;
    this.subscriptions.add(
      this.tvSeriesService.loadTVSeriesDetails(seriesId).subscribe({
        next: (series) => {
          console.log('TvseriesDetailsComponent received series data:', series);
          this.series = series;
          this.loading = false;
          
          // Debug: Log series data like movie-details does
          console.log('=== TV SERIES DEBUG ===');
          
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
          this.errorMessage = 'Errore nel caricamento dei dettagli della serie TV';
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
    
    // If no URL provided, try to find one from the series data
    if (!url && this.series) {
      console.log('DEBUG: No URL provided, searching in series data');
      // Check traditional trailers array first
      if (this.series.trailers && this.series.trailers.length > 0) {
        url = this.series.trailers[0].url;
        console.log('DEBUG: Found trailer in trailers array:', url);
      }
      // Check video_files for trailer
      else if ((this.series as any).video_files && (this.series as any).video_files.length > 0) {
        const trailerVideo = (this.series as any).video_files.find((video: any) => 
          video.title && video.title.toLowerCase().includes('trailer')
        );
        if (trailerVideo) {
          url = trailerVideo.public_stream_url || trailerVideo.stream_url;
          console.log('DEBUG: Found trailer in video_files:', url);
        }
      }
    }
    
    console.log('DEBUG: Final trailer URL:', url);
    if (url) {
      // Check if it's a local video file (MP4) or YouTube URL
      if (url.includes('.mp4') || url.includes('stream-video') || url.includes('public-video')) {
        // Local video file - use video element instead of iframe
        console.log('DEBUG: Using video element for local file');
        this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
      } else {
        // YouTube URL - use iframe
        console.log('DEBUG: Using iframe for YouTube URL');
        this.trailerUrl = this.sanitizeTrailerUrl(url);
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
   * Open the video modal with the specified video URL for episodes
   */
  openVideoModal(template: TemplateRef<any>, videoUrl: string): void {
    console.log('DEBUG: openVideoModal called with URL:', videoUrl);
    if (videoUrl) {
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
      console.log('DEBUG: Setting sanitized videoUrl to:', this.videoUrl);
      this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
    } else {
      console.log('No video URL available for this episode');
    }
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
}
