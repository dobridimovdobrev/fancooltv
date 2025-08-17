import { Component, ElementRef, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category, ImageFile, Movie, Person, Trailer, VideoFile } from '../../../models/media.models';
import { ApiService } from '../../../services/api.service';
import { ApiResponse } from '../../../models/api.models';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-movie-form',
  templateUrl: './movie-form.component.html',
  styleUrls: ['./movie-form.component.scss']
})
export class MovieFormComponent implements OnInit {
  @Input() movie: Movie | null = null;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  movieForm: FormGroup;
  categories: Category[] = [];
  persons: Person[] = [];
  personsForDisplay: Person[] = []; // Array per mantenere le persone associate al film per la visualizzazione
  loading = false;
  uploadingPoster = false;
  uploadingBackdrop = false;
  
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
    private modalService: BsModalService
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
      title: ['', [Validators.required, Validators.maxLength(128)]],
      slug: ['', [Validators.maxLength(128)]],
      description: ['', [Validators.required]],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(2100)]],
      duration: ['', [Validators.min(1)]],
      imdb_rating: ['', [Validators.min(0), Validators.max(10)]],
      premiere_date: [''],
      status: ['published', [Validators.required]],
      category_id: [null, [Validators.required]], // Cambiato da stringa vuota a null
      poster: [''],
      backdrop: [''],
      persons: this.fb.array([]),
      trailers: this.fb.array([]),
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
    this.personsArray.clear();
    if (movie.persons && movie.persons.length) {
      movie.persons.forEach(person => {
        this.personsArray.push(this.createPersonForm(person));
      });
    }

    // Clear and populate trailers array
    this.trailersArray.clear();
    if (movie.trailers && movie.trailers.length) {
      movie.trailers.forEach(trailer => {
        this.trailersArray.push(this.createTrailerForm(trailer));
      });
    }

    // Clear and populate video files array
    this.videoFilesArray.clear();
    if (movie.video_files && movie.video_files.length) {
      movie.video_files.forEach(videoFile => {
        this.videoFilesArray.push(this.createVideoFileForm(videoFile));
      });
    }

    // Clear and populate image files array
    this.imageFilesArray.clear();
    if (movie.image_files && movie.image_files.length) {
      movie.image_files.forEach(imageFile => {
        this.imageFilesArray.push(this.createImageFileForm(imageFile));
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
  modalRef?: BsModalRef;

  // Riferimenti agli elementi del DOM
  @ViewChild('personModal') personModal!: TemplateRef<any>;
  @ViewChild('searchPersonInput') searchPersonInput!: ElementRef;
  @ViewChild('newPersonName') newPersonName!: ElementRef;
  @ViewChild('newPersonPhoto') newPersonPhoto!: ElementRef;

  // Carica tutte le persone disponibili
  loadPersons(): void {
    this.isLoadingPersons = true;
    this.apiService.getPersons({ per_page: 100 }).subscribe({
      next: (response) => {
        this.persons = response.data;
        console.log(`Caricate ${this.persons.length} persone`);
        this.isLoadingPersons = false;
      },
      error: (error: any) => {
        console.error('Error loading persons', error);
        this.isLoadingPersons = false;
      }
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
  
  // Search for a person by name
  searchPerson(name: string): void {
    // If the field is empty, don't show anything
    if (!name || name.trim() === '') {
      this.persons = [];
      return;
    }
    
    this.isLoadingPersons = true;
    
    // From the API documentation, we know we can use the 'name' parameter
    // to filter people by name
    const searchParams: Record<string, any> = {
      name: name.trim(),
      per_page: 50 // Increase to get more results
    };
    
    console.log('Search parameters:', searchParams);
    
    this.apiService.getPersons(searchParams).subscribe({
      next: (response: ApiResponse<Person[]>) => {
        console.log('API response people:', response);
        
        if (response && response.data) {
          // Create a Map to track people by name (to catch duplicates with different IDs)
          const uniquePersonsMap = new Map<string, Person>();
          
          // First pass: identify duplicates by name (case insensitive)
          response.data.forEach(person => {
            const normalizedName = person.name.toLowerCase().trim();
            
            // If we already have this name, keep the one with the lowest ID (assuming it's the original)
            if (uniquePersonsMap.has(normalizedName)) {
              const existing = uniquePersonsMap.get(normalizedName)!;
              if (parseInt(person.person_id.toString()) < parseInt(existing.person_id.toString())) {
                uniquePersonsMap.set(normalizedName, person);
              }
            } else {
              uniquePersonsMap.set(normalizedName, person);
            }
          });
          
          // Convert the Map to an array
          const uniquePersons = Array.from(uniquePersonsMap.values());
          
          // Sort people by name
          uniquePersons.sort((a, b) => a.name.localeCompare(b.name));
          
          this.persons = uniquePersons;
          console.log(`Found ${this.persons.length} unique people for search "${name}"`);
        } else {
          this.persons = [];
        }
        
        this.isLoadingPersons = false;
      },
      error: (err: any) => {
        console.error('Error searching for people:', err);
        this.isLoadingPersons = false;
        this.persons = []; // Reset in case of error
      }
    });
  }
  
  // Metodo rimosso perché la logica di rimozione dei duplicati è stata integrata direttamente nel metodo searchPerson

  // Funzione trackBy per ottimizzare il rendering delle liste e prevenire duplicati visivi
  trackByPersonId(index: number, person: Person): string {
    return person.person_id.toString();
  }

  // Apre il modal per la selezione della persona
  openPersonModal(index: number): void {
    this.currentPersonIndex = index;
    
    // Apre il modal usando ngx-bootstrap
    this.modalRef = this.modalService.show(this.personModal, {
      class: 'modal-lg',
      backdrop: 'static',
      keyboard: false
    });
    
    // Salviamo le persone associate al film in una variabile temporanea
    // per non perdere i riferimenti ai nomi quando resettiamo l'array persons
    const currentPersons = [...this.persons];
    
    // Reset della lista delle persone per non mostrare nulla di default nel modal
    // ma manteniamo una copia delle persone associate al film
    this.personsForDisplay = currentPersons;
    this.persons = [];
    
    console.log('Persone salvate per visualizzazione:', this.personsForDisplay.length);
    
    // Focus sul campo di ricerca
    setTimeout(() => {
      if (this.searchPersonInput) {
        this.searchPersonInput.nativeElement.focus();
      }
    }, 300);
  }

  // Seleziona una persona dal modal
  selectPersonFromModal(personId: string): void {
    if (this.currentPersonIndex >= 0) {
      this.personsArray.at(this.currentPersonIndex).get('person_id')?.setValue(personId);
      
      // Chiudi il modal
      if (this.modalRef) {
        this.modalRef.hide();
      }
      
      // Reset dell'indice corrente
      this.currentPersonIndex = -1;
    }
  }

  // Aggiunge una nuova persona dal modal
  addNewPersonFromModal(name: string, photoInput: HTMLInputElement): void {
    if (!name) {
      alert('Inserisci un nome per la persona');
      return;
    }
    
    const file = photoInput.files?.[0];
    if (!file) {
      alert('Seleziona una foto per la persona');
      return;
    }
    
    // Prima carica l'immagine
    this.isLoadingPersons = true;
    const formData = new FormData();
    formData.append('image', file);
    
    this.apiService.uploadImage(formData, 'person').subscribe({
      next: (response: {url: string}) => {
        // Ora crea la persona con l'URL dell'immagine
        const personData = {
          name: name,
          photo: response.url
        };
        
        // Chiamata API per creare la persona
        this.apiService.createPerson(personData).subscribe({
          next: (personResponse: ApiResponse<Person>) => {
            // Aggiungi la persona appena creata alla lista e selezionala
            const newPerson = personResponse.data;
            this.persons = [newPerson, ...this.persons];
            
            // Seleziona la persona appena creata
            this.selectPersonFromModal(newPerson.person_id.toString());
            
            this.isLoadingPersons = false;
            
            // Resetta i campi del form
            if (this.newPersonName) {
              this.newPersonName.nativeElement.value = '';
            }
            if (this.newPersonPhoto) {
              this.newPersonPhoto.nativeElement.value = '';  
            }
          },
          error: (error: any) => {
            console.error('Error creating person', error);
            this.isLoadingPersons = false;
            alert('Errore durante la creazione della persona');
          }
        });
      },
      error: (error: any) => {
        console.error('Error uploading person photo', error);
        this.isLoadingPersons = false;
        alert('Errore durante il caricamento della foto');
      }
    });
  }
  
  // Aggiungi una nuova persona (redirect alla pagina di creazione persona)
  addNewPerson(): void {
    // Salva lo stato attuale del form in localStorage
    localStorage.setItem('movieFormData', JSON.stringify(this.movieForm.value));
    // Redirect alla pagina di creazione persona
    window.location.href = '/dashboard/admin/persons/create';
  }

  // Form getters for easy access in template
  get personsArray(): FormArray {
    return this.movieForm.get('persons') as FormArray;
  }

  get trailersArray(): FormArray {
    return this.movieForm.get('trailers') as FormArray;
  }

  get videoFilesArray(): FormArray {
    return this.movieForm.get('video_files') as FormArray;
  }

  get imageFilesArray(): FormArray {
    return this.movieForm.get('image_files') as FormArray;
  }

  // Create form groups for nested objects
  createPersonForm(person?: Person): FormGroup {
    return this.fb.group({
      person_id: [person?.person_id || '', Validators.required]
      // Il campo character è stato rimosso come richiesto
    });
  }

  createTrailerForm(trailer?: Trailer): FormGroup {
    return this.fb.group({
      trailer_id: [trailer?.trailer_id || null],
      title: [trailer?.title || '', Validators.required],
      url: [trailer?.url || '']
    });
  }

  createVideoFileForm(videoFile?: VideoFile): FormGroup {
    return this.fb.group({
      id: [videoFile?.id || null],
      url: [videoFile?.url || ''],
      title: [videoFile?.title || ''],
      type: [videoFile?.type || '']
    });
  }

  createImageFileForm(imageFile?: ImageFile): FormGroup {
    return this.fb.group({
      id: [imageFile?.id || null],
      url: [imageFile?.url || '', [Validators.required, Validators.pattern('https?://.*')]],
      type: [imageFile?.type || '']
    });
  }

  // Add new items to form arrays
  addPerson(): void {
    // Crea un nuovo indice per la persona che stiamo per aggiungere
    const newIndex = this.personsArray.length;
    // Aggiungiamo un form vuoto all'array
    this.personsArray.push(this.createPersonForm());
    // Apriamo direttamente il modal di ricerca
    this.openPersonModal(newIndex);
  }

  addTrailer(): void {
    this.trailersArray.push(this.createTrailerForm());
  }

  addVideoFile(): void {
    this.videoFilesArray.push(this.createVideoFileForm());
  }

  addImageFile(): void {
    this.imageFilesArray.push(this.createImageFileForm());
  }

  // Remove items from form arrays
  removePerson(index: number): void {
    this.personsArray.removeAt(index);
  }

  removeTrailer(index: number): void {
    this.trailersArray.removeAt(index);
  }

  removeVideoFile(index: number): void {
    this.videoFilesArray.removeAt(index);
  }

  removeImageFile(index: number): void {
    this.imageFilesArray.removeAt(index);
  }

  // Handle file uploads
  onPosterUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadingPoster = true;
      const formData = new FormData();
      formData.append('image', file);
      
      this.apiService.uploadImage(formData, 'poster').subscribe({
        next: (response: {url: string}) => {
          this.movieForm.patchValue({ poster: response.url });
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
      
      this.apiService.uploadImage(formData, 'backdrop').subscribe({
        next: (response: {url: string}) => {
          this.movieForm.patchValue({ backdrop: response.url });
          this.uploadingBackdrop = false;
        },
        error: (error: any) => {
          console.error('Error uploading backdrop', error);
          this.uploadingBackdrop = false;
        }
      });
    }
  }

  // Handle trailer file upload
  onTrailerUpload(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      
      // For now, we'll use a generic upload approach
      // This will need to be updated when video upload API is implemented
      console.log('Trailer file selected:', file.name);
      
      // Temporarily store the file name as URL until proper upload is implemented
      this.trailersArray.at(index).patchValue({ url: file.name });
      
      // TODO: Implement proper video upload when API endpoint is available
      // this.apiService.uploadVideo(formData, 'trailer').subscribe({
      //   next: (response: {url: string}) => {
      //     this.trailersArray.at(index).patchValue({ url: response.url });
      //   },
      //   error: (error: any) => {
      //     console.error('Error uploading trailer', error);
      //   }
      // });
    }
  }

  // Handle video file upload
  onVideoFileUpload(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      
      // For now, we'll use a generic upload approach
      // This will need to be updated when video upload API is implemented
      console.log('Video file selected:', file.name);
      
      // Temporarily store the file name as URL until proper upload is implemented
      this.videoFilesArray.at(index).patchValue({ url: file.name });
      
      // TODO: Implement proper video upload when API endpoint is available
      // this.apiService.uploadVideo(formData, 'movie').subscribe({
      //   next: (response: {url: string}) => {
      //     this.videoFilesArray.at(index).patchValue({ url: response.url });
      //   },
      //   error: (error: any) => {
      //     console.error('Error uploading video file', error);
      //   }
      // });
    }
  }

  // Form submission
  onSubmit(): void {
    if (this.movieForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.movieForm);
      return;
    }

    this.loading = true;
    const formData = this.prepareFormData();
    this.formSubmit.emit(formData);
  }

  // Helper to mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Prepare form data for API submission
  prepareFormData(): any {
    const formValue = this.movieForm.value;
    
    // Clean up empty values
    Object.keys(formValue).forEach(key => {
      if (formValue[key] === '') {
        formValue[key] = null;
      }
    });
    
    // Genera lo slug se non è stato specificato
    if (!formValue.slug && formValue.title) {
      formValue.slug = this.generateSlug(formValue.title);
    }

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
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Rimuovi caratteri speciali
      .replace(/[\s_-]+/g, '-') // Sostituisci spazi e underscore con trattini
      .replace(/^-+|-+$/g, ''); // Rimuovi trattini iniziali e finali
  }
  
  /**
   * Check if the form is valid
   * @returns true if the form is valid, false otherwise
   */
  isValid(): boolean {
    if (this.movieForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.movieForm);
      return false;
    }
    return true;
  }
  
  /**
   * Get the form data ready for API submission
   * @returns prepared form data
   */
  getFormData(): any {
    return this.prepareFormData();
  }

  // Cancel form
  onCancel(): void {
    this.cancel.emit();
  }
  
  // Funzione di confronto per il select della categoria
  compareCategories(item1: any, item2: any): boolean {
    // Converti entrambi i valori in stringhe per un confronto sicuro
    return item1 && item2 && item1.toString() === item2.toString();
  }
}
