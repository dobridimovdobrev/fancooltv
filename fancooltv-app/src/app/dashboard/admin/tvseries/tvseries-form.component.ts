import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TVSeries, Season, Episode } from '../../../models/tvseries.models';
import { Category, Person } from '../../../models/media.models';
import { ApiService } from '../../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tvseries-form',
  templateUrl: './tvseries-form.component.html',
  styleUrls: ['./tvseries-form.component.scss']
})
export class TVSeriesFormComponent implements OnInit, OnDestroy {
  @Input() tvSeries: TVSeries | null = null;
  @Input() isEditMode = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();

  tvSeriesForm!: FormGroup;
  categories: Category[] = [];
  persons: Person[] = [];
  countries: any[] = [];
  loading = false;
  error = '';
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFormData();
    
    if (this.isEditMode && this.tvSeries) {
      this.populateForm();
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
      poster: [''],
      backdrop: [''],
      description: ['', [Validators.required, Validators.minLength(10)]],
      total_seasons: ['', [Validators.required, Validators.min(1)]],
      status: ['active', Validators.required],
      persons: this.fb.array([]),
      trailers: this.fb.array([])
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

    this.tvSeriesForm.patchValue({
      title: this.tvSeries.title,
      year: this.tvSeries.year,
      imdb_rating: this.tvSeries.imdb_rating,
      category_id: this.tvSeries.category?.category_id,
      poster: this.tvSeries.poster,
      backdrop: this.tvSeries.backdrop,
      description: this.tvSeries.description,
      total_seasons: this.tvSeries.total_seasons,
      status: this.tvSeries.status
    });

    // Populate persons
    if (this.tvSeries.persons && this.tvSeries.persons.length > 0) {
      const personsArray = this.tvSeriesForm.get('persons') as FormArray;
      this.tvSeries.persons.forEach(person => {
        personsArray.push(this.fb.group({
          person_id: [person.person_id],
          role: [person.character || '']
        }));
      });
    }

    // Populate trailers
    if (this.tvSeries.trailers && this.tvSeries.trailers.length > 0) {
      const trailersArray = this.tvSeriesForm.get('trailers') as FormArray;
      this.tvSeries.trailers.forEach((trailer: any) => {
        trailersArray.push(this.fb.group({
          url: [trailer.url],
          type: [trailer.type || 'youtube']
        }));
      });
    }
  }

  /**
   * Get persons FormArray
   */
  get personsArray(): FormArray {
    return this.tvSeriesForm.get('persons') as FormArray;
  }

  /**
   * Get trailers FormArray
   */
  get trailersArray(): FormArray {
    return this.tvSeriesForm.get('trailers') as FormArray;
  }

  /**
   * Add person to the form
   */
  addPerson(): void {
    const personGroup = this.fb.group({
      person_id: ['', Validators.required],
      role: ['']
    });
    this.personsArray.push(personGroup);
  }

  /**
   * Remove person from the form
   */
  removePerson(index: number): void {
    this.personsArray.removeAt(index);
  }

  /**
   * Add trailer to the form
   */
  addTrailer(): void {
    const trailerGroup = this.fb.group({
      url: ['', Validators.required],
      type: ['youtube']
    });
    this.trailersArray.push(trailerGroup);
  }

  /**
   * Remove trailer from the form
   */
  removeTrailer(index: number): void {
    this.trailersArray.removeAt(index);
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.tvSeriesForm.valid) {
      const formData = this.prepareFormData();
      this.formSubmit.emit(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Prepare form data for submission
   */
  private prepareFormData(): any {
    const formValue = { ...this.tvSeriesForm.value };

    // Process persons array
    if (formValue.persons && Array.isArray(formValue.persons)) {
      formValue.persons = formValue.persons
        .filter((person: any) => person.person_id && person.person_id.toString().trim() !== '')
        .map((person: any) => parseInt(person.person_id, 10));
    }

    // Process trailers array
    if (formValue.trailers && Array.isArray(formValue.trailers)) {
      formValue.trailers = formValue.trailers.filter((trailer: any) => trailer.url && trailer.url.trim() !== '');
    }

    return formValue;
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
}
