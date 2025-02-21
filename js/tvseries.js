// Utility Functions
function getImageUrl(imageUrl) {
    if (!imageUrl) return null;
    return imageUrl.startsWith('http') ? imageUrl : `https://api.dobridobrev.com/storage/${imageUrl}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Cache DOM elements
    const elements = {
        seriesGrid: document.getElementById('tvSeriesGrid'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        loadMoreBtn: document.getElementById('loadMoreBtn'),
        searchInput: document.getElementById('searchInput'),
        genreFilter: document.getElementById('genreFilter'),
        yearFilter: document.getElementById('yearFilter'),
        template: document.getElementById('tvseries-card-template')
    };

    // Validate template existence
    if (!elements.template) {
        console.error('Series card template not found!');
        return;
    }

    // State management
    const state = {
        currentPage: 1,
        lastPage: null,
        allSeries: [],
        displayedCount: 0,
        itemsPerView: 20,
        isLoading: false
    };

    // Initialize app
    try {
        // Show loading state
        elements.loadingSpinner.classList.remove('d-none');
        elements.loadMoreBtn.classList.add('d-none');

        // Load initial data
        const response = await fetchSeries(1);
        state.allSeries = response.data;
        state.lastPage = response.meta.last_page;
        state.currentPage = response.meta.current_page;

        // Load filters
        await Promise.all([
            loadCategories(elements.genreFilter),
            populateYearFilter(elements.yearFilter, state.allSeries)
        ]);

        // Display first 20 series
        displaySeries(state.allSeries.slice(0, state.itemsPerView), elements);
        state.displayedCount = state.itemsPerView;

        // Show load more button if there are more series to show
        elements.loadingSpinner.classList.add('d-none');
        if (state.displayedCount < state.allSeries.length || state.currentPage < state.lastPage) {
            elements.loadMoreBtn.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        elements.loadingSpinner.classList.add('d-none');
        showError('Failed to load TV series');
    }

    // Event Listeners Setup
    function setupEventListeners(elements, state) {
        let filterTimeout;

        // Search and filter handlers
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(() => filterSeries(elements, state), 300);
        });

        elements.genreFilter.addEventListener('change', () => filterSeries(elements, state));
        elements.yearFilter.addEventListener('change', () => filterSeries(elements, state));

        // Load more handler
        elements.loadMoreBtn.addEventListener('click', async () => {
            if (state.isLoading) return;

            state.isLoading = true;
            elements.loadMoreBtn.disabled = true;
            elements.loadingSpinner.classList.remove('d-none');

            try {
                let seriesToShow = [];
                
                // First check if we have more series in current data
                if (state.displayedCount < state.allSeries.length) {
                    seriesToShow = state.allSeries.slice(state.displayedCount, state.displayedCount + state.itemsPerView);
                    state.displayedCount += seriesToShow.length;
                }
                // If we need more series, fetch next page
                else if (state.currentPage < state.lastPage) {
                    const nextPage = state.currentPage + 1;
                    const response = await fetchSeries(nextPage);
                    
                    state.allSeries = [...state.allSeries, ...response.data];
                    state.currentPage = response.meta.current_page;
                    state.lastPage = response.meta.last_page;
                    
                    seriesToShow = response.data.slice(0, state.itemsPerView);
                    state.displayedCount += seriesToShow.length;
                }

                if (seriesToShow.length > 0) {
                    displaySeries(seriesToShow, elements, true);
                }

                // Hide load more button if no more series to show
                if (state.displayedCount >= state.allSeries.length && state.currentPage >= state.lastPage) {
                    elements.loadMoreBtn.classList.add('d-none');
                }
            } catch (error) {
                console.error('Error loading more series:', error);
                showError('Failed to load more series');
            } finally {
                state.isLoading = false;
                elements.loadMoreBtn.disabled = false;
                elements.loadingSpinner.classList.add('d-none');
            }
        });
    }

    setupEventListeners(elements, state);

    // Series Display
    function displaySeries(series, elements, append = false) {
        if (!append) {
            elements.seriesGrid.innerHTML = '';
        }

        const fragment = document.createDocumentFragment();

        series.forEach(series => {
            const seriesCard = renderSeriesCard(series, elements.template);
            if (seriesCard) {
                fragment.appendChild(seriesCard);
            }
        });

        elements.seriesGrid.appendChild(fragment);
    }

    // Series Card Rendering
    function renderSeriesCard(series, template) {
        try {
            const card = template.content.cloneNode(true);
            
            // Get all required elements
            const img = card.querySelector('img');
            const title = card.querySelector('.card-title');
            const year = card.querySelector('.year-value');
            const rating = card.querySelector('.rating-value');
            const duration = card.querySelector('.duration-value');
            const category = card.querySelector('.category-value');
            const detailsLink = card.querySelector('.btn-details');
            const noImagePlaceholder = card.querySelector('.no-image-placeholder');

            // Set image and fallback
            const imageUrl = getImageUrl(series.poster);
            if (imageUrl) {
                img.src = imageUrl;
                img.alt = `${series.title} Poster`;
                img.title = `${series.title} - ${series.year || 'N/A'} - Rating: ${series.imdb_rating?.toFixed(1) || 'N/A'}`;
                img.onerror = () => {
                    img.style.display = 'none';
                    noImagePlaceholder.classList.remove('d-none');
                    noImagePlaceholder.classList.add('d-flex');
                };
            } else {
                img.style.display = 'none';
                noImagePlaceholder.classList.remove('d-none');
                noImagePlaceholder.classList.add('d-flex');
            }

            // Set text content
            title.textContent = series.title;
            year.textContent = series.year || 'N/A';
            rating.textContent = series.imdb_rating?.toFixed(1) || 'N/A';
            duration.textContent = series.total_seasons ? `${series.total_seasons} Seasons` : 'N/A';
            category.textContent = series.category?.name || 'N/A';

            // Set link
            detailsLink.href = `tvseries-details.html?id=${series.tv_series_id}`;

            return card;
        } catch (error) {
            console.error('Error rendering series card:', error);
            return null;
        }
    }

    // Filter Series
    async function filterSeries(elements, state) {
        const searchTerm = elements.searchInput.value.toLowerCase();
        const selectedGenre = elements.genreFilter.value;
        const selectedYear = elements.yearFilter.value;

        // Reset pagination state
        state.currentPage = 1;
        state.lastPage = null;
        state.displayedCount = 0;

        try {
            // Fetch first page with filters
            const queryParams = new URLSearchParams({
                page: state.currentPage
            });
            
            if (selectedGenre) {
                queryParams.append('category', selectedGenre);
            }
            if (selectedYear) {
                queryParams.append('year', selectedYear);
            }
            if (searchTerm) {
                queryParams.append('search', searchTerm);
            }

            const response = await fetch(`https://api.dobridobrev.com/api/v1/tvseries?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch filtered TV series');
            
            const data = await response.json();
            state.allSeries = data.data;
            state.currentPage = data.meta.current_page;
            state.lastPage = data.meta.last_page;

            // Display first 20 filtered series
            const seriesToShow = state.allSeries.slice(0, state.itemsPerView);
            displaySeries(seriesToShow, elements);
            state.displayedCount = seriesToShow.length;
            
            // Show/hide load more button
            elements.loadMoreBtn.classList.toggle('d-none', 
                !(state.displayedCount < state.allSeries.length || state.currentPage < state.lastPage));
        } catch (error) {
            console.error('Error filtering series:', error);
            showError('Failed to filter series');
        }
    }

    // API Calls
    async function fetchSeries(page = 1) {
        try {
            const response = await fetch(`https://api.dobridobrev.com/api/v1/tvseries?page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch TV series');
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching TV series:', error);
            throw error;
        }
    }

    async function loadCategories(selectElement) {
        try {
            const response = await fetch('https://api.dobridobrev.com/api/v1/categories', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const data = await response.json();
            const categories = data.data || [];

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.category_id;
                option.textContent = category.name;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
            throw error;
        }
    }

    function populateYearFilter(selectElement, series) {
        const years = [...new Set(series.map(series => series.year))]
            .filter(Boolean)
            .sort((a, b) => b - a);

        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            selectElement.appendChild(option);
        });
    }

    // Error Handling
    function showError(message) {
        console.error(message);
    }
});
