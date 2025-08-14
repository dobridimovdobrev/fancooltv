import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

/**
 * Interface for dashboard statistics
 */
export interface DashboardStats {
  totalMovies: number;
  totalSeries: number;
  totalPersons: number;
  totalUsers: number;
  totalCountries: number;
  totalCategories: number;
  recentUploads: number;
}

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss']
})
export class AdminHomeComponent implements OnInit {
  // Dashboard statistics
  stats: DashboardStats = {
    totalMovies: 0,
    totalSeries: 0,
    totalPersons: 0,
    totalUsers: 0,
    totalCountries: 0,
    totalCategories: 0,
    recentUploads: 0
  };

  // User properties
  capitalizedName: string = '';
  isAdminUser: boolean = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    // Load dashboard stats
    this.loadDashboardStats();
    
    // Get user data
    this.getUserData();
  }

  // Method to load dashboard statistics
  loadDashboardStats(): void {
    // Use unified dashboard stats API (backend respects soft delete for all counts)
    this.apiService.getDashboardStats().subscribe({
      next: (response) => {
        // Update stats with backend counts (all soft delete aware)
        this.stats = {
          totalUsers: response.data?.totalUsers || 0,
          totalCategories: response.data?.totalCategories || 0, // Need to add to backend
          totalCountries: response.data?.totalCountries || 0,
          totalMovies: response.data?.totalMovies || 0,
          totalSeries: response.data?.totalSeries || 0,
          totalPersons: response.data?.totalPersons || 0,
          recentUploads: response.data?.recentUploads || 0
        };
        console.log('✅ Dashboard stats loaded with unified API:', this.stats);
      },
      error: (error) => {
        console.error('❌ Error loading dashboard statistics:', error);
        this.useDefaultStats();
      }
    });
  }

  // Metodo di fallback per usare dati di default in caso di errore
  private useDefaultStats(): void {
    // Dati di default da mostrare in caso di errore
    this.stats = {
      totalMovies: 0,
      totalSeries: 0,
      totalPersons: 0,
      totalUsers: 0,
      totalCountries: 0,
      totalCategories: 0,
      recentUploads: 0
    };
  }

  // Method to get user data from auth service
  getUserData(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      // Get name from first_name if available, otherwise use username
      let name = '';
      if (currentUser.first_name) {
        name = currentUser.first_name;
      } else {
        name = currentUser.username;
      }
      
      // Capitalize first letter of name
      this.capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
      
      // Check if user is admin
      this.isAdminUser = this.authService.isAdmin();
    }
  }
}
