// Login credentials interface
export interface LoginCredentials {
    username: string;
    password: string;
}
// Register data interface
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
// Response interface
export interface AuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
}
// Validation error interface
export interface ValidationError {
    field: string;
    message: string;
}
