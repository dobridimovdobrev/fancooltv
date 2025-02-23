import { MovieManager } from './classes/MovieManager.js';
import { ApiService } from './services/ApiService.js';
import { requireAuth } from './utils/auth.js';
document.addEventListener('DOMContentLoaded', () => {
    // Verifica autenticazione prima di tutto
    requireAuth();
    const grid = document.getElementById('moviesGrid');
    const template = document.getElementById('movie-card-template');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!grid || !template) {
        console.error('Required elements not found');
        return;
    }
    const elements = {
        grid,
        template,
        searchInput,
        searchButton,
        genreFilter,
        yearFilter,
        loadMoreBtn
    };
    const apiService = new ApiService();
    const movieManager = new MovieManager(elements, apiService);
    // Aggiungi l'event listener per il pulsante di ricerca
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            if (searchInput) {
                movieManager.search(searchInput.value);
            }
        });
    }
    movieManager.initialize();
});
