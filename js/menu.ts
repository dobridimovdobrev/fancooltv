import { ApiService } from './services/ApiService.js';

export class MenuManager {
    private readonly apiService: ApiService;
    private readonly desktopLoginLink: HTMLElement | null;
    private readonly mobileLoginLink: HTMLElement | null;

    constructor() {
        this.apiService = new ApiService();
        this.desktopLoginLink = document.querySelector('.ms-auto.d-none.d-lg-flex .nav-item:last-child .nav-link');
        this.mobileLoginLink = document.querySelector('.offcanvas .nav-item:last-child .nav-link');
        
        // Inizializza il menu
        this.updateMenu();
    }

    private updateMenu(): void {
        const isAuthenticated = this.apiService.isAuthenticated();
        
        if (this.desktopLoginLink) {
            this.updateLoginLink(this.desktopLoginLink, isAuthenticated);
        }
        
        if (this.mobileLoginLink) {
            this.updateLoginLink(this.mobileLoginLink, isAuthenticated);
        }
    }

    private updateLoginLink(link: HTMLElement, isAuthenticated: boolean): void {
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
        } else {
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
