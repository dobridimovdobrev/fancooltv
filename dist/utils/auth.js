// Utils/auth.ts
import { ApiService } from '../services/ApiService.js';
// Require authentication
export function requireAuth() {
    const apiService = new ApiService();
    if (!apiService.isAuthenticated()) {
        window.location.href = 'login.html';
    }
}
