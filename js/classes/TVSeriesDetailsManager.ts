import { TVSeries, Person } from '../types/media.types.js';
import { ApiService } from '../services/ApiService.js';
import { ExtendedMediaDetailsElements } from '../types/ui.types.js';
declare var bootstrap: any;

export class TVSeriesDetailsManager {
    private elements: ExtendedMediaDetailsElements;
    private apiService: ApiService;
    private readonly baseUrl = window.location.origin;

    constructor(elements: ExtendedMediaDetailsElements, apiService: ApiService) {
        this.elements = elements;
        this.apiService = apiService;

        // Add modal hide event listener
        this.elements.trailerModal._element.addEventListener('hidden.bs.modal', () => {
            this.elements.trailerIframe.src = '';
        });
    }

    public async fetchSeriesDetails(seriesId: string): Promise<TVSeries> {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Authentication required');

        if (!seriesId) {
            throw new Error('Series ID is required');
        }

        const response = await fetch(`https://api.dobridobrev.com/api/v1/tvseries/${seriesId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch series details');
        
        const data = await response.json();
        return data.data;
    }

    public updateSeriesDetails(series: TVSeries): void {
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
            document.addEventListener('playTrailer', ((e: Event) => {
                const customEvent = e as CustomEvent<string>;
                this.playEpisode(customEvent.detail, 'Watch Trailer');
            }) as EventListener);
        }
    }

    public updateCast(persons: Person[] | undefined): void {
        if (!persons || persons.length === 0) return;

        this.elements.cast.innerHTML = `
            <h3 class="mb-3">Cast</h3>
            <div class="cast-section">
                <div class="cast-list">
                    ${persons.map(person => `
                        <div class="cast-item">
                            <div class="cast-image">
                                <img src="${this.getImageUrl(person.profile_image)}" alt="${person.name} Profile" title="${person.name} - Cast Member" onerror="this.src='images/no-profile.png'">
                            </div>
                            <p class="cast-name">${person.name}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    public updateSeasons(series: TVSeries, seasons: any[], trailerUrl: string | undefined): void {
        if (!seasons || seasons.length === 0) return;

        // Filtra le stagioni valide (season_number > 0)
        const validSeasons = seasons.filter(season => season.season_number > 0);
        if (validSeasons.length === 0) return;

        this.elements.seasons.innerHTML = `<h3 class="mb-4">Seasons</h3>`;

        validSeasons.forEach(season => {
            const seasonElement = this.elements.seasonTemplate.content.cloneNode(true) as DocumentFragment;
            const seasonSection = seasonElement.querySelector('.season-section') as HTMLElement;
            const seasonHeader = seasonElement.querySelector('.season-header') as HTMLElement;
            const seasonName = seasonElement.querySelector('.season-name') as HTMLElement;
            const episodesCount = seasonElement.querySelector('.episodes-count') as HTMLElement;
            const seasonYear = seasonElement.querySelector('.season-year') as HTMLElement;
            const episodesList = seasonElement.querySelector('.episodes-list') as HTMLElement;

            // Set season attributes
            const seasonId = `season${season.season_number}Episodes`;
            seasonSection.id = `season${season.season_number}`;
            seasonHeader.dataset.bsTarget = `#${seasonId}`;
            episodesList.id = seasonId;
            
            seasonName.textContent = `Season ${season.season_number}`;
            episodesCount.textContent = `${season.episodes?.length || 0} Episodes`;
            seasonYear.textContent = season.year || '';

            // Create episodes list
            if (season.episodes && season.episodes.length > 0) {
                // Ordina gli episodi per numero
                const sortedEpisodes = [...season.episodes].sort((a, b) => a.episode_number - b.episode_number);

                sortedEpisodes.forEach((episode: any) => {
                    const episodeElement = this.elements.episodeTemplate.content.cloneNode(true) as DocumentFragment;
                    const episodeTitle = episodeElement.querySelector('.episode-title') as HTMLElement;
                    const episodeNumber = episodeElement.querySelector('.episode-number') as HTMLElement;
                    const episodeDescription = episodeElement.querySelector('.episode-description') as HTMLElement;
                    const episodeStill = episodeElement.querySelector('.episode-still') as HTMLElement;
                    const watchButton = episodeElement.querySelector('.watch-button') as HTMLButtonElement;

                    episodeTitle.textContent = episode.title;
                    episodeNumber.textContent = `${episode.episode_number}`;
                    episodeDescription.textContent = episode.description || '';

                    // Set episode still if available
                    if (episode.still) {
                        episodeStill.style.backgroundImage = `url('${this.getImageUrl(episode.still)}')`;
                    }

                    if (trailerUrl) {
                        watchButton.onclick = () => this.playEpisode(trailerUrl, episode.title);
                    } else {
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
                const header = accordion as HTMLElement;
                const targetId = header.dataset.bsTarget;
                if (!targetId) return;

                const collapse = new bootstrap.Collapse(targetId);
                const isExpanded = document.querySelector(targetId)?.classList.contains('show');
                const icon = header.querySelector('.toggle-icon');

                // Toggle icon
                if (isExpanded) {
                    icon?.classList.remove('fa-chevron-up');
                    icon?.classList.add('fa-chevron-down');
                } else {
                    icon?.classList.remove('fa-chevron-down');
                    icon?.classList.add('fa-chevron-up');
                }
            });
        });
    }

    public playEpisode(trailerUrl: string, episodeTitle: string): void {
        if (!trailerUrl) return;

        const embedUrl = this.getYouTubeEmbedUrl(trailerUrl);
        this.elements.trailerModal.show();
        this.elements.trailerIframe.src = embedUrl;
        this.elements.trailerModal._element.querySelector('.modal-title').textContent = episodeTitle;
    }

    private getImageUrl(imageUrl: string | undefined): string {
        if (!imageUrl) return '';
        return imageUrl.startsWith('http') ? imageUrl : `https://api.dobridobrev.com/storage/${imageUrl}`;
    }

    private getYouTubeEmbedUrl(url: string): string {
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
