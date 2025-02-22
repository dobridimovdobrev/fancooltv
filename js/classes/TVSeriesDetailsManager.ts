import { TVSeries, Person } from '../types/media.types.js';
import { ApiService } from '../services/ApiService.js';
import { ExtendedMediaDetailsElements } from '../types/ui.types.js';
declare var bootstrap: any;

export class TVSeriesDetailsManager {
    private elements: ExtendedMediaDetailsElements;
    private apiService: ApiService;
    private readonly baseUrl = window.location.origin;
    private currentVisibleSeasons: number = 5;
    private readonly SEASONS_PER_LOAD: number = 5;

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

        const castGrid = this.elements.cast.querySelector('.cast-grid');
        if (!castGrid) return;

        // Crea le card del cast
        castGrid.innerHTML = persons.slice(0, 5).map(person => {
            const imageUrl = this.apiService.getImageUrl(person.profile_image || '', 'cast');
            
            return `
                <div class="cast-card">
                    <div class="cast-image" style="background-image: url('${imageUrl}')"></div>
                    <div class="cast-info">
                        <div class="actor-name">${person.name}</div>
                        ${person.character ? `<div class="character-name">${person.character}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    public updateSeasons(series: TVSeries, seasons: any[], trailerUrl: string | undefined): void {
        if (!seasons || seasons.length === 0) return;

        // Filtra le stagioni valide (season_number > 0)
        const validSeasons = seasons
            .filter(season => season.season_number > 0)
            .sort((a, b) => a.season_number - b.season_number);
            
        if (validSeasons.length === 0) return;

        this.elements.seasons.innerHTML = `<h3 class="mb-4">Seasons</h3>`;
        
        // Mostra solo le prime 5 stagioni inizialmente
        const initialSeasons = validSeasons.slice(0, 5);
        this.renderSeasons(initialSeasons, trailerUrl);

        // Se ci sono più di 5 stagioni, aggiungi il pulsante "Load More"
        if (validSeasons.length > 5) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'btn btn-outline-primary mt-3 w-100';
            loadMoreBtn.innerHTML = '<i class="fas fa-plus me-2"></i>Load More Seasons';
            
            let currentIndex = 5;
            
            loadMoreBtn.addEventListener('click', () => {
                // Rimuovi il pulsante temporaneamente
                loadMoreBtn.remove();
                
                // Prendi le prossime 5 stagioni
                const nextSeasons = validSeasons.slice(currentIndex, currentIndex + 5);
                this.renderSeasons(nextSeasons, trailerUrl);
                currentIndex += 5;

                // Aggiungi il pulsante dopo l'ultima stagione mostrata
                if (currentIndex < validSeasons.length) {
                    loadMoreBtn.innerHTML = '<i class="fas fa-plus me-2"></i>Load More Seasons';
                    this.elements.seasons.appendChild(loadMoreBtn);
                }
            });

            this.elements.seasons.appendChild(loadMoreBtn);
        }
    }

    private renderSeasons(seasons: any[], trailerUrl: string | undefined): void {
        // Prima rimuovi tutti gli event listener esistenti
        const existingAccordions = this.elements.seasons.querySelectorAll('.season-header');
        existingAccordions.forEach(accordion => {
            accordion.replaceWith(accordion.cloneNode(true));
        });

        seasons.forEach(season => {
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
                        const stillUrl = this.getImageUrl(episode.still);
                        if (stillUrl) {
                            episodeStill.style.backgroundImage = `url('${stillUrl}')`;
                        }
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
                event.preventDefault();
                const header = accordion as HTMLElement;
                const targetId = header.dataset.bsTarget;
                if (!targetId) return;

                const target = document.querySelector(targetId);
                if (!target) return;

                // Chiudi tutti gli altri accordion
                const allCollapses = document.querySelectorAll('.episodes-list.show');
                allCollapses.forEach(collapse => {
                    if (collapse.id !== targetId.substring(1)) {
                        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapse);
                        bsCollapse.hide();

                        // Trova e aggiorna l'icona del collapse chiuso
                        const collapseHeader = document.querySelector(`[data-bs-target="#${collapse.id}"]`);
                        const icon = collapseHeader?.querySelector('.toggle-icon');
                        if (icon) {
                            icon.classList.remove('fa-chevron-up');
                            icon.classList.add('fa-chevron-down');
                        }
                    }
                });

                // Gestione del collapse corrente
                const bsCollapse = bootstrap.Collapse.getOrCreateInstance(target, {
                    toggle: false
                });
                
                const isCurrentlyShown = target.classList.contains('show');
                if (isCurrentlyShown) {
                    bsCollapse.hide();
                } else {
                    bsCollapse.show();
                }

                const icon = header.querySelector('.toggle-icon');
                if (isCurrentlyShown) {
                    icon?.classList.remove('fa-chevron-up');
                    icon?.classList.add('fa-chevron-down');
                } else {
                    icon?.classList.remove('fa-chevron-down');
                    icon?.classList.add('fa-chevron-up');
                }
            });
        });
    }

    private initializeSeasons(): void {
        const seasonsContainer = this.elements.seasonsContainer;
        if (!seasonsContainer) return;

        // Nascondi tutte le stagioni inizialmente
        const allSeasons = Array.from(seasonsContainer.querySelectorAll('.season-item'));
        allSeasons.forEach((season, index) => {
            if (index >= this.SEASONS_PER_LOAD) {
                (season as HTMLElement).style.display = 'none';
            }
        });

        // Mostra/nascondi il pulsante "Load More" in base al numero di stagioni
        this.updateLoadMoreButton(allSeasons.length);
    }

    private updateLoadMoreButton(totalSeasons: number): void {
        const loadMoreButton = this.elements.loadMoreButton;
        if (!loadMoreButton) return;

        if (this.currentVisibleSeasons < totalSeasons) {
            loadMoreButton.style.display = 'block';
            // Aggiorna il testo del pulsante per mostrare quante stagioni rimangono
            const remainingSeasons = totalSeasons - this.currentVisibleSeasons;
            const seasonsToLoad = Math.min(this.SEASONS_PER_LOAD, remainingSeasons);
            loadMoreButton.textContent = `Load More (${seasonsToLoad} Seasons)`;
        } else {
            loadMoreButton.style.display = 'none';
        }
    }

    private handleLoadMore(): void {
        const seasonsContainer = this.elements.seasonsContainer;
        if (!seasonsContainer) return;

        const allSeasons = Array.from(seasonsContainer.querySelectorAll('.season-item'));
        const totalSeasons = allSeasons.length;

        // Calcola quante nuove stagioni mostrare
        const startIndex = this.currentVisibleSeasons;
        const endIndex = Math.min(startIndex + this.SEASONS_PER_LOAD, totalSeasons);

        // Mostra le prossime stagioni
        for (let i = startIndex; i < endIndex; i++) {
            (allSeasons[i] as HTMLElement).style.display = 'block';
        }

        // Aggiorna il contatore delle stagioni visibili
        this.currentVisibleSeasons = endIndex;

        // Aggiorna il pulsante "Load More"
        this.updateLoadMoreButton(totalSeasons);
    }

    public playEpisode(trailerUrl: string, episodeTitle: string): void {
        if (!trailerUrl) return;

        const embedUrl = this.getYouTubeEmbedUrl(trailerUrl);
        this.elements.trailerModal.show();
        this.elements.trailerIframe.src = embedUrl;
        this.elements.trailerModal._element.querySelector('.modal-title').textContent = episodeTitle;
    }

    private getYouTubeEmbedUrl(url: string): string {
        // Gestisce sia i link normali che quelli abbreviati
        const videoId = url.includes('youtu.be/') 
            ? url.split('youtu.be/')[1]
            : url.split('v=')[1]?.split('&')[0];

        if (!videoId) return '';
        
        // Aggiungi parametri necessari per l'embed
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }

    private getImageUrl(imageUrl: string | undefined): string {
        if (!imageUrl) return '';
        return imageUrl.startsWith('http') ? imageUrl : `https://api.dobridobrev.com/storage/${imageUrl}`;
    }

    public initialize(): void {
        // Inizializza le stagioni
        this.initializeSeasons();

        // Event listener per il pulsante "Load More"
        const loadMoreButton = this.elements.loadMoreButton;
        if (loadMoreButton) {
            loadMoreButton.addEventListener('click', () => this.handleLoadMore());
        }
    }
}
