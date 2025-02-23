import { UIElements } from '../types/ui.types.js';
import { ApiService } from '../services/ApiService.js';
import { ApiResponse, PaginationParams } from '../types/api.types.js';

export abstract class MediaManager<T> {
    protected elements: UIElements;
    protected apiService: ApiService;
    protected currentPage: number = 1;
    protected isLoading: boolean = false;
    protected currentSearch: string = '';
    protected currentGenre: string = '';
    protected currentYear: string = '';

    constructor(elements: UIElements, apiService: ApiService) {
        this.elements = elements;
        this.apiService = apiService;
        this.initialize();
    }

    public initialize(): void {
        if (!this.elements.grid || !this.elements.template) {
            console.error('Required elements not found:', 
                !this.elements.grid ? 'grid' : 'template');
            this.showError('An error occurred while initializing the page');
            return;
        }

        this.setupLoadMoreButton();
        this.setupFilters();
        this.loadCategories();
        this.loadYears();
        this.loadItems();
    }

    private setupLoadMoreButton(): void {
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => {
                this.currentPage++;
                this.loadItems();
            });
        }
    }

    private setupFilters(): void {
        // Setup search input
        if (this.elements.searchInput) {
            let searchTimeout: number;
            this.elements.searchInput.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                clearTimeout(searchTimeout);
                searchTimeout = window.setTimeout(() => {
                    this.currentSearch = target.value;
                    this.currentPage = 1;
                    this.loadItems();
                }, 500);
            });

            // Aggiungi anche l'evento per il tasto Enter
            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.currentSearch = (e.target as HTMLInputElement).value;
                    this.currentPage = 1;
                    this.loadItems();
                }
            });
        }

        // Setup genre filter
        if (this.elements.genreFilter) {
            this.elements.genreFilter.addEventListener('change', (e) => {
                const select = e.target as HTMLSelectElement;
                this.currentGenre = select.value || '';
                console.log('Selected category:', this.currentGenre); // Debug
                this.currentPage = 1;
                this.loadItems();
            });
        }

        // Setup year filter
        if (this.elements.yearFilter) {
            this.elements.yearFilter.addEventListener('change', (e) => {
                const select = e.target as HTMLSelectElement;
                this.currentYear = select.value || '';
                console.log('Selected year:', this.currentYear); // Debug
                this.currentPage = 1;
                this.loadItems();
            });
        }
    }

    private async loadCategories(): Promise<void> {
        if (!this.elements.genreFilter) return;

        try {
            const response = await this.apiService.getCategories();
            if (response.data) {
                const categories = response.data;
                console.log('Categories loaded:', categories); // Per debug
                const options = categories.map(category => 
                    `<option value="${category.id}">${category.name}</option>`
                ).join('');
                this.elements.genreFilter.innerHTML = '<option value="">All Genres</option>' + options;
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    private loadYears(): void {
        if (!this.elements.yearFilter) return;

        const currentYear = new Date().getFullYear();
        const startYear = 1900;
        let options = '<option value="">All Years</option>';
        
        for (let year = currentYear; year >= startYear; year--) {
            options += `<option value="${year}">${year}</option>`;
        }
        
        this.elements.yearFilter.innerHTML = options;
    }

    protected async loadItems(): Promise<void> {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading();
            this.hideError();
            
            const params: PaginationParams = {
                page: this.currentPage
            };

            // Aggiungi i parametri di filtro solo se sono stati impostati
            if (this.currentSearch && this.currentSearch.trim() !== '') {
                params.q = this.currentSearch.trim();
            }
            
            // Aggiungi categoria solo se è stata selezionata
            if (this.currentGenre && this.currentGenre !== '' && this.currentGenre !== 'undefined') {
                params.category = this.currentGenre;
            }
            
            // Aggiungi anno solo se è stato selezionato
            if (this.currentYear && this.currentYear !== '' && this.currentYear !== 'undefined') {
                params.year = this.currentYear;
            }

            console.log('Loading items with params:', params); // Per debug

            const response = await this.fetchItems(params);
            
            if (response.data && Array.isArray(response.data)) {
                // Clear grid if it's a new search or filter
                if (this.currentPage === 1) {
                    this.elements.grid.innerHTML = '';
                }
                
                this.displayItems(response.data);
                this.updatePagination(response.meta);
                
                // Show "no results" message if needed
                if (response.data.length === 0 && this.currentPage === 1) {
                    this.showNoResults();
                } else {
                    this.hideNoResults();
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error loading items:', error);
            this.showError('An error occurred while loading the content');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    protected displayItems(items: T[]): void {
        if (!this.elements.grid) {
            console.error('Grid element not found');
            return;
        }

        items.forEach(item => {
            try {
                const element = this.createItemElement(item);
                if (element) {
                    this.elements.grid.appendChild(element);
                }
            } catch (error) {
                console.error('Error creating item element:', error);
            }
        });
    }

    protected showError(message: string): void {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.classList.remove('d-none');
        }
    }

    protected hideError(): void {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.classList.add('d-none');
        }
    }

    private showLoading(): void {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('d-none');
        }
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.disabled = true;
        }
    }

    private hideLoading(): void {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('d-none');
        }
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.disabled = false;
        }
    }

    protected updatePagination(meta: ApiResponse<any>['meta']): void {
        this.currentPage = meta.current_page;
        
        if (this.elements.loadMoreBtn) {
            if (meta.current_page < meta.last_page) {
                this.elements.loadMoreBtn.classList.remove('d-none');
            } else {
                this.elements.loadMoreBtn.classList.add('d-none');
            }
        }
    }

    protected showNoResults(): void {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'noResults';
        noResultsDiv.className = 'text-center mt-4';
        noResultsDiv.innerHTML = `
            <p class="text-muted">No results found</p>
            ${this.currentSearch || this.currentGenre || this.currentYear ? 
                '<p class="text-muted">Try adjusting your filters or search terms</p>' : ''}
        `;
        
        const existingNoResults = document.getElementById('noResults');
        if (existingNoResults) {
            existingNoResults.remove();
        }
        
        this.elements.grid?.appendChild(noResultsDiv);
    }

    protected hideNoResults(): void {
        const noResultsDiv = document.getElementById('noResults');
        if (noResultsDiv) {
            noResultsDiv.remove();
        }
    }

    protected abstract fetchItems(params: PaginationParams): Promise<ApiResponse<T[]>>;
    protected abstract createItemElement(item: T): HTMLElement;
}
