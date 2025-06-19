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
    category_id: number;
    name: string;
}

export interface Movie {
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
    character?: string;
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



export interface Episode {
    id: number;
    title: string;
    description?: string;
    duration?: number;
    trailer_url?: string;
}
