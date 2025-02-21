export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    gender: 'male' | 'female';
    birthday: string;
    password: string;
    password_confirmation: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
}

export interface ValidationError {
    field: string;
    message: string;
}
