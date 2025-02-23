import { MovieDetailsManager } from './classes/MovieDetailsManager.js';
import { ApiService } from './services/ApiService.js';
import { MediaDetailsElements } from './types/ui.types.js';
import { requireAuth } from './utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Verifica autenticazione prima di tutto
    requireAuth();
    
    const elements: MediaDetailsElements = {
        poster: document.getElementById('poster') as HTMLElement,
        title: document.getElementById('title') as HTMLElement,
        year: document.getElementById('year') as HTMLElement,
        rating: document.getElementById('rating') as HTMLElement,
        duration: document.getElementById('duration') as HTMLElement,
        category: document.getElementById('category') as HTMLElement,
        plot: document.getElementById('plot') as HTMLElement,
        cast: document.getElementById('cast') as HTMLElement,
        director: document.getElementById('director') as HTMLElement,
        metadata: document.getElementById('metadata') as HTMLElement,
        description: document.getElementById('plot') as HTMLElement,
        trailer: document.getElementById('trailer') as HTMLElement
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
    const movieDetailsManager = new MovieDetailsManager(elements, apiService);
});
