import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Movie } from '../../models/media.models';
import { TVSeries } from '../../models/tvseries.models';

// Generic media interface for common properties
export interface MediaItem {
  id: number;
  title: string;
  poster: string;
  year: number;
  imdb_rating: number;
  category?: { name: string };
  // Movie specific
  duration?: number;
  movie_id?: number;
  // TV Series specific
  total_seasons?: number;
  tv_series_id?: number;
}

@Component({
  selector: 'app-media-card',
  templateUrl: './media-card.component.html',
  styleUrls: ['./media-card.component.scss']
})
export class MediaCardComponent {
  @Input() mediaItem!: MediaItem;
  @Input() mediaType: 'movie' | 'tvseries' = 'movie';
  @Output() imageError = new EventEmitter<Event>();
  @Output() cardClick = new EventEmitter<number>();

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.parentElement) {
      // Hide the broken image
      imgElement.style.display = 'none';
      
      // Show the placeholder
      const placeholder = imgElement.parentElement.querySelector('.no-image-placeholder');
      if (placeholder instanceof HTMLElement) {
        placeholder.classList.remove('d-none');
        placeholder.style.display = 'flex';
      }
    }
    
    // Emit the error event for parent component handling
    this.imageError.emit(event);
  }

  /**
   * Handle card click for navigation
   */
  onCardClick(): void {
    const id = this.mediaType === 'movie' 
      ? this.mediaItem.movie_id || this.mediaItem.id
      : this.mediaItem.tv_series_id || this.mediaItem.id;
    
    this.cardClick.emit(id);
  }

  /**
   * Get the route link for details page
   */
  getDetailsRoute(): string[] {
    const id = this.mediaType === 'movie' 
      ? this.mediaItem.movie_id || this.mediaItem.id
      : this.mediaItem.tv_series_id || this.mediaItem.id;
    
    return this.mediaType === 'movie' 
      ? ['/movie-details', id.toString()]
      : ['/tvseries-details', id.toString()];
  }

  /**
   * Get duration or seasons text
   */
  getDurationText(): string {
    if (this.mediaType === 'movie' && this.mediaItem.duration) {
      return `${this.mediaItem.duration} min`;
    } else if (this.mediaType === 'tvseries' && this.mediaItem.total_seasons) {
      return `${this.mediaItem.total_seasons} Seasons`;
    }
    return '';
  }

  /**
   * Get category name safely
   */
  getCategoryName(): string {
    return this.mediaItem.category?.name || '';
  }
}
