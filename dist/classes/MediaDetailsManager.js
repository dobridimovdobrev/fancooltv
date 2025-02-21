export class MediaDetailsManager {
    constructor(elements, apiService) {
        this.mediaId = '';
        this.elements = elements;
        this.apiService = apiService;
        this.initialize();
    }
    initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        this.mediaId = urlParams.get('id') || '';
        if (!this.mediaId) {
            this.showError('No media ID provided');
            return;
        }
        if (!this.apiService.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        this.loadDetails();
    }
    async loadDetails() {
        try {
            const details = await this.fetchDetails(this.mediaId);
            this.displayDetails(details);
        }
        catch (error) {
            console.error('Error loading details:', error);
            this.showError('Failed to load media details');
        }
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
}
