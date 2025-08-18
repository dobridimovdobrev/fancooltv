// Auth models based on existing API types
export interface ApiResponse<T> {
    data: T;
    links?: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta?: {
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

export interface AuthApiResponse<T> {
    data?: T;
    status: 'success' | 'error';
    message?: string;
    errors?: Record<string, string[]>;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegistrationData {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
    gender: 'male' | 'female';
    birthday: string;
    country_id: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    gender: string;
    birthday: string;
    country_id?: number;
    role: 'user' | 'admin';
    created_at: string;
    updated_at: string;
}
