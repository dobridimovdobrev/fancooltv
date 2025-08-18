import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { UserService, UpdateProfileRequest, User as ServiceUser, UpdateUserRequest } from '../../../services/user.service';
import { CountryService, Country } from '../../../services/country.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/auth.models';

@Component({
  selector: 'app-profile-edit-modal',
  templateUrl: './profile-edit-modal.component.html',
  styleUrls: ['./profile-edit-modal.component.scss']
})
export class ProfileEditModalComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  submitted = false;
  countries: Country[] = [];
  loadingCountries = false;
  currentUser: User | null = null;
  
  // Admin edit mode
  user?: ServiceUser;
  isAdminEdit = false;
  
  // Server validation errors
  serverErrors: { [key: string]: string[] } = {};
  
  @Output() profileUpdated = new EventEmitter<User>();
  @Output() onUserUpdated = new EventEmitter<User>();

  constructor(
    public modalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private countryService: CountryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if this is admin edit mode
    if (this.isAdminEdit && this.user) {
      // Convert ServiceUser to User for compatibility
      this.currentUser = {
        id: this.user.user_id,
        username: this.user.username,
        email: this.user.email,
        first_name: this.user.first_name,
        last_name: this.user.last_name,
        gender: this.user.gender,
        birthday: this.user.birthday,
        country_id: this.user.country_id,
        role: this.user.role_id === 1 ? 'admin' : 'user',
        created_at: this.user.created_at || '',
        updated_at: this.user.updated_at || ''
      };
    } else {
      this.currentUser = this.authService.currentUserValue;
    }
    console.log('Current user data:', JSON.stringify(this.currentUser, null, 2)); // Debug log
    // Initialize form first with empty values to prevent template errors
    this.initializeForm();
    this.loadCountries();
    this.loadUserData();
  }

  initializeForm(): void {
    console.log('Initializing form with user data:', this.currentUser);
    this.profileForm = this.formBuilder.group({
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      first_name: [this.currentUser?.first_name || '', [Validators.required]],
      last_name: [this.currentUser?.last_name || '', [Validators.required]],
      gender: [this.currentUser?.gender || '', [Validators.required]],
      user_status: [this.user?.user_status || 'active'],
      birthday: [this.currentUser?.birthday || '', [Validators.required]],
      country_id: [this.currentUser?.country_id || '', [Validators.required]],
      password: [''],
      password_confirmation: ['']
    });
    
    console.log('Form values after initialization:', this.profileForm.value);
    console.log('Form valid:', this.profileForm.valid);
    console.log('Form errors:', this.profileForm.errors);

    // Password is always optional for profile updates
    // No dynamic validation needed
  }

  loadUserData(): void {
    if (!this.currentUser?.id) {
      console.error('No current user ID available');
      this.initializeForm();
      return;
    }

    this.loading = true;
    console.log('Loading user data for ID:', this.currentUser.id);
    
    this.userService.getUserById(this.currentUser.id).subscribe({
      next: (response) => {
        console.log('Full user data loaded from API:', JSON.stringify(response.data, null, 2));
        
        // Map UserService.User to AuthModels.User and update currentUser
        this.currentUser = {
          id: response.data.user_id,
          username: response.data.username,
          email: response.data.email,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          gender: response.data.gender,
          birthday: response.data.birthday,
          country_id: response.data.country_id,
          role: response.data.role_id === 1 ? 'admin' : 'user',
          created_at: response.data.created_at || '',
          updated_at: response.data.updated_at || ''
        };
        
        console.log('Mapped user data:', JSON.stringify(this.currentUser, null, 2));
        this.loading = false;
        // Update form with loaded data - ensure password fields are empty
        this.profileForm.patchValue({
          email: this.currentUser.email,
          first_name: this.currentUser.first_name,
          last_name: this.currentUser.last_name,
          gender: this.currentUser.gender,
          birthday: this.currentUser.birthday,
          country_id: this.currentUser.country_id,
          password: '',
          password_confirmation: ''
        });
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        this.loading = false;
        // Fallback to current user data if API fails
        this.initializeForm();
      }
    });
  }

  loadCountries(): void {
    this.loadingCountries = true;
    this.countryService.getPublicCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.loadingCountries = false;
        
        // Update country field after countries are loaded
        if (this.currentUser?.country_id && this.profileForm) {
          this.profileForm.patchValue({
            country_id: this.currentUser.country_id
          });
        }
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.loadingCountries = false;
        this.countries = [];
      }
    });
  }

  get f() {
    return this.profileForm.controls;
  }

  hasServerError(fieldName: string): boolean {
    return this.serverErrors && this.serverErrors[fieldName] !== undefined;
  }

  getServerError(fieldName: string): string {
    return this.serverErrors && this.serverErrors[fieldName] ? 
      this.serverErrors[fieldName].join(', ') : '';
  }

  onSubmit(): void {
    this.submitted = true;
    this.serverErrors = {};

    if (this.profileForm.invalid) {
      return;
    }

    // Check password only if user wants to change it
    const password = this.f['password'].value?.trim();
    const passwordConfirmation = this.f['password_confirmation'].value?.trim();
    
    // Only validate passwords if user entered something in password field
    if (password) {
      if (password.length < 8) {
        this.serverErrors['password'] = ['La password deve essere di almeno 8 caratteri'];
        return;
      }
      if (password !== passwordConfirmation) {
        this.serverErrors['password_confirmation'] = ['Le password non corrispondono'];
        return;
      }
    }

    this.loading = true;

    // Prepare update data - only send changed values
    if (this.isAdminEdit && this.user) {
      // Admin edit mode - use updateUser
      const updateData: UpdateUserRequest = {};
      
      // Only include email if it's different from current
      if (this.f['email'].value !== this.currentUser?.email) {
        updateData.email = this.f['email'].value;
      }
      
      // Always send other fields
      updateData.first_name = this.f['first_name'].value;
      updateData.last_name = this.f['last_name'].value;
      updateData.gender = this.f['gender'].value;
      updateData.birthday = this.f['birthday'].value;
      updateData.country_id = parseInt(this.f['country_id'].value, 10);
      updateData.user_status = this.f['user_status'].value;
      
      if (password) {
        updateData.password = password;
        updateData.password_confirmation = passwordConfirmation;
      }

      this.userService.updateUser(this.user.user_id, updateData).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Admin update response:', response);
          
          if (response && response.data) {
            // Convert ServiceUser to User for compatibility
            const mappedUser: User = {
              id: response.data.user_id,
              username: response.data.username,
              email: response.data.email,
              first_name: response.data.first_name,
              last_name: response.data.last_name,
              gender: response.data.gender,
              birthday: response.data.birthday,
              country_id: response.data.country_id,
              role: response.data.role_id === 1 ? 'admin' : 'user',
              created_at: response.data.created_at || '',
              updated_at: response.data.updated_at || ''
            };
            this.onUserUpdated.emit(mappedUser);
          }
          this.modalRef.hide();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error updating user:', error);
          
          if (error.status === 422 && error.error?.errors) {
            this.serverErrors = error.error.errors;
          } else if (error.status === 500 && error.error?.message?.includes('email')) {
            this.serverErrors = { email: ['Questa email è già in uso'] };
          } else {
            this.serverErrors = { general: ['Errore durante l\'aggiornamento. Riprova.'] };
          }
        }
      });
    } else {
      // Regular user profile update
      const updateData: UpdateProfileRequest = {};
      
      // Only include email if it's different from current
      if (this.f['email'].value !== this.currentUser?.email) {
        updateData.email = this.f['email'].value;
      }
      
      // Always send other fields
      updateData.first_name = this.f['first_name'].value;
      updateData.last_name = this.f['last_name'].value;
      updateData.gender = this.f['gender'].value;
      updateData.birthday = this.f['birthday'].value;
      updateData.country_id = parseInt(this.f['country_id'].value, 10);
      
      if (password) {
        updateData.password = password;
        updateData.password_confirmation = passwordConfirmation;
      }

      this.userService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Update response:', response);
        
        // Check if response has data
        if (response && response.data) {
          // Map UserService.User to AuthModels.User
          const mappedUser: User = {
            id: response.data.user_id || this.currentUser?.id || 0,
            username: response.data.username || this.currentUser?.username || '',
            email: response.data.email || this.currentUser?.email || '',
            first_name: response.data.first_name || this.currentUser?.first_name || '',
            last_name: response.data.last_name || this.currentUser?.last_name || '',
            gender: response.data.gender || this.currentUser?.gender || '',
            birthday: response.data.birthday || this.currentUser?.birthday || '',
            country_id: response.data.country_id || this.currentUser?.country_id,
            role: response.data.role_id === 1 ? 'admin' : 'user',
            created_at: response.data.created_at || this.currentUser?.created_at || '',
            updated_at: response.data.updated_at || this.currentUser?.updated_at || ''
          };
          this.profileUpdated.emit(mappedUser);
        }
        this.modalRef.hide();
      },
      error: (error) => {
        this.loading = false;
        console.error('Profile update error:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        
        // Reset errors
        this.serverErrors = {};
        
        // Handle different error scenarios like in register component
        if (error && error.errors) {
          // Case 1: Direct error from auth service
          console.log('Errori di validazione dal servizio auth:', error.errors);
          this.serverErrors = error.errors;
        } else if (error && error.error && error.error.errors) {
          // Case 2: Standard HTTP error with validation errors
          console.log('Errori di validazione HTTP standard:', error.error.errors);
          this.serverErrors = error.error.errors;
        } else if (error.status === 500) {
          // Case 3: Server error 500 - likely email already exists
          console.log('Errore 500 - probabilmente email duplicata');
          this.serverErrors = { email: ['Questa email è già in uso'] };
        } else if (error.status === 422) {
          // Case 4: Validation error without specific field info
          this.serverErrors = { general: ['Alcuni dati inseriti non sono validi'] };
        } else {
          // Case 5: Generic error
          this.serverErrors = { general: ['Si è verificato un errore durante l\'aggiornamento del profilo'] };
        }
        
        console.log('serverErrors dopo assegnazione:', this.serverErrors);
        
        // Mark fields with errors as touched
        for (const key in this.serverErrors) {
          if (this.f[key]) {
            this.f[key].markAsTouched();
          }
        }
      }
    });
    }
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

  cancel(): void {
    this.modalRef.hide();
  }
}
