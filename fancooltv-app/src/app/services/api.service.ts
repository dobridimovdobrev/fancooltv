import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, PaginationParams } from '../models/api.models';
import { Movie, Category, Person } from '../models/media.models';
import { TVSeries } from '../models/tvseries.models';
import { DashboardStats } from '../dashboard/admin/home/admin-home.component';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly baseImageUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get movies with optional pagination and filters
   */
  public getMovies(params: Partial<PaginationParams> = { page: 1 }): Observable<ApiResponse<Movie[]>> {
    return this.get<Movie[]>('/api/v1/movies', params);
  }

  /**
   * Get movie details by ID
   */
  public getMovieDetails(id: number): Observable<ApiResponse<Movie>> {
    return this.get<Movie>(`/api/v1/movies/${id}`);
  }

  /**
   * Get TV series with optional pagination and filters
   */
  public getTVSeries(params: Partial<PaginationParams> = { page: 1 }): Observable<ApiResponse<TVSeries[]>> {
    return this.get<TVSeries[]>('/api/v1/tvseries', params);
  }

  /**
   * Get TV series details by ID
   */
  public getTVSeriesDetails(id: number): Observable<ApiResponse<TVSeries>> {
    return this.get<TVSeries>(`/api/v1/tvseries/${id}`);
  }

  /**
   * Get all categories
   */
  public getCategories(params?: Record<string, any>): Observable<ApiResponse<Category[]>> {
    return this.get<Category[]>('/api/v1/categories', params);
  }

  /**
   * Get image URL with proper formatting
   */
  public getImageUrl(path: string | any, type: 'cast' | 'poster' | 'backdrop' | 'still' = 'poster'): string {
    // Handle poster/backdrop object format from API
    if (path && typeof path === 'object' && path.url) {
      return path.url;
    }
    
    // Check if path is null, undefined, or empty string
    if (!path || typeof path !== 'string') {
      return '';
    }
    
    // If path is already a complete URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Still add size parameters for cast images
      if (type === 'cast' && !path.includes('w=') && !path.includes('h=')) {
        return `${path}${path.includes('?') ? '&' : '?'}w=300&h=300&fit=crop`;
      }
      return path;
    }

    // Remove any leading slashes
    let cleanPath = path.replace(/^\/+/, '');

    // Add storage/ before image paths
    if (!cleanPath.startsWith('storage/')) {
      const pathParts = cleanPath.split('/');
      if (pathParts[0] === 'images') {
        pathParts.unshift('storage');
        cleanPath = pathParts.join('/');
      }
    }

    // Add specific dimensions based on image type
    const fullUrl = `${this.baseImageUrl}/${cleanPath}`;
    if (type === 'cast') {
      return `${fullUrl}?w=300&h=300&fit=crop`;
    }

    return fullUrl;
  }

  /**
   * Get dashboard statistics
   */
  public getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.get<DashboardStats>('/api/v1/dashboard/stats');
  }

  /**
   * Get all persons/actors
   */
  public getPersons(params?: Record<string, any>): Observable<ApiResponse<Person[]>> {
    return this.get<Person[]>('/api/v1/persons', params);
  }
  
  /**
   * Get a single person by ID
   */
  public getPerson(personId: string): Observable<ApiResponse<Person>> {
    return this.get<Person>(`/api/v1/persons/${personId}`);
  }

  /**
   * Upload image (poster, backdrop, etc)
   */
  public uploadImage(formData: FormData, type: string): Observable<{url: string}> {
    return this.http.post<{url: string}>(`${this.baseUrl}/api/v1/upload/image/${type}`, formData, {
      headers: this.getHeadersForUpload()
    });
  }
  
  /**
   * Create a new person
   */
  public createPerson(personData: {name: string, photo: string}): Observable<ApiResponse<Person>> {
    return this.http.post<ApiResponse<Person>>(`${this.baseUrl}/api/v1/persons`, personData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update an existing person
   */
  public updatePerson(personId: number, personData: {name: string, photo: string}): Observable<ApiResponse<Person>> {
    return this.http.put<ApiResponse<Person>>(`${this.baseUrl}/api/v1/persons/${personId}`, personData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete a person
   */
  public deletePerson(personId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/v1/persons/${personId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Create a new movie
   */
  public createMovie(movieData: Partial<Movie>): Observable<ApiResponse<Movie>> {
    return this.http.post<ApiResponse<Movie>>(`${this.baseUrl}/api/v1/movies`, movieData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update an existing movie
   */
  public updateMovie(id: number, movieData: Partial<Movie>): Observable<ApiResponse<Movie>> {
    return this.http.put<ApiResponse<Movie>>(`${this.baseUrl}/api/v1/movies/${id}`, movieData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete a movie
   */
  public deleteMovie(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/api/v1/movies/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Create a new TV series
   */
  public createTVSeries(tvSeriesData: Partial<TVSeries>): Observable<ApiResponse<TVSeries>> {
    return this.http.post<ApiResponse<TVSeries>>(`${this.baseUrl}/api/v1/tvseries`, tvSeriesData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update an existing TV series
   */
  public updateTVSeries(id: number, tvSeriesData: Partial<TVSeries>): Observable<ApiResponse<TVSeries>> {
    return this.http.put<ApiResponse<TVSeries>>(`${this.baseUrl}/api/v1/tvseries/${id}`, tvSeriesData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete a TV series
   */
  public deleteTVSeries(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/api/v1/tvseries/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Generic GET method for API calls
   */
  private get<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          // Convert parameters to the correct format
          if (key === 'q') {
            httpParams = httpParams.append('title', value.toString());
          } else if (key === 'category') {
            httpParams = httpParams.append('category_id', value.toString());
          } else {
            httpParams = httpParams.append(key, value.toString());
          }
        }
      });
    }

    console.log('Requesting URL:', `${this.baseUrl}${endpoint}`, httpParams); // For debugging
    
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  /**
   * Get headers for API requests with authentication if available
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
  
  /**
   * Get headers for file upload requests with authentication if available
   * Note: Content-Type is not set as it will be set automatically by the browser for FormData
   */
  private getHeadersForUpload(): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
}
