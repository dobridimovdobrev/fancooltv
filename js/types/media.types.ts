export interface BaseMedia {
    id: number;
    title: string;
    overview: string;
    posterPath: string;
    backdropPath: string;
    voteAverage: number;
    genres: string[];
}

export interface Category {
    id: number;
    name: string;
}

export interface Movie extends BaseMedia {
    movie_id: number;
    title: string;
    year: number;
    duration: number;
    imdb_rating: number;
    status: string;
    category: Category;
    poster: string;
    description: string;
    backdrop: string;
    persons: Person[];
    trailers: Trailer[];
}

export interface Person {
    person_id: number;
    name: string;
    profile_image: string;
}

export interface Trailer {
    trailer_id: number;
    title: string;
    url: string;
}

export interface Season {
    season_number: number;
    episodes_count: number;
    air_date?: string;
    description?: string;
}

export interface TVSeries extends BaseMedia {
    id: number;
    title: string;
    year: number;
    duration: number;
    imdb_rating: number;
    status: string;
    category: Category;
    poster: string;
    description: string;
    backdrop: string;
    total_seasons: number;
    persons: Person[];
    trailers: Trailer[];
    seasons: {
        season_number: number;
        year: string;
        episodes: {
            episode_number: number;
            title: string;
            description: string;
        }[];
    }[];
}

export interface Episode {
    id: number;
    title: string;
    description?: string;
    duration?: number;
    trailer_url?: string;
}
