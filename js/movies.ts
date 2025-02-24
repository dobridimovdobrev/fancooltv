import { MovieManager } from './classes/MovieManager.js';
import { ApiService } from './services/ApiService.js';
import { UIElements } from './types/ui.types.js';
import { requireAuth } from './utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Verify authentication before anything else
    requireAuth();
    
    const grid = document.getElementById('moviesGrid');
    const template = document.getElementById('movie-card-template') as HTMLTemplateElement;
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
    const genreFilter = document.getElementById('genreFilter') as HTMLSelectElement;
    const yearFilter = document.getElementById('yearFilter') as HTMLSelectElement;
    const loadMoreBtn = document.getElementById('loadMoreBtn') as HTMLButtonElement;

    if (!grid || !template) {
        console.error('Required elements not found');
        return;
    }

    const elements: UIElements = {
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

    // Add event listener to search button
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            if (searchInput) {
                movieManager.search(searchInput.value);
            }
        });
    }

    movieManager.initialize();
});
