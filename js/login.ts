import { ApiService } from './services/ApiService.js';
import { LoginCredentials } from './types/api.types.js';

document.addEventListener('DOMContentLoaded', () => {
    const apiService = new ApiService();
    
    if (apiService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm') as HTMLFormElement;
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const errorMessage = document.getElementById('errorMessage') as HTMLElement;

    if (!loginForm || !usernameInput || !passwordInput || !errorMessage) {
        console.error('Required form elements not found');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        errorMessage.classList.add('d-none');

        try {
            const credentials: LoginCredentials = {
                username: usernameInput.value.trim(),
                password: passwordInput.value
            };

            await apiService.login(credentials);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.classList.remove('d-none');
        }
    });
});
