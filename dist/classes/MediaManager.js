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
        this.setupLoadMoreButton();
        this.loadItems();
    }
    setupLoadMoreButton() {
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => {
                this.currentPage++;
                this.loadItems();
            });
        }
    }
    async loadItems() {
        if (this.isLoading)
            return;
        try {
            this.isLoading = true;
            this.showLoading();
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
            this.hideLoading();
        }
    }
    displayItems(items) {
        if (!this.elements.grid) {
            console.error('Grid element not found');
            return;
        }
        // Remove existing content only if it's the first page
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
    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('d-none');
        }
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.disabled = true;
        }
    }
    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('d-none');
        }
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.disabled = false;
        }
    }
    updatePagination(meta) {
        this.currentPage = meta.current_page;
        if (this.elements.loadMoreBtn) {
            if (meta.current_page < meta.last_page) {
                this.elements.loadMoreBtn.classList.remove('d-none');
            }
            else {
                this.elements.loadMoreBtn.classList.add('d-none');
            }
        }
    }
}
