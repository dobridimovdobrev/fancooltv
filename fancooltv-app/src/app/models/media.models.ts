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
    slug?: string;
    description: string;
    year: number;
    duration: number;
    imdb_rating: number;
    premiere_date?: string;
    status: 'published' | 'draft' | 'sheduled' | 'coming soon';
    category: Category;
    category_id: number;
    poster: string;
    backdrop: string;
    persons: Person[];
    trailers: Trailer[];
    video_files?: VideoFile[];
    image_files?: ImageFile[];
    deleted_at?: string | null;
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

export interface VideoFile {
    video_file_id?: number;
    id?: number;
    url: string;
    title?: string;
    type?: string;
    format?: string;
    resolution?: string;
    stream_url?: string;
    public_stream_url?: string;
}

export interface ImageFile {
    id?: number;
    url: string;
    type?: string; // poster, backdrop, still, etc.
}
