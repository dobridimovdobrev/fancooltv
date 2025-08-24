import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreditsService } from '../../services/credits.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-credits-modal',
  templateUrl: './user-credits-modal.component.html',
  styleUrls: ['./user-credits-modal.component.scss']
})
export class UserCreditsModalComponent implements OnInit {
  currentBalance = 0;
  loading = false;
  addingCredits = false;
  error = '';
  success = '';
  addCreditsForm: FormGroup;

  constructor(
    public bsModalRef: BsModalRef,
    private creditsService: CreditsService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.addCreditsForm = this.fb.group({
      amount: [100, [Validators.required, Validators.min(20), Validators.max(1000)]]
    });
  }

  ngOnInit(): void {
    this.loadCredits();
  }

  loadCredits(): void {
    this.loading = true;
    this.error = '';
    
    this.creditsService.getBalance()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (balance) => {
          console.log('Saldo crediti ricevuto:', balance);
          this.currentBalance = balance;
          
          // Se il saldo è 0 ma sappiamo che dovrebbe essere maggiore, mostriamo un messaggio
          if (balance === 0) {
            console.warn('Saldo crediti ricevuto è 0, potrebbe esserci un problema di sincronizzazione');
          }
        },
        error: (err) => {
          console.error('Error loading credits:', err);
          this.error = 'Unable to load credit balance. Please try again later.';
        }
      });
  }

  addCredits(): void {
    if (this.addCreditsForm.invalid) {
      return;
    }
    
    const amount = this.addCreditsForm.get('amount')?.value;
    this.addingCredits = true;
    this.error = '';
    this.success = '';
    
    this.creditsService.addCredits(amount)
      .pipe(finalize(() => this.addingCredits = false))
      .subscribe({
        next: (response) => {
          this.success = `You have added ${amount} credits to your account!`;
          
          // Se la risposta include il nuovo saldo, aggiorniamo direttamente
          if (response.newBalance !== undefined) {
            this.currentBalance = response.newBalance;
          } else {
            // Altrimenti facciamo una nuova chiamata per ottenere il saldo aggiornato
            this.loadCredits();
          }
          
          this.addCreditsForm.reset({ amount: 100 });
        },
        error: (err) => {
          console.error('Error adding credits:', err);
          this.error = 'Unable to add credits. Please try again later.';
        }
      });
  }

  close(): void {
    this.bsModalRef.hide();
    
    // Aggiorna la pagina corrente dopo la chiusura del modal
    setTimeout(() => {
      // Ottieni l'URL corrente e ricarica la stessa pagina
      const currentUrl = this.router.url;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
        console.log('Pagina aggiornata dopo la chiusura del modal dei crediti');
      });
    }, 100); // Piccolo ritardo per assicurarsi che il modal sia completamente chiuso
  }
}
