import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent implements OnInit {
  // Menu items for the sidebar
  menuItems = [
    {
      title: 'Dashboard',
      icon: 'fa-solid fa-gauge-high',
      route: '/dashboard/admin'
    },
    {
      title: 'Movies',
      icon: 'fa-solid fa-film',
      route: '/dashboard/admin/movies'
    },
    {
      title: 'TV Series',
      icon: 'fa-solid fa-tv',
      route: '/dashboard/admin/tvseries'
    },
    {
      title: 'Persons',
      icon: 'fa-solid fa-user-group',
      route: '/dashboard/admin/persons'
    },
    {
      title: 'Users',
      icon: 'fa-solid fa-users',
      route: '/dashboard/admin/users'
    }
  ];

  // Properties for username and role
  userName: string = '';
  isAdminUser: boolean = false;

  constructor(private router: Router, public authService: AuthService) { }

  ngOnInit(): void {
    // Get username and role
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      // Use first_name and last_name if available, otherwise username
      if (currentUser.first_name) {
        this.userName = currentUser.first_name;
      } else {
        this.userName = currentUser.username;
      }
      this.isAdminUser = this.authService.isAdmin();
    }
  }

  // Check if the current route is active
  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
