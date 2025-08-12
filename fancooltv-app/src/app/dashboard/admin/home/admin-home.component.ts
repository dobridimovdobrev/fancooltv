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
    // Caricamento dati dal backend tramite API
    this.apiService.getDashboardStats().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.stats = response.data;
          console.log('Statistiche caricate con successo:', this.stats);
        } else {
          console.error('Errore: risposta API non valida', response);
          this.useDefaultStats();
        }
      },
      error: (error) => {
        console.error('Errore durante il recupero delle statistiche:', error);
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
