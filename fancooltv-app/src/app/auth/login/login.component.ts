import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  returnUrl: string = '/';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    // Check if user just registered
    const registered = this.route.snapshot.queryParams['registered'];
    if (registered) {
      this.success = 'Registrazione completata con successo. Ora puoi accedere.';
    }

    // Check if user was logged out due to status change
    const statusError = this.route.snapshot.queryParams['statusError'];
    if (statusError) {
      if (statusError === 'banned') {
        this.error = 'Il tuo account è stato bannato. Contatta l\'amministratore per maggiori informazioni.';
      } else if (statusError === 'inactive') {
        this.error = 'Il tuo account è stato temporaneamente disattivato. Contatta l\'amministratore per riattivarlo.';
      }
    }
  }

  ngOnInit(): void {
    // Initialize the login form
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login({
      username: this.f['username'].value,
      password: this.f['password'].value
    })
    .pipe(first())
    .subscribe({
      next: () => {
        // Navigate to return url or home page
        this.router.navigate([this.returnUrl]);
      },
      error: error => {
        // Handle specific account status errors
        if (error?.status === 401) {
          const message = error?.error?.message || error?.message || '';
          if (message.toLowerCase().includes('banned')) {
            this.error = 'Il tuo account è stato bannato. Contatta l\'amministratore per maggiori informazioni.';
          } else if (message.toLowerCase().includes('inactive') || message.toLowerCase().includes('disabled')) {
            this.error = 'Il tuo account è stato temporaneamente disattivato. Contatta l\'amministratore per riattivarlo.';
          } else if (message.toLowerCase().includes('account')) {
            this.error = message;
          } else {
            this.error = 'Username o password non validi';
          }
        } else {
          this.error = error?.message || 'Errore durante il login. Riprova più tardi.';
        }
        this.loading = false;
      }
    });
  }
}
