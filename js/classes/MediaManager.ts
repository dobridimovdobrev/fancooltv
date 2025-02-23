import { UIElements } from '../types/ui.types.js';
import { ApiService } from '../services/ApiService.js';
import { ApiResponse, PaginationParams } from '../types/api.types.js';

export abstract class MediaManager<T> {
    protected elements: UIElements;
    protected apiService: ApiService;
    protected currentPage: number = 1;
    protected isLoading: boolean = false;

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

    protected async loadItems(): Promise<void> {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading();
            this.hideError();
            
            const params: PaginationParams = {
                page: this.currentPage
            };

            const response = await this.fetchItems(params);
            
            if (response.data && Array.isArray(response.data)) {
                this.displayItems(response.data);
                this.updatePagination(response.meta);
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

        // Rimuovi il contenuto esistente solo se è la prima pagina
        if (this.currentPage === 1) {
            this.elements.grid.innerHTML = '';
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

    protected abstract fetchItems(params: PaginationParams): Promise<ApiResponse<T[]>>;
    protected abstract createItemElement(item: T): HTMLElement;
}
