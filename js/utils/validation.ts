import { ValidationResult } from '../types';

export class FormValidator {
    static validateEmail(email: string): ValidationResult {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: emailRegex.test(email),
            message: 'Please enter a valid email address'
        };
    }

    static validatePassword(password: string): ValidationResult {
        return {
            isValid: password.length >= 6,
            message: 'Password must be at least 6 characters long'
        };
    }

    static validateRequired(value: string, fieldName: string): ValidationResult {
        return {
            isValid: value.trim().length > 0,
            message: `${fieldName} is required`
        };
    }

    static validateName(name: string): ValidationResult {
        return {
            isValid: name.trim().length > 0,
            message: 'Name is required'
        };
    }

    static validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
        return {
            isValid: password === confirmPassword,
            message: 'Passwords do not match'
        };
    }

    static validatePhone(phone: string): ValidationResult {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return {
            isValid: phoneRegex.test(phone),
            message: 'Please enter a valid phone number'
        };
    }

    static validateZipCode(zipCode: string): ValidationResult {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return {
            isValid: zipRegex.test(zipCode),
            message: 'Please enter a valid ZIP code'
        };
    }

    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password: string): boolean {
        return password.length >= 6;
    }

    validateName(name: string): boolean {
        return name.length >= 2;
    }

    validatePasswordMatch(password: string, confirmPassword: string): boolean {
        return password === confirmPassword;
    }
}
