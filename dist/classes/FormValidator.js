// Form validator class
export class FormValidator {
    constructor() {
        this.validators = new Map();
    }
    // Add a validator
    addValidator(fieldName, validator, errorMessage) {
        const validators = this.validators.get(fieldName) || [];
        validators.push({
            validate: validator,
            errorMessage: typeof errorMessage === 'string'
                ? () => errorMessage
                : errorMessage
        });
        this.validators.set(fieldName, validators);
    }
    // Validate a field
    async validateField(fieldName, value) {
        const fieldValidators = this.validators.get(fieldName);
        if (!fieldValidators)
            return null;
        for (const validator of fieldValidators) {
            const isValid = await validator.validate(value);
            if (!isValid) {
                return {
                    field: fieldName,
                    message: validator.errorMessage(value)
                };
            }
        }
        return null;
    }
    // Validate all fields
    async validateAll(formData) {
        const errors = [];
        for (const [fieldName, value] of Object.entries(formData)) {
            const error = await this.validateField(fieldName, value);
            if (error) {
                errors.push(error);
            }
        }
        return errors;
    }
}
// Predefined validators
export const Validators = {
    required: (message = 'This field is required') => ({
        validate: (value) => value.trim().length > 0,
        errorMessage: () => message
    }),
    email: (message = 'Please enter a valid email') => ({
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        errorMessage: () => message
    }),
    minLength: (length, message) => ({
        validate: (value) => value.length >= length,
        errorMessage: () => message || `Must be at least ${length} characters`
    }),
    pattern: (regex, message) => ({
        validate: (value) => regex.test(value),
        errorMessage: () => message
    }),
    match: (otherField, message) => ({
        validate: (value, formData) => formData ? value === formData[otherField] : false,
        errorMessage: () => message
    })
};
