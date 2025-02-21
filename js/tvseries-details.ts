import { TVSeriesDetailsManager } from './classes/TVSeriesDetailsManager.js';
import { ApiService } from './services/ApiService.js';
import { MediaDetailsElements } from './types/ui.types.js';
import { TVSeries, Person } from './types/media.types.js';

// Declare Bootstrap globally since it's loaded from CDN
declare const bootstrap: any;

interface ExtendedMediaDetailsElements extends MediaDetailsElements {
    backdrop: HTMLElement;
    seasonTemplate: HTMLTemplateElement;
    episodeTemplate: HTMLTemplateElement;
    trailerModal: any;
    trailerIframe: HTMLIFrameElement;
    seasons: HTMLElement;
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Get series ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');
    
    if (!seriesId) {
        window.location.href = 'tvseries.html';
        return;
    }

    // Cache DOM elements
    const elements: ExtendedMediaDetailsElements = {
        backdrop: document.getElementById('backdrop') as HTMLElement,
        poster: document.getElementById('poster') as HTMLElement,
        title: document.getElementById('title') as HTMLElement,
        year: document.getElementById('year') as HTMLElement,
        rating: document.getElementById('rating') as HTMLElement,
        duration: document.getElementById('duration') as HTMLElement,
        category: document.getElementById('category') as HTMLElement,
        plot: document.getElementById('description') as HTMLElement,
        cast: document.getElementById('cast') as HTMLElement,
        director: document.getElementById('director') as HTMLElement,
        metadata: document.getElementById('metadata') as HTMLElement,
        description: document.getElementById('description') as HTMLElement,
        trailer: document.getElementById('trailer') as HTMLElement,
        seasons: document.getElementById('seasons') as HTMLElement,
        seasonTemplate: document.getElementById('season-template') as HTMLTemplateElement,
        episodeTemplate: document.getElementById('episode-template') as HTMLTemplateElement,
        trailerModal: new bootstrap.Modal(document.getElementById('trailerModal')),
        trailerIframe: document.querySelector('#trailerModal iframe') as HTMLIFrameElement
    };

    // Verifica che tutti gli elementi necessari siano presenti
    const missingElements = Object.entries(elements)
        .filter(([_, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements.join(', '));
        return;
    }

    try {
        const apiService = new ApiService();
        const response = await fetch(`https://api.dobridobrev.com/api/v1/tvseries/${seriesId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch series details');
        
        const series: TVSeries = await response.json();
        if (!series) throw new Error('Series not found');

        // Update UI
        updateSeriesDetails(series, elements);
        updateCast(series.persons, elements);
        if (series.seasons) {
            updateSeasons(series, series.seasons, series.trailers?.[0]?.url, elements);
        }

    } catch (error) {
        console.error('Error loading series details:', error);
        // Handle error (show error message to user)
    }
});

function updateSeriesDetails(series: TVSeries, elements: ExtendedMediaDetailsElements): void {
    // Set backdrop
    if (series.backdrop) {
        const backdropUrl = getImageUrl(series.backdrop);
        elements.backdrop.style.backgroundImage = `url(${backdropUrl})`;
        elements.backdrop.setAttribute('role', 'img');
        elements.backdrop.setAttribute('aria-label', `${series.title} Backdrop`);
        elements.backdrop.setAttribute('title', `${series.title} - Series Backdrop`);
    }

    // Set poster
    if (series.poster) {
        const posterUrl = getImageUrl(series.poster);
        elements.poster.style.backgroundImage = `url(${posterUrl})`;
        elements.poster.setAttribute('role', 'img');
        elements.poster.setAttribute('aria-label', `${series.title} Poster`);
        elements.poster.setAttribute('title', `${series.title} - ${series.year || 'N/A'} - Rating: ${series.imdb_rating || 'N/A'}`);
    }

    // Set title and metadata
    elements.title.textContent = series.title;
    elements.metadata.innerHTML = `
        ${series.year ? `<div class="meta-item"><i class="fas fa-calendar"></i> ${series.year}</div>` : ''}
        ${series.imdb_rating ? `<div class="meta-item"><i class="fas fa-star"></i> ${series.imdb_rating}</div>` : ''}
        ${series.total_seasons ? `<div class="meta-item"><i class="fas fa-tv"></i> ${series.total_seasons} Seasons</div>` : ''}
        ${series.category ? `<div class="meta-item"><i class="fas fa-film"></i> ${series.category.name}</div>` : ''}
    `;

    // Set description
    elements.description.textContent = series.description || '';

    // Set trailer if available
    if (series.trailers && series.trailers.length > 0) {
        elements.trailer.innerHTML = `
            <button class="btn btn-primary" onclick="playTrailer('${series.trailers[0].url}')">
                <i class="fas fa-play me-2"></i>Watch Trailer
            </button>
        `;
    }
}

function updateCast(persons: Person[] | undefined, elements: ExtendedMediaDetailsElements): void {
    if (!persons || persons.length === 0) return;

    elements.cast.innerHTML = `
        <h3 class="mb-3">Cast</h3>
        <div class="cast-section">
            <div class="cast-list">
                ${persons.map(person => `
                    <div class="cast-item">
                        <div class="cast-image">
                            <img src="${getImageUrl(person.profile_image)}" alt="${person.name} Profile" title="${person.name} - Cast Member" onerror="this.src='images/no-profile.png'">
                        </div>
                        <p class="cast-name">${person.name}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function updateSeasons(series: TVSeries, seasons: any[], trailerUrl: string | undefined, elements: ExtendedMediaDetailsElements): void {
    if (!seasons || seasons.length === 0) return;

    elements.seasons.innerHTML = '';

    seasons.forEach((season, index) => {
        const seasonElement = elements.seasonTemplate.content.cloneNode(true) as DocumentFragment;
        const seasonSection = seasonElement.querySelector('.season-section') as HTMLElement;
        const seasonHeader = seasonElement.querySelector('.season-header') as HTMLElement;
        const seasonTitle = seasonElement.querySelector('.season-title') as HTMLElement;
        const seasonName = seasonElement.querySelector('.season-name') as HTMLElement;
        const episodesCount = seasonElement.querySelector('.episodes-count') as HTMLElement;
        const seasonYear = seasonElement.querySelector('.season-year') as HTMLElement;
        const episodesList = seasonElement.querySelector('.episodes-list') as HTMLElement;

        // Set season attributes
        seasonSection.id = `season${index + 1}`;
        seasonHeader.dataset.bsTarget = `#season${index + 1}Episodes`;
        seasonName.textContent = `Season ${index + 1}`;
        episodesCount.textContent = `${season.episodes.length} Episodes`;
        seasonYear.textContent = season.year || '';

        // Create episodes list
        if (season.episodes && season.episodes.length > 0) {
            const episodesContainer = document.createElement('div');
            episodesContainer.id = `season${index + 1}Episodes`;
            episodesContainer.className = 'collapse episode-list';

            season.episodes.forEach((episode: any) => {
                const episodeElement = elements.episodeTemplate.content.cloneNode(true) as DocumentFragment;
                const episodeTitle = episodeElement.querySelector('.episode-title') as HTMLElement;
                const episodeNumber = episodeElement.querySelector('.episode-number') as HTMLElement;
                const episodeDescription = episodeElement.querySelector('.episode-description') as HTMLElement;
                const watchButton = episodeElement.querySelector('.watch-button') as HTMLButtonElement;

                episodeTitle.textContent = episode.title;
                episodeNumber.textContent = `Episode ${episode.episode_number}`;
                episodeDescription.textContent = episode.description || '';

                if (trailerUrl) {
                    watchButton.onclick = () => playEpisode(trailerUrl, episode.title);
                } else {
                    watchButton.style.display = 'none';
                }

                episodesContainer.appendChild(episodeElement);
            });

            episodesList.appendChild(episodesContainer);
        }

        elements.seasons.appendChild(seasonElement);
    });
}

function playEpisode(trailerUrl: string, episodeTitle: string): void {
    const modal = document.getElementById('trailerModal') as HTMLElement;
    const iframe = modal.querySelector('iframe') as HTMLIFrameElement;
    const title = modal.querySelector('.modal-title') as HTMLElement;

    title.textContent = episodeTitle;
    iframe.src = trailerUrl;

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener('hidden.bs.modal', () => {
        iframe.src = '';
    });
}

function getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return 'images/no-profile.png';
    return imageUrl.startsWith('http') ? imageUrl : `images/${imageUrl}`;
}

// Global function for playing trailer
(window as any).playTrailer = function(trailerUrl: string): void {
    const modal = document.getElementById('trailerModal') as HTMLElement;
    const iframe = modal.querySelector('iframe') as HTMLIFrameElement;
    iframe.src = trailerUrl;

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener('hidden.bs.modal', () => {
        iframe.src = '';
    });
};
