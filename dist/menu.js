import { ApiService } from './services/ApiService.js';
export class MenuManager {
    constructor() {
        this.apiService = new ApiService();
        this.desktopLoginLink = document.querySelector('.ms-auto.d-none.d-lg-flex .nav-item:last-child .nav-link');
        this.mobileLoginLink = document.querySelector('.offcanvas .nav-item:last-child .nav-link');
        // Inizializza il menu
        this.updateMenu();
    }
    updateMenu() {
        const isAuthenticated = this.apiService.isAuthenticated();
        if (this.desktopLoginLink) {
            this.updateLoginLink(this.desktopLoginLink, isAuthenticated);
        }
        if (this.mobileLoginLink) {
            this.updateLoginLink(this.mobileLoginLink, isAuthenticated);
        }
    }
    updateLoginLink(link, isAuthenticated) {
        const icon = link.querySelector('i');
        if (isAuthenticated) {
            link.innerHTML = '';
            if (icon) {
                icon.className = 'fas fa-sign-out-alt';
                link.appendChild(icon);
            }
            link.appendChild(document.createTextNode(' Logout'));
            link.setAttribute('href', '#');
            link.onclick = (e) => {
                e.preventDefault();
                this.apiService.logout();
                window.location.href = 'login.html';
            };
        }
        else {
            link.innerHTML = '';
            if (icon) {
                icon.className = 'fas fa-sign-in-alt';
                link.appendChild(icon);
            }
            link.appendChild(document.createTextNode(' Login'));
            link.setAttribute('href', 'login.html');
            link.onclick = null;
        }
    }
}
// Inizializza il menu quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    new MenuManager();
});
