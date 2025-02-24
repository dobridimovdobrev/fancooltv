// User types
export interface UserCredentials {
    email: string;
    password: string;
}
// Registration types
export interface UserRegistration extends UserCredentials {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
}
// Validation result
export interface ValidationResult {
    isValid: boolean;
    message?: string;
}
