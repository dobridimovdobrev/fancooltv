import { MediaManager } from './MediaManager.js';
export class TVSeriesManager extends MediaManager {
    constructor(elements, apiService) {
        super(elements, apiService);
    }
    search(query) {
        this.currentSearch = query;
        this.currentPage = 1;
        this.loadItems();
    }
    async fetchItems(params) {
        return this.apiService.getTVSeries(params);
    }
    createItemElement(series) {
        const template = this.elements.template.content.cloneNode(true);
        const article = template.querySelector('.movie-card');
        if (!article) {
            console.error('TV series card element not found in template');
            return document.createElement('div');
        }
        const img = article.querySelector('img');
        const title = article.querySelector('.card-title');
        const yearValue = article.querySelector('.year-value');
        const ratingValue = article.querySelector('.rating-value');
        const durationValue = article.querySelector('.duration-value');
        const categoryValue = article.querySelector('.category-value');
        const detailsLink = article.querySelector('.btn-details');
        if (img) {
            img.src = this.apiService.getImageUrl(series.poster);
            img.alt = `${series.title} Poster`;
            // Handle case when image fails to load
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
        if (durationValue)
            durationValue.textContent = `${series.total_seasons} Seasons`;
        if (categoryValue && series.category)
            categoryValue.textContent = series.category.name;
        if (detailsLink) {
            detailsLink.setAttribute('href', `tvseries-details.html?id=${series.tv_series_id}`);
            detailsLink.setAttribute('aria-label', `View details for ${series.title}`);
            detailsLink.setAttribute('title', `View details for ${series.title}`);
        }
        // Wrap article in div.col for grid
        const col = document.createElement('div');
        col.className = 'col-12 col-custom-2 col-custom-3 col-custom-4 col-custom-5';
        col.appendChild(article);
        return col;
    }
}
