// API response interface
export interface ApiResponse<T> {
    data: T;
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
}
// Auth API response interface
export interface AuthApiResponse<T> {
    data: T;
    status: 'success' | 'error';
    message?: string;
}
// Error API response interface
export interface ApiError {
    status: 'error';
    message: string;
    errors?: Record<string, string[]>;
}
// Pagination parameters interface
export interface PaginationParams {
    page: number;
    q?: string;           // per la ricerca
    category?: string;    // per il filtro categoria
    year?: string;        // per il filtro anno
}
// Login credentials interface
export interface LoginCredentials {
    username: string;
    password: string;
}
// Registration data interface
export interface RegistrationData {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
    gender: 'male' | 'female';
    birthday: string;
}
