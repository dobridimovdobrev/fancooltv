import { ApiResponse, AuthApiResponse, LoginCredentials, PaginationParams, RegistrationData } from '../types/api.types.js';
import { Movie, TVSeries, Category } from '../types/media.types.js';

interface AuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
    };
}

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

    public async register(data: RegistrationData): Promise<void> {
        const response = await this.post<AuthResponse>('/auth/register', data);
        if (response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('auth_token', this.token);
        } else {
            throw new Error('Registration failed');
        }
    }

    public async getMovies(params: Partial<PaginationParams> = { page: 1 }): Promise<ApiResponse<Movie[]>> {
        return this.get<Movie[]>('/api/v1/movies', params);
    }

    public async getMovieDetails(id: number): Promise<ApiResponse<Movie>> {
        return this.get<Movie>(`/api/v1/movies/${id}`);
    }

    public async getTVSeries(params: Partial<PaginationParams> = { page: 1 }): Promise<ApiResponse<TVSeries[]>> {
        return this.get<TVSeries[]>('/api/v1/tvseries', params);
    }

    public async getTVSeriesDetails(id: number): Promise<ApiResponse<TVSeries>> {
        return this.get<TVSeries>(`/api/v1/tvseries/${id}`);
    }

    public async getCategories(): Promise<ApiResponse<Category[]>> {
        return this.get('/categories');
    }

    public logout(): void {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    public getImageUrl(path: string, type: 'cast' | 'poster' | 'backdrop' | 'still' = 'poster'): string {
        if (!path) return '';
        
        // Se il percorso è già un URL completo, restituiscilo
        if (path.startsWith('http://') || path.startsWith('https://')) {
            // Aggiungi comunque i parametri di dimensione per le immagini del cast
            if (type === 'cast' && !path.includes('w=') && !path.includes('h=')) {
                return `${path}${path.includes('?') ? '&' : '?'}w=300&h=300&fit=crop`;
            }
            return path;
        }

        // Rimuovi eventuali slash iniziali
        let cleanPath = path.replace(/^\/+/, '');

        // Aggiungi storage/ prima del percorso delle immagini
        if (!cleanPath.startsWith('storage/')) {
            const pathParts = cleanPath.split('/');
            if (pathParts[0] === 'images') {
                pathParts.unshift('storage');
                cleanPath = pathParts.join('/');
            }
        }

        // Aggiungi dimensioni specifiche per tipo di immagine
        const fullUrl = `${this.baseImageUrl}/${cleanPath}`;
        if (type === 'cast') {
            return `${fullUrl}?w=300&h=300&fit=crop`;
        }

        return fullUrl;
    }

    private async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        const url = new URL(this.baseUrl + endpoint);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

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
