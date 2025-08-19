import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiResponse } from '../../../models/api.models';
import { TVSeries } from '../../../models/tvseries.models';
import { ApiService } from '../../../services/api.service';
import { debounceTime, distinctUntilChanged, fromEvent } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-admin-tvseries',
  templateUrl: './admin-tvseries.component.html',
  styleUrls: ['./admin-tvseries.component.scss']
})
export class AdminTVSeriesComponent implements OnInit {
  // Component properties
  tvSeries: TVSeries[] = [];
  filteredTVSeries: TVSeries[] = [];
  loading: boolean = false;
  isLoading: boolean = false;
  error: string = '';
  noResults: boolean = false;
  hasMoreData: boolean = true;
  
  // Pagination
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 10;
  totalPages = 0;

  // Search and Filters (Movies-like)
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  
  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  modalRef?: BsModalRef;
  tvSeriesToDelete: TVSeries | null = null;

  constructor(
    public apiService: ApiService,
    private router: Router,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.loadTVSeries();
    this.setupSearchListener();
  }

  /**
   * Load TV series from API with pagination
   */
  loadTVSeries(page: number = 1): void {
    this.loading = true;
    
    const params: any = {
      page: page,
      limit: this.itemsPerPage,
      sort_by: 'created_at',
      sort_direction: 'desc'
    };
    
    // Add filters if selected
    if (this.searchTerm) params.q = this.searchTerm;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.selectedStatus) params.status = this.selectedStatus;
    
    console.log('Loading TV Series with params:', params);
    const startTime = performance.now();
    
    this.apiService.getTVSeries(params).subscribe({
      next: (response) => {
        const endTime = performance.now();
        console.log(`TV Series API call took ${endTime - startTime} milliseconds`);
        console.log('TV Series response:', response);
        
        // Debug poster data for each TV series
        response.data.forEach((series: any, index: number) => {
          console.log(`TV Series ${index + 1} (${series.title}):`, {
            poster: series.poster,
            hasUrl: series.poster?.url ? 'YES' : 'NO',
            url: series.poster?.url,
            posterType: typeof series.poster
          });
        });
        
        if (page === 1) {
          this.tvSeries = response.data;
        } else {
          this.tvSeries = [...this.tvSeries, ...response.data];
        }
        
        this.totalItems = response.meta?.total || 0;
        this.noResults = this.tvSeries.length === 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading TV series:', error);
        this.loading = false;
        this.noResults = true;
      }
    });
  }

  /**
   * Load more TV series (pagination)
   */
  loadMore(): void {
    if (this.loading || this.tvSeries.length >= this.totalItems) return;
    
    this.currentPage++;
    this.loadTVSeries(this.currentPage);
  }

  /**
   * Setup search input listener with debounce
   */
  setupSearchListener(): void {
    if (this.searchInput) {
      fromEvent(this.searchInput.nativeElement, 'input')
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(() => {
          this.onSearchInputChange();
        });
    }
  }

  /**
   * Handle search input change
   */
  onSearchInputChange(): void {
    this.searchTerm = this.searchInput.nativeElement.value;
    this.currentPage = 1;
    this.loadTVSeries(1);
  }

  /**
   * Handle search button click
   */
  onSearchClick(): void {
    this.searchTerm = this.searchInput.nativeElement.value;
    this.currentPage = 1;
    this.loadTVSeries(1);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchInput.nativeElement.value = '';
    this.currentPage = 1;
    this.loadTVSeries(1);
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadTVSeries(1);
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.searchInput.nativeElement.value = '';
    this.currentPage = 1;
    this.loadTVSeries(1);
  }

  /**
   * Get image URL for TV series poster
   */
  getImageUrl(poster: any): string {
    if (!poster) {
      return '/assets/images/no-poster.jpg';
    }
    if (poster && poster.url) {
      return poster.url;
    }
    if (poster && poster.sizes && poster.sizes.original) {
      return poster.sizes.original;
    }
    return poster || '/assets/images/no-poster.jpg';
  }

  /**
   * Handle image error
   */
  onImageError(event: any): void {
    const img = event.target;
    const placeholder = img.parentElement.querySelector('.no-image-placeholder');
    
    img.style.display = 'none';
    if (placeholder) {
      placeholder.classList.remove('d-none');
    }
  }

  /**
   * Show delete confirmation modal
   */
  openDeleteModal(seriesId: number): void {
    // Find the TV series to delete
    this.tvSeriesToDelete = this.tvSeries.find(s => s.tv_series_id === seriesId) || null;
    
    if (this.tvSeriesToDelete) {
      // Open the delete confirmation modal
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-md modal-dialog-centered',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Confirm TV series deletion
   */
  confirmDelete(): void {
    if (this.tvSeriesToDelete) {
      this.loading = true;
      
      this.apiService.deleteTVSeries(this.tvSeriesToDelete.tv_series_id).subscribe({
        next: (response) => {
          console.log('TV series deleted successfully:', response);
          // Remove TV series from the list
          this.tvSeries = this.tvSeries.filter(s => s.tv_series_id !== this.tvSeriesToDelete!.tv_series_id);
          this.noResults = this.tvSeries.length === 0;
          this.modalRef?.hide();
          this.tvSeriesToDelete = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting TV series:', error);
          this.loading = false;
          this.modalRef?.hide();
          this.tvSeriesToDelete = null;
        }
      });
    }
  }

  /**
   * Cancel TV series deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
    this.tvSeriesToDelete = null;
  }

  /**
   * Navigate to create TV series
   */
  createTVSeries(): void {
    this.router.navigate(['/admin/tvseries/create']);
  }

  /**
   * Navigate to edit TV series
   */
  editTVSeries(seriesId: number): void {
    this.router.navigate(['/admin/tvseries/edit', seriesId]);
  }
}
