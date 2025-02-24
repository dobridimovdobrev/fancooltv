import { ValidationError } from '../types/auth.types';
// Field validator interface
type ValidatorFn = (value: string) => boolean | Promise<boolean>;
type ErrorMessageFn = (value: string) => string;
    // Field validator interface
interface FieldValidator {
    validate: ValidatorFn;
    errorMessage: ErrorMessageFn;
}
    // Form validator class
export class FormValidator {
    private validators: Map<string, FieldValidator[]>;

    constructor() {
        this.validators = new Map();
    }

    // Add a validator
    addValidator(
        fieldName: string, 
        validator: ValidatorFn, 
        errorMessage: string | ErrorMessageFn
    ): void {
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
    async validateField(fieldName: string, value: string): Promise<ValidationError | null> {
        const fieldValidators = this.validators.get(fieldName);
        if (!fieldValidators) return null;

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
    async validateAll(formData: Record<string, string>): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];

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
    required: (message = 'This field is required'): FieldValidator => ({
        validate: (value: string) => value.trim().length > 0,
        errorMessage: () => message
    }),

    email: (message = 'Please enter a valid email'): FieldValidator => ({
        validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        errorMessage: () => message
    }),

    minLength: (length: number, message?: string): FieldValidator => ({
        validate: (value: string) => value.length >= length,
        errorMessage: () => message || `Must be at least ${length} characters`
    }),

    pattern: (regex: RegExp, message: string): FieldValidator => ({
        validate: (value: string) => regex.test(value),
        errorMessage: () => message
    }),

    match: (otherField: string, message: string): FieldValidator => ({
        validate: (value: string, formData?: Record<string, string>) => 
            formData ? value === formData[otherField] : false,
        errorMessage: () => message
    })
};
