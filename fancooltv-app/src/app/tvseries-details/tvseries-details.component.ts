import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TVSeries } from '../models/tvseries.models';
import { TVSeriesService } from '../services/tvseries.service';
import { ApiService } from '../services/api.service';
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
  expandedSeasons: Set<number> = new Set<number>();
  modalRef?: BsModalRef;
  private subscriptions: Subscription = new Subscription();
  
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
    this.loading = true;
    this.error = false;
    this.subscriptions.add(
      this.tvSeriesService.loadTVSeriesDetails(seriesId).subscribe({
        next: (series) => {
          this.series = series;
          this.loading = false;
          if (series.trailers && series.trailers.length > 0) {
            this.trailerUrl = this.sanitizeTrailerUrl(series.trailers[0].url);
          }
        },
        error: (error) => {
          this.error = true;
          this.errorMessage = error.message;
          this.loading = false;
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
    const url = trailerUrl || (this.series?.trailers && this.series.trailers.length > 0 ? this.series.trailers[0].url : '');
    if (url) {
      this.trailerUrl = this.sanitizeTrailerUrl(url);
      this.modalRef = this.modalService.show(template, { class: 'modal-lg modal-dialog-centered' });
    } else {
      // If there is no trailer available, we show a message or handle it in another way
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
  getImageUrl(path: string, type: 'cast' | 'poster' | 'backdrop' | 'still' = 'poster'): string {
    if (!path) return '';
    return this.apiService.getImageUrl(path, type);
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
