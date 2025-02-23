import { ApiService } from './services/ApiService.js';
document.addEventListener('DOMContentLoaded', () => {
    const apiService = new ApiService();
    if (apiService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password_confirmation');
    const firstNameInput = document.getElementById('first_name');
    const lastNameInput = document.getElementById('last_name');
    const genderSelect = document.getElementById('gender');
    const birthdayInput = document.getElementById('birthday');
    const termsCheck = document.getElementById('termsCheck');
    const errorContainer = document.getElementById('errorContainer');
    if (!registerForm || !usernameInput || !emailInput || !passwordInput || !passwordConfirmInput ||
        !firstNameInput || !lastNameInput || !genderSelect || !birthdayInput || !termsCheck || !errorContainer) {
        console.error('Required form elements not found');
        return;
    }
    // Funzione per mostrare gli errori di validazione
    const showValidationErrors = (errors) => {
        var _a, _b;
        errorContainer.innerHTML = '';
        for (const [field, messages] of Object.entries(errors)) {
            const input = document.getElementById(field);
            if (input) {
                input.classList.add('is-invalid');
                // Rimuovi eventuali feedback esistenti
                const existingFeedback = (_a = input.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('.invalid-feedback');
                if (existingFeedback) {
                    existingFeedback.remove();
                }
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = messages[0];
                (_b = input.parentElement) === null || _b === void 0 ? void 0 : _b.appendChild(feedback);
            }
        }
    };
    // Funzione per pulire gli errori di validazione
    const clearValidationErrors = () => {
        errorContainer.innerHTML = '';
        const invalidInputs = registerForm.querySelectorAll('.is-invalid');
        invalidInputs.forEach(input => {
            var _a;
            input.classList.remove('is-invalid');
            const feedback = (_a = input.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.remove();
            }
        });
    };
    // Validazione del form
    const validateForm = () => {
        const errors = {};
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
        }
        else if (passwordInput.value.length < 8) {
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
            const registrationData = {
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value,
                password_confirmation: passwordConfirmInput.value,
                first_name: firstNameInput.value.trim(),
                last_name: lastNameInput.value.trim(),
                gender: genderSelect.value,
                birthday: birthdayInput.value
            };
            await apiService.register(registrationData);
            // Reindirizza alla pagina di login dopo una registrazione riuscita
            window.location.href = 'login.html?registered=true';
        }
        catch (error) {
            console.error('Registration error:', error);
            if (error.status === 422 && error.errors) {
                showValidationErrors(error.errors);
            }
            else {
                errorContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${error.message || 'Registration failed. Please try again.'}
                    </div>
                `;
            }
        }
    });
});
