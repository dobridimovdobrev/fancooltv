import { TVSeries } from '../types/media.types.js';
import { MediaManager } from './MediaManager.js';
import { ApiService } from '../services/ApiService.js';
import { UIElements } from '../types/ui.types.js';
import { ApiResponse, PaginationParams } from '../types/api.types.js';

export class TVSeriesManager extends MediaManager<TVSeries> {
    constructor(elements: UIElements, apiService: ApiService) {
        super(elements, apiService);
    }

    protected async fetchItems(params: PaginationParams): Promise<ApiResponse<TVSeries[]>> {
        const response = await this.apiService.getTVSeries(params);
        console.log('TV Series response:', response);
        if (response.data && Array.isArray(response.data)) {
            console.log('First TV series data:', response.data[0]);
        }
        return response;
    }

    protected createItemElement(series: TVSeries): HTMLElement {
        const template = this.elements.template.content.cloneNode(true) as DocumentFragment;
        const article = template.querySelector('.movie-card') as HTMLElement;
        
        if (!article) {
            console.error('TV Series card element not found in template');
            return document.createElement('div');
        }
        
        const img = article.querySelector('img');
        const title = article.querySelector('.card-title');
        const yearValue = article.querySelector('.year-value');
        const ratingValue = article.querySelector('.rating-value');
        const seasonsValue = article.querySelector('.duration-value');
        const categoryValue = article.querySelector('.category-value');
        const detailsLink = article.querySelector('.btn-details');

        if (img) {
            img.src = this.apiService.getImageUrl(series.poster);
            img.alt = `${series.title} Poster`;
            
            // Gestire il caso in cui l'immagine non si carica
            img.onerror = () => {
                const noImagePlaceholder = article.querySelector('.no-image-placeholder');
                if (noImagePlaceholder) {
                    noImagePlaceholder.classList.remove('d-none');
                    img.classList.add('d-none');
                }
            };
        }
        
        if (title) title.textContent = series.title;
        if (yearValue) yearValue.textContent = series.year.toString();
        if (ratingValue) ratingValue.textContent = series.imdb_rating.toString();
        if (seasonsValue) seasonsValue.textContent = `${series.numberOfSeasons} seasons`;
        if (categoryValue) categoryValue.textContent = series.category.name;
        
        if (detailsLink) {
            detailsLink.setAttribute('href', `tvseries-details.html?id=${series.id}`);
            detailsLink.setAttribute('aria-label', `View details for ${series.title}`);
            detailsLink.setAttribute('title', `View details for ${series.title}`);
        }

        // Avvolgere l'article in un div.col per la griglia
        const col = document.createElement('div');
        col.className = 'col-12 col-custom-2 col-custom-3 col-custom-4 col-custom-5';
        col.appendChild(article);

        return col;
    }
}
