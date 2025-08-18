import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Person } from '../../../models/media.models';
import { ApiService } from '../../../services/api.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-person-form',
  templateUrl: './person-form.component.html',
  styleUrls: ['./person-form.component.scss']
})
export class PersonFormComponent implements OnInit {
  @Input() person: Person | null = null;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  personForm: FormGroup;
  loading = false;
  uploadingPhoto = false;
  
  // Variabili per tenere traccia dell'immagine caricata
  uploadedImageId: number | null = null;
  uploadedImageFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    public apiService: ApiService
  ) {
    this.personForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.person) {
      this.populateForm(this.person);
    }
  }

  /**
   * Create the form with all required fields and validations
   */
  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      profile_image: [''] // Solo URL completo, non servono più base_path e size_path
    });
  }

  /**
   * Populate form with existing person data
   */
  populateForm(person: Person): void {
    console.log('Popolo il form con i dati della persona:', person);
    this.personForm.patchValue({
      name: person.name,
      profile_image: person.profile_image_full || person.profile_image
      // Use profile_image_full if available, fallback to profile_image
    });
    
    // If person has an image, store the image ID for potential updates
    if (person.image_id) {
      this.uploadedImageId = person.image_id;
      console.log('Person has existing image ID:', person.image_id);
    }
  }

  /**
   * Handle photo upload
   * Step 1: Upload image and get image_id
   */
  onPhotoUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadingPhoto = true;
      this.uploadedImageFile = file;
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'persons');
      
      this.apiService.uploadImage(formData).subscribe({
        next: (response: any) => {
          console.log('Image upload response:', response);
          
          if (response && response.status === 'success' && response.message && response.message.image) {
            // Save the uploaded image ID
            this.uploadedImageId = response.message.image.image_id;
            
            // Update form with image URL
            this.personForm.patchValue({ 
              profile_image: response.message.full_url
            });
            
            console.log('✅ Image uploaded successfully, ID:', this.uploadedImageId);
            console.log('✅ Image URL:', response.message.full_url);
          } else {
            console.error('❌ Invalid API response:', response);
            alert('Invalid response from server during photo upload.');
          }
          
          this.uploadingPhoto = false;
        },
        error: (error: any) => {
          console.error('Error uploading photo:', error);
          this.uploadingPhoto = false;
          
          let errorMsg = 'Error uploading photo.';
          if (error.error && error.error.message) {
            errorMsg += ' Details: ' + error.error.message;
          }
          alert(errorMsg);
        }
      });
    }
  }

  /**
   * Form submission
   * Implementa la procedura completa per creare una persona con immagine
   */
  onSubmit(): void {
    if (this.personForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.personForm);
      return;
    }

    // Prevent multiple submissions
    if (this.loading) {
      return;
    }

    this.loading = true;
    const personName = this.personForm.get('name')?.value;
    
    // Se stiamo modificando una persona esistente
    if (this.person) {
      // Prepare update data
      const updates: any = {};
      if (personName) updates.name = personName;
      
      // Handle image update - use new uploaded image or keep existing
      if (this.uploadedImageId && this.uploadedImageId !== this.person.image_id) {
        updates.image_file_id = this.uploadedImageId;
        console.log('🔄 Updating person with new image ID:', this.uploadedImageId);
      }
      
      this.formSubmit.emit({ updates, hasImageUpdate: !!updates.image_file_id });
      this.loading = false; // Reset loading state after emitting
      return;
    }
    
    // Create person with image_file_id in single request
    this.apiService.createPerson(personName, this.uploadedImageId || undefined).pipe(
      switchMap((personResponse: any) => {
        console.log('Person creation API response:', personResponse);
        
        // Access correct response structure according to documentation
        if (personResponse && personResponse.status === 'success' && personResponse.message && personResponse.message.person) {
          const personId = personResponse.message.person.person_id;
          console.log('✅ Person created successfully, ID:', personId);
          return of({ success: true, personId: personId });
        } else {
          console.error('Invalid API response:', personResponse);
          return of({ success: false, error: 'Invalid API response' });
        }
      }),
      catchError(error => {
        console.error('Errore durante la creazione della persona:', error);
        return of({ success: false, error: error });
      })
    ).subscribe({
      next: (result: any) => {
        this.loading = false;
        
        if (result.success) {
          // Emetti i dati del form per notificare il componente padre
          const formData = this.personForm.value;
          this.formSubmit.emit(formData);
        } else {
          alert('Si è verificato un errore durante la creazione della persona.');
        }
      },
      error: (error: any) => {
        console.error('Errore durante la procedura di creazione persona:', error);
        this.loading = false;
        alert('Si è verificato un errore durante la creazione della persona.');
      }
    });
  }

  /**
   * Helper to mark all form controls as touched
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Cancel form
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Gestisce l'errore di caricamento immagine
   * @param event L'evento di errore
   */
  onImageError(event: any): void {
    // Se l'immagine non si carica, usiamo il poster dei film come fallback
    // poiché il placeholder-person.jpg non esiste
    event.target.src = 'assets/images/movies-poster.jpg';
  }
}
