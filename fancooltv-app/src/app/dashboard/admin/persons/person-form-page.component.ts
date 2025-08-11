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
   * Gestisce sia la creazione che l'aggiornamento di una persona
   */
  onFormSubmit(formData: any): void {
    this.loading = true;
    
    if (this.isEditMode && this.personId) {
      // Update existing person
      // Nota: in questo caso il componente PersonFormComponent ha già gestito la logica
      // di caricamento dell'immagine e compilazione del form
      this.apiService.updatePerson(this.personId, {
        name: formData.name,
        profile_image: formData.profile_image
      }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard/admin/persons']);
        },
        error: (error: any) => {
          console.error('Errore durante l\'aggiornamento della persona:', error);
          alert('Si è verificato un errore durante l\'aggiornamento della persona.');
          this.loading = false;
        }
      });
    } else {
      // Per la creazione, il componente PersonFormComponent gestisce tutto il processo
      // Qui dobbiamo solo gestire la navigazione dopo il completamento
      this.loading = false;
      this.router.navigate(['/dashboard/admin/persons']);
    }
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.router.navigate(['/dashboard/admin/persons']);
  }
}
