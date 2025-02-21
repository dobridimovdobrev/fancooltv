import { MediaDetailsManager } from './MediaDetailsManager.js';
export class MovieDetailsManager extends MediaDetailsManager {
    constructor(elements, apiService) {
        super(elements, apiService);
    }
    async fetchDetails(id) {
        const response = await this.apiService.getMovieDetails(parseInt(id, 10));
        if (response.data) {
            return response.data;
        }
        throw new Error('Failed to fetch movie details');
    }
    displayDetails(movie) {
        // Set backdrop
        const backdrop = document.getElementById('backdrop');
        if (backdrop && movie.backdrop) {
            backdrop.style.backgroundImage = `url('${this.apiService.getImageUrl(movie.backdrop)}')`;
            backdrop.setAttribute('role', 'img');
            backdrop.setAttribute('aria-label', `${movie.title} Backdrop`);
            backdrop.setAttribute('title', `${movie.title} - Movie Backdrop`);
        }
        // Set poster
        if (this.elements.poster && movie.poster) {
            this.elements.poster.style.backgroundImage = `url('${this.apiService.getImageUrl(movie.poster)}')`;
            this.elements.poster.setAttribute('role', 'img');
            this.elements.poster.setAttribute('aria-label', `${movie.title} Poster`);
            this.elements.poster.setAttribute('title', `${movie.title} - ${movie.year} - Rating: ${movie.imdb_rating}`);
        }
        // Set title
        if (this.elements.title) {
            this.elements.title.textContent = movie.title;
        }
        // Set metadata
        if (this.elements.metadata) {
            this.elements.metadata.innerHTML = `
                <div class="meta-item"><i class="fas fa-calendar"></i> ${movie.year}</div>
                <div class="meta-item"><i class="fas fa-star"></i> ${movie.imdb_rating}</div>
                <div class="meta-item"><i class="fas fa-clock"></i> ${movie.duration} min</div>
                <div class="meta-item"><i class="fas fa-film"></i> ${movie.category.name}</div>
            `;
        }
        // Set description
        if (this.elements.description) {
            this.elements.description.textContent = movie.description;
        }
        // Set cast
        if (this.elements.cast && movie.persons) {
            const castHtml = movie.persons.map(person => `
                <div class="cast-member">
                    <img src="${this.apiService.getImageUrl(person.profile_image)}" alt="${person.name}" class="cast-photo">
                    <div class="cast-name">${person.name}</div>
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
        if (this.elements.trailer && movie.trailers && movie.trailers.length > 0) {
            this.elements.trailer.innerHTML = `
                <h3>Trailer</h3>
                <div class="ratio ratio-16x9">
                    <iframe src="${movie.trailers[0].url.replace('watch?v=', 'embed/')}" 
                            title="${movie.trailers[0].title}" 
                            allowfullscreen>
                    </iframe>
                </div>
            `;
        }
    }
}
