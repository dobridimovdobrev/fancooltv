import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse } from '../../../models/api.models';
import { Person } from '../../../models/media.models';
import { ApiService } from '../../../services/api.service';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-person-form-page',
  templateUrl: './person-form-page.component.html',
  styleUrls: ['./person-form-page.component.scss']
})
export class PersonFormPageComponent implements OnInit {
  person: Person | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  isEditMode = false;
  personId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.personId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.personId;

    if (this.isEditMode && this.personId) {
      this.loadPerson(this.personId);
    }
  }

  /**
   * Load person data for editing
   */
  loadPerson(personId: string): void {
    this.loading = true;
    this.error = null;

    this.apiService.getPerson(personId).subscribe({
      next: (response: ApiResponse<Person>) => {
        this.person = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading person:', error);
        this.error = 'Si è verificato un errore durante il caricamento della persona.';
        this.loading = false;
      }
    });
  }

  /**
   * Handle form submission
   */
  onFormSubmit(formData: any): void {
    if (formData.updates) {
      // Handle update with specific updates object
      this.savePersonUpdate(formData.updates);
    } else {
      // Handle create with full person data
      this.savePerson(formData);
    }
  }

  /**
   * Save person data
   */
  savePerson(personData: any): void {
    // Create new person - handled by person-form component
    this.success = 'Person created successfully!';
    this.loading = false;
    
    // Navigate back to persons list after a short delay
    setTimeout(() => {
      this.router.navigate(['/dashboard/admin/persons']);
    }, 2000);
  }

  /**
   * Save person update data
   */
  savePersonUpdate(updates: any): void {
    if (!this.person) return;
    
    this.loading = true;
    this.error = '';
    this.success = '';

    console.log('🔄 Updating person with data:', updates);
    
    this.apiService.updatePerson(this.person.person_id, updates).subscribe({
      next: (response) => {
        console.log('✅ Person updated successfully:', response);
        
        // Update local person data with response
        if (response && response.status === 'success' && response.message && response.message.person) {
          this.person = response.message.person;
        }
        
        this.success = 'Person updated successfully!';
        this.loading = false;
        
        // DON'T navigate - stay on same page with success message
      },
      error: (error) => {
        console.error('❌ Error updating person:', error);
        this.error = 'Failed to update person. Please try again.';
        this.loading = false;
      }
    });
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.router.navigate(['/dashboard/admin/persons']);
  }
}
