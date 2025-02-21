export class TVSeriesDetailsManager {
    constructor(elements, apiService) {
        this.baseUrl = window.location.origin;
        this.elements = elements;
        this.apiService = apiService;
        // Add modal hide event listener
        this.elements.trailerModal._element.addEventListener('hidden.bs.modal', () => {
            this.elements.trailerIframe.src = '';
        });
    }
    async fetchSeriesDetails(seriesId) {
        const token = localStorage.getItem('auth_token');
        if (!token)
            throw new Error('Authentication required');
        if (!seriesId) {
            throw new Error('Series ID is required');
        }
        const response = await fetch(`https://api.dobridobrev.com/api/v1/tvseries/${seriesId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (!response.ok)
            throw new Error('Failed to fetch series details');
        const data = await response.json();
        return data.data;
    }
    updateSeriesDetails(series) {
        // Set backdrop
        if (series.backdrop) {
            const backdropUrl = this.getImageUrl(series.backdrop);
            this.elements.backdrop.style.backgroundImage = `url(${backdropUrl})`;
            this.elements.backdrop.setAttribute('role', 'img');
            this.elements.backdrop.setAttribute('aria-label', `${series.title} Backdrop`);
            this.elements.backdrop.setAttribute('title', `${series.title} - Series Backdrop`);
        }
        // Set poster
        if (series.poster) {
            const posterUrl = this.getImageUrl(series.poster);
            this.elements.poster.style.backgroundImage = `url(${posterUrl})`;
            this.elements.poster.setAttribute('role', 'img');
            this.elements.poster.setAttribute('aria-label', `${series.title} Poster`);
            this.elements.poster.setAttribute('title', `${series.title} - ${series.year || 'N/A'} - Rating: ${series.imdb_rating || 'N/A'}`);
        }
        // Set title and metadata
        this.elements.title.textContent = series.title;
        this.elements.metadata.innerHTML = `
            ${series.year ? `<div class="meta-item"><i class="fas fa-calendar"></i> ${series.year}</div>` : ''}
            ${series.imdb_rating ? `<div class="meta-item"><i class="fas fa-star"></i> ${series.imdb_rating}</div>` : ''}
            ${series.total_seasons ? `<div class="meta-item"><i class="fas fa-tv"></i> ${series.total_seasons} Seasons</div>` : ''}
            ${series.category ? `<div class="meta-item"><i class="fas fa-film"></i> ${series.category.name}</div>` : ''}
        `;
        // Set description
        this.elements.description.textContent = series.description || '';
        // Set trailer if available
        if (series.trailers && series.trailers.length > 0) {
            const trailerUrl = series.trailers[0].url;
            this.elements.trailer.innerHTML = `
                <button class="btn btn-primary" onclick="document.dispatchEvent(new CustomEvent('playTrailer', { detail: '${trailerUrl}' }))">
                    <i class="fas fa-play me-2"></i>Watch Trailer
                </button>
            `;
            // Add event listener for trailer
            document.addEventListener('playTrailer', ((e) => {
                const customEvent = e;
                this.playEpisode(customEvent.detail, 'Watch Trailer');
            }));
        }
    }
    updateCast(persons) {
        if (!persons || persons.length === 0)
            return;
        const castGrid = this.elements.cast.querySelector('.cast-grid');
        if (castGrid) {
            const castHtml = persons.slice(0, 5).map(person => `
                <div class="cast-card">
                    <div class="cast-image" style="background-image: url('${this.getImageUrl(person.profile_image)}')"></div>
                    <div class="cast-info">
                        <div class="actor-name">${person.name}</div>
                        ${person.character ? `<div class="character-name">${person.character}</div>` : ''}
                    </div>
                </div>
            `).join('');
            castGrid.innerHTML = castHtml;
        }
    }
    updateSeasons(series, seasons, trailerUrl) {
        if (!seasons || seasons.length === 0)
            return;
        // Filtra le stagioni valide (season_number > 0)
        const validSeasons = seasons.filter(season => season.season_number > 0);
        if (validSeasons.length === 0)
            return;
        this.elements.seasons.innerHTML = `<h3 class="mb-4">Seasons</h3>`;
        validSeasons.forEach(season => {
            var _a;
            const seasonElement = this.elements.seasonTemplate.content.cloneNode(true);
            const seasonSection = seasonElement.querySelector('.season-section');
            const seasonHeader = seasonElement.querySelector('.season-header');
            const seasonName = seasonElement.querySelector('.season-name');
            const episodesCount = seasonElement.querySelector('.episodes-count');
            const seasonYear = seasonElement.querySelector('.season-year');
            const episodesList = seasonElement.querySelector('.episodes-list');
            // Set season attributes
            const seasonId = `season${season.season_number}Episodes`;
            seasonSection.id = `season${season.season_number}`;
            seasonHeader.dataset.bsTarget = `#${seasonId}`;
            episodesList.id = seasonId;
            seasonName.textContent = `Season ${season.season_number}`;
            episodesCount.textContent = `${((_a = season.episodes) === null || _a === void 0 ? void 0 : _a.length) || 0} Episodes`;
            seasonYear.textContent = season.year || '';
            // Create episodes list
            if (season.episodes && season.episodes.length > 0) {
                // Ordina gli episodi per numero
                const sortedEpisodes = [...season.episodes].sort((a, b) => a.episode_number - b.episode_number);
                sortedEpisodes.forEach((episode) => {
                    const episodeElement = this.elements.episodeTemplate.content.cloneNode(true);
                    const episodeTitle = episodeElement.querySelector('.episode-title');
                    const episodeNumber = episodeElement.querySelector('.episode-number');
                    const episodeDescription = episodeElement.querySelector('.episode-description');
                    const episodeStill = episodeElement.querySelector('.episode-still');
                    const watchButton = episodeElement.querySelector('.watch-button');
                    episodeTitle.textContent = episode.title;
                    episodeNumber.textContent = `${episode.episode_number}`;
                    episodeDescription.textContent = episode.description || '';
                    // Set episode still if available
                    if (episode.still) {
                        episodeStill.style.backgroundImage = `url('${this.getImageUrl(episode.still)}')`;
                    }
                    if (trailerUrl) {
                        watchButton.onclick = () => this.playEpisode(trailerUrl, episode.title);
                    }
                    else {
                        watchButton.style.display = 'none';
                    }
                    episodesList.appendChild(episodeElement);
                });
            }
            this.elements.seasons.appendChild(seasonElement);
        });
        // Add collapse functionality
        const accordions = this.elements.seasons.querySelectorAll('.season-header');
        accordions.forEach(accordion => {
            accordion.addEventListener('click', (event) => {
                var _a;
                const header = accordion;
                const targetId = header.dataset.bsTarget;
                if (!targetId)
                    return;
                const collapse = new bootstrap.Collapse(targetId);
                const isExpanded = (_a = document.querySelector(targetId)) === null || _a === void 0 ? void 0 : _a.classList.contains('show');
                const icon = header.querySelector('.toggle-icon');
                // Toggle icon
                if (isExpanded) {
                    icon === null || icon === void 0 ? void 0 : icon.classList.remove('fa-chevron-up');
                    icon === null || icon === void 0 ? void 0 : icon.classList.add('fa-chevron-down');
                }
                else {
                    icon === null || icon === void 0 ? void 0 : icon.classList.remove('fa-chevron-down');
                    icon === null || icon === void 0 ? void 0 : icon.classList.add('fa-chevron-up');
                }
            });
        });
    }
    playEpisode(trailerUrl, episodeTitle) {
        if (!trailerUrl)
            return;
        const embedUrl = this.getYouTubeEmbedUrl(trailerUrl);
        this.elements.trailerModal.show();
        this.elements.trailerIframe.src = embedUrl;
        this.elements.trailerModal._element.querySelector('.modal-title').textContent = episodeTitle;
    }
    getImageUrl(imageUrl) {
        if (!imageUrl)
            return '';
        return imageUrl.startsWith('http') ? imageUrl : `https://api.dobridobrev.com/storage/${imageUrl}`;
    }
    getYouTubeEmbedUrl(url) {
        // Handle different YouTube URL formats
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            // Return embed URL
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url;
    }
}
