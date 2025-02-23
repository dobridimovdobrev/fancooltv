import { ApiService } from './services/ApiService.js';
import { RegistrationData } from './types/api.types.js';

document.addEventListener('DOMContentLoaded', () => {
    const apiService = new ApiService();
    
    if (apiService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const registerForm = document.getElementById('registerForm') as HTMLFormElement;
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const passwordConfirmInput = document.getElementById('password_confirmation') as HTMLInputElement;
    const firstNameInput = document.getElementById('first_name') as HTMLInputElement;
    const lastNameInput = document.getElementById('last_name') as HTMLInputElement;
    const genderSelect = document.getElementById('gender') as HTMLSelectElement;
    const birthdayInput = document.getElementById('birthday') as HTMLInputElement;
    const termsCheck = document.getElementById('termsCheck') as HTMLInputElement;
    const errorContainer = document.getElementById('errorContainer') as HTMLElement;

    if (!registerForm || !usernameInput || !emailInput || !passwordInput || !passwordConfirmInput || 
        !firstNameInput || !lastNameInput || !genderSelect || !birthdayInput || !termsCheck || !errorContainer) {
        console.error('Required form elements not found');
        return;
    }

    // Funzione per mostrare gli errori di validazione
    const showValidationErrors = (errors: Record<string, string[]>) => {
        errorContainer.innerHTML = '';
        for (const [field, messages] of Object.entries(errors)) {
            const input = document.getElementById(field) as HTMLElement;
            if (input) {
                input.classList.add('is-invalid');
                // Rimuovi eventuali feedback esistenti
                const existingFeedback = input.parentElement?.querySelector('.invalid-feedback');
                if (existingFeedback) {
                    existingFeedback.remove();
                }
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = messages[0];
                input.parentElement?.appendChild(feedback);
            }
        }
    };

    // Funzione per pulire gli errori di validazione
    const clearValidationErrors = () => {
        errorContainer.innerHTML = '';
        const invalidInputs = registerForm.querySelectorAll('.is-invalid');
        invalidInputs.forEach(input => {
            input.classList.remove('is-invalid');
            const feedback = input.parentElement?.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.remove();
            }
        });
    };

    // Validazione del form
    const validateForm = (): Record<string, string[]> | null => {
        const errors: Record<string, string[]> = {};

        if (!termsCheck.checked) {
            errors['termsCheck'] = ['You must agree to the Terms and Conditions'];
        }

        if (!usernameInput.value.trim()) {
            errors['username'] = ['Username is required'];
        }

        if (!emailInput.value.trim()) {
            errors['email'] = ['Email is required'];
        }

        if (!passwordInput.value) {
            errors['password'] = ['Password is required'];
        } else if (passwordInput.value.length < 8) {
            errors['password'] = ['Password must be at least 8 characters long'];
        }

        if (passwordInput.value !== passwordConfirmInput.value) {
            errors['password_confirmation'] = ['Passwords do not match'];
        }

        if (!firstNameInput.value.trim()) {
            errors['first_name'] = ['First name is required'];
        }

        if (!lastNameInput.value.trim()) {
            errors['last_name'] = ['Last name is required'];
        }

        if (!genderSelect.value) {
            errors['gender'] = ['Please select a gender'];
        }

        if (!birthdayInput.value) {
            errors['birthday'] = ['Birthday is required'];
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearValidationErrors();

        // Validazione lato client
        const validationErrors = validateForm();
        if (validationErrors) {
            showValidationErrors(validationErrors);
            return;
        }

        try {
            const registrationData: RegistrationData = {
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value,
                password_confirmation: passwordConfirmInput.value,
                first_name: firstNameInput.value.trim(),
                last_name: lastNameInput.value.trim(),
                gender: genderSelect.value as 'male' | 'female',
                birthday: birthdayInput.value
            };

            await apiService.register(registrationData);
            // Reindirizza alla pagina di login dopo una registrazione riuscita
            window.location.href = 'login.html?registered=true';
        } catch (error: any) {
            console.error('Registration error:', error);
            
            if (error.status === 422 && error.errors) {
                showValidationErrors(error.errors);
            } else {
                errorContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${error.message || 'Registration failed. Please try again.'}
                    </div>
                `;
            }
        }
    });
});
