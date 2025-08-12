import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CountryService } from '../../../services/country.service';

export interface Country {
  country_id?: number;
  name: string;
  continent: string;
  iso_char2: string;
  iso_char3: string;
  phone_prefix: string;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-country-form',
  templateUrl: './country-form.component.html',
  styleUrls: ['./country-form.component.scss']
})
export class CountryFormComponent implements OnInit {
  countryForm!: FormGroup;
  country: Country | null = null;
  loading = false;
  isEditMode = false;
  countryId: number | null = null;

  // Continent options
  continents = [
    { code: 'AF', name: 'Africa' },
    { code: 'AN', name: 'Antarctica' },
    { code: 'AS', name: 'Asia' },
    { code: 'EU', name: 'Europe' },
    { code: 'NA', name: 'North America' },
    { code: 'OC', name: 'Oceania' },
    { code: 'SA', name: 'South America' }
  ];

  constructor(
    private fb: FormBuilder,
    private countryService: CountryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.countryId = +params['id'];
        this.isEditMode = true;
        this.loadCountry();
      }
    });
  }

  private initializeForm(): void {
    this.countryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      continent: ['', [Validators.required]],
      iso_char2: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
      iso_char3: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      phone_prefix: ['', [Validators.required, Validators.maxLength(10)]]
    });
  }

  private loadCountry(): void {
    if (!this.countryId) return;

    this.loading = true;
    this.countryService.getCountry(this.countryId).subscribe({
      next: (country) => {
        this.country = country;
        this.populateForm(country);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading country:', error);
        this.loading = false;
        // Redirect to countries list if country not found
        this.router.navigate(['/dashboard/admin/countries']);
      }
    });
  }

  private populateForm(country: Country): void {
    this.countryForm.patchValue({
      name: country.name,
      continent: country.continent,
      iso_char2: country.iso_char2,
      iso_char3: country.iso_char3,
      phone_prefix: country.phone_prefix
    });
  }

  onSubmit(): void {
    if (this.countryForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.countryForm.controls).forEach(key => {
        this.countryForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formData = this.countryForm.value;

    if (this.isEditMode && this.countryId) {
      // Update existing country
      this.countryService.updateCountry(this.countryId, formData).subscribe({
        next: (response) => {
          console.log('Country updated successfully:', response);
          this.router.navigate(['/dashboard/admin/countries']);
        },
        error: (error) => {
          console.error('Error updating country:', error);
          this.loading = false;
        }
      });
    } else {
      // Create new country
      this.countryService.createCountry(formData).subscribe({
        next: (response) => {
          console.log('Country created successfully:', response);
          this.router.navigate(['/dashboard/admin/countries']);
        },
        error: (error) => {
          console.error('Error creating country:', error);
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/admin/countries']);
  }

  // Helper method to get continent name by code
  getContinentName(code: string): string {
    const continent = this.continents.find(c => c.code === code);
    return continent ? continent.name : code;
  }
}
