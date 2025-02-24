import { ApiResponse, AuthApiResponse, LoginCredentials, PaginationParams, RegistrationData } from '../types/api.types.js';
import { Movie, TVSeries, Category } from '../types/media.types.js';
// Response interface
interface AuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
    };
}
// API service class
export class ApiService {
    private readonly baseUrl = 'https://api.dobridobrev.com';
    private readonly baseImageUrl = 'https://api.dobridobrev.com';
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    public isAuthenticated(): boolean {
        return this.token !== null;
    }
    
    // Login method
    public async login(credentials: LoginCredentials): Promise<void> {
        const response = await fetch(this.baseUrl + '/api/login', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                username: credentials.username,
                password: credentials.password
            })
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.status === 'success' && data.message?.token) {
            const token = data.message.token;
            this.token = token;
            localStorage.setItem('auth_token', token);
        } else {
            throw new Error('Login failed: Invalid response format');
        }
    }
    //register method
    public async register(data: RegistrationData): Promise<void> {
        console.log('Sending registration data:', data);

        const response = await fetch(this.baseUrl + '/api/register', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        console.log('Server response:', responseData);

        if (!response.ok) {
            if (response.status === 422) {
                // Validation errors
                throw {
                    status: 422,
                    errors: responseData.errors || { general: [responseData.message || 'Validation failed'] },
                    message: 'Validation failed'
                };
            }
            throw new Error(responseData.message || 'Registration failed');
        }

        // The registration was successful, no need for a token
        if (responseData.status === 'success') {
            return; // The user should log in separately
        } else {
            console.error('Unexpected response format:', responseData);
            throw new Error('Registration failed: Invalid response format');
        }
    }

    //get movies method
    public async getMovies(params: Partial<PaginationParams> = { page: 1 }): Promise<ApiResponse<Movie[]>> {
        return this.get<Movie[]>('/api/v1/movies', params);
    }
    //get movie details method
    public async getMovieDetails(id: number): Promise<ApiResponse<Movie>> {
        return this.get<Movie>(`/api/v1/movies/${id}`);
    }
    //get tv series method
    public async getTVSeries(params: Partial<PaginationParams> = { page: 1 }): Promise<ApiResponse<TVSeries[]>> {
        return this.get<TVSeries[]>('/api/v1/tvseries', params);
    }
    //get tv series details method
    public async getTVSeriesDetails(id: number): Promise<ApiResponse<TVSeries>> {
        return this.get<TVSeries>(`/api/v1/tvseries/${id}`);
    }

    //get categories method
    public async getCategories(params?: Record<string, any>): Promise<ApiResponse<Category[]>> {
        return this.get<Category[]>('/api/v1/categories', params);
    }

    //logout method
    public logout(): void {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    //get image url method
    public getImageUrl(path: string, type: 'cast' | 'poster' | 'backdrop' | 'still' = 'poster'): string {
        if (!path) return '';
        
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
    //get method
    private async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        const url = new URL(this.baseUrl + endpoint);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    // Converti i parametri nel formato corretto
                    if (key === 'q') {
                        url.searchParams.append('title', value.toString());
                    } else if (key === 'category') {
                        url.searchParams.append('category_id', value.toString());
                    } else {
                        url.searchParams.append(key, value.toString());
                    }
                }
            });
        }

        console.log('Requesting URL:', url.toString()); // Per debug
        //make the request
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data); // Per debug
        return data;
    }
    //post method
    private async post<T>(endpoint: string, data: Record<string, any>): Promise<AuthApiResponse<T>> {
        const response = await fetch(this.baseUrl + endpoint, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
    //get headers
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }
}
