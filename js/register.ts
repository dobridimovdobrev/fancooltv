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
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const firstNameInput = document.getElementById('firstName') as HTMLInputElement;
    const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
    const genderSelect = document.getElementById('gender') as HTMLSelectElement;
    const errorMessage = document.getElementById('errorMessage') as HTMLElement;

    if (!registerForm || !usernameInput || !passwordInput || !firstNameInput || !lastNameInput || !genderSelect || !errorMessage) {
        console.error('Required form elements not found');
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        errorMessage.classList.add('d-none');

        try {
            const registrationData: RegistrationData = {
                username: usernameInput.value.trim(),
                password: passwordInput.value,
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                gender: genderSelect.value as 'male' | 'female'
            };

            await apiService.register(registrationData);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Registration error:', error);
            errorMessage.textContent = 'Registration failed. Please try again.';
            errorMessage.classList.remove('d-none');
        }
    });
});
