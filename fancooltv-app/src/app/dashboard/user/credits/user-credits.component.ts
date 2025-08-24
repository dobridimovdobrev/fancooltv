import { Component, OnInit } from '@angular/core';
import { CreditsService } from '../../../services/credits.service';

@Component({
  selector: 'app-user-credits',
  templateUrl: './user-credits.component.html',
  styleUrls: ['./user-credits.component.scss']
})
export class UserCreditsComponent implements OnInit {
  credits: number = 0;
  loading: boolean = true;
  error: boolean = false;

  constructor(private creditsService: CreditsService) { }

  ngOnInit(): void {
    this.loadCredits();
  }

  /**
   * Carica il saldo crediti dell'utente
   */
  loadCredits(): void {
    this.loading = true;
    this.error = false;

    this.creditsService.getBalance().subscribe({
      next: (balance) => {
        this.credits = balance;
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento dei crediti:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}
