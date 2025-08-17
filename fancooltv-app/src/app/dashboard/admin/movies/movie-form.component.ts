import { Component, ElementRef, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category, ImageFile, Movie, Person, Trailer, VideoFile } from '../../../models/media.models';
import { ApiService } from '../../../services/api.service';
import { ApiResponse } from '../../../models/api.models';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-movie-form',
  templateUrl: './movie-form.component.html',
  styleUrls: ['./movie-form.component.scss']
})
export class MovieFormComponent implements OnInit {
  @Input() movie: Movie | null = null;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() view = new EventEmitter<Movie>();
  @Output() delete = new EventEmitter<Movie>();

  movieForm: FormGroup;
  categories: Category[] = [];
  persons: Person[] = [];
  personsForDisplay: Person[] = []; // Array per mantenere le persone associate al film per la visualizzazione
  loading = false;
  
  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  modalRef?: BsModalRef;
  uploadingPoster = false;
  uploadingBackdrop = false;
  uploadingTrailer: boolean[] = [];
  uploadingVideoFile: boolean[] = [];
  trailerUploadProgress: number[] = [];
  videoFileUploadProgress: number[] = [];

  // Status options for dropdown
  statusOptions = [
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'sheduled', label: 'Scheduled' },
    { value: 'coming soon', label: 'Coming Soon' }
  ];

  constructor(
    private fb: FormBuilder,
    public apiService: ApiService,
    private modalService: BsModalService,
    private sanitizer: DomSanitizer
  ) {
    this.movieForm = this.createForm();
  }

  ngOnInit(): void {
    // Prima carichiamo le categorie
    this.apiService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
        console.log('Categorie caricate:', this.categories);
        
        // SOLO DOPO che le categorie sono caricate, popoliamo il form
        if (this.movie) {
          console.log('Popolo il form con il film:', this.movie);
          this.populateForm(this.movie);
          
          // FORZIAMO la selezione della categoria
          // Otteniamo l'ID categoria dal film
          let categoryId = this.movie.category_id;
          
          // Se category_id non è definito ma l'oggetto category esiste, usiamo quello
          if (!categoryId && this.movie.category && this.movie.category.category_id) {
            categoryId = this.movie.category.category_id;
            console.log('Usando category_id dall\'oggetto category in ngOnInit:', categoryId);
          }
          
          if (categoryId) {
            console.log('Imposto forzatamente la categoria:', categoryId);
            setTimeout(() => {
              this.movieForm.get('category_id')?.setValue(categoryId);
            }, 100);
          }
        }
      },
      error: (error) => {
        console.error('Errore caricamento categorie:', error);
      }
    });
    
    // Carichiamo solo le persone associate al film se stiamo modificando un film esistente
    if (this.movie && this.movie.persons && this.movie.persons.length > 0) {
      console.log('Film ha persone associate:', this.movie.persons.length);
      // Aggiungiamo le persone associate al film all'array delle persone
      this.persons = [...this.movie.persons];
      console.log('Persone caricate per il film:', this.persons);
    } else {
      // Inizializziamo l'array delle persone vuoto
      this.persons = [];
    }
    
    // Aggiunge listener per la generazione automatica dello slug dal titolo
    this.movieForm.get('title')?.valueChanges.subscribe(title => {
      // Genera lo slug solo se il campo slug è vuoto o non è stato modificato manualmente
      if (!this.movieForm.get('slug')?.value) {
        const slug = this.generateSlug(title);
        this.movieForm.get('slug')?.setValue(slug);
      }
    });
  }

  // Create the form with all required fields and validations
  createForm(): FormGroup {
    return this.fb.group({
      // Basic movie data - required fields
      title: ['', [Validators.required, Validators.maxLength(128)]],
      slug: ['', [Validators.maxLength(128)]],
      description: ['', [Validators.required]],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(2100)]],
      duration: ['', [Validators.min(1)]],
      imdb_rating: ['', [Validators.min(0), Validators.max(10)]],
      premiere_date: [''],
      status: ['published', [Validators.required]],
      category_id: [null, [Validators.required]],
      
      // Image URLs - required fields
      poster: ['', [Validators.required]],
      backdrop: ['', [Validators.required]],
      
      // Optional arrays
      persons: this.fb.array([]),
      video_files: this.fb.array([]),
      image_files: this.fb.array([])
    });
  }

  // Populate form with existing movie data
  populateForm(movie: Movie): void {
    console.log('MOVIE COMPLETO:', movie);
    
    // Determiniamo il valore corretto per category_id
    let categoryId = null;
    
    // Se category_id è definito nel film, lo usiamo
    if (movie.category_id) {
      categoryId = movie.category_id;
      console.log('Usando category_id dal film:', categoryId);
    } 
    // Altrimenti, se l'oggetto category esiste, usiamo il suo id (che nell'API è chiamato 'id' ma nel modello è 'category_id')
    else if (movie.category && (movie.category as any).id) {
      categoryId = (movie.category as any).id;
      console.log('Usando id dall\'oggetto category (API):', categoryId);
    }
    // Come ultima risorsa, se c'è category.category_id
    else if (movie.category && movie.category.category_id) {
      categoryId = movie.category.category_id;
      console.log('Usando category_id dall\'oggetto category:', categoryId);
    }
    
    // Impostiamo tutti i valori del form inclusa la categoria
    this.movieForm.patchValue({
      title: movie.title,
      slug: movie.slug,
      description: movie.description,
      year: movie.year,
      duration: movie.duration,
      imdb_rating: movie.imdb_rating,
      premiere_date: movie.premiere_date,
      status: movie.status,
      category_id: categoryId, // Impostiamo il valore corretto della categoria
      poster: movie.poster,
      backdrop: movie.backdrop
    });
    
    console.log('Valore categoria impostato nel form:', this.movieForm.get('category_id')?.value);
    
    // Clear and populate persons array
    const personsArray = this.movieForm.get('persons') as FormArray;
    personsArray.clear();
    if (movie.persons && movie.persons.length) {
      movie.persons.forEach(person => {
        personsArray.push(this.fb.group({
          person_id: [person.person_id || '']
        }));
      });
    }


    // Clear and populate video files array
    const videoFilesArray = this.movieForm.get('video_files') as FormArray;
    videoFilesArray.clear();
    if (movie.video_files && movie.video_files.length) {
      movie.video_files.forEach(videoFile => {
        videoFilesArray.push(this.fb.group({
          id: [videoFile.id || null],
          url: [videoFile.url || ''],
          title: [videoFile.title || '']
        }));
      });
    }

    // Clear and populate image files array
    const imageFilesArray = this.movieForm.get('image_files') as FormArray;
    imageFilesArray.clear();
    if (movie.image_files && movie.image_files.length) {
      movie.image_files.forEach(imageFile => {
        imageFilesArray.push(this.fb.group({
          id: [imageFile.id || null],
          url: [imageFile.url || ''],
          type: [imageFile.type || '']
        }));
      });
    }
  }

  // Load categories for dropdown
  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
        
        // Se abbiamo un film, forziamo la selezione della categoria
        if (this.movie && this.movie.category_id) {
          // Forza l'aggiornamento della categoria
          setTimeout(() => {
            // IMPORTANTE: Convertiamo esplicitamente a stringa
            const categoryId = this.movie?.category_id;
            if (categoryId) {
              this.movieForm.get('category_id')?.setValue(categoryId.toString());
              console.log('Categoria impostata:', categoryId.toString());
            }
          }, 0);
        }
      },
      error: (error: any) => {
        console.error('Error loading categories', error);
      }
    });
  }

  // Variabili per la gestione delle persone e del modal
  isLoadingPersons: boolean = false;
  currentPersonIndex: number = -1;
  personModalRef?: BsModalRef;

  // Riferimenti agli elementi del DOM
  @ViewChild('personModal') personModal!: TemplateRef<any>;
  @ViewChild('searchPersonInput') searchPersonInput!: ElementRef;

  
  // Ottieni il nome di una persona dal suo ID
  getPersonName(personId: string): string {
    if (!personId) return '';
    
    // Prima cerchiamo nell'array principale
    let person = this.persons.find(p => p.person_id.toString() === personId.toString());
    
    // Se non troviamo la persona nell'array principale, cerchiamo nell'array di visualizzazione
    if (!person && this.personsForDisplay.length > 0) {
      person = this.personsForDisplay.find(p => p.person_id.toString() === personId.toString());
      if (person) {
        console.log(`Persona trovata nell'array di visualizzazione: ${person.name}`);
      }
    }
    
    // Se abbiamo trovato la persona, restituiamo il suo nome
    if (person) {
      return person.name;
    }
    
    // Se non abbiamo trovato la persona in nessun array, carichiamola dall'API
    console.log(`Persona con ID ${personId} non trovata in nessun array. Caricamento dall'API...`);
    
    // Caricamento asincrono della persona dall'API
    this.apiService.getPerson(personId).subscribe({
      next: (response: ApiResponse<Person>) => {
        if (response && response.data) {
          // Aggiungiamo la persona all'array di visualizzazione
          this.personsForDisplay.push(response.data);
          console.log(`Persona caricata dall'API: ${response.data.name}`);
          
          // Forziamo il refresh della vista
          setTimeout(() => {
            // Questo triggerà il change detection di Angular
          }, 0);
        }
      },
      error: (err: any) => {
        console.error(`Errore nel caricamento della persona con ID ${personId}:`, err);
      }
    });
    
    // Restituiamo l'ID come fallback mentre aspettiamo la risposta dell'API
    return `ID: ${personId}`;
  }
  
  // Metodo rimosso perché la logica di rimozione dei duplicati è stata integrata direttamente nel metodo searchPerson

  // Funzione trackBy per ottimizzare il rendering delle liste e prevenire duplicati visivi
  trackByPersonId(index: number, person: Person): string {
    return person.person_id.toString();
  }

  // Apre il modal per la selezione della persona
  openPersonModal(index: number = -1): void {
    this.currentPersonIndex = index;
    
    // Reset della lista delle persone per la ricerca
    this.persons = [];
    
    // Apre il modal usando ngx-bootstrap
    this.personModalRef = this.modalService.show(this.personModal, {
      class: 'modal-lg modal-dialog-centered',
      backdrop: 'static',
      keyboard: false
    });
    
    // Focus sul campo di ricerca
    setTimeout(() => {
      if (this.searchPersonInput) {
        this.searchPersonInput.nativeElement.focus();
      }
    }, 300);
  }

  // Cerca persone nel modal
  searchPersonInModal(query: string): void {
    if (!query || query.length < 2) {
      this.persons = [];
      return;
    }
    
    this.isLoadingPersons = true;
    this.apiService.searchPersons(query).subscribe({
      next: (response: any) => {
        this.persons = response.data || [];
        this.isLoadingPersons = false;
      },
      error: (error: any) => {
        console.error('Error searching persons:', error);
        this.persons = [];
        this.isLoadingPersons = false;
      }
    });
  }

  // Seleziona una persona dal modal
  selectPersonFromModal(personId: string): void {
    if (this.currentPersonIndex >= 0) {
      // Modifica persona esistente
      const personsArray = this.movieForm.get('persons') as FormArray;
      personsArray.at(this.currentPersonIndex).get('person_id')?.setValue(personId);
    } else {
      // Aggiungi nuova persona
      this.personsArray.push(this.fb.group({
        person_id: [personId],
        role: ['']
      }));
    }
    
    this.personModalRef?.hide();
    
    // Reset dell'indice corrente
    this.currentPersonIndex = -1;
  }

  // Prepare form data for API submission
  prepareFormData(): any {
    const formValue = this.movieForm.value;
    
    // Convert persons array from objects to array of IDs only
    if (formValue.persons && Array.isArray(formValue.persons)) {
      formValue.persons = formValue.persons
        .filter((person: any) => person.person_id && person.person_id.toString().trim() !== '')
        .map((person: any) => parseInt(person.person_id, 10));
    }
    
    // Handle poster and backdrop - extract URL from object or use string directly
    if (formValue.poster) {
      if (typeof formValue.poster === 'object' && formValue.poster.url) {
        formValue.poster = formValue.poster.url; // Extract URL from object
      } else if (typeof formValue.poster === 'string' && formValue.poster.trim() === '') {
        delete formValue.poster; // Remove empty string
      }
    } else {
      delete formValue.poster; // Remove if null/undefined
    }
    
    if (formValue.backdrop) {
      if (typeof formValue.backdrop === 'object' && formValue.backdrop.url) {
        formValue.backdrop = formValue.backdrop.url; // Extract URL from object
      } else if (typeof formValue.backdrop === 'string' && formValue.backdrop.trim() === '') {
        delete formValue.backdrop; // Remove empty string
      }
    } else {
      delete formValue.backdrop; // Remove if null/undefined
    }
    
    // Add missing database fields with default values
    if (!formValue.format) {
      formValue.format = 'HD'; // Default format
    }
    if (!formValue.language) {
      formValue.language = 'en'; // Default language
    }
    if (!formValue.country) {
      formValue.country = 'US'; // Default country
    }
    
    // Genera lo slug se non è stato specificato
    if (!formValue.slug && formValue.title) {
      formValue.slug = this.generateSlug(formValue.title);
    }

    // ... (rest of the code remains the same)
    // No field name changes needed

    // Log each field for debugging
    console.log('=== FORM DATA ANALYSIS ===');
    console.log('Title:', formValue.title);
    console.log('Description:', formValue.description);
    console.log('Year:', formValue.year);
    console.log('Category ID:', formValue.category_id);
    console.log('Poster:', formValue.poster);
    console.log('Backdrop:', formValue.backdrop);
    console.log('Format:', formValue.format);
    console.log('Language:', formValue.language);
    console.log('Country:', formValue.country);
    console.log('Video Files:', formValue.video_files);
    console.log('Video Files DETAILED:', JSON.stringify(formValue.video_files, null, 2));
    console.log('Persons:', formValue.persons);
    console.log('Persons DETAILED:', JSON.stringify(formValue.persons, null, 2));
    console.log('Slug:', formValue.slug);
    console.log('=== END ANALYSIS ===');

    return formValue;
  }
  
  /**
   * Genera uno slug dal titolo del film
   * @param title Il titolo del film
   * @returns Lo slug generato
   */
  generateSlug(title: string): string {
    if (!title) return '';
    
    // Converti in minuscolo e rimuovi caratteri speciali
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Rimuovi caratteri speciali
      .replace(/[\s_-]+/g, '-') // Sostituisci spazi e underscore con trattini
      .replace(/^-+|-+$/g, ''); // Rimuovi trattini iniziali e finali
    
    // Aggiungi timestamp per garantire unicità
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  }
  
  /**
   * Check if the form is valid
   * @returns true if the form is valid, false otherwise
   */
  isValid(): boolean {
    if (this.movieForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.movieForm.markAllAsTouched();
      return false;
    }
    return true;
  }

  // Helper methods for FormArray access
  get personsArray(): FormArray {
    return this.movieForm.get('persons') as FormArray;
  }


  get videoFilesArray(): FormArray {
    return this.movieForm.get('video_files') as FormArray;
  }

  get imageFilesArray(): FormArray {
    return this.movieForm.get('image_files') as FormArray;
  }
  
  /**
   * Get the form data ready for API submission
   * @returns prepared form data
   */
  getFormData(): any {
    return this.prepareFormData();
  }

  // Form submission
  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    this.movieForm.markAllAsTouched();
    
    if (this.isValid()) {
      const formData = this.prepareFormData();
      this.formSubmit.emit(formData);
    }
  }

  // Cancel form
  onCancel(): void {
    this.cancel.emit();
  }
  
  // View movie details
  onView(): void {
    if (this.movie) {
      this.view.emit(this.movie);
    }
  }
  
  // Delete movie
  onDelete(): void {
    if (this.movie) {
      // Open the delete confirmation modal
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-md modal-dialog-centered',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Confirm movie deletion
   */
  confirmDelete(): void {
    if (this.movie) {
      this.loading = true;
      
      this.apiService.deleteMovie(this.movie.movie_id).subscribe({
        next: (response: any) => {
          console.log('Movie deleted successfully:', response);
          this.modalRef?.hide();
          this.loading = false;
          this.delete.emit(this.movie!);
        },
        error: (error: any) => {
          console.error('Error deleting movie:', error);
          this.loading = false;
          this.modalRef?.hide();
        }
      });
    }
  }

  /**
   * Cancel movie deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
  }


  // Add video file
  addVideoFile(): void {
    this.videoFilesArray.push(this.fb.group({
      id: [null],
      url: [''],
      title: ['']
    }));
  }

  // Remove video file
  removeVideoFile(index: number): void {
    this.videoFilesArray.removeAt(index);
  }

  // Add person - open modal
  addPerson(): void {
    if (this.personsArray.length >= 5) {
      return; // Don't open modal if limit reached
    }
    this.openPersonModal(-1);
  }

  // Check if can add more persons
  canAddPerson(): boolean {
    return this.personsArray.length < 5;
  }

  // Remove person
  removePerson(index: number): void {
    this.personsArray.removeAt(index);
  }



  // Handle file uploads
  onPosterUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadingPoster = true;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'poster');
      
      this.apiService.uploadImage(formData).subscribe({
        next: (response: any) => {
          console.log('Poster upload response:', response);
          if (response && response.message) {
            const imageUrl = response.message.full_url || response.message.url || response.message.path;
            if (imageUrl) {
              this.movieForm.patchValue({ poster: imageUrl });
            } else {
              console.error('No image URL found in response:', response.message);
            }
          } else {
            console.error('Invalid response structure:', response);
          }
          this.uploadingPoster = false;
        },
        error: (error: any) => {
          console.error('Error uploading poster', error);
          this.uploadingPoster = false;
        }
      });
    }
  }

  onBackdropUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadingBackdrop = true;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'backdrop');
      
      this.apiService.uploadImage(formData).subscribe({
        next: (response: any) => {
          console.log('Backdrop upload response:', response);
          if (response && response.message) {
            const imageUrl = response.message.full_url || response.message.url || response.message.path;
            if (imageUrl) {
              this.movieForm.patchValue({ backdrop: imageUrl });
            } else {
              console.error('No image URL found in response:', response.message);
            }
          } else {
            console.error('Invalid response structure:', response);
          }
          this.uploadingBackdrop = false;
        },
        error: (error: any) => {
          console.error('Error uploading backdrop', error);
          this.uploadingBackdrop = false;
        }
      });
    }
  }


  // Handle video file upload
  onVideoFileUpload(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      if (!this.canUploadFiles()) {
        alert('Please fill in Title, Description, Year, Category, and upload Poster & Backdrop before uploading videos.');
        event.target.value = '';
        return;
      }

      this.uploadingVideoFile[index] = true;
      this.videoFileUploadProgress[index] = 0;
      const formData = new FormData();
      formData.append('video', file);
      formData.append('type', 'movie');
      
      this.apiService.uploadVideoWithProgress(formData).subscribe({
        next: (event: any) => {
          if (event.type === 'progress') {
            this.videoFileUploadProgress[index] = event.progress;
          } else if (event.type === 'response') {
            console.log('Video file upload response:', event.response);
            console.log('DEBUG: Checking response structure...');
            console.log('DEBUG: event.response.stream_url =', event.response.stream_url);
            console.log('DEBUG: event.response.message =', event.response.message);
            
            if (event.response && event.response.message && event.response.message.stream_url) {
              // Use the stream_url from the upload response
              const videoFileId = event.response.message.video.video_file_id;
              console.log('DEBUG: videoFileId extracted =', videoFileId);
              
              this.videoFilesArray.at(index).patchValue({
                url: event.response.message.stream_url,
                id: videoFileId,
                video_file_id: videoFileId,
                format: event.response.message.video.format || 'mp4',
                resolution: event.response.message.video.resolution || '720p',
                title: event.response.message.video.title || ''
              });
              console.log('✅ Video URL updated in form:', event.response.message.stream_url);
              console.log('✅ Video file ID added to form:', videoFileId);
            } else if (event.response && event.response.message && event.response.message.streaming_url) {
              // Fallback to old format
              this.videoFilesArray.at(index).patchValue({
                url: event.response.message.streaming_url
              });
            } else {
              console.log('❌ No stream_url found in response');
            }
            this.uploadingVideoFile[index] = false;
            this.videoFileUploadProgress[index] = 100;
          }
        },
        error: (error: any) => {
          console.error('Error uploading video file', error);
          this.uploadingVideoFile[index] = false;
          this.videoFileUploadProgress[index] = 0;
        }
      });
    }
  }
  
  // Get safe video streaming URL
  getSafeVideoStreamingUrl(streamUrl: string): SafeUrl {
    if (!streamUrl) return this.sanitizer.bypassSecurityTrustUrl('');
    const fullUrl = this.apiService.getVideoUrl(streamUrl);
    return this.sanitizer.bypassSecurityTrustUrl(fullUrl);
  }

  // Check if video is uploaded
  hasVideoUrl(url: string | null | undefined): boolean {
    return Boolean(url && url.trim && url.trim() !== '');
  }

  // Video player progress tracking
  videoPlayers: {[key: string]: HTMLVideoElement} = {};
  videoProgress: {[key: string]: number} = {};
  
  /**
   * Register a video element for progress tracking
   * @param video The video element
   * @param id Unique identifier for the video
   */
  registerVideoPlayer(video: HTMLVideoElement, id: string): void {
    this.videoPlayers[id] = video;
    this.videoProgress[id] = 0;
    
    // Add event listeners for progress tracking
    video.addEventListener('timeupdate', () => {
      if (video.duration) {
        this.videoProgress[id] = (video.currentTime / video.duration) * 100;
      }
    });
    
    video.addEventListener('ended', () => {
      this.videoProgress[id] = 100;
    });
  }
  
  /**
   * Get the current progress for a video
   * @param id Unique identifier for the video
   * @returns Progress percentage (0-100)
   */
  getVideoProgress(id: string): number {
    return this.videoProgress[id] || 0;
  }

  // Check if basic required fields are filled to allow video uploads
  canUploadFiles(): boolean {
    const form = this.movieForm;
    const title = form.get('title')?.value;
    const description = form.get('description')?.value;
    const year = form.get('year')?.value;
    const categoryId = form.get('category_id')?.value;
    const poster = form.get('poster')?.value;
    const backdrop = form.get('backdrop')?.value;
    
    const canUpload = !!(title && description && year && categoryId && poster && backdrop);
    
    return canUpload;
  }

  // Funzione di confronto per il select della categoria
  compareCategories(item1: any, item2: any): boolean {
    // Converti entrambi i valori in stringhe per un confronto sicuro
    return item1 && item2 && item1.toString() === item2.toString();
  }
}
