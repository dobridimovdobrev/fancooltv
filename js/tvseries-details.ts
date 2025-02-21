import { TVSeriesDetailsManager } from './classes/TVSeriesDetailsManager.js';
import { ApiService } from './services/ApiService.js';
import { MediaDetailsElements } from './types/ui.types.js';

document.addEventListener('DOMContentLoaded', () => {
    const elements: MediaDetailsElements = {
        poster: document.getElementById('seriesPoster') as HTMLImageElement,
        title: document.getElementById('seriesTitle') as HTMLElement,
        year: document.getElementById('seriesYear') as HTMLElement,
        rating: document.getElementById('seriesRating') as HTMLElement,
        duration: document.getElementById('seriesDuration') as HTMLElement,
        category: document.getElementById('seriesCategory') as HTMLElement,
        plot: document.getElementById('seriesPlot') as HTMLElement,
        cast: document.getElementById('seriesCast') as HTMLElement,
        director: document.getElementById('seriesDirector') as HTMLElement,
        metadata: document.getElementById('seriesMetadata') as HTMLElement,
        description: document.getElementById('seriesDescription') as HTMLElement,
        trailer: document.getElementById('seriesTrailer') as HTMLElement
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
