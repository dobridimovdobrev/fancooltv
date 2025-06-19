import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegistrationData } from '../../models/auth.models';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  passwordMismatch = false;
  
  // Oggetto per memorizzare gli errori di validazione specifici per campo dal backend
  serverErrors: { [key: string]: string[] } = {};

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      birthday: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  // Getter per accesso facilitato ai controlli del form
  get f() {
    return this.registerForm.controls;
  }
  
  // Metodo per verificare se ci sono errori di validazione dal server per un campo specifico
  hasServerError(fieldName: string): boolean {
    const hasError = this.serverErrors && this.serverErrors[fieldName] !== undefined;
    console.log(`Controllo errore server per ${fieldName}:`, hasError, this.serverErrors);
    return hasError;
  }
  
  // Metodo per ottenere il messaggio di errore dal server per un campo specifico
  getServerError(fieldName: string): string {
    const errorMessage = this.serverErrors && this.serverErrors[fieldName] ? 
      this.serverErrors[fieldName].join(', ') : '';
    console.log(`Messaggio errore server per ${fieldName}:`, errorMessage);
    return errorMessage;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.passwordMismatch = false;
    this.serverErrors = {}; // Reset server errors

    // Check if the form is valid
    if (this.registerForm.invalid) {
      return;
    }

    // Verifica che le password corrispondano
    if (this.f['password'].value !== this.f['password_confirmation'].value) {
      this.passwordMismatch = true;
      return;
    }

    this.loading = true;

    // Format the birth date in YYYY-MM-DD format required by the backend
    let birthday = this.f['birthday'].value;
    if (birthday) {
      // If the date is already a string in the correct format, we use it as is
      // Otherwise, we format it
      if (birthday instanceof Date) {
        const year = birthday.getFullYear();
        const month = String(birthday.getMonth() + 1).padStart(2, '0');
        const day = String(birthday.getDate()).padStart(2, '0');
        birthday = `${year}-${month}-${day}`;
      }
    }

    console.log('Form valido, preparazione dati per la registrazione');
    
    // Prepara i dati per la registrazione
    const registerData: RegistrationData = {
      username: this.f['username'].value,
      first_name: this.f['first_name'].value,
      last_name: this.f['last_name'].value,
      email: this.f['email'].value,
      gender: this.f['gender'].value,
      birthday: birthday,
      password: this.f['password'].value,
      password_confirmation: this.f['password_confirmation'].value
    };
    
    console.log('Dati di registrazione preparati:', JSON.stringify(registerData));

    // Chiama il servizio di autenticazione per registrare l'utente
    this.authService.register(registerData).subscribe({
      next: () => {
        // Registrazione riuscita, reindirizza alla pagina di login
        this.router.navigate(['/login'], { 
          queryParams: { registered: 'true' } 
        });
      },
      error: (err) => {
        console.log('Errore completo:', err);
        this.loading = false;
        
        // Reset degli errori
        this.serverErrors = {};
        this.error = '';
        
        // Gestione degli errori
        if (err && err.errors) {
          // Caso 1: errore restituito direttamente dal servizio di autenticazione
          console.log('Errori di validazione dal servizio auth:', err.errors);
          this.serverErrors = err.errors;
        } else if (err && err.error && err.error.errors) {
          // Caso 2: errore HTTP standard
          console.log('Errori di validazione HTTP standard:', err.error.errors);
          this.serverErrors = err.error.errors;
        }
        
        console.log('serverErrors dopo assegnazione:', this.serverErrors);
        
        // Se abbiamo errori di validazione, creiamo un messaggio di errore generale
        if (Object.keys(this.serverErrors).length > 0) {
          const errorMessages = [];
          
          for (const key in this.serverErrors) {
            if (this.serverErrors.hasOwnProperty(key)) {
              // Aggiungiamo il messaggio di errore alla lista
              errorMessages.push(`${key}: ${this.serverErrors[key].join(', ')}`);
              
              // Marchiamo i campi con errori come touched per mostrare i messaggi
              if (this.f[key]) {
                this.f[key].markAsTouched();
              }
            }
          }
          
          // Messaggio di errore generale
          if (errorMessages.length > 0) {
            this.error = errorMessages.join('\n');
          }
        } else {
          // Se non abbiamo errori di validazione specifici, mostriamo un messaggio generico
          if (err && err.message) {
            this.error = err.message;
          } else if (err && err.error && err.error.message) {
            this.error = err.error.message;
          } else {
            this.error = 'Si è verificato un errore durante la registrazione. Riprova più tardi.';
          }
        }
        
        console.log('serverErrors finale:', this.serverErrors);
        console.log('Messaggio di errore generale:', this.error);
      }
    });
  }
}
