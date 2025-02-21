import { ApiService } from './services/ApiService.js';
document.addEventListener('DOMContentLoaded', () => {
    const apiService = new ApiService();
    if (apiService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const genderSelect = document.getElementById('gender');
    const errorMessage = document.getElementById('errorMessage');
    if (!registerForm || !usernameInput || !passwordInput || !firstNameInput || !lastNameInput || !genderSelect || !errorMessage) {
        console.error('Required form elements not found');
        return;
    }
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        errorMessage.classList.add('d-none');
        try {
            const registrationData = {
                username: usernameInput.value.trim(),
                password: passwordInput.value,
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                gender: genderSelect.value
            };
            await apiService.register(registrationData);
            window.location.href = 'index.html';
        }
        catch (error) {
            console.error('Registration error:', error);
            errorMessage.textContent = 'Registration failed. Please try again.';
            errorMessage.classList.remove('d-none');
        }
    });
});
