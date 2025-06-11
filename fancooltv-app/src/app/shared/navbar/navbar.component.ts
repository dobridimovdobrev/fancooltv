import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Sottoscrizione agli aggiornamenti dello stato di autenticazione
    this.authService.currentUser.subscribe(() => {
      // Questo verrà eseguito ogni volta che lo stato dell'utente cambia
      console.log('Stato autenticazione aggiornato');
    });
  }

  /**
   * Gestisce il logout dell'utente
   */
  logout(): void {
    console.log('Logout in corso...');
    this.authService.logout();
    // Reindirizza alla home page dopo il logout
    this.router.navigate(['/']);
  }
}
