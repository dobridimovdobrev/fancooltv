import { ApiService } from './services/ApiService.js';
import { LoginCredentials } from './types/api.types.js';

document.addEventListener('DOMContentLoaded', () => {
    // Pulisci il localStorage all'inizio
    localStorage.removeItem('auth_token');
    
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

    // Rimuovi la classe is-invalid quando l'utente inizia a digitare
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
            const credentials: LoginCredentials = {
                username: usernameInput.value.trim(),
                password: passwordInput.value
            };

            await apiService.login(credentials);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            // Messaggio generico per sicurezza
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.classList.remove('d-none');
            
            // Evidenzia entrambi i campi per non rivelare quale è sbagliato
            usernameInput.classList.add('is-invalid');
            passwordInput.classList.add('is-invalid');
            
            // Pulisci la password per sicurezza
            passwordInput.value = '';
        }
    });
});
