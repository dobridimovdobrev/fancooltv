import { TVSeriesManager } from './classes/TVSeriesManager.js';
import { ApiService } from './services/ApiService.js';
import { UIElements } from './types/ui.types.js';
import { requireAuth } from './utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Verifica autenticazione prima di tutto
    requireAuth();
    
    const grid = document.getElementById('tvSeriesGrid');
    const template = document.getElementById('tvseries-card-template') as HTMLTemplateElement;
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
    const tvSeriesManager = new TVSeriesManager(elements, apiService);

    // Aggiungi l'event listener per il pulsante di ricerca
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            if (searchInput) {
                tvSeriesManager.search(searchInput.value);
            }
        });
    }

    tvSeriesManager.initialize();
});
