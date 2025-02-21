import { TVSeriesManager } from './classes/TVSeriesManager.js';
import { ApiService } from './services/ApiService.js';
import { UIElements } from './types/ui.types.js';

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('tvSeriesGrid');
    const template = document.getElementById('tvseries-card-template') as HTMLTemplateElement;
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const genreFilter = document.getElementById('genreFilter') as HTMLSelectElement;
    const yearFilter = document.getElementById('yearFilter') as HTMLSelectElement;

    if (!grid || !template) {
        console.error('Required elements not found');
        return;
    }

    const elements: UIElements = {
        grid,
        template,
        searchInput,
        genreFilter,
        yearFilter
    };

    const apiService = new ApiService();
    const tvSeriesManager = new TVSeriesManager(elements, apiService);
});
