import { Category, Person, Trailer } from './media.models';

export interface ImageData {
  url: string;
  sizes: {
    w92?: string;
    w154?: string;
    w185?: string;
    w300?: string;
    w342?: string;
    w500?: string;
    w780?: string;
    w1280?: string;
    original: string;
  };
  width: number;
  height: number;
  format: string;
}

export interface TVSeries {
  tv_series_id: number;
  title: string;
  year: number;
  imdb_rating: number;
  total_seasons: number;
  total_episodes: number;
  status: string;
  category: Category;
  poster: ImageData;
  description?: string;
  backdrop?: ImageData;
  persons?: Person[];
  trailers?: Trailer[];
  seasons?: Season[];
}

export interface Season {
  season_id: number;
  season_number: number;
  name: string;
  year: string;
  episodes: Episode[];
}

export interface Episode {
  episode_id: number;
  episode_number: number;
  title: string;
  description: string;
  still?: string;
  trailer?: string;
}
