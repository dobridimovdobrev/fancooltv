import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Flag to toggle sidebar on mobile
  sidebarVisible = false;
  // User properties
  isAdminUser = false;
  capitalizedName = '';
  userIp = '';

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Check if user is authenticated, if not redirect to login
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else {
      // Get user data
      this.loadUserData();
      // Get user IP from backend
      this.getUserIpFromBackend();
    }
  }
  
  // Get user IP from backend
  getUserIpFromBackend(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.userService.getUserById(currentUser.id).subscribe({
        next: (response) => {
          if (response && response.data && response.data.ip_address) {
            this.userIp = response.data.ip_address;
          } else {
            this.userIp = 'Not available';
          }
        },
        error: (error) => {
          console.error('Error fetching IP from backend:', error);
          this.userIp = 'Not available';
        }
      });
    } else {
      this.userIp = 'Not available';
    }
  }
  
  // Load user data from auth service
  loadUserData(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      // Check if user is admin
      this.isAdminUser = this.authService.isAdmin();
      
      // Get user name and capitalize first letter
      let name = '';
      if (currentUser.first_name) {
        name = currentUser.first_name;
      } else if (currentUser.username) {
        name = currentUser.username;
      }
      
      // Capitalize first letter of name
      if (name) {
        this.capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
  }

  // Toggle sidebar visibility on mobile
  toggleSidebar(): void {
    console.log('%c toggleSidebar CHIAMATO', 'background: red; color: white; font-size: 16px');
    console.log('Stato precedente della sidebar:', this.sidebarVisible);
    this.sidebarVisible = !this.sidebarVisible;
    console.log('NUOVO stato della sidebar:', this.sidebarVisible);
    
    // Forza il rilevamento delle modifiche
    setTimeout(() => {
      console.log('Verifica dopo timeout se la sidebar è visibile:', this.sidebarVisible);
      // Verifica se l'elemento .admin-sidebar ha la classe .show
      const sidebarElement = document.querySelector('.admin-sidebar');
      console.log('Elemento sidebar trovato:', sidebarElement);
      console.log('Elemento ha classe .show:', sidebarElement?.classList.contains('show'));
    }, 100);
  }

  // Logout user and redirect to login page
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
