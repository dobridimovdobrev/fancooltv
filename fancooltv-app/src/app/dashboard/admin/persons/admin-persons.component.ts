import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
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
  noResults = false;

  // Search
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  searchQuery: string = '';

  constructor(
    public apiService: ApiService,
    private router: Router
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
    this.error = null;

    const params: Partial<PaginationParams> = {
      page: page,
      per_page: this.itemsPerPage // Usa il valore di itemsPerPage (20)
    };

    // Add search parameter if present
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      params.name = this.searchQuery.trim(); // Usa 'name' invece di 'q' come da documentazione API
      console.log('Searching for name:', this.searchQuery.trim());
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
   * Configura il listener per la ricerca con debounce
   */
  setupSearchListener(): void {
    if (this.searchInput && this.searchInput.nativeElement) {
      fromEvent(this.searchInput.nativeElement, 'input')
        .pipe(
          debounceTime(400),
          distinctUntilChanged()
        )
        .subscribe(() => {
          this.searchQuery = this.searchInput.nativeElement.value;
          this.currentPage = 1; // Torna alla prima pagina
          this.loadPersons();
        });
    }
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
   * Delete a person
   */
  deletePerson(personId: number): void {
    if (confirm('Are you sure you want to delete this person?')) {
      this.loading = true;
      this.apiService.deletePerson(personId.toString()).subscribe({
        next: () => {
          this.persons = this.persons.filter(p => p.person_id !== personId);
          this.filteredPersons = this.filteredPersons.filter(p => p.person_id !== personId);
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error deleting person:', error);
          alert('An error occurred while deleting the person.');
          this.loading = false;
        }
      });
    }
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
    
    // Aggiungi puntini di sospensione se necessario
    if (startPage > 1) {
      // Aggiungi link alla prima pagina
      this.paginationLinks.unshift({
        url: 'javascript:void(0)',
        label: '1',
        active: false
      });
      
      // Aggiungi puntini se c'è un gap
      if (startPage > 2) {
        this.paginationLinks.unshift({
          url: null,
          label: '...',
          active: false
        });
      }
    }
    
    if (endPage < this.totalPages) {
      // Aggiungi puntini se c'è un gap
      if (endPage < this.totalPages - 1) {
        this.paginationLinks.push({
          url: null,
          label: '...',
          active: false
        });
      }
      
      // Aggiungi link all'ultima pagina
      this.paginationLinks.push({
        url: 'javascript:void(0)',
        label: this.totalPages.toString(),
        active: false
      });
    }
    
    console.log('Generated pagination links:', this.paginationLinks);
  }

  /**
   * Get image URL for person
   */
  getPersonImageUrl(imagePath: string): string {
    // Verifica che imagePath sia una stringa valida
    if (!imagePath) {
      return 'assets/images/placeholder-person.jpg'; // Immagine placeholder
    }
    return this.apiService.getImageUrl(imagePath, 'person');
  }
}
