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
    const elements = {
        backdrop: document.getElementById('backdrop'),
        poster: document.getElementById('poster'),
        title: document.getElementById('title'),
        metadata: document.getElementById('metadata'),
        description: document.getElementById('description'),
        trailer: document.getElementById('trailer'),
        cast: document.getElementById('cast'),
        seasons: document.getElementById('seasons'),
        seasonTemplate: document.getElementById('season-template'),
        episodeTemplate: document.getElementById('episode-template'),
        trailerModal: new bootstrap.Modal(document.getElementById('trailerModal')),
        trailerIframe: document.querySelector('#trailerModal iframe')
    };

    try {
        // Fetch series details
        const series = await fetchSeriesDetails(seriesId);
        if (!series) throw new Error('Series not found');

        // Update UI
        updateSeriesDetails(series, elements);
        updateCast(series.persons, elements);
        updateSeasons(series, series.seasons, series.trailers[0]?.url, elements);

    } catch (error) {
        console.error('Error loading series details:', error);
        // Handle error (show error message to user)
    }
});

async function fetchSeriesDetails(seriesId) {
    try {
        const response = await fetch(`https://api.dobridobrev.com/api/v1/tvseries/${seriesId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch series details');
        
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

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
    elements.description.textContent = series.description;

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

function updateSeasons(series, seasons, trailerUrl, elements) {
    if (!seasons || seasons.length === 0) return;

    console.log('Dati delle stagioni ricevuti:', seasons);

    // Sort seasons by season number and normalize season numbers
    let sortedSeasons = [...seasons].sort((a, b) => a.season_number - b.season_number);
    
    // Se esiste Season 0, aggiungi 1 a tutti i numeri di stagione
    if (sortedSeasons[0].season_number === 0) {
        sortedSeasons = sortedSeasons.map(season => ({
            ...season,
            season_number: season.season_number + 1
        }));
    }

    // Clear seasons container
    elements.seasons.innerHTML = '';

    sortedSeasons.forEach((season, index) => {
        console.log(`Stagione ${season.season_number}:`, {
            total_episodes: season.total_episodes,
            episodes_array: season.episodes,
            episodes_length: season.episodes ? season.episodes.length : 0
        });

        const seasonElement = elements.seasonTemplate.content.cloneNode(true);
        
        // Set season header
        const seasonHeader = seasonElement.querySelector('.season-header');
        const seasonTitle = seasonElement.querySelector('.season-name');
        const episodesCount = seasonElement.querySelector('.episodes-count');
        const seasonYear = seasonElement.querySelector('.badge.season-year');
        
        // Mostra solo gli episodi effettivamente presenti
        const actualEpisodesCount = season.episodes ? season.episodes.length : 0;
        seasonTitle.textContent = `Season ${season.season_number}`;
        episodesCount.textContent = `${actualEpisodesCount} Episodes`;
        seasonYear.textContent = season.year;

        // Set collapse target
        const collapseId = `season-${season.season_id}`;
        seasonHeader.setAttribute('data-bs-target', `#${collapseId}`);
        const episodesContainer = seasonElement.querySelector('.episodes-container');
        episodesContainer.id = collapseId;

        // Add episodes
        if (season.episodes && season.episodes.length > 0) {
            const sortedEpisodes = [...season.episodes].sort((a, b) => a.episode_number - b.episode_number);
            
            sortedEpisodes.forEach(episode => {
                const episodeElement = elements.episodeTemplate.content.cloneNode(true);
                
                // Set episode details
                episodeElement.querySelector('.episode-number').textContent = `${episode.episode_number}`;
                episodeElement.querySelector('.episode-title').textContent = episode.title;
                
                const episodeStill = episodeElement.querySelector('.episode-still');
                // Use series backdrop as fallback if episode has no still
                if (episode.still) {
                    episodeStill.src = getImageUrl(episode.still);
                    episodeStill.alt = `${series.title} S${season.season_number}E${episode.episode_number} - ${episode.title}`;
                    episodeStill.title = `${series.title} - Season ${season.season_number} Episode ${episode.episode_number}: ${episode.title}`;
                } else if (series.backdrop) {
                    episodeStill.src = getImageUrl(series.backdrop);
                    episodeStill.alt = `${series.title} S${season.season_number}E${episode.episode_number} - ${episode.title}`;
                    episodeStill.title = `${series.title} - Season ${season.season_number} Episode ${episode.episode_number}: ${episode.title}`;
                } else {
                    episodeStill.src = 'images/no-image.png';
                    episodeStill.alt = 'No image available';
                }

                // Add click handler for watch button
                const watchButton = episodeElement.querySelector('.watch-episode');
                watchButton.addEventListener('click', () => {
                    playEpisode(trailerUrl, `${series.title} - S${season.season_number}E${episode.episode_number}: ${episode.title}`);
                });

                episodesContainer.appendChild(episodeElement);
            });
        } else {
            episodesContainer.innerHTML = '<div class="text-center py-3">No episodes available</div>';
        }

        elements.seasons.appendChild(seasonElement);
    });
}

function playEpisode(trailerUrl, episodeTitle) {
    const modal = new bootstrap.Modal(document.getElementById('trailerModal'));
    const iframe = document.querySelector('#trailerModal iframe');
    const modalTitle = document.querySelector('#trailerModal .modal-title');

    if (trailerUrl) {
        iframe.src = trailerUrl;
        modalTitle.textContent = episodeTitle;
        modal.show();

        // Reset iframe when modal is closed
        document.getElementById('trailerModal').addEventListener('hidden.bs.modal', () => {
            iframe.src = '';
        }, { once: true });
    } else {
        alert('No video available for this episode');
    }
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return null;
    return imageUrl.startsWith('http') ? imageUrl : `https://api.dobridobrev.com/storage/${imageUrl}`;
}

// Global function for playing trailer
function playTrailer(trailerUrl) {
    playEpisode(trailerUrl, 'Series Trailer');
}
