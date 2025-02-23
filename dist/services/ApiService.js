export class ApiService {
    constructor() {
        this.baseUrl = 'https://api.dobridobrev.com';
        this.baseImageUrl = 'https://api.dobridobrev.com';
        this.token = null;
        this.token = localStorage.getItem('auth_token');
    }
    isAuthenticated() {
        return this.token !== null;
    }
    async login(credentials) {
        var _a;
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
        if (data.status === 'success' && ((_a = data.message) === null || _a === void 0 ? void 0 : _a.token)) {
            const token = data.message.token;
            this.token = token;
            localStorage.setItem('auth_token', token);
        }
        else {
            throw new Error('Login failed: Invalid response format');
        }
    }
    async register(data) {
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
        // La registrazione è andata a buon fine, non ci aspettiamo più un token
        if (responseData.status === 'success') {
            return; // L'utente dovrà fare login separatamente
        }
        else {
            console.error('Unexpected response format:', responseData);
            throw new Error('Registration failed: Invalid response format');
        }
    }
    async getMovies(params = { page: 1 }) {
        return this.get('/api/v1/movies', params);
    }
    async getMovieDetails(id) {
        return this.get(`/api/v1/movies/${id}`);
    }
    async getTVSeries(params = { page: 1 }) {
        return this.get('/api/v1/tvseries', params);
    }
    async getTVSeriesDetails(id) {
        return this.get(`/api/v1/tvseries/${id}`);
    }
    async getCategories(params) {
        return this.get('/api/v1/categories', params);
    }
    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }
    getImageUrl(path, type = 'poster') {
        if (!path)
            return '';
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
    async get(endpoint, params) {
        const url = new URL(this.baseUrl + endpoint);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    // Converti i parametri nel formato corretto
                    if (key === 'q') {
                        url.searchParams.append('title', value.toString());
                    }
                    else if (key === 'category') {
                        url.searchParams.append('category_id', value.toString());
                    }
                    else {
                        url.searchParams.append(key, value.toString());
                    }
                }
            });
        }
        console.log('Requesting URL:', url.toString()); // Per debug
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
