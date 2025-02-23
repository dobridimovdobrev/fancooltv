import { TVSeriesManager } from './classes/TVSeriesManager.js';
import { ApiService } from './services/ApiService.js';
import { requireAuth } from './utils/auth.js';
document.addEventListener('DOMContentLoaded', () => {
    // Verifica autenticazione prima di tutto
    requireAuth();
    const grid = document.getElementById('tvSeriesGrid');
    const template = document.getElementById('tvseries-card-template');
    const searchInput = document.getElementById('searchInput');
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
        genreFilter,
        yearFilter,
        loadMoreBtn
    };
    const apiService = new ApiService();
    const tvSeriesManager = new TVSeriesManager(elements, apiService);
    tvSeriesManager.initialize();
});
