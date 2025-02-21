import { ApiService } from '../services/ApiService.js';
import { MediaDetailsElements } from '../types/ui.types.js';
import { BaseMedia } from '../types/media.types.js';

export abstract class MediaDetailsManager<T extends BaseMedia> {
    protected elements: MediaDetailsElements;
    protected apiService: ApiService;
    protected mediaId: string = '';

    constructor(elements: MediaDetailsElements, apiService: ApiService) {
        this.elements = elements;
        this.apiService = apiService;
        this.initialize();
    }

    protected initialize(): void {
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

    protected async loadDetails(): Promise<void> {
        try {
            const details = await this.fetchDetails(this.mediaId);
            this.displayDetails(details);
        } catch (error) {
            console.error('Error loading details:', error);
            this.showError('Failed to load media details');
        }
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

    protected abstract fetchDetails(id: string): Promise<T>;
    protected abstract displayDetails(details: T): void;
}
