import { Component, ElementRef, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
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
  @ViewChild('deleteVideoModal') deleteVideoModal!: TemplateRef<any>;
  @ViewChild('uploadProgressModal') uploadProgressModal!: TemplateRef<any>;
  @ViewChild('personModal') personModal!: TemplateRef<any>;
  @ViewChild('searchPersonInput') searchPersonInput!: ElementRef;
  modalRef?: BsModalRef;
  uploadModalRef?: BsModalRef;
  personModalRef?: BsModalRef;
  videoToDeleteIndex: number = -1;
  uploadingPoster = false;
  uploadingBackdrop = false;
  uploadingTrailer: boolean[] = [];
  uploadingVideoFile: boolean[] = [];
  trailerUploadProgress: number[] = [];
  videoFileUploadProgress: number[] = [];
  currentPersonIndex: number = -1;
  isLoadingPersons: boolean = false;
  
  // File storage variables (like TV series form)
  posterFile: File | null = null;
  backdropFile: File | null = null;
  videoFiles: { [key: string]: File } = {};
  deletedVideoIds: number[] = []; // Track deleted video IDs
  
  // Preview URLs
  posterPreviewUrl: string | null = null;
  backdropPreviewUrl: string | null = null;

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
    private sanitizer: DomSanitizer,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private appRef: ApplicationRef
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
    // Reset deleted video IDs when repopulating form
    this.deletedVideoIds = [];
    if (movie.video_files && movie.video_files.length) {
      movie.video_files.forEach(videoFile => {
        videoFilesArray.push(this.fb.group({
          id: [videoFile.video_file_id || null], // Use video_file_id from API
          url: [videoFile.stream_url || videoFile.url || ''],
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

  // Upload progress tracking
  uploadProgress: number = 0;
  // Variabile per memorizzare il progresso massimo raggiunto
  private maxUploadProgress: number = 0;
  // Flag per indicare che l'upload è stato completato con successo
  public uploadCompleted: boolean = false;
  isUploading: boolean = false;
  private progressInterval: any;
  uploadSuccessMessage: string = '';
  
  // Flag per evitare aperture multiple del modal
  private modalAlreadyOpen: boolean = false;
  
  // Start upload progress (no simulation, just show modal)
  startUploadProgress(): void {
    // Non resettiamo più la barra di progresso qui
    // this.uploadProgress = 0; // <-- Rimosso per evitare reset indesiderati
    this.isUploading = true;
    this.uploadSuccessMessage = '';
    this.showUploadModal();
  }
  
  // Complete upload progress
  completeUploadProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    
    this.uploadProgress = 100;
    this.isUploading = false;
    
    // Hide modal after showing completion
    setTimeout(() => {
      this.resetUploadState();
    }, 2000);
  }
  
  // Reset upload state - VERSIONE SEMPLIFICATA
  public resetUploadState(): void {
    console.log('=== RESET UPLOAD STATE ===');
    
    // Reset everything to initial state
    this.uploadProgress = 0;
    this.maxUploadProgress = 0;
    this.uploadCompleted = false;
    this.isUploading = false;
    this.loading = false;
    this.uploadSuccessMessage = '';
    
    // Close modal if open
    if (this.uploadModalRef) {
      this.uploadModalRef.hide();
      this.uploadModalRef = undefined;
      this.modalAlreadyOpen = false;
      console.log('Modal chiuso e reset completato');
    }
    
    // Force UI update
    this.changeDetectorRef.detectChanges();
    console.log('Stato completamente resettato');
  }
  
  // Show upload progress modal - versione semplificata che non resetta la barra
  public showUploadModal(): void {
    console.log('showUploadModal called');
    
    // Non resettiamo più la barra di progresso qui per evitare flickering
    // this.uploadProgress = 0; // <-- Rimosso per evitare reset indesiderati
    
    // Apriamo il modal solo se non è già aperto
    if (!this.uploadModalRef && this.uploadProgressModal && !this.modalAlreadyOpen) {
      console.log('Apertura modal di progresso');
      
      // Impostiamo il flag per evitare aperture multiple
      this.modalAlreadyOpen = true;
      
      this.uploadModalRef = this.modalService.show(this.uploadProgressModal, {
        class: 'modal-md modal-dialog-centered',
        backdrop: 'static',
        keyboard: false,
        ignoreBackdropClick: true
      });
      
      console.log('Modal aperto');
    } else {
      console.log('Modal già aperto o template non trovato');
    }
  }
  
  // Hide upload progress modal
  hideUploadModal(): void {
    console.log('hideUploadModal called');
    if (this.uploadModalRef) {
      this.uploadModalRef.hide();
      this.uploadModalRef = undefined;
      // Resettiamo il flag quando nascondiamo manualmente il modal
      this.modalAlreadyOpen = false;
      console.log('Modal nascosto, flag modalAlreadyOpen resettato');
    }
  }
  
  // Metodo pubblico per forzare la chiusura del modal dall'esterno
  public forceCloseUploadModal(): void {
    console.log('forceCloseUploadModal called');
    this.ngZone.run(() => {
      console.log('Inside ngZone.run in forceCloseUploadModal');
      if (this.uploadModalRef) {
        console.log('Modal reference exists, forcing close');
        this.uploadModalRef.hide();
        this.uploadModalRef = undefined;
        // Resettiamo il flag quando forziamo la chiusura del modal
        this.modalAlreadyOpen = false;
        
        // Non resettiamo più la barra di progresso
        // this.uploadProgress = 0; // <-- Rimosso per evitare reset indesiderati
        
        this.isUploading = false;
        // Manteniamo il messaggio di successo se presente
        // this.uploadSuccessMessage = ''; // <-- Rimosso per mantenere il messaggio
        
        this.changeDetectorRef.detectChanges();
        console.log('Modal closed, flag reset, upload state preserved');
      } else {
        console.log('No modal reference found to close');
      }
    });
  }

  // Metodo rimosso - upload progress è ora gestito dal page component
  
  // Set upload success message - versione modificata che non resetta la barra
  public setUploadSuccessMessage(message: string): void {
    console.log('Setting upload success message:', message);
    
    // Esegui tutto all'interno di NgZone per garantire che Angular rilevi le modifiche
    this.ngZone.run(() => {
      this.uploadSuccessMessage = message;
      this.isUploading = false;
      this.uploadCompleted = true;
      this.changeDetectorRef.detectChanges();
      
      // Chiudiamo il modal dopo aver mostrato il messaggio di successo
      setTimeout(() => {
        console.log('Auto-closing modal after success message');
        this.forceCloseUploadModal();
      }, 2500); // Aumentato a 2.5 secondi per dare tempo di leggere il messaggio
    });
  }
  
  // Metodo per forzare l'aggiornamento dell'interfaccia utente
  private forceUIUpdate(): void {
    console.log('Forzando aggiornamento UI completo');
    
    // Usa requestAnimationFrame per sincronizzarsi con il ciclo di rendering del browser
    requestAnimationFrame(() => {
      // Forza il rilevamento delle modifiche
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
    });
  }

  
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
    // Check if we have files to upload
    const hasFiles = this.posterFile || this.backdropFile || Object.keys(this.videoFiles).length > 0;
    
    if (hasFiles) {
      // Return FormData when files are present
      return this.prepareFormDataWithFiles();
    }
    
    // Return regular object when no files
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
    
    // Filter and validate video_files before sending
    if (formValue.video_files && Array.isArray(formValue.video_files)) {
      formValue.video_files = formValue.video_files.filter((videoFile: any) => {
        // Keep only video files with valid URLs
        return videoFile && videoFile.url && videoFile.url.toString().trim() !== '';
      });
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

  // Form submission - now uploads files like TV series form
  onSubmit(): void {
    if (this.movieForm.valid) {
      this.loading = true;
      
      // Check if we have files to upload
      const hasFiles = this.posterFile || this.backdropFile || Object.keys(this.videoFiles).length > 0;
      if (hasFiles) {
        // Start simulated progress
        this.startUploadProgress();
      }
      
      // Prepare form data
      const formData = this.prepareFormData();
      console.log('Form data prepared:', formData);
      
      // Emit the form data to parent component
      this.formSubmit.emit(formData);
    }
  }
  
  /**
   * Prepare form data with files for submission (like TV series form)
   */
  private prepareFormDataWithFiles(): FormData {
    const formData = new FormData();
    const formValue = { ...this.movieForm.value };
    
    // Add basic movie data
    if (formValue.title) formData.append('title', formValue.title);
    if (formValue.slug) formData.append('slug', formValue.slug);
    if (formValue.description) formData.append('description', formValue.description);
    if (formValue.year) formData.append('year', formValue.year.toString());
    if (formValue.duration) formData.append('duration', formValue.duration.toString());
    if (formValue.imdb_rating) formData.append('imdb_rating', formValue.imdb_rating.toString());
    if (formValue.premiere_date) formData.append('premiere_date', formValue.premiere_date);
    if (formValue.status) formData.append('status', formValue.status);
    if (formValue.category_id) formData.append('category_id', formValue.category_id.toString());
    
    // Add default fields
    formData.append('format', 'HD');
    formData.append('language', 'en');
    formData.append('country', 'US');
    
    // Add image files
    if (this.posterFile) {
      formData.append('poster_image', this.posterFile);
    }
    if (this.backdropFile) {
      formData.append('backdrop_image', this.backdropFile);
    }
    
      // Add video files - all videos are treated as movie videos
    Object.keys(this.videoFiles).forEach((key, index) => {
      const file = this.videoFiles[key];
      if (file) {
        formData.append('movie_video', file);
      }
    });
    
    // Add existing video file IDs to keep (excluding deleted ones)
    const existingVideoIds: number[] = [];
    this.videoFilesArray.controls.forEach((control: any) => {
      const videoId = control.get('id')?.value;
      if (videoId && videoId !== null && !this.deletedVideoIds.includes(videoId)) {
        existingVideoIds.push(videoId);
      }
    });
    
    // If we're uploading a new video file, we want to replace all existing videos
    // So we should not keep any existing video IDs when there's a new upload
    const hasNewVideoUpload = Object.keys(this.videoFiles).length > 0;
    if (hasNewVideoUpload) {
      console.log('New video upload detected, clearing existing video IDs to replace all videos');
      existingVideoIds.length = 0; // Clear the array to replace all existing videos
    }
    
    console.log('Existing video IDs to keep:', existingVideoIds);
    console.log('Deleted video IDs:', this.deletedVideoIds);
    
    // Send existing video IDs to backend for sync
    // Always send the array, even if empty, so backend knows to sync
    if (existingVideoIds.length > 0) {
      existingVideoIds.forEach(id => {
        formData.append('existing_video_ids[]', id.toString());
      });
    } else {
      // Send empty array - append empty string to existing_video_ids[] to create empty array
      formData.append('existing_video_ids[]', '');
    }
    
    // Debug: Log all FormData entries
    console.log('=== FormData being sent to backend ===');
    for (let pair of (formData as any).entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    console.log('=== End FormData ===');
    
    // Add persons array
    if (formValue.persons && Array.isArray(formValue.persons)) {
      const persons = formValue.persons
        .filter((person: any) => person.person_id && person.person_id.toString().trim() !== '')
        .map((person: any) => parseInt(person.person_id, 10));
      
      persons.forEach((personId: number) => {
        formData.append('persons[]', personId.toString());
      });
    }
    
    return formData;
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

  // Show video delete confirmation modal
  removeVideoFile(index: number): void {
    this.videoToDeleteIndex = index;
    this.modalRef = this.modalService.show(this.deleteVideoModal, {
      class: 'modal-md modal-dialog-centered',
      backdrop: 'static',
      keyboard: false
    });
  }

  // Confirm video deletion
  confirmVideoDelete(): void {
    if (this.videoToDeleteIndex >= 0) {
      // Get the video control before removing it
      const videoControl = this.videoFilesArray.at(this.videoToDeleteIndex);
      const videoId = videoControl?.get('id')?.value;
      
      // If it's an existing video (has ID), add to deleted list
      if (videoId && videoId !== null) {
        this.deletedVideoIds.push(videoId);
        console.log('Added video ID to deletion list:', videoId);
        console.log('Current deleted video IDs:', this.deletedVideoIds);
      }
      
      // Remove the video file from local storage if it exists
      const videoKey = `video_${this.videoToDeleteIndex}`;
      if (this.videoFiles[videoKey]) {
        delete this.videoFiles[videoKey];
      }
      
      // Remove from form array
      this.videoFilesArray.removeAt(this.videoToDeleteIndex);
      
      // Reset index
      this.videoToDeleteIndex = -1;
    }
    this.modalRef?.hide();
  }

  // Cancel video deletion
  cancelVideoDelete(): void {
    this.videoToDeleteIndex = -1;
    this.modalRef?.hide();
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



  // Handle file uploads - store files locally like TV series form
  onPosterUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.posterFile = file;
      this.uploadingPoster = false;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.posterPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // Mark poster as valid when file is selected
      this.movieForm.patchValue({ poster: 'file_selected' });
      
      console.log('Poster file selected for upload on submit');
    }
  }

  onBackdropUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.backdropFile = file;
      this.uploadingBackdrop = false;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.backdropPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // Mark backdrop as valid when file is selected
      this.movieForm.patchValue({ backdrop: 'file_selected' });
      
      console.log('Backdrop file selected for upload on submit');
    }
  }


  // Handle video file upload - store files locally like TV series form
  onVideoFileUpload(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      // Store file locally for upload on submit
      const videoKey = `video_${index}`;
      this.videoFiles[videoKey] = file;
      
      // Update form with placeholder to indicate file is selected
      const videoControl = this.videoFilesArray.at(index);
      const currentTitle = videoControl.get('title')?.value;
      
      videoControl.patchValue({
        url: 'file_selected',
        // Only update title if it's empty (preserve user-set titles)
        title: currentTitle || file.name.replace(/\.[^/.]+$/, '') // Remove extension for title
      });
      
      console.log(`Video file ${file.name} selected for upload on submit`);
      
      // Reset upload states
      this.uploadingVideoFile[index] = false;
      this.videoFileUploadProgress[index] = 0;
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

  // Check if basic required fields are filled - simplified since files are uploaded on submit
  canUploadFiles(): boolean {
    // Always allow file selection since they're uploaded on submit
    return true;
  }

  // Funzione di confronto per il select della categoria
  compareCategories(item1: any, item2: any): boolean {
    // Converti entrambi i valori in stringhe per un confronto sicuro
    return item1 && item2 && item1.toString() === item2.toString();
  }
}
