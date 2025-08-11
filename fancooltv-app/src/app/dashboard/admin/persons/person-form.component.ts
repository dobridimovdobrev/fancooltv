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
      profile_image: person.profile_image
      // Non è più necessario salvare base_path e size_path poiché l'API restituisce l'URL completo
    });
  }

  /**
   * Handle photo upload
   * Passo 1: Carica l'immagine e ottiene l'ID dell'immagine
   */
  onPhotoUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadingPhoto = true;
      this.uploadedImageFile = file;
      
      const personName = this.personForm.get('name')?.value || 'Nuova persona';
      
      this.apiService.uploadPersonImage(file, personName).subscribe({
        next: (response: any) => {
          console.log('Risposta API caricamento immagine:', response);
          
          // Corretto accesso alla struttura della risposta API
          if (response && response.status === 'success' && response.message && response.message.imageFile) {
            // Salviamo l'ID dell'immagine caricata
            this.uploadedImageId = response.message.imageFile.id;
            
            // Aggiorniamo il form con tutti i campi dell'immagine
            if (response.message.imageFile) {
              const imageFile = response.message.imageFile;
              
              // Usiamo direttamente l'URL completo
              this.personForm.patchValue({ 
                profile_image: imageFile.url
              });
              
              console.log('URL immagine salvato nel form:', imageFile.url);
            }
            
            this.uploadingPhoto = false;
            console.log('Immagine caricata con successo, ID:', this.uploadedImageId);
          } else {
            console.error('Risposta API non valida:', response);
            this.uploadingPhoto = false;
            alert('Risposta non valida dal server durante il caricamento della foto.');
          }
        },
        error: (error: any) => {
          console.error('Errore durante il caricamento della foto:', error);
          this.uploadingPhoto = false;
          
          // Mostriamo un messaggio di errore più dettagliato
          let errorMsg = 'Si è verificato un errore durante il caricamento della foto.';
          if (error.error && error.error.message) {
            errorMsg += ' Dettaglio: ' + error.error.message;
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

    this.loading = true;
    const personName = this.personForm.get('name')?.value;
    
    // Se stiamo modificando una persona esistente
    if (this.person) {
      // Emetti i dati del form per l'aggiornamento
      const formData = this.personForm.value;
      this.formSubmit.emit(formData);
      return;
    }
    
    // Se stiamo creando una nuova persona
    // Passo 2: Creare la persona
    this.apiService.createPerson(personName).pipe(
      switchMap((personResponse: any) => {
        console.log('Risposta API creazione persona:', personResponse);
        
        // Corretto accesso alla struttura della risposta API
        if (personResponse && personResponse.status === 'success' && personResponse.message && personResponse.message.person) {
          const personId = personResponse.message.person.id;
          console.log('Persona creata con successo, ID:', personId);
          
          // Se abbiamo un'immagine caricata, procediamo con il passo 3
          if (this.uploadedImageId) {
            // Passo 3: Associare l'immagine alla persona
            return this.apiService.associateImageToPerson(personId, this.uploadedImageId).pipe(
              catchError(error => {
                console.error('Errore durante l\'associazione dell\'immagine alla persona:', error);
                // Anche se l'associazione fallisce, restituiamo comunque i dati della persona
                return of({ success: true, personId: personId });
              })
            );
          } else {
            // Se non c'è un'immagine da associare, restituiamo i dati della persona
            return of({ success: true, personId: personId });
          }
        } else {
          console.error('Risposta API non valida:', personResponse);
          return of({ success: false, error: 'Risposta API non valida' });
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
