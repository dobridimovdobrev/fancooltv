export interface UserCredentials {
    email: string;
    password: string;
}

export interface UserRegistration extends UserCredentials {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
}

export interface ValidationResult {
    isValid: boolean;
    message?: string;
}
