import { TVSeriesDetailsManager } from './classes/TVSeriesDetailsManager.js';
import { ApiService } from './services/ApiService.js';
import { ExtendedMediaDetailsElements } from './types/ui.types.js';
import { requireAuth } from './utils/auth.js';

// Declare Bootstrap globally since it's loaded from CDN
declare const bootstrap: any;

document.addEventListener('DOMContentLoaded', async () => {
    // Verifica autenticazione prima di tutto
    requireAuth();
    
    // Get series ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');
    
    if (!seriesId) {
        window.location.href = 'tvseries.html';
        return;
    }

    // Cache DOM elements
    const elements: ExtendedMediaDetailsElements = {
        backdrop: document.getElementById('backdrop') as HTMLElement,
        poster: document.getElementById('poster') as HTMLElement,
        title: document.getElementById('title') as HTMLElement,
        year: document.getElementById('year') as HTMLElement,
        rating: document.getElementById('rating') as HTMLElement,
        duration: document.getElementById('duration') as HTMLElement,
        category: document.getElementById('category') as HTMLElement,
        plot: document.getElementById('description') as HTMLElement,
        cast: document.getElementById('cast') as HTMLElement,
        director: document.getElementById('director') as HTMLElement,
        metadata: document.getElementById('metadata') as HTMLElement,
        description: document.getElementById('description') as HTMLElement,
        trailer: document.getElementById('trailer') as HTMLElement,
        seasons: document.getElementById('seasons') as HTMLElement,
        seasonTemplate: document.getElementById('season-template') as HTMLTemplateElement,
        episodeTemplate: document.getElementById('episode-template') as HTMLTemplateElement,
        trailerModal: new bootstrap.Modal(document.getElementById('trailerModal')),
        trailerIframe: document.querySelector('#trailerModal iframe') as HTMLIFrameElement,
        seasonsContainer: document.querySelector('.seasons-container') as HTMLElement,
        loadMoreButton: document.querySelector('.load-more-button') as HTMLButtonElement
    };

    // Validate required elements
    const missingElements = Object.entries(elements)
        .filter(([_, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements.join(', '));
        return;
    }

    // Initialize managers
    const apiService = new ApiService();
    const seriesDetailsManager = new TVSeriesDetailsManager(elements, apiService);

    // Load series details
    try {
        const series = await seriesDetailsManager.fetchSeriesDetails(seriesId);
        
        // Update UI
        seriesDetailsManager.updateSeriesDetails(series);
        seriesDetailsManager.updateCast(series.persons);
        if (series.seasons) {
            seriesDetailsManager.updateSeasons(series, series.seasons, series.trailers?.[0]?.url);
        }
    } catch (error) {
        console.error('Error loading series details:', error);
        // TODO: Show error message to user
    }
});

function playEpisode(trailerUrl: string, episodeTitle: string): void {
    const modal = document.getElementById('trailerModal') as HTMLElement;
    const iframe = modal.querySelector('iframe') as HTMLIFrameElement;
    const title = modal.querySelector('.modal-title') as HTMLElement;

    title.textContent = episodeTitle;
    iframe.src = trailerUrl;

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener('hidden.bs.modal', () => {
        iframe.src = '';
    });
}

function getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return 'images/no-profile.png';
    return imageUrl.startsWith('http') ? imageUrl : `images/${imageUrl}`;
}

// Global function for playing trailer
(window as any).playTrailer = function(trailerUrl: string): void {
    const modal = document.getElementById('trailerModal') as HTMLElement;
    const iframe = modal.querySelector('iframe') as HTMLIFrameElement;
    iframe.src = trailerUrl;

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener('hidden.bs.modal', () => {
        iframe.src = '';
    });
};
