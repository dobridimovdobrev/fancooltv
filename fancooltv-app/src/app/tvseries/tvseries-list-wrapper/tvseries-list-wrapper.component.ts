import { Component, OnInit } from '@angular/core';
import { TVSeriesService } from '../../services/tvseries.service';
import { TVSeriesServiceRefactored } from '../../shared/services/tvseries.service.refactored';
import { BaseMediaService } from '../../shared/services/base-media.service';
import { Category } from '../../models/media.models';

@Component({
  selector: 'app-tvseries-list-wrapper',
  templateUrl: './tvseries-list-wrapper.component.html',
  styleUrls: ['./tvseries-list-wrapper.component.scss']
})
export class TvseriesListWrapperComponent implements OnInit {
  // MediaListComponent configuration
  mediaType: 'tvseries' = 'tvseries';
  title = 'TV Series';
  searchPlaceholder = 'Search TV series...';
  mediaService: BaseMediaService<any>;

  constructor(
    private tvseriesService: TVSeriesService,
    private tvseriesServiceRefactored: TVSeriesServiceRefactored
  ) {
    // Use the refactored service for the new component
    this.mediaService = this.tvseriesServiceRefactored;
  }

  ngOnInit(): void {
    // Initialize the service if needed
    this.initializeService();
  }

  /**
   * Initialize the TV series service
   */
  private initializeService(): void {
    // Load initial categories and years for filters
    this.loadCategories();
    this.loadYears();
  }

  /**
   * Load TV series categories for filters
   */
  private loadCategories(): void {
    // TV series service doesn't have categories, will be handled by MediaListComponent
    console.debug('TV series categories will be loaded by MediaListComponent');
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
    console.debug('Years generated for TV series:', years.length);
  }
}
