import { MediaManager } from './MediaManager.js';
export class TVSeriesManager extends MediaManager {
    constructor(elements, apiService) {
        super(elements, apiService);
    }
    async fetchItems(params) {
        const response = await this.apiService.getTVSeries(params);
        console.log('TV Series response:', response);
        if (response.data && Array.isArray(response.data)) {
            console.log('First TV series data:', response.data[0]);
        }
        return response;
    }
    createItemElement(series) {
        const template = this.elements.template.content.cloneNode(true);
        const article = template.querySelector('.movie-card');
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
        if (title)
            title.textContent = series.title;
        if (yearValue)
            yearValue.textContent = series.year.toString();
        if (ratingValue)
            ratingValue.textContent = series.imdb_rating.toString();
        if (seasonsValue)
            seasonsValue.textContent = `${series.total_seasons} seasons`;
        if (categoryValue)
            categoryValue.textContent = series.category.name;
        if (detailsLink) {
            if (series.tv_series_id) {
                detailsLink.setAttribute('href', `tvseries-details.html?id=${series.tv_series_id}`);
                detailsLink.setAttribute('aria-label', `View details for ${series.title}`);
                detailsLink.setAttribute('title', `View details for ${series.title}`);
            }
            else {
                console.error('Series ID is undefined:', series);
                detailsLink.style.display = 'none';
            }
        }
        // Avvolgere l'article in un div.col per la griglia
        const col = document.createElement('div');
        col.className = 'col-12 col-custom-2 col-custom-3 col-custom-4 col-custom-5';
        col.appendChild(article);
        return col;
    }
}
