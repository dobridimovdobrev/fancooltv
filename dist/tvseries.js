import { TVSeriesManager } from './classes/TVSeriesManager.js';
import { ApiService } from './services/ApiService.js';
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('tvSeriesGrid');
    const template = document.getElementById('tvseries-card-template');
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    if (!grid || !template) {
        console.error('Required elements not found');
        return;
    }
    const elements = {
        grid,
        template,
        searchInput,
        genreFilter,
        yearFilter
    };
    const apiService = new ApiService();
    const tvSeriesManager = new TVSeriesManager(elements, apiService);
});
