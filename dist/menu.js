import { ApiService } from './services/ApiService.js';
export class MenuManager {
    constructor() {
        this.apiService = new ApiService();
        this.desktopLoginLinks = document.querySelectorAll('.ms-auto.d-none.d-lg-flex .nav-item:last-child .nav-link');
        this.mobileLoginLinks = document.querySelectorAll('.offcanvas .nav-item:last-child .nav-link');
        // Inizializza il menu
        this.updateMenu();
        // Aggiungi listener per il cambio di stato dell'autenticazione
        window.addEventListener('storage', (e) => {
            if (e.key === 'auth_token') {
                this.updateMenu();
            }
        });
    }
    updateMenu() {
        const isAuthenticated = this.apiService.isAuthenticated();
        this.desktopLoginLinks.forEach(link => {
            this.updateLoginLink(link, isAuthenticated);
        });
        this.mobileLoginLinks.forEach(link => {
            this.updateLoginLink(link, isAuthenticated);
        });
    }
    updateLoginLink(link, isAuthenticated) {
        if (isAuthenticated) {
            link.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            link.setAttribute('href', '#');
            link.onclick = (e) => {
                e.preventDefault();
                this.apiService.logout();
                window.location.href = 'login.html';
            };
        }
        else {
            link.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            link.setAttribute('href', 'login.html');
            link.onclick = null;
        }
    }
}
// Inizializza il menu quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    new MenuManager();
});
