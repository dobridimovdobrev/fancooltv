export class FormValidator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: emailRegex.test(email),
            message: 'Please enter a valid email address'
        };
    }
    static validatePassword(password) {
        return {
            isValid: password.length >= 6,
            message: 'Password must be at least 6 characters long'
        };
    }
    static validateRequired(value, fieldName) {
        return {
            isValid: value.trim().length > 0,
            message: `${fieldName} is required`
        };
    }
    static validateName(name) {
        return {
            isValid: name.trim().length > 0,
            message: 'Name is required'
        };
    }
    static validatePasswordMatch(password, confirmPassword) {
        return {
            isValid: password === confirmPassword,
            message: 'Passwords do not match'
        };
    }
    static validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return {
            isValid: phoneRegex.test(phone),
            message: 'Please enter a valid phone number'
        };
    }
    static validateZipCode(zipCode) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return {
            isValid: zipRegex.test(zipCode),
            message: 'Please enter a valid ZIP code'
        };
    }
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    validatePassword(password) {
        return password.length >= 6;
    }
    validateName(name) {
        return name.length >= 2;
    }
    validatePasswordMatch(password, confirmPassword) {
        return password === confirmPassword;
    }
}
