export class MediaManager {
    constructor(elements, apiService) {
        this.currentPage = 1;
        this.isLoading = false;
        this.elements = elements;
        this.apiService = apiService;
        this.initialize();
    }
    initialize() {
        if (!this.elements.grid || !this.elements.template) {
            console.error('Required elements not found:', !this.elements.grid ? 'grid' : 'template');
            this.showError('An error occurred while initializing the page');
            return;
        }
        this.loadItems();
    }
    async loadItems() {
        if (this.isLoading)
            return;
        try {
            this.isLoading = true;
            this.hideError();
            const params = {
                page: this.currentPage
            };
            const response = await this.fetchItems(params);
            if (response.data && Array.isArray(response.data)) {
                this.displayItems(response.data);
                this.updatePagination(response.meta);
            }
            else {
                throw new Error('Invalid response format');
            }
        }
        catch (error) {
            console.error('Error loading items:', error);
            this.showError('An error occurred while loading the content');
        }
        finally {
            this.isLoading = false;
        }
    }
    displayItems(items) {
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
            }
            catch (error) {
                console.error('Error creating item element:', error);
            }
        });
    }
    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.classList.remove('d-none');
        }
    }
    hideError() {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.classList.add('d-none');
        }
    }
    updatePagination(meta) {
        // TODO: Implementare la paginazione usando meta.links
        this.currentPage = meta.current_page;
    }
}
