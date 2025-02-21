export interface UIElements {
    grid: HTMLElement;
    template: HTMLTemplateElement;
    searchInput?: HTMLInputElement;
    genreFilter?: HTMLSelectElement;
    yearFilter?: HTMLSelectElement;
}

export interface MediaDetailsElements {
    poster: HTMLElement;
    title: HTMLElement;
    year: HTMLElement;
    rating: HTMLElement;
    duration: HTMLElement;
    category: HTMLElement;
    plot: HTMLElement;
    cast: HTMLElement;
    director: HTMLElement;
    metadata: HTMLElement;
    description: HTMLElement;
    trailer: HTMLElement;
}

export interface ExtendedMediaDetailsElements extends MediaDetailsElements {
    backdrop: HTMLElement;
    seasonTemplate: HTMLTemplateElement;
    episodeTemplate: HTMLTemplateElement;
    trailerModal: any;
    trailerIframe: HTMLIFrameElement;
    seasons: HTMLElement;
    seasonsContainer: HTMLElement;
    loadMoreButton: HTMLButtonElement;
}

export interface CardElements {
    img: HTMLImageElement;
    title: HTMLElement;
    year: HTMLElement;
    rating: HTMLElement;
    duration: HTMLElement;
    category: HTMLElement;
    detailsLink: HTMLAnchorElement;
    noImagePlaceholder: HTMLElement;
}

export interface State<T> {
    currentPage: number;
    lastPage: number | null;
    allItems: T[];
    displayedCount: number;
    itemsPerView: number;
    isLoading: boolean;
}

export interface FormElements {
    form: HTMLFormElement;
    inputs: Record<string, HTMLInputElement>;
    errorMessages: Record<string, HTMLElement>;
}
