import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
  public getTVSeries(params: any = {}): Observable<any> {
    // Log per debug
    console.log('ApiService.getTVSeries - Chiamata con parametri:', params);
    console.log('ApiService.getTVSeries - User role:', localStorage.getItem('userRole') || 'user');
    console.log('ApiService.getTVSeries - Auth token:', localStorage.getItem('auth_token') ? 'presente' : 'mancante');
    
    return this.get('/api/v1/tvseries', params).pipe(
      map(response => {
        // Log per debug
        console.log('ApiService.getTVSeries - Risposta ricevuta:', response);
        console.log('ApiService.getTVSeries - Struttura completa:', JSON.stringify(response, null, 2));
        
        // Log se non ci sono risultati
        if (response && response.data && Array.isArray(response.data) && response.data.length === 0) {
          console.log('ApiService.getTVSeries - Nessun risultato trovato');
          console.log('ApiService.getTVSeries - Meta info:', response.meta);
          console.log('ApiService.getTVSeries - Links:', response.links);
        }
        
        return response;
      }),
      catchError(error => {
        // Log dettagliato dell'errore
        console.error('ApiService.getTVSeries - Errore:', error);
        console.error('ApiService.getTVSeries - Status:', error.status);
        console.error('ApiService.getTVSeries - Message:', error.message);
        console.error('ApiService.getTVSeries - Error details:', error.error);
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Get TV series details by ID
   */
  public getTVSeriesDetails(id: number): Observable<ApiResponse<TVSeries>> {
    console.log('ApiService.getTVSeriesDetails called with ID:', id);
    return this.get<TVSeries>(`/api/v1/tvseries/${id}`).pipe(
      map((response: any) => {
        console.log('ApiService.getTVSeriesDetails raw response:', response);
        console.log('Response video_files:', response?.data?.video_files || response?.video_files);
        return response;
      })
    );
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
  public uploadImage(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/upload/image`, formData, {
      headers: this.getHeadersForUpload()
    });
  }

  /**
   * Upload video file
   */
  public uploadVideo(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/v1/upload/video`, formData, {
      headers: this.getHeadersForUpload()
    });
  }

  /**
   * Upload video file with progress tracking
   */
  public uploadVideoWithProgress(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/v1/upload/video`, formData, {
      headers: this.getHeadersForUpload(),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / event.total);
          return { type: 'progress', progress };
        } else if (event.type === HttpEventType.Response) {
          return { type: 'response', response: event.body };
        }
        return event;
      })
    );
  }

  /**
   * Upload trailer file with progress tracking
   */
  public uploadTrailerWithProgress(file: File, title?: string, description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('video', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    return this.http.post(`${this.baseUrl}/api/v1/upload/trailer`, formData, {
      headers: this.getHeadersForUpload(),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / event.total);
          return { type: 'progress', progress };
        } else if (event.type === HttpEventType.Response) {
          return { type: 'response', response: event.body };
        }
        return event;
      })
    );
  }

  /**
   * Get video streaming URL using existing backend endpoints
   */
  public getVideoUrl(videoPath: string): string {
    // Extract filename from path (e.g., "videos/abc123.mp4" -> "abc123.mp4")
    const filename = videoPath.includes('/') ? videoPath.split('/').pop() : videoPath;
    
    // Use the existing stream-video endpoint with Bearer token
    return `${this.baseUrl}/api/v1/stream-video/${filename}`;
  }

  /**
   * Get public video URL (no authentication required)
   */
  public getPublicVideoUrl(videoPath: string): string {
    const filename = videoPath.includes('/') ? videoPath.split('/').pop() : videoPath;
    return `${this.baseUrl}/api/v1/public-video/${filename}`;
  }

  /**
   * Download video as blob for authenticated streaming
   */
  public getVideoBlob(videoPath: string): Observable<Blob> {
    const fullUrl = videoPath.startsWith('http') ? videoPath : `${this.baseUrl}${videoPath}`;
    
    return this.http.get(fullUrl, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
  
  /**
   * Create a new person
   */
  public createPerson(name: string, imageFileId?: number): Observable<any> {
    const payload: any = { name };
    if (imageFileId) {
      payload.image_file_id = imageFileId;
    }
    return this.http.post<any>(`${this.baseUrl}/api/v1/persons`, payload, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update an existing person
   */
  public updatePerson(personId: number, updates: { name?: string, image_file_id?: number | null }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/persons/${personId}`, updates, {
      headers: this.getHeaders()
    });
  }

  /**
   * Associate image to person
   */
  public associateImageToPerson(personId: number, imageFileIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/persons/${personId}/images`, { image_file_ids: imageFileIds }, {
      headers: this.getHeaders()
    });
  }

  /**
   * Remove image from person
   */
  public removeImageFromPerson(personId: number, imageId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/persons/${personId}/images/${imageId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get person images
   */
  public getPersonImages(personId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/persons/${personId}/images`, {
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
   * Create a new movie with files (FormData)
   */
  public createMovieWithFiles(formData: FormData): Observable<ApiResponse<Movie>> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
    });
    
    return this.http.post<ApiResponse<Movie>>(`${this.baseUrl}/api/v1/movies`, formData, {
      headers: headers
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
   * Delete a season
   */
  public deleteSeason(seasonId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/api/v1/seasons/${seasonId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete an episode
   */
  public deleteEpisode(episodeId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/api/v1/episodes/${episodeId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Create a complete TV series with files (FormData) - single API call
   */
  public createCompleteTvSeries(formData: FormData): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
    });
    
    return this.http.post<any>(`${this.baseUrl}/api/v1/tvseries/complete`, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Update a complete TV series with files (FormData) - single API call
   * Uses POST to fix Laravel FormData issue with PUT
   */
  public updateCompleteTvSeries(id: number, formData: FormData): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
    });
    
    // Use POST with complete-update endpoint as requested
    return this.http.post<any>(`${this.baseUrl}/api/v1/tvseries/${id}/complete-update`, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Create a complete movie with files (FormData) - single API call
   */
  public createCompleteMovie(formData: FormData): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
    });
    
    return this.http.post<any>(`${this.baseUrl}/api/v1/movies/complete`, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Update a complete movie with files (FormData) - single API call
   * Uses POST to fix Laravel FormData issue with PUT
   */
  public updateCompleteMovie(id: number, formData: FormData): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
    });
    
    // Use POST with complete-update endpoint as requested
    return this.http.post<any>(`${this.baseUrl}/api/v1/movies/${id}/complete-update`, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Search persons by name
   */
  public searchPersons(query: string): Observable<any> {
    const params = new HttpParams()
      .set('name', query)
      .set('per_page', '50');
    
    return this.http.get<any>(`${this.baseUrl}/api/v1/persons`, {
      headers: this.getHeaders(),
      params: params
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
          if (key === 'q' || key === 'search') {
            httpParams = httpParams.append('title', value.toString());
          } else if (key === 'category') {
            httpParams = httpParams.append('category_id', value.toString());
          } else {
            httpParams = httpParams.append(key, value.toString());
          }
        }
      });
    }

    // Debug logging removed for production performance
    
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
