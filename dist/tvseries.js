import { TVSeriesManager } from './classes/TVSeriesManager.js';
import { ApiService } from './services/ApiService.js';
import { requireAuth } from './utils/auth.js';
document.addEventListener('DOMContentLoaded', () => {
    // Verify authentication before anything else
    requireAuth();
    const grid = document.getElementById('tvSeriesGrid');
    const template = document.getElementById('tvseries-card-template');
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
    const tvSeriesManager = new TVSeriesManager(elements, apiService);
    // Add event listener to search button
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            if (searchInput) {
                tvSeriesManager.search(searchInput.value);
            }
        });
    }
    tvSeriesManager.initialize();
});
