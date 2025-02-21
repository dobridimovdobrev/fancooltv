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

export interface AuthApiResponse<T> {
    data: T;
    status: 'success' | 'error';
    message?: string;
}

export interface ApiError {
    status: 'error';
    message: string;
    errors?: Record<string, string[]>;
}

export interface PaginationParams {
    page: number;
    perPage?: number;
    search?: string;
    genre?: string;
    year?: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegistrationData {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
}
