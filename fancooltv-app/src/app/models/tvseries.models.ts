import { Category, Person, Trailer } from './media.models';

export interface TVSeries {
  tv_series_id: number;
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
  seasons: Season[];
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
