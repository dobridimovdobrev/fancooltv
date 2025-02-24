import { Movie } from '../types/media.types.js';
import { MediaManager } from './MediaManager.js';
import { ApiService } from '../services/ApiService.js';
import { UIElements } from '../types/ui.types.js';
import { ApiResponse, PaginationParams } from '../types/api.types.js';
// MovieManager class
export class MovieManager extends MediaManager<Movie> {
    constructor(elements: UIElements, apiService: ApiService) {
        super(elements, apiService);
    }

    // search method
    public search(query: string): void {
        this.currentSearch = query;
        this.currentPage = 1;
        this.loadItems();
    }
    // fetch items method
    protected async fetchItems(params: PaginationParams): Promise<ApiResponse<Movie[]>> {
        const response = await this.apiService.getMovies(params);
        console.log('Movie response:', response);
        if (response.data && Array.isArray(response.data)) {
            console.log('First movie data:', response.data[0]);
        }
        return response;
    }

    // create item element method
    protected createItemElement(movie: Movie): HTMLElement {
        const template = this.elements.template.content.cloneNode(true) as DocumentFragment;
        const article = template.querySelector('.movie-card') as HTMLElement;
        
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
        
        if (title) title.textContent = movie.title;
        if (yearValue) yearValue.textContent = movie.year.toString();
        if (ratingValue) ratingValue.textContent = movie.imdb_rating.toString();
        if (durationValue) durationValue.textContent = `${movie.duration} min`;
        if (categoryValue) categoryValue.textContent = movie.category.name;
        
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
