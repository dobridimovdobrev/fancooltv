import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  /**
   * Custom validator for username format
   */
  static usernameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const username = control.value;
      const minLength = 3;
      const maxLength = 20;
      const validPattern = /^[a-zA-Z0-9_]+$/;
      
      if (username.length < minLength) {
        return { usernameMinLength: { requiredLength: minLength, actualLength: username.length } };
      }
      
      if (username.length > maxLength) {
        return { usernameMaxLength: { requiredLength: maxLength, actualLength: username.length } };
      }
      
      if (!validPattern.test(username)) {
        return { usernameInvalidFormat: true };
      }
      
      return null;
    };
  }

  /**
   * Custom validator for password strength
   */
  static passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const password = control.value;
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      const errors: ValidationErrors = {};
      
      if (password.length < minLength) {
        errors['passwordMinLength'] = { requiredLength: minLength, actualLength: password.length };
      }
      
      if (!hasUpperCase) {
        errors['passwordUpperCase'] = true;
      }
      
      if (!hasLowerCase) {
        errors['passwordLowerCase'] = true;
      }
      
      if (!hasNumbers) {
        errors['passwordNumbers'] = true;
      }
      
      if (!hasSpecialChar) {
        errors['passwordSpecialChar'] = true;
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Custom validator for password confirmation
   */
  static passwordMatchValidator(passwordControlName: string, confirmPasswordControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const passwordControl = formGroup.get(passwordControlName);
      const confirmPasswordControl = formGroup.get(confirmPasswordControlName);
      
      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }
      
      if (confirmPasswordControl.errors && !confirmPasswordControl.errors['passwordMismatch']) {
        return null;
      }
      
      if (passwordControl.value !== confirmPasswordControl.value) {
        confirmPasswordControl.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        confirmPasswordControl.setErrors(null);
        return null;
      }
    };
  }

  /**
   * Custom validator for age validation
   */
  static ageValidator(minAge: number = 13): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const birthDate = new Date(control.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        // Birthday hasn't occurred this year
        const actualAge = age - 1;
        if (actualAge < minAge) {
          return { ageMinimum: { requiredAge: minAge, actualAge: actualAge } };
        }
      } else if (age < minAge) {
        return { ageMinimum: { requiredAge: minAge, actualAge: age } };
      }
      
      return null;
    };
  }

  /**
   * Custom validator for email format (more strict than built-in)
   */
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const email = control.value;
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (!emailPattern.test(email)) {
        return { emailInvalidFormat: true };
      }
      
      // Check for common disposable email domains
      const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
      const domain = email.split('@')[1];
      
      if (disposableDomains.includes(domain)) {
        return { emailDisposable: true };
      }
      
      return null;
    };
  }

  /**
   * Get validation error message
   */
  static getErrorMessage(controlName: string, errors: ValidationErrors): string {
    const errorMessages: { [key: string]: (error: any) => string } = {
      required: () => `${controlName} è obbligatorio`,
      email: () => 'Inserisci un indirizzo email valido',
      emailInvalidFormat: () => 'Formato email non valido',
      emailDisposable: () => 'Email temporanee non sono consentite',
      usernameMinLength: (error) => `Username deve essere di almeno ${error.requiredLength} caratteri`,
      usernameMaxLength: (error) => `Username non può superare ${error.requiredLength} caratteri`,
      usernameInvalidFormat: () => 'Username può contenere solo lettere, numeri e underscore',
      passwordMinLength: (error) => `Password deve essere di almeno ${error.requiredLength} caratteri`,
      passwordUpperCase: () => 'Password deve contenere almeno una lettera maiuscola',
      passwordLowerCase: () => 'Password deve contenere almeno una lettera minuscola',
      passwordNumbers: () => 'Password deve contenere almeno un numero',
      passwordSpecialChar: () => 'Password deve contenere almeno un carattere speciale',
      passwordMismatch: () => 'Le password non corrispondono',
      ageMinimum: (error) => `Età minima richiesta: ${error.requiredAge} anni`
    };

    const errorKey = Object.keys(errors)[0];
    const errorValue = errors[errorKey];
    const messageFunction = errorMessages[errorKey];
    
    return messageFunction ? messageFunction(errorValue) : `${controlName} non è valido`;
  }

  /**
   * Check if form control has specific error
   */
  static hasError(control: AbstractControl | null, errorType: string): boolean {
    return control ? control.hasError(errorType) && (control.dirty || control.touched) : false;
  }

  /**
   * Get all error messages for a control
   */
  static getAllErrorMessages(controlName: string, control: AbstractControl | null): string[] {
    if (!control || !control.errors) return [];
    
    return Object.keys(control.errors).map(errorKey => {
      const errors = { [errorKey]: control.errors![errorKey] };
      return this.getErrorMessage(controlName, errors);
    });
  }

  /**
   * Validate URL format
   */
  static urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      try {
        new URL(control.value);
        return null;
      } catch {
        return { invalidUrl: true };
      }
    };
  }

  /**
   * Validate YouTube URL format
   */
  static youtubeUrlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const url = control.value;
      const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
      
      if (!youtubePattern.test(url)) {
        return { invalidYoutubeUrl: true };
      }
      
      return null;
    };
  }

  /**
   * Validate numeric range
   */
  static rangeValidator(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const value = parseFloat(control.value);
      
      if (isNaN(value)) {
        return { notANumber: true };
      }
      
      if (value < min || value > max) {
        return { outOfRange: { min, max, actual: value } };
      }
      
      return null;
    };
  }
}
