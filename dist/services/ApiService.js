export class ApiService {
    constructor() {
        this.baseUrl = 'https://api.dobridobrev.com/api/v1';
        this.baseImageUrl = 'https://api.dobridobrev.com';
        this.token = null;
        this.token = localStorage.getItem('auth_token');
    }
    isAuthenticated() {
        return this.token !== null;
    }
    async login(credentials) {
        const response = await this.post('/auth/login', credentials);
        if (response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('auth_token', this.token);
        }
        else {
            throw new Error('Login failed');
        }
    }
    async register(data) {
        const response = await this.post('/auth/register', data);
        if (response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('auth_token', this.token);
        }
        else {
            throw new Error('Registration failed');
        }
    }
    async getMovies(params = { page: 1 }) {
        return this.get('/movies', params);
    }
    async getMovieDetails(id) {
        return this.get(`/movies/${id}`);
    }
    async getTVSeries(params = { page: 1 }) {
        return this.get('/tvseries', params);
    }
    async getTVSeriesDetails(id) {
        return this.get(`/tvseries/${id}`);
    }
    async getCategories() {
        return this.get('/categories');
    }
    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }
    getImageUrl(path, type = 'poster') {
        if (!path)
            return '';
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
    async get(endpoint, params) {
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
    async post(endpoint, data) {
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
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }
}
