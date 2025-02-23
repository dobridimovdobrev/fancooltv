import { ApiService } from './services/ApiService.js';
document.addEventListener('DOMContentLoaded', () => {
    // Clear localStorage at start
    localStorage.removeItem('auth_token');
    const apiService = new ApiService();
    if (apiService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    if (!loginForm || !usernameInput || !passwordInput || !errorMessage) {
        console.error('Required form elements not found');
        return;
    }
    // Remove is-invalid class when user starts typing
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('is-invalid');
            errorMessage.classList.add('d-none');
        });
    });
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Reset previous error states
        errorMessage.classList.add('d-none');
        usernameInput.classList.remove('is-invalid');
        passwordInput.classList.remove('is-invalid');
        // Client-side validation
        let isValid = true;
        if (!usernameInput.value.trim()) {
            usernameInput.classList.add('is-invalid');
            isValid = false;
        }
        if (!passwordInput.value) {
            passwordInput.classList.add('is-invalid');
            isValid = false;
        }
        if (!isValid) {
            return;
        }
        try {
            const credentials = {
                username: usernameInput.value.trim(),
                password: passwordInput.value
            };
            await apiService.login(credentials);
            window.location.href = 'index.html';
        }
        catch (error) {
            console.error('Login error:', error);
            // Generic message for security
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.classList.remove('d-none');
            // Highlight both fields to not reveal which one is wrong
            usernameInput.classList.add('is-invalid');
            passwordInput.classList.add('is-invalid');
            // Clear password for security
            passwordInput.value = '';
        }
    });
});
