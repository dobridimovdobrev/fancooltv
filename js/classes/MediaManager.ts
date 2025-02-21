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

        this.loadItems();
    }

    protected async loadItems(): Promise<void> {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
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

    protected updatePagination(meta: ApiResponse<any>['meta']): void {
        // TODO: Implementare la paginazione usando meta.links
        this.currentPage = meta.current_page;
    }

    protected abstract fetchItems(params: PaginationParams): Promise<ApiResponse<T[]>>;
    protected abstract createItemElement(item: T): HTMLElement;
}
