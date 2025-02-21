import { TVSeriesDetailsManager } from './classes/TVSeriesDetailsManager.js';
import { ApiService } from './services/ApiService.js';
document.addEventListener('DOMContentLoaded', async () => {
    var _a, _b;
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    // Get series ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');
    if (!seriesId) {
        window.location.href = 'tvseries.html';
        return;
    }
    // Cache DOM elements
    const elements = {
        backdrop: document.getElementById('backdrop'),
        poster: document.getElementById('poster'),
        title: document.getElementById('title'),
        year: document.getElementById('year'),
        rating: document.getElementById('rating'),
        duration: document.getElementById('duration'),
        category: document.getElementById('category'),
        plot: document.getElementById('description'),
        cast: document.getElementById('cast'),
        director: document.getElementById('director'),
        metadata: document.getElementById('metadata'),
        description: document.getElementById('description'),
        trailer: document.getElementById('trailer'),
        seasons: document.getElementById('seasons'),
        seasonTemplate: document.getElementById('season-template'),
        episodeTemplate: document.getElementById('episode-template'),
        trailerModal: new bootstrap.Modal(document.getElementById('trailerModal')),
        trailerIframe: document.querySelector('#trailerModal iframe'),
        seasonsContainer: document.querySelector('.seasons-container'),
        loadMoreButton: document.querySelector('.load-more-button')
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
            seriesDetailsManager.updateSeasons(series, series.seasons, (_b = (_a = series.trailers) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url);
        }
    }
    catch (error) {
        console.error('Error loading series details:', error);
        // TODO: Show error message to user
    }
});
function playEpisode(trailerUrl, episodeTitle) {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    const title = modal.querySelector('.modal-title');
    title.textContent = episodeTitle;
    iframe.src = trailerUrl;
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    modal.addEventListener('hidden.bs.modal', () => {
        iframe.src = '';
    });
}
function getImageUrl(imageUrl) {
    if (!imageUrl)
        return 'images/no-profile.png';
    return imageUrl.startsWith('http') ? imageUrl : `images/${imageUrl}`;
}
// Global function for playing trailer
window.playTrailer = function (trailerUrl) {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    iframe.src = trailerUrl;
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    modal.addEventListener('hidden.bs.modal', () => {
        iframe.src = '';
    });
};
