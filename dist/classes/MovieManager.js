import { MediaManager } from './MediaManager.js';
export class MovieManager extends MediaManager {
    constructor(elements, apiService) {
        super(elements, apiService);
    }
    async fetchItems(params) {
        const response = await this.apiService.getMovies(params);
        console.log('Movie response:', response);
        if (response.data && Array.isArray(response.data)) {
            console.log('First movie data:', response.data[0]);
        }
        return response;
    }
    createItemElement(movie) {
        const template = this.elements.template.content.cloneNode(true);
        const article = template.querySelector('.movie-card');
        if (!article) {
            console.error('Movie card element not found in template');
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
            img.src = this.apiService.getImageUrl(movie.poster);
            img.alt = `${movie.title} Poster`;
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
            title.textContent = movie.title;
        if (yearValue)
            yearValue.textContent = movie.year.toString();
        if (ratingValue)
            ratingValue.textContent = movie.imdb_rating.toString();
        if (durationValue)
            durationValue.textContent = `${movie.duration} min`;
        if (categoryValue)
            categoryValue.textContent = movie.category.name;
        if (detailsLink) {
            detailsLink.setAttribute('href', `movie-details.html?id=${movie.movie_id}`);
            detailsLink.setAttribute('aria-label', `View details for ${movie.title}`);
            detailsLink.setAttribute('title', `View details for ${movie.title}`);
        }
        // Wrap article in div.col for grid
        const col = document.createElement('div');
        col.className = 'col-12 col-custom-2 col-custom-3 col-custom-4 col-custom-5';
        col.appendChild(article);
        return col;
    }
}
