import { ApiService } from './services/ApiService.js';
document.addEventListener('DOMContentLoaded', () => {
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
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        errorMessage.classList.add('d-none');
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
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.classList.remove('d-none');
        }
    });
});
