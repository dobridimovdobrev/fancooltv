import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      // Check if route requires admin role
      const requiresAdmin = route.data['requiresAdmin'] === true;
      
      if (requiresAdmin && !this.authService.isAdmin()) {
        // User is authenticated but not admin, redirect to home
        this.router.navigate(['/']);
        return false;
      }
      
      // User is authenticated and has required role
      return true;
    }

    // Not authenticated, redirect to login
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}
