import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { CountryService, Country } from '../../../services/country.service';

@Component({
  selector: 'app-admin-countries',
  templateUrl: './admin-countries.component.html',
  styleUrls: ['./admin-countries.component.scss']
})
export class AdminCountriesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;

  countries: Country[] = [];
  loading = false;
  noResults = false;
  currentPage = 1;
  perPage = 30; // Load 30 countries at a time (matches backend)
  totalItems = 0;
  
  // Search and filters
  searchTerm = '';
  continentFilter = '';
  
  // Modal properties
  modalRef?: BsModalRef;
  countryToDelete: Country | null = null;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private countryService: CountryService,
    private router: Router,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    // Auto-reset search when navigating from menu
    this.resetSearchAndFilters();
    this.loadCountries();
  }

  /**
   * Called when component becomes active (Angular lifecycle)
   */
  ngAfterViewInit(): void {
    // Additional reset when view is initialized
    setTimeout(() => {
      this.resetSearchAndFilters();
    }, 50);
  }

  /**
   * Reset search and filters (called on navigation)
   */
  private resetSearchAndFilters(): void {
    this.searchTerm = '';
    this.continentFilter = '';
    this.currentPage = 1;
    
    // Clear the search input if it exists
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.value = '';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load countries from API
   */
  loadCountries(reset: boolean = false): void {
    console.log('🔄 Loading countries - Reset:', reset, 'Page:', this.currentPage);
    
    if (reset) {
      this.countries = [];
      this.currentPage = 1;
    }

    this.loading = true;
    this.noResults = false;

    const filters: any = {};
    if (this.searchTerm) {
      filters.name = this.searchTerm;
    }
    if (this.continentFilter) {
      filters.continent = this.continentFilter;
    }

    this.subscriptions.add(
      this.countryService.getCountries(this.currentPage, this.perPage, filters).subscribe({
        next: (response) => {
          console.log('✅ Countries API response:', response);
          console.log('🔍 Response type:', typeof response);
          console.log('🔍 Response.data type:', typeof response?.data);
          console.log('🔍 First country sample:', response?.data?.[0]);
          
          if (response && response.data) {
            // Always reset when it's a new search/filter or after delete operation
            if (reset || this.currentPage === 1) {
              this.countries = response.data;
            } else {
              // Only concatenate for pagination (Load More)
              this.countries = [...this.countries, ...response.data];
            }
            this.totalItems = response.meta?.total || response.data.length;
            this.loading = false;
            
            console.log('📊 Countries loaded:', this.countries.length, 'Total:', this.totalItems);
            console.log('🔍 First loaded country:', this.countries[0]);
            
            // Update the service subject
            this.countryService.updateCountriesSubject(this.countries);
          } else {
            console.warn('⚠️ Invalid response format:', response);
            this.loading = false;
            this.noResults = true;
          }
        },
        error: (error) => {
          console.error('❌ Error loading countries:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          this.loading = false;
          this.noResults = true;
        }
      })
    );
  }

  /**
   * Load more countries (pagination)
   */
  loadMore(): void {
    if (this.countries.length < this.totalItems && !this.loading) {
      this.currentPage++;
      this.loadCountries();
    }
  }

  /**
   * Handle search button click
   */
  onSearchClick(): void {
    this.searchTerm = this.searchInput.nativeElement.value.trim();
    this.loadCountries(true);
  }

  /**
   * Handle search input change (for real-time updates)
   */
  onSearchInputChange(): void {
    // Update searchTerm from input - no automatic search, only on Enter or Search button
    // This is just to keep the model in sync for the clear button visibility
  }

  /**
   * Clear search input and reload all countries
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchInput.nativeElement.value = '';
    this.continentFilter = '';
    // Reset continent filter select
    const continentSelect = document.querySelector('.filter-select') as HTMLSelectElement;
    if (continentSelect) {
      continentSelect.value = '';
    }
    // Reload all countries
    this.loadCountries(true);
  }

  /**
   * Handle continent filter change
   */
  onContinentChange(event: any): void {
    this.continentFilter = event.target.value;
    this.applyFilters();
  }

  /**
   * Apply filters to countries list
   */
  private applyFilters(): void {
    this.loadCountries(true);
  }

  /**
   * Get continent display name
   */
  getContinentName(continent: string): string {
    const continents: { [key: string]: string } = {
      'AF': 'Africa',
      'AS': 'Asia',
      'EU': 'Europe',
      'NA': 'North America',
      'SA': 'South America',
      'OC': 'Oceania',
      'AN': 'Antarctica'
    };
    return continents[continent] || continent;
  }

  /**
   * Get continent badge class
   */
  getContinentBadgeClass(continent: string): string {
    const classes: { [key: string]: string } = {
      'AF': 'badge-warning',
      'AS': 'badge-info',
      'EU': 'badge-primary',
      'NA': 'badge-success',
      'SA': 'badge-danger',
      'OC': 'badge-secondary',
      'AN': 'badge-light'
    };
    return classes[continent] || 'badge-secondary';
  }

  /**
   * Format phone prefix for display
   */
  formatPhonePrefix(prefix: string): string {
    return prefix.startsWith('+') ? prefix : `+${prefix}`;
  }

  /**
   * Navigate to create country form
   */
  createCountry(): void {
    this.router.navigate(['/dashboard/admin/countries/create']);
  }

  /**
   * Navigate to edit country form
   */
  editCountry(countryId: number): void {
    this.router.navigate(['/dashboard/admin/countries/edit', countryId]);
  }

  /**
   * Show delete confirmation modal
   */
  deleteCountry(countryId: number): void {
    // Find the country to delete
    this.countryToDelete = this.countries.find(c => c.country_id === countryId) || null;
    
    if (this.countryToDelete) {
      // Open the delete confirmation modal
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-md',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Confirm country deletion
   */
  confirmDelete(): void {
    if (this.countryToDelete) {
      this.loading = true;
      
      this.countryService.deleteCountry(this.countryToDelete.country_id!).subscribe({
        next: (response) => {
          console.log('Country deleted successfully:', response);
          // Reset to first page and reload countries list
          this.currentPage = 1;
          this.loadCountries(true);
          this.modalRef?.hide();
          this.countryToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting country:', error);
          this.loading = false;
          this.modalRef?.hide();
          this.countryToDelete = null;
        }
      });
    }
  }

  /**
   * Cancel country deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
    this.countryToDelete = null;
  }


}
