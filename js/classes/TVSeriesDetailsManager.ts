import { TVSeries } from '../types/media.types.js';
import { MediaDetailsManager } from './MediaDetailsManager.js';
import { ApiService } from '../services/ApiService.js';
import { MediaDetailsElements } from '../types/ui.types.js';

export class TVSeriesDetailsManager extends MediaDetailsManager<TVSeries> {
    constructor(elements: MediaDetailsElements, apiService: ApiService) {
        super(elements, apiService);
    }

    protected async fetchDetails(id: string): Promise<TVSeries> {
        const response = await this.apiService.getTVSeriesDetails(parseInt(id, 10));
        if (response.data) {
            return response.data;
        }
        throw new Error('Failed to fetch TV series details');
    }

    protected displayDetails(series: TVSeries): void {
        // Set backdrop
        const backdrop = document.getElementById('backdrop');
        if (backdrop && series.backdrop) {
            backdrop.style.backgroundImage = `url('${this.apiService.getImageUrl(series.backdrop)}')`;
            backdrop.setAttribute('role', 'img');
            backdrop.setAttribute('aria-label', `${series.title} Backdrop`);
            backdrop.setAttribute('title', `${series.title} - Series Backdrop`);
        }

        // Set poster
        if (this.elements.poster && series.poster) {
            this.elements.poster.style.backgroundImage = `url('${this.apiService.getImageUrl(series.poster)}')`;
            this.elements.poster.setAttribute('role', 'img');
            this.elements.poster.setAttribute('aria-label', `${series.title} Poster`);
            this.elements.poster.setAttribute('title', `${series.title} - ${series.year} - Rating: ${series.imdb_rating}`);
        }

        // Set title
        if (this.elements.title) {
            this.elements.title.textContent = series.title;
        }

        // Set metadata
        if (this.elements.metadata) {
            this.elements.metadata.innerHTML = `
                <div class="meta-item"><i class="fas fa-calendar"></i> ${series.year}</div>
                <div class="meta-item"><i class="fas fa-star"></i> ${series.imdb_rating}</div>
                <div class="meta-item"><i class="fas fa-tv"></i> ${series.numberOfSeasons} Seasons</div>
                <div class="meta-item"><i class="fas fa-film"></i> ${series.category.name}</div>
            `;
        }

        // Set description
        if (this.elements.description) {
            this.elements.description.textContent = series.overview;
        }

        // Set cast
        if (this.elements.cast && series.genres) {
            const castHtml = series.genres.map(genre => `
                <div class="cast-member">
                    <div class="cast-name">${genre}</div>
                </div>
            `).join('');

            this.elements.cast.innerHTML = `
                <h3>Cast</h3>
                <div class="cast-grid">
                    ${castHtml}
                </div>
            `;
        }

        // Set trailer
        if (this.elements.trailer) {
            this.elements.trailer.innerHTML = `
                <h3>Trailer</h3>
                <div class="ratio ratio-16x9">
                    <!-- Trailer will be added here -->
                </div>
            `;
        }
    }
}
