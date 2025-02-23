import { ApiService } from '../services/ApiService.js';
export function requireAuth() {
    const apiService = new ApiService();
    if (!apiService.isAuthenticated()) {
        window.location.href = 'login.html';
    }
}
