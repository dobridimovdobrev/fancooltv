import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ApiResponse, PaginationParams } from '../../../models/api.models';
import { Person } from '../../../models/media.models';
import { ApiService } from '../../../services/api.service';
import { debounceTime, distinctUntilChanged, fromEvent } from 'rxjs';

@Component({
  selector: 'app-admin-persons',
  templateUrl: './admin-persons.component.html',
  styleUrls: ['./admin-persons.component.scss']
})
export class AdminPersonsComponent implements OnInit {
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;

  // Person data
  persons: Person[] = [];
  filteredPersons: Person[] = [];

  // Pagination
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 20; // Number of items per page from API (ridotto da 100 a 20)
  totalPages = 0;
  paginationLinks: any[] = [];

  // UI States
  loading: boolean = false;
  error: string | null = null;
  noResults: boolean = false;

  // Search and Filters (Movies-like)
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  searchQuery: string = '';
  searchTerm: string = '';
  selectedKnownFor: string = '';

  // Modal properties
  modalRef?: BsModalRef;
  personToDelete: Person | null = null;

  constructor(
    public apiService: ApiService,
    private router: Router,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.loadPersons();
    this.setupSearchListener();
  }

  /**
   * Load persons from API with pagination
   */
  loadPersons(page: number = 1): void {
    this.loading = true;
    this.error = '';

    const params: Record<string, any> = {
      page: page,
      per_page: this.itemsPerPage
    };

    // Add search parameter if present (usando 'name' come specificato nella documentazione API)
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      params['name'] = this.searchQuery.trim();
      console.log('Searching for person by name:', this.searchQuery.trim());
    }
    
    // Add filter for known_for if selected
    if (this.selectedKnownFor && this.selectedKnownFor.trim() !== '') {
      params['known_for'] = this.selectedKnownFor.trim();
      console.log('Filtering by known_for:', this.selectedKnownFor.trim());
    }
    
    console.log('Requesting persons with params:', params);

    this.apiService.getPersons(params).subscribe({
      next: (response: any) => {
        console.log('API Response getPersons:', response);

        if (response && Array.isArray(response.data)) {
          // Sostituisci sempre i dati invece di concatenarli
          this.persons = response.data;

          // Determina se la paginazione è in 'meta' (vecchia struttura) o 'pagination' (nuova struttura)
          const paginationData = response.pagination || response.meta || {};
          
          // Update pagination information
          this.totalItems = paginationData.total || 0;
          this.totalPages = paginationData.total_pages || paginationData.last_page || 1;
          this.currentPage = paginationData.current_page || 1;
          
          // Gestione dei link di paginazione
          if (paginationData.links) {
            // Nuova struttura: links è un oggetto con next e previous
            if (typeof paginationData.links === 'object' && !Array.isArray(paginationData.links)) {
              console.log('Nuova struttura di paginazione rilevata:', paginationData.links);
              // Genera manualmente i link basandoci su current_page e total_pages
              this.generatePaginationLinks();
            } 
            // Vecchia struttura: links è un array di oggetti
            else if (Array.isArray(paginationData.links)) {
              console.log('Vecchia struttura di paginazione rilevata');
              this.paginationLinks = paginationData.links;
              console.log('Pagination links:', this.paginationLinks);
            } else {
              // Fallback: genera manualmente
              this.generatePaginationLinks();
            }
          } else {
            // Nessun link fornito, genera manualmente
            this.generatePaginationLinks();
          }

          this.filteredPersons = [...this.persons];
          this.noResults = this.persons.length === 0;

          console.log(`Persons loaded: ${this.persons.length} of ${this.totalItems} total, page ${this.currentPage} of ${this.totalPages}`);
        } else {
          console.error('Unrecognized API response format:', response);
          this.error = 'Formato risposta API non riconosciuto';
          this.noResults = true;
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Errore durante il caricamento delle persone:', error);
        this.error = 'Si è verificato un errore durante il caricamento delle persone.';
        this.loading = false;
        this.noResults = true;
      }
    });
  }

  /**
   * Configura il listener per la ricerca (solo su Enter key)
   */
  setupSearchListener(): void {
    // Non configuriamo più la ricerca in tempo reale
    // La ricerca avviene solo su click del pulsante Search o Enter key
  }

  /**
   * Gestisce il click sul pulsante di ricerca
   */
  onSearchClick(): void {
    if (this.searchInput && this.searchInput.nativeElement) {
      this.searchQuery = this.searchInput.nativeElement.value.trim();
      this.currentPage = 1;
      this.persons = []; // Reset persons array
      this.loadPersons();
    }
  }

  /**
   * Navigate to create new person page
   */
  createPerson(): void {
    this.router.navigate(['/dashboard/admin/persons/create']);
  }

  /**
   * Navigate to edit person page
   */
  editPerson(personId: number): void {
    this.router.navigate(['/dashboard/admin/persons/edit', personId]);
  }

  /**
   * Show delete confirmation modal
   */
  openDeleteModal(personId: number): void {
    // Find the person to delete
    this.personToDelete = this.persons.find(p => p.person_id === personId) || null;
    
    if (this.personToDelete) {
      // Open the delete confirmation modal
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-md',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Confirm person deletion
   */
  confirmDelete(): void {
    if (this.personToDelete) {
      this.loading = true;
      
      this.apiService.deletePerson(this.personToDelete.person_id).subscribe({
        next: (response) => {
          console.log('Person deleted successfully:', response);
          // Reload persons list
          this.loadPersons();
          this.modalRef?.hide();
          this.personToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting person:', error);
          this.loading = false;
          this.modalRef?.hide();
          this.personToDelete = null;
        }
      });
    }
  }

  /**
   * Cancel person deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
    this.personToDelete = null;
  }

  /**
   * Carica più persone (paginazione)
   */
  loadMore(): void {
    if (this.loading || this.currentPage >= this.totalPages) return;

    this.currentPage++;
    this.loadPersons(this.currentPage);
  }

  /**
   * Naviga a una pagina specifica
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;

    this.currentPage = page;
    this.loadPersons(page);
  }

  /**
   * Gestisce l'errore di caricamento immagine
   * @param event L'evento di errore
   */
  onImageError(event: any): void {
    // Se l'immagine non si carica, usiamo il poster dei film come fallback
    // poiché il placeholder-person.jpg non esiste
    event.target.src = 'assets/images/movies-poster.jpg';
  }

  /**
   * Verifica se un valore è NaN
   */
  isNaN(value: any): boolean {
    return Number.isNaN(Number(value));
  }
  
  /**
   * Genera manualmente i link di paginazione quando non sono forniti dall'API
   */
  generatePaginationLinks(): void {
    // Resetta i link di paginazione
    this.paginationLinks = [];
    
    // Numero massimo di link da mostrare (esclusi prev/next)
    const maxLinks = 5;
    
    // Calcola l'intervallo di pagine da mostrare
    let startPage = Math.max(1, this.currentPage - Math.floor(maxLinks / 2));
    let endPage = Math.min(this.totalPages, startPage + maxLinks - 1);
    
    // Aggiusta l'intervallo se necessario
    if (endPage - startPage + 1 < maxLinks && startPage > 1) {
      startPage = Math.max(1, endPage - maxLinks + 1);
    }
    
    // Crea i link di paginazione
    for (let i = startPage; i <= endPage; i++) {
      this.paginationLinks.push({
        url: i === this.currentPage ? null : 'javascript:void(0)',
        label: i.toString(),
        active: i === this.currentPage
      });
    }
  }

  /**
   * Handle search input change
   */
  onSearchInputChange(): void {
    // Search functionality will be triggered by the debounced listener
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchQuery = '';
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.loadPersons(1);
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadPersons(1);
  }

  /**
   * Reset filters
   */
  resetFilters(): void {
    this.selectedKnownFor = '';
    this.searchTerm = '';
    this.searchQuery = '';
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.currentPage = 1;
    this.loadPersons(1);
  }

  /**
   * Get image URL for person
   */
  getPersonImageUrl(imagePath: string): string {
    // Verifica che imagePath sia una stringa valida
    if (!imagePath) {
      return 'assets/images/placeholder-person.jpg'; // Immagine placeholder
    }
    return this.apiService.getImageUrl(imagePath, 'cast');
  }
}
