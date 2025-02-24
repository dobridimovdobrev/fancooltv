import { ValidationResult } from '../types';

// Form validator
export class FormValidator {
    static validateEmail(email: string): ValidationResult {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: emailRegex.test(email),
            message: 'Please enter a valid email address'
        };
    }

    // Password validation
    static validatePassword(password: string): ValidationResult {
        return {
            isValid: password.length >= 6,
            message: 'Password must be at least 6 characters long'
        };
    }

    // Required field validation
    static validateRequired(value: string, fieldName: string): ValidationResult {
        return {
            isValid: value.trim().length > 0,
            message: `${fieldName} is required`
        };
    }

    // Name validation
    static validateName(name: string): ValidationResult {
        return {
            isValid: name.trim().length > 0,
            message: 'Name is required'
        };
    }

    // Password match validation
    static validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
        return {
            isValid: password === confirmPassword,
            message: 'Passwords do not match'
        };
    }

    // Phone validation
    static validatePhone(phone: string): ValidationResult {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return {
            isValid: phoneRegex.test(phone),
            message: 'Please enter a valid phone number'
        };
    }
    //validates zip code
    static validateZipCode(zipCode: string): ValidationResult {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return {
            isValid: zipRegex.test(zipCode),
            message: 'Please enter a valid ZIP code'
        };
    }
    //validates email
    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    //validates password
    validatePassword(password: string): boolean {
        return password.length >= 6;
    }
    //validates required field
    validateRequired(value: string, fieldName: string): boolean {
        return value.trim().length > 0;
    }

    // Password match validation
    validatePasswordMatch(password: string, confirmPassword: string): boolean {
        return password === confirmPassword;
    }
}
