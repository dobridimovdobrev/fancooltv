import { TVSeriesDetailsManager } from './classes/TVSeriesDetailsManager.js';
import { ApiService } from './services/ApiService.js';
document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        poster: document.getElementById('seriesPoster'),
        title: document.getElementById('seriesTitle'),
        year: document.getElementById('seriesYear'),
        rating: document.getElementById('seriesRating'),
        duration: document.getElementById('seriesDuration'),
        category: document.getElementById('seriesCategory'),
        plot: document.getElementById('seriesPlot'),
        cast: document.getElementById('seriesCast'),
        director: document.getElementById('seriesDirector'),
        metadata: document.getElementById('seriesMetadata'),
        description: document.getElementById('seriesDescription'),
        trailer: document.getElementById('seriesTrailer')
    };
    // Verifica che tutti gli elementi necessari siano presenti
    const missingElements = Object.entries(elements)
        .filter(([_, element]) => !element)
        .map(([key]) => key);
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements.join(', '));
        return;
    }
    const apiService = new ApiService();
    const tvSeriesDetailsManager = new TVSeriesDetailsManager(elements, apiService);
});
