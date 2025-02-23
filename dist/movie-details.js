import { MovieDetailsManager } from './classes/MovieDetailsManager.js';
import { ApiService } from './services/ApiService.js';
import { requireAuth } from './utils/auth.js';
document.addEventListener('DOMContentLoaded', () => {
    // Verifica autenticazione prima di tutto
    requireAuth();
    const elements = {
        poster: document.getElementById('poster'),
        title: document.getElementById('title'),
        year: document.getElementById('year'),
        rating: document.getElementById('rating'),
        duration: document.getElementById('duration'),
        category: document.getElementById('category'),
        plot: document.getElementById('plot'),
        cast: document.getElementById('cast'),
        director: document.getElementById('director'),
        metadata: document.getElementById('metadata'),
        description: document.getElementById('plot'),
        trailer: document.getElementById('trailer')
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
