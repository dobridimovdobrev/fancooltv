import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Flag to toggle sidebar on mobile
  sidebarVisible = true;
  // User properties
  isAdminUser = false;
  capitalizedName = '';
  userIp = '';

  constructor(
    public authService: AuthService,
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
      // Get user IP
      this.getUserIp();
    }
  }
  
  // Get user IP from external service
  getUserIp(): void {
    // Prima prova con ipify.org
    this.http.get('https://api.ipify.org?format=json')
      .subscribe({
        next: (response: any) => {
          if (response && response.ip) {
            this.userIp = response.ip;
          } else {
            this.tryAlternativeIpService();
          }
        },
        error: (error) => {
          console.error('Error fetching IP from ipify:', error);
          this.tryAlternativeIpService();
        }
      });
  }

  // Metodo alternativo per ottenere l'IP
  tryAlternativeIpService(): void {
    // Prova con jsonip.com come alternativa
    this.http.get('https://jsonip.com')
      .subscribe({
        next: (response: any) => {
          if (response && response.ip) {
            this.userIp = response.ip;
          } else {
            this.userIp = 'Not available';
          }
        },
        error: (error) => {
          console.error('Error fetching IP from alternative service:', error);
          
          // Ultima risorsa: prova con httpbin
          this.http.get('https://httpbin.org/ip')
            .subscribe({
              next: (response: any) => {
                if (response && response.origin) {
                  this.userIp = response.origin;
                } else {
                  this.userIp = 'Not available';
                }
              },
              error: (finalError) => {
                console.error('All IP services failed:', finalError);
                this.userIp = 'Not available';
              }
            });
        }
      });
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
    this.sidebarVisible = !this.sidebarVisible;
  }

  // Logout user and redirect to login page
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
