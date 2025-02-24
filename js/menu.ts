import { ApiService } from './services/ApiService.js';
// Menu manager class
export class MenuManager {
    private readonly apiService: ApiService;
    private readonly desktopLoginLinks: NodeListOf<HTMLElement>;
    private readonly mobileLoginLinks: NodeListOf<HTMLElement>;
    // Constructor
    constructor() {
        this.apiService = new ApiService();
        this.desktopLoginLinks = document.querySelectorAll('.ms-auto.d-none.d-lg-flex .nav-item:last-child .nav-link');
        this.mobileLoginLinks = document.querySelectorAll('.offcanvas .nav-item:last-child .nav-link');
        
        // Initialize menu
        this.updateMenu();

        // Add listener for authentication state changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'auth_token') {
                this.updateMenu();
            }
        });
    }

    // Update menu
    private updateMenu(): void {
        const isAuthenticated = this.apiService.isAuthenticated();
        
        this.desktopLoginLinks.forEach(link => {
            this.updateLoginLink(link, isAuthenticated);
        });
        
        this.mobileLoginLinks.forEach(link => {
            this.updateLoginLink(link, isAuthenticated);
        });
    }

    // Update login link
    private updateLoginLink(link: HTMLElement, isAuthenticated: boolean): void {
        if (isAuthenticated) {
            link.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            link.setAttribute('href', '#');
            link.onclick = (e) => {
                e.preventDefault();
                this.apiService.logout();
                window.location.href = 'login.html';
            };
        } else {
            link.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            link.setAttribute('href', 'login.html');
            link.onclick = null;
        }
    }
}

// Initialize menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MenuManager();
});
