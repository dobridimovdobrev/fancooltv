import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { CountryService } from '../../../../services/country.service';

@Component({
  selector: 'app-user-create-page',
  templateUrl: './user-create-page.component.html',
  styleUrls: ['./user-create-page.component.scss']
})
export class UserCreatePageComponent implements OnInit {
  createUserForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  passwordMismatch = false;
  countries: any[] = [];
  loadingCountries = false;
  
  // Object to store specific field validation errors from backend
  serverErrors: { [key: string]: string[] } = {};

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private countryService: CountryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCountries();
  }

  private initializeForm(): void {
    this.createUserForm = this.formBuilder.group({
      username: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      birthday: ['', Validators.required],
      country_id: ['', Validators.required],
      role: ['user', Validators.required],
      user_status: ['active', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    });
  }

  // Load countries for the form
  loadCountries(): void {
    this.loadingCountries = true;
    this.countryService.getPublicCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.loadingCountries = false;
        console.log('Countries loaded:', countries.length);
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.loadingCountries = false;
        this.countries = [];
      }
    });
  }

  // Getter for easy access to form controls
  get f() {
    return this.createUserForm.controls;
  }
  
  // Method to check if there are server validation errors for a specific field
  hasServerError(fieldName: string): boolean {
    const hasError = this.serverErrors && this.serverErrors[fieldName] !== undefined;
    return hasError;
  }
  
  // Method to get server error message for a specific field
  getServerError(fieldName: string): string {
    const errorMessage = this.serverErrors && this.serverErrors[fieldName] ? 
      this.serverErrors[fieldName].join(', ') : '';
    return errorMessage;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.passwordMismatch = false;
    this.serverErrors = {}; // Reset server errors

    // Check if the form is valid
    if (this.createUserForm.invalid) {
      console.log('Form is invalid:', this.createUserForm.errors);
      return;
    }

    // Check if passwords match
    if (this.f['password'].value !== this.f['password_confirmation'].value) {
      this.passwordMismatch = true;
      return;
    }

    this.loading = true;

    // Format the birth date in YYYY-MM-DD format required by the backend
    let birthday = this.f['birthday'].value;
    if (birthday) {
      if (birthday instanceof Date) {
        const year = birthday.getFullYear();
        const month = String(birthday.getMonth() + 1).padStart(2, '0');
        const day = String(birthday.getDate()).padStart(2, '0');
        birthday = `${year}-${month}-${day}`;
      }
    }

    console.log('Form valid, preparing data for user creation');
    
    // Prepare data for user creation
    const createUserData = {
      username: this.f['username'].value,
      first_name: this.f['first_name'].value,
      last_name: this.f['last_name'].value,
      email: this.f['email'].value,
      gender: this.f['gender'].value,
      birthday: birthday,
      country_id: parseInt(this.f['country_id'].value, 10),
      role: this.f['role'].value,
      user_status: this.f['user_status'].value,
      password: this.f['password'].value,
      password_confirmation: this.f['password_confirmation'].value
    };
    
    console.log('User creation data prepared:', JSON.stringify(createUserData));

    // Call user service to create the user
    this.userService.createUser(createUserData).subscribe({
      next: (response) => {
        console.log('User created successfully:', response);
        // Navigate back to admin users list
        this.router.navigate(['/dashboard/admin/users'], { 
          queryParams: { created: 'true' } 
        });
      },
      error: (err) => {
        console.log('Complete error:', err);
        this.loading = false;
        
        // Reset errors
        this.serverErrors = {};
        this.error = '';
        
        // Handle errors
        if (err && err.errors) {
          // Case 1: error returned directly from auth service
          console.log('Validation errors from service:', err.errors);
          this.serverErrors = err.errors;
        } else if (err && err.error && err.error.errors) {
          // Case 2: standard HTTP error
          console.log('Standard HTTP validation errors:', err.error.errors);
          this.serverErrors = err.error.errors;
        }
        
        console.log('serverErrors after assignment:', this.serverErrors);
        
        // If we have validation errors, create a general error message
        if (Object.keys(this.serverErrors).length > 0) {
          const errorMessages = [];
          
          for (const key in this.serverErrors) {
            if (this.serverErrors.hasOwnProperty(key)) {
              // Add error message to list
              errorMessages.push(`${key}: ${this.serverErrors[key].join(', ')}`);
              
              // Mark fields with errors as touched to show messages
              if (this.f[key]) {
                this.f[key].markAsTouched();
              }
            }
          }
          
          // General error message
          if (errorMessages.length > 0) {
            this.error = errorMessages.join('\n');
          }
        } else {
          // If we don't have specific validation errors, show a generic message
          if (err && err.message) {
            this.error = err.message;
          } else if (err && err.error && err.error.message) {
            this.error = err.error.message;
          } else {
            this.error = 'Si è verificato un errore durante la creazione dell\'utente. Riprova più tardi.';
          }
        }
        
        console.log('Final serverErrors:', this.serverErrors);
        console.log('General error message:', this.error);
      }
    });
  }

  // Navigate back to users list
  goBack(): void {
    this.router.navigate(['/dashboard/admin/users']);
  }
}
