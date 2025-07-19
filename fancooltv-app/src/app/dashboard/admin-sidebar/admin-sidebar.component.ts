import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
      route: '/dashboard'
    },
    {
      title: 'Movies',
      icon: 'fa-solid fa-film',
      route: '/dashboard/movies'
    },
    {
      title: 'TV Series',
      icon: 'fa-solid fa-tv',
      route: '/dashboard/tvseries'
    },
    {
      title: 'Persons',
      icon: 'fa-solid fa-user-group',
      route: '/dashboard/persons'
    },
    {
      title: 'Users',
      icon: 'fa-solid fa-users',
      route: '/dashboard/users'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  // Check if the current route is active
  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
