import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TVSeries, Season, Episode } from '../../../models/tvseries.models';
import { Category, Person } from '../../../models/media.models';
import { ApiService } from '../../../services/api.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tvseries-form',
  templateUrl: './tvseries-form.component.html',
  styleUrls: ['./tvseries-form.component.scss']
})
export class TVSeriesFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() tvSeries: TVSeries | null = null;
  @Input() isEditMode = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  tvSeriesForm!: FormGroup;
  categories: Category[] = [];
  persons: Person[] = [];
  personsForDisplay: Person[] = [];
  countries: any[] = [];
  loading = false;
  error = '';
  
  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  @ViewChild('personModal') personModal!: TemplateRef<any>;
  modalRef?: BsModalRef;
  personModalRef?: BsModalRef;
  uploadingPoster = false;
  uploadingBackdrop = false;
  isLoadingPersons = false;
  
  // File upload properties
  posterFile: File | null = null;
  trailerVideoFile: File | null = null;
  trailerVideoUploadProgress: number = 0;
  uploadingTrailerVideo: boolean = false;
  existingTrailerVideo: any = null;
  existingEpisodeVideos: { [key: string]: any } = {};
  backdropFile: File | null = null;
  
  // Image preview URLs
  posterPreviewUrl: string | null = null;
  backdropPreviewUrl: string | null = null;
  
  // Episode file properties
  episodeFiles: { [key: string]: File } = {};
  episodeVideoFiles: { [key: string]: File } = {};
  uploadingEpisodeVideo: { [key: string]: boolean } = {};
  episodeVideoUploadProgress: { [key: string]: number } = {};
  episodeImagePreviewUrls: { [key: string]: string } = {};
  
  // Year validation
  maxYear = new Date().getFullYear() + 1;
  
  // Status options for dropdown
  statusOptions = [
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'ended', label: 'Ended' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    public apiService: ApiService,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFormData();
    
    if (this.isEditMode && this.tvSeries) {
      this.populateForm();
    }
    
    // Form initialization complete
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tvSeries'] && changes['tvSeries'].currentValue && this.isEditMode) {
      // TV Series data changed, repopulate form
      setTimeout(() => {
        this.populateForm();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.tvSeriesForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 5)]],
      imdb_rating: ['', [Validators.min(0), Validators.max(10)]],
      category_id: ['', Validators.required],
      poster: ['', Validators.required],
      backdrop: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      total_seasons: ['', [Validators.min(1)]],
      total_episodes: ['', [Validators.min(1)]],
      status: ['published', Validators.required],
      persons: this.fb.array([]),
      // trailers array removed - using only video file upload
      seasons: this.fb.array([])
    });
  }

  /**
   * Load form data (categories, persons, countries)
   */
  private loadFormData(): void {
    this.loading = true;

    // Load categories
    this.subscriptions.add(
      this.apiService.getCategories().subscribe({
        next: (response: any) => {
          this.categories = response.data || [];
        },
        error: (error: any) => {
          console.error('Error loading categories:', error);
        }
      })
    );

    // Load persons
    this.subscriptions.add(
      this.apiService.getPersons().subscribe({
        next: (response: any) => {
          this.persons = response.data || [];
        },
        error: (error: any) => {
          console.error('Error loading persons:', error);
        }
      })
    );

    // Load countries (commented out as method doesn't exist)
    // this.subscriptions.add(
    //   this.apiService.getCountries().subscribe({
    //     next: (response: any) => {
    //       this.countries = response.data || [];
    //       this.loading = false;
    //     },
    //     error: (error: any) => {
    //       console.error('Error loading countries:', error);
    //       this.loading = false;
    //     }
    //   })
    // );
    this.loading = false;
  }

  /**
   * Populate form with existing TV series data
   */
  private populateForm(): void {
    if (!this.tvSeries) return;

    // Debug logs removed for production

    this.tvSeriesForm.patchValue({
      title: this.tvSeries.title,
      year: this.tvSeries.year,
      imdb_rating: this.tvSeries.imdb_rating,
      category_id: (this.tvSeries.category as any)?.id || this.tvSeries.category?.category_id,
      poster: this.tvSeries.poster,
      backdrop: this.tvSeries.backdrop,
      description: this.tvSeries.description,
      total_seasons: this.tvSeries.total_seasons,
      total_episodes: this.tvSeries.total_episodes,
      status: this.tvSeries.status
    });

    // Set poster preview if exists
    if (this.tvSeries.poster && this.tvSeries.poster.url) {
      this.posterPreviewUrl = this.tvSeries.poster.url;
    }

    // Set backdrop preview if exists
    if (this.tvSeries.backdrop && this.tvSeries.backdrop.url) {
      this.backdropPreviewUrl = this.tvSeries.backdrop.url;
    }

    // Populate persons - clear existing and add from data
    const personsArray = this.tvSeriesForm.get('persons') as FormArray;
    personsArray.clear(); // Clear existing persons
    
    if (this.tvSeries.persons && this.tvSeries.persons.length > 0) {
      this.tvSeries.persons.forEach(person => {
        personsArray.push(this.fb.group({
          person_id: [person.person_id],
          role: [(person as any).character || (person as any).role || '']
        }));
      });
    }

    // Set trailer video preview if exists
    if (this.hasExistingTrailer()) {
      // Trailer exists - show some indication (we can't preload file but can show it exists)
      this.trailerVideoFile = null; // Can't preload file from URL
    }
    
    // Check video_files for trailer (new format)
    if ((this.tvSeries as any).video_files && (this.tvSeries as any).video_files.length > 0) {
      const trailerVideo = (this.tvSeries as any).video_files.find((video: any) => 
        video.title && video.title.toLowerCase().includes('trailer')
      );
      if (trailerVideo) {
        // Show indication that trailer exists
        this.trailerVideoFile = null; // Can't preload file from URL
        this.existingTrailerVideo = trailerVideo; // Store for display
      }
    }

    // Populate seasons and episodes - clear existing and add from data
    const seasonsArray = this.tvSeriesForm.get('seasons') as FormArray;
    seasonsArray.clear(); // Clear existing seasons
    
    if (this.tvSeries.seasons && this.tvSeries.seasons.length > 0) {
      this.tvSeries.seasons.forEach((season: any) => {
        const seasonGroup = this.fb.group({
          season_number: [season.season_number, [Validators.min(1)]],
          total_episodes: [season.total_episodes || season.episodes?.length || ''],
          year: [season.year || ''],
          name: [season.name || ''],
          overview: [season.overview || ''],
          premiere_date: [season.premiere_date || ''],
          episodes: this.fb.array([])
        });

        // Populate episodes for this season
        if (season.episodes && season.episodes.length > 0) {
          const episodesArray = seasonGroup.get('episodes') as FormArray;
          season.episodes.forEach((episode: any) => {
            const episodeGroup = this.fb.group({
              episode_id: [episode.episode_id || null], // ID for existing episodes
              episode_number: [episode.episode_number, [Validators.min(1)]],
              title: [episode.title],
              overview: [episode.description || episode.overview || ''],
              air_date: [episode.air_date || ''],
              runtime: [episode.duration || episode.runtime || ''],
              status: [episode.status || 'published']
            });
            episodesArray.push(episodeGroup);

            // Set episode image preview if exists
            if (episode.still && episode.still.url) {
              const episodeKey = `${seasonsArray.length}-${episodesArray.length - 1}`;
              this.episodeImagePreviewUrls[episodeKey] = episode.still.url;
            }

            // Set episode video preview if exists
            if (episode.video_files && episode.video_files.length > 0) {
              const episodeKey = `${seasonsArray.length}-${episodesArray.length - 1}`;
              const episodeVideo = episode.video_files.find((video: any) => 
                video.title && video.title.toLowerCase().includes('episode')
              );
              if (episodeVideo) {
                // Store existing episode video for display
                this.existingEpisodeVideos[episodeKey] = episodeVideo;
              }
            }
          });
        }

        seasonsArray.push(seasonGroup);
      });
    }

    // Form population debug logs removed for production
  }

  /**
   * Get persons FormArray
   */
  get personsArray(): FormArray {
    return this.tvSeriesForm.get('persons') as FormArray;
  }

  // Trailers array getter removed


  // Duplicate methods removed - using methods at line 459+ instead

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.isFormValid()) {
      // Form submission started
      const formData = this.prepareFormData();
      this.formSubmit.emit(formData);
    } else {
      // Form validation failed - marking fields as touched
      this.markFormGroupTouched();
      
      // Show specific validation errors
      if (!this.posterFile) {
        // Missing poster file
      }
      if (!this.backdropFile) {
        // Missing backdrop file
      }
    }
  }

  /**
   * Prepare form data for submission as FormData for /complete endpoint
   */
  private prepareFormData(): FormData {
    const formData = new FormData();
    const formValue = { ...this.tvSeriesForm.value };
    
    // Debug logs
    console.log('DEBUG: Form value before submit:', this.tvSeriesForm.value);
    console.log('DEBUG: Title value:', this.tvSeriesForm.get('title')?.value);
    
    if (this.tvSeriesForm.valid) {
      // Add basic TV series data - ALWAYS send these fields
      formData.append('title', this.tvSeriesForm.get('title')?.value || '');
      console.log('DEBUG: Title being sent:', this.tvSeriesForm.get('title')?.value);
      console.log('DEBUG: FormData title:', formData.get('title'));

      // Add status directly - backend expects ongoing/ended
      if (formValue.status) {
        formData.append('status', formValue.status);
      } else {
        formData.append('status', 'ongoing'); // Default value
      }

      // Add image files
      if (this.posterFile) {
        formData.append('poster_image', this.posterFile);
      }
      if (this.backdropFile) {
        formData.append('backdrop_image', this.backdropFile);
      }

      // Add trailer video
      if (this.trailerVideoFile) {
        formData.append('trailer_video', this.trailerVideoFile);
      }

      // Add persons array
      if (formValue.persons && Array.isArray(formValue.persons)) {
        const persons = formValue.persons
          .filter((person: any) => person.person_id && person.person_id.toString().trim() !== '')
          .map((person: any) => parseInt(person.person_id, 10));
        
        persons.forEach((personId: number) => {
          formData.append('persons[]', personId.toString());
        });
      }
    }

    // Add seasons data
    if (formValue.seasons && Array.isArray(formValue.seasons)) {
      formValue.seasons.forEach((season: any, seasonIndex: number) => {
        // Processing season data
        
        if (season.season_number) formData.append(`seasons[${seasonIndex}][season_number]`, season.season_number.toString());
        
        // Calculate total_episodes automatically if not provided
        let totalEpisodes = season.total_episodes;
        if (!totalEpisodes && season.episodes && Array.isArray(season.episodes)) {
          totalEpisodes = season.episodes.length;
        }
        if (totalEpisodes) {
          formData.append(`seasons[${seasonIndex}][total_episodes]`, totalEpisodes.toString());
        }
        
        if (season.year) formData.append(`seasons[${seasonIndex}][year]`, season.year.toString());
        if (season.name) formData.append(`seasons[${seasonIndex}][name]`, season.name);
        if (season.overview) formData.append(`seasons[${seasonIndex}][overview]`, season.overview);
        if (season.premiere_date) formData.append(`seasons[${seasonIndex}][premiere_date]`, season.premiere_date);

        // Add episodes for this season
        if (season.episodes && Array.isArray(season.episodes)) {
          season.episodes.forEach((episode: any, episodeIndex: number) => {
            if (episode.episode_id) formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][episode_id]`, episode.episode_id.toString());
            if (episode.episode_number) formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][episode_number]`, episode.episode_number.toString());
            if (episode.title) formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][title]`, episode.title);
            if (episode.overview) formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][overview]`, episode.overview);
            if (episode.air_date) formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][air_date]`, episode.air_date);
            if (episode.runtime) formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][runtime]`, episode.runtime.toString());
            
            // Add episode status (required by backend)
            const episodeStatus = episode.status || 'published';
            formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][status]`, episodeStatus);

            // Add episode files with correct field names expected by backend
            const episodeKey = `${seasonIndex}-${episodeIndex}`;
            if (this.episodeFiles[episodeKey]) {
              formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][still_image]`, this.episodeFiles[episodeKey]);
            }
            if (this.episodeVideoFiles[episodeKey]) {
              formData.append(`seasons[${seasonIndex}][episodes][${episodeIndex}][episode_video]`, this.episodeVideoFiles[episodeKey]);
            }
          });
        }
      });
    }

    return formData;
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.tvSeriesForm.controls).forEach(key => {
      const control = this.tvSeriesForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach(arrayKey => {
              arrayControl.get(arrayKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.formCancel.emit();
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.tvSeriesForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.tvSeriesForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${fieldName} is required`;
    if (errors['minlength']) return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['min']) return `${fieldName} must be at least ${errors['min'].min}`;
    if (errors['max']) return `${fieldName} must be at most ${errors['max'].max}`;
    
    return 'Invalid value';
  }

  /**
   * Check if can add more persons (max 5)
   */
  canAddPerson(): boolean {
    return this.personsArray.length < 5;
  }

  /**
   * Get person name by ID
   */
  getPersonName(personId: number): string {
    if (!personId) return '';
    
    // First try to find in personsForDisplay (from search)
    let person = this.personsForDisplay.find(p => p.person_id === personId);
    
    // If not found and we have tvSeries data, search there
    if (!person && this.tvSeries && this.tvSeries.persons) {
      person = this.tvSeries.persons.find(p => p.person_id === personId);
    }
    
    return person ? person.name : '';
  }


  /**
   * Search person in modal
   */
  searchPersonInModal(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim().length < 2) {
      this.persons = [];
      return;
    }

    this.isLoadingPersons = true;
    
    this.apiService.searchPersons(searchTerm).subscribe({
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

  /**
   * Select person from modal
   */
  selectPersonFromModal(personId: string): void {
    const person = this.persons.find(p => p.person_id.toString() === personId);
    if (!person) return;

    // Add to display array if not already there
    if (!this.personsForDisplay.find(p => p.person_id === person.person_id)) {
      this.personsForDisplay.push(person);
    }

    // Find the current person index being edited
    const currentPersonIndex = this.personsArray.length - 1;
    if (currentPersonIndex >= 0) {
      this.personsArray.at(currentPersonIndex).patchValue({
        person_id: person.person_id
      });
    }

    this.personModalRef?.hide();
  }

  /**
   * Track by person ID for ngFor
   */
  trackByPersonId(index: number, person: Person): number {
    return person.person_id;
  }

  /**
   * Open person modal when adding person
   */
  addPerson(): void {
    if (!this.canAddPerson()) return;

    // Add empty person to form array
    const personGroup = this.fb.group({
      person_id: ['', Validators.required],
      role: ['']
    });
    this.personsArray.push(personGroup);

    // Open modal
    this.personModalRef = this.modalService.show(this.personModal, {
      backdrop: 'static',
      keyboard: false
    });
  }

  /**
   * Remove person from the form
   */
  removePerson(index: number): void {
    this.personsArray.removeAt(index);
  }

  /**
   * Cancel delete operation
   */
  cancelDelete(): void {
    this.modalRef?.hide();
  }

  /**
   * Confirm delete operation
   */
  confirmDelete(): void {
    if (this.tvSeries) {
      // Emit delete event to parent
      this.loading = true;
      // The actual delete will be handled by parent component
      // This is just for the modal functionality
    }
    this.modalRef?.hide();
  }

  /**
   * Show delete modal
   */
  showDeleteModal(): void {
    if (this.tvSeries) {
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-lg modal-dialog-centered',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Get seasons FormArray
   */
  get seasonsArray(): FormArray {
    return this.tvSeriesForm.get('seasons') as FormArray;
  }

  /**
   * Add new season
   */
  addSeason(): void {
    const seasonGroup = this.fb.group({
      season_number: ['', [Validators.min(1)]],
      total_episodes: ['', [Validators.min(1)]],
      year: ['', [Validators.min(1900), Validators.max(this.maxYear)]],
      name: [''],
      overview: [''],
      premiere_date: [''],
      episodes: this.fb.array([])
    });

    this.seasonsArray.push(seasonGroup);
  }

  /**
   * Remove season
   */
  removeSeason(seasonIndex: number): void {
    this.seasonsArray.removeAt(seasonIndex);
  }

  /**
   * Get episodes FormArray for a specific season
   */
  getEpisodesArray(seasonIndex: number): FormArray {
    return this.seasonsArray.at(seasonIndex).get('episodes') as FormArray;
  }

  /**
   * Add new episode to a season
   */
  addEpisode(seasonIndex: number): void {
    const episodeGroup = this.fb.group({
      title: [''],
      episode_number: ['', [Validators.min(1)]],
      duration: ['', [Validators.min(1)]],
      air_date: [''],
      status: ['published'],
      description: ['']
    });

    this.getEpisodesArray(seasonIndex).push(episodeGroup);
  }

  /**
   * Remove episode from a season
   */
  removeEpisode(seasonIndex: number, episodeIndex: number): void {
    this.getEpisodesArray(seasonIndex).removeAt(episodeIndex);
    
    // Clean up associated files
    const episodeKey = `${seasonIndex}-${episodeIndex}`;
    delete this.episodeFiles[episodeKey];
    delete this.episodeVideoFiles[episodeKey];
    delete this.uploadingEpisodeVideo[episodeKey];
    delete this.episodeVideoUploadProgress[episodeKey];
  }

  /**
   * Handle episode image upload
   */
  onEpisodeImageUpload(event: any, seasonIndex: number, episodeIndex: number): void {
    const file = event.target.files[0];
    if (file) {
      const episodeKey = `${seasonIndex}-${episodeIndex}`;
      this.episodeFiles[episodeKey] = file;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.episodeImagePreviewUrls[episodeKey] = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // Episode image uploaded successfully
    }
  }

  /**
   * Handle episode video upload
   */
  onEpisodeVideoUpload(event: any, seasonIndex: number, episodeIndex: number): void {
    const file = event.target.files[0];
    if (file) {
      const episodeKey = `${seasonIndex}-${episodeIndex}`;
      this.episodeVideoFiles[episodeKey] = file;
      this.uploadingEpisodeVideo[episodeKey] = true;
      this.episodeVideoUploadProgress[episodeKey] = 0;
      
      // Simulate upload progress
      const interval = setInterval(() => {
        this.episodeVideoUploadProgress[episodeKey] += 10;
        if (this.episodeVideoUploadProgress[episodeKey] >= 100) {
          this.uploadingEpisodeVideo[episodeKey] = false;
          clearInterval(interval);
          // Episode video uploaded successfully
        }
      }, 200);
    }
  }

  /**
   * Handle trailer video upload
   */
  onTrailerVideoUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.trailerVideoFile = file;
      this.uploadingTrailerVideo = true;
      this.trailerVideoUploadProgress = 0;
      
      // Simulate upload progress with percentage display
      const interval = setInterval(() => {
        this.trailerVideoUploadProgress += 10;
        if (this.trailerVideoUploadProgress >= 100) {
          this.uploadingTrailerVideo = false;
          clearInterval(interval);
          // Trailer video uploaded successfully
        }
      }, 200);
    }
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    // Simplified validation - only check essential fields
    const title = this.tvSeriesForm.get('title')?.value;
    const description = this.tvSeriesForm.get('description')?.value;
    const category = this.tvSeriesForm.get('category_id')?.value;
    
    // Basic required fields
    if (!title || !description || !category) {
      return false;
    }
    
    // Files required only for new TV series
    if (!this.isEditMode) {
      if (!this.posterFile || !this.backdropFile) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Handle poster image upload
   */
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
      this.tvSeriesForm.patchValue({ poster: 'file_selected' });
      
      // Poster uploaded successfully
    }
  }

  /**
   * Handle backdrop image upload
   */
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
      this.tvSeriesForm.patchValue({ backdrop: 'file_selected' });
      
      // Backdrop uploaded successfully
    }
  }

  // localStorage backup system removed

  // localStorage loading system removed

  // localStorage clearing system removed

  /**
   * Check if there's an existing trailer video
   */
  hasExistingTrailer(): boolean {
    return this.existingTrailerVideo !== null;
  }

  /**
   * Get the title of existing trailer video
   */
  getExistingTrailerTitle(): string {
    return this.existingTrailerVideo ? this.existingTrailerVideo.title : '';
  }

  /**
   * Check if there's an existing episode video for a specific season/episode
   */
  hasExistingEpisodeVideo(seasonIndex: number, episodeIndex: number): boolean {
    const episodeKey = `${seasonIndex}-${episodeIndex}`;
    return this.existingEpisodeVideos[episodeKey] !== undefined;
  }

  /**
   * Get the title of existing episode video for a specific season/episode
   */
  getExistingEpisodeVideoTitle(seasonIndex: number, episodeIndex: number): string {
    const episodeKey = `${seasonIndex}-${episodeIndex}`;
    const video = this.existingEpisodeVideos[episodeKey];
    return video ? video.title : '';
  }
}
