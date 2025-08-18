import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, User as ServiceUser, UpdateUserRequest } from '../../../../services/user.service';
import { CountryService, Country } from '../../../../services/country.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-edit-page',
  templateUrl: './user-edit-page.component.html',
  styleUrls: ['./user-edit-page.component.scss']
})
export class UserEditPageComponent implements OnInit {
  userForm!: FormGroup;
  user: ServiceUser | null = null;
  countries: Country[] = [];
  loading = false;
  loadingCountries = false;
  submitted = false;
  error: string | null = null;
  success: string | null = null;
  userId!: number;
  
  // Server validation errors
  serverErrors: { [key: string]: string[] } = {};

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private countryService: CountryService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load countries first
    this.loadCountries();
    
    // Get user ID from route params
    this.route.params.subscribe(params => {
      this.userId = +params['id'];
      if (this.userId) {
        this.loadUserData();
      } else {
        this.error = 'Invalid user ID';
      }
    });
  }

  // Custom validator for password confirmation
  passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('password_confirmation');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    // Only validate if both passwords have values
    if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['mismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
      return null;
    }
  }

  initializeForm(): void {
    console.log('🚀 Initializing form...');
    console.log('📊 User data:', this.user);
    console.log('🏳️ Country ID to set:', this.user?.country_id);
    console.log('🌍 Countries loaded:', this.countries.length);
    
    // Find the country to verify it exists
    const userCountry = this.countries.find(c => c.country_id === this.user?.country_id);
    console.log('🔍 Found user country:', userCountry);
    console.log('🗺️ All countries:', this.countries.map(c => `${c.country_id}: ${c.name}`));
    
    this.userForm = this.formBuilder.group({
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      first_name: [this.user?.first_name || '', [Validators.required]],
      last_name: [this.user?.last_name || '', [Validators.required]],
      gender: [this.user?.gender || '', [Validators.required]],
      birthday: [this.user?.birthday || '', [Validators.required]],
      country_id: [this.user?.country_id || '', [Validators.required]],
      user_status: [this.user?.user_status || 'active'],
      role_id: [(this.user as any)?.role_id || 2],
      password: [''],
      password_confirmation: ['']
    });
    
    console.log('✅ Form initialized with values:', this.userForm.value);
    console.log('🔧 Country field value:', this.userForm.get('country_id')?.value);
    console.log('✔️ Form valid:', this.userForm.valid);
    
    // Force clear password fields immediately and after timeout
    this.userForm.get('password')?.setValue('');
    this.userForm.get('password_confirmation')?.setValue('');
    
    setTimeout(() => {
      this.userForm.get('password')?.setValue('');
      this.userForm.get('password_confirmation')?.setValue('');
      this.userForm.get('password')?.markAsUntouched();
      this.userForm.get('password_confirmation')?.markAsUntouched();
      console.log('🔒 Password fields force cleared and marked untouched');
    }, 200);
  }

  loadUserData(): void {
    this.loading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response && response.data) {
          this.user = response.data;
          console.log('🔍 User data loaded:', this.user);
          console.log('🏳️ User country_id:', this.user.country_id, 'Type:', typeof this.user.country_id);
          console.log('🌍 Available countries:', this.countries.length);
          
          // Wait for countries to load before initializing form
          if (this.countries.length === 0) {
            console.log('⏳ Waiting for countries to load...');
            setTimeout(() => this.initializeForm(), 500);
          } else {
            this.initializeForm();
          }
        } else {
          this.error = 'User not found';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading user:', error);
        this.error = 'Failed to load user data';
      }
    });
  }

  loadCountries(): void {
    this.loadingCountries = true;
    this.countryService.getPublicCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.loadingCountries = false;
        console.log('🌍 All countries loaded:', countries.length);
        
        // Update country field after countries are loaded
        if (this.user?.country_id && this.userForm) {
          this.userForm.patchValue({
            country_id: this.user.country_id
          });
        }
      },
      error: (error) => {
        this.loadingCountries = false;
        console.error('Error loading countries:', error);
      }
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.userForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.serverErrors = {};

    if (this.userForm.invalid) {
      return;
    }

    const formValue = this.userForm.value;
    const password = formValue.password?.trim();
    const passwordConfirmation = formValue.password_confirmation?.trim();

    // Only validate password match if both fields have values
    if (password && passwordConfirmation && password !== passwordConfirmation) {
      this.serverErrors = { password_confirmation: ['Le password non corrispondono'] };
      return;
    }

    this.loading = true;

    // Prepare update data - match profile-edit-modal exactly
    const updateData: any = {};
    
    // Always include these fields
    updateData.first_name = formValue.first_name;
    updateData.last_name = formValue.last_name;
    updateData.gender = formValue.gender;
    updateData.birthday = formValue.birthday;
    updateData.country_id = parseInt(formValue.country_id, 10);
    updateData.user_status = formValue.user_status;
    updateData.role_id = parseInt(formValue.role_id, 10);
    
    // Only include email if it's different from current
    if (formValue.email !== this.user?.email) {
      updateData.email = formValue.email;
    }
    
    // Only include password if both fields are filled
    if (password && passwordConfirmation) {
      updateData.password = password;
      updateData.password_confirmation = passwordConfirmation;
    }

    console.log('📤 Sending update data:', updateData);
    
    this.userService.updateUser(this.userId, updateData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('✅ User updated successfully:', response);
        this.success = 'User updated successfully';
        
        // Check if the updated user is the current logged-in user
        const currentUser = this.authService.currentUserValue;
        console.log('🔍 Current user ID:', currentUser?.id);
        console.log('🔍 Updated user ID:', this.user?.user_id);
        console.log('🔍 User object:', this.user);
        
        if (currentUser && currentUser.id === this.user?.user_id) {
          console.log('🔄 Updated user is current user, refreshing auth data...');
          // Refresh the current user's data to update role/permissions
          this.authService.refreshUserData().subscribe({
            next: (updatedUser: any) => {
              console.log('✅ Current user data refreshed:', updatedUser);
              console.log('✅ New role:', updatedUser.role);
              // Force a page reload to ensure all components update
              window.location.reload();
            },
            error: (error: any) => {
              console.error('❌ Failed to refresh user data:', error);
              // Force logout and redirect to login if refresh fails
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          });
        } else {
          // Navigate back to users list after a short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard/admin/users']);
          }, 1500);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error updating user:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error body:', error.error);
        
        if (error.status === 422 && error.error?.errors) {
          this.serverErrors = error.error.errors;
        } else if (error.status === 500) {
          this.error = 'Errore interno del server. Verifica i dati inviati.';
        } else {
          this.error = 'Failed to update user';
        }
        for (const key in this.serverErrors) {
          if (this.f[key]) {
            this.f[key].markAsTouched();
          }
        }
      }
    });
  }

  // Translate server error messages to Italian
  private translateErrors(errors: { [key: string]: string[] }): { [key: string]: string[] } {
    const translatedErrors: { [key: string]: string[] } = {};
    
    for (const [field, messages] of Object.entries(errors)) {
      translatedErrors[field] = messages.map((message: string) => {
        if (message.includes('has already been taken')) {
          return 'Questa email è già in uso';
        }
        if (message.includes('email') && message.includes('invalid')) {
          return 'Inserisci un indirizzo email valido';
        }
        if (message.includes('required')) {
          return 'Questo campo è obbligatorio';
        }
        return message;
      });
    }
    
    return translatedErrors;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin/users']);
  }
}
