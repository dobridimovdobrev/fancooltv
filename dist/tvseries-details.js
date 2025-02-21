import { ApiService } from './services/ApiService.js';
document.addEventListener('DOMContentLoaded', async () => {
    var _a, _b;
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
    const elements = {
        backdrop: document.getElementById('backdrop'),
        poster: document.getElementById('poster'),
        title: document.getElementById('title'),
        year: document.getElementById('year'),
        rating: document.getElementById('rating'),
        duration: document.getElementById('duration'),
        category: document.getElementById('category'),
        plot: document.getElementById('description'),
        cast: document.getElementById('cast'),
        director: document.getElementById('director'),
        metadata: document.getElementById('metadata'),
        description: document.getElementById('description'),
        trailer: document.getElementById('trailer'),
        seasons: document.getElementById('seasons'),
        seasonTemplate: document.getElementById('season-template'),
        episodeTemplate: document.getElementById('episode-template'),
        trailerModal: new bootstrap.Modal(document.getElementById('trailerModal')),
        trailerIframe: document.querySelector('#trailerModal iframe')
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
        if (!response.ok)
            throw new Error('Failed to fetch series details');
        const series = await response.json();
        if (!series)
            throw new Error('Series not found');
        // Update UI
        updateSeriesDetails(series, elements);
        updateCast(series.persons, elements);
        if (series.seasons) {
            updateSeasons(series, series.seasons, (_b = (_a = series.trailers) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url, elements);
        }
    }
    catch (error) {
        console.error('Error loading series details:', error);
        // Handle error (show error message to user)
    }
});
function updateSeriesDetails(series, elements) {
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
function updateCast(persons, elements) {
    if (!persons || persons.length === 0)
        return;
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
function updateSeasons(series, seasons, trailerUrl, elements) {
    if (!seasons || seasons.length === 0)
        return;
    elements.seasons.innerHTML = '';
    seasons.forEach((season, index) => {
        const seasonElement = elements.seasonTemplate.content.cloneNode(true);
        const seasonSection = seasonElement.querySelector('.season-section');
        const seasonHeader = seasonElement.querySelector('.season-header');
        const seasonTitle = seasonElement.querySelector('.season-title');
        const seasonName = seasonElement.querySelector('.season-name');
        const episodesCount = seasonElement.querySelector('.episodes-count');
        const seasonYear = seasonElement.querySelector('.season-year');
        const episodesList = seasonElement.querySelector('.episodes-list');
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
            season.episodes.forEach((episode) => {
                const episodeElement = elements.episodeTemplate.content.cloneNode(true);
                const episodeTitle = episodeElement.querySelector('.episode-title');
                const episodeNumber = episodeElement.querySelector('.episode-number');
                const episodeDescription = episodeElement.querySelector('.episode-description');
                const watchButton = episodeElement.querySelector('.watch-button');
                episodeTitle.textContent = episode.title;
                episodeNumber.textContent = `Episode ${episode.episode_number}`;
                episodeDescription.textContent = episode.description || '';
                if (trailerUrl) {
                    watchButton.onclick = () => playEpisode(trailerUrl, episode.title);
                }
                else {
                    watchButton.style.display = 'none';
                }
                episodesContainer.appendChild(episodeElement);
            });
            episodesList.appendChild(episodesContainer);
        }
        elements.seasons.appendChild(seasonElement);
    });
}
function playEpisode(trailerUrl, episodeTitle) {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    const title = modal.querySelector('.modal-title');
    title.textContent = episodeTitle;
    iframe.src = trailerUrl;
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    modal.addEventListener('hidden.bs.modal', () => {
        iframe.src = '';
    });
}
function getImageUrl(imageUrl) {
    if (!imageUrl)
        return 'images/no-profile.png';
    return imageUrl.startsWith('http') ? imageUrl : `images/${imageUrl}`;
}
// Global function for playing trailer
window.playTrailer = function (trailerUrl) {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    iframe.src = trailerUrl;
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    modal.addEventListener('hidden.bs.modal', () => {
        iframe.src = '';
    });
};
