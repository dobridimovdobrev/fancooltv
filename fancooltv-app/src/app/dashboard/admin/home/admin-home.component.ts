import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss']
})
export class AdminHomeComponent implements OnInit {
  // Statistiche di base per la dashboard
  stats = {
    totalMovies: 0,
    totalSeries: 0,
    totalPersons: 0,
    totalUsers: 0,
    recentUploads: 0
  };

  constructor() { }

  ngOnInit(): void {
    // In una implementazione reale, qui si caricherebbero i dati dal servizio
    this.loadDashboardStats();
  }

  // Metodo per caricare le statistiche della dashboard
  loadDashboardStats(): void {
    // Simulazione dati - in produzione questi dati verrebbero caricati da API
    this.stats = {
      totalMovies: 124,
      totalSeries: 45,
      totalPersons: 230,
      totalUsers: 1250,
      recentUploads: 12
    };
  }
}
