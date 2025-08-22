import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie } from 'src/app/models/media.models';
import { ApiService } from 'src/app/services/api.service';
import { MovieFormComponent } from './movie-form.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-movie-form-page',
  templateUrl: './movie-form-page.component.html',
  styleUrls: ['./movie-form-page.component.scss']
})
export class MovieFormPageComponent implements OnInit {
  @ViewChild('movieForm') movieForm!: MovieFormComponent;
  
  movie: Movie | null = null;
  isEditMode = false;
  pageTitle = 'Add New Movie';
  loading = false;
  error = '';
  success = '';

  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  modalRef?: BsModalRef;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    // Check if we're in edit mode by looking for an ID in the route
    const movieId = this.route.snapshot.paramMap.get('id');
    if (movieId) {
      this.isEditMode = true;
      this.pageTitle = 'Edit Movie';
      this.loadMovie(+movieId);
    }
  }

  loadMovie(id: number): void {
    this.loading = true;
    // Utilizziamo getMovieDetails per ottenere i dettagli del film
    this.apiService.getMovieDetails(id).subscribe({
      next: (response: any) => {
        // Log completo della risposta API per debug
        console.log('API Response COMPLETA:', response);
        
        // Estraiamo il film dalla risposta API
        this.movie = response.data;
        
        // Log dettagliato dei dati del film per debug
        console.log('Movie data COMPLETO:', JSON.stringify(this.movie));
        console.log('Category:', this.movie?.category);
        console.log('Category ID:', this.movie?.category_id);
        
        // Se il film ha una categoria, aggiungiamo manualmente category_id
        if (this.movie && this.movie.category && !this.movie.category_id) {
          this.movie.category_id = this.movie.category.category_id;
          console.log('Aggiunto category_id manualmente:', this.movie.category_id);
        }
        
        // Controlliamo che this.movie non sia null prima di accedere alla proprietà title
        if (this.movie) {
          this.pageTitle = `Edit Movie: ${this.movie.title}`;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load movie data. Please try again.';
        console.error('Error loading movie:', err);
        this.loading = false;
      }
    });
  }

  saveMovie(formData: any): void {
    console.log('saveMovie called with data:', formData);
    this.loading = true;

    if (this.isEditMode && this.movie) {
      // Update existing movie - check if formData is FormData or regular object
      console.log('Updating existing movie:', this.movie.movie_id);
      const apiCall = formData instanceof FormData 
        ? this.apiService.updateCompleteMovie(this.movie.movie_id, formData)
        : this.apiService.updateMovie(this.movie.movie_id, formData);
      
      apiCall.subscribe({
        next: (response) => {
          console.log('Movie updated successfully:', response);
          console.log('Response video_files:', response?.data?.video_files);
          this.loading = false;
          this.error = '';
          this.success = 'Movie updated successfully!';
          
          // For updateCompleteMovie, always reload since response doesn't include video_files
          // For regular updateMovie, use response data if available
          if (formData instanceof FormData || !response?.data?.video_files) {
            console.log('Reloading movie data (FormData update or missing video_files)');
            if (this.movie && this.movie.movie_id) {
              this.loadMovie(this.movie.movie_id);
            }
          } else {
            console.log('Using response data directly');
            this.movie = response.data;
            if (this.movie?.category && (this.movie.category as any)?.id && !this.movie.category_id) {
              this.movie.category_id = (this.movie.category as any).id;
            }
          }
          
          // Clear success message after 5 seconds
          setTimeout(() => {
            this.success = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error updating movie:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.message);
          console.error('Error details:', err.error);
          console.error('FULL ERROR RESPONSE:', JSON.stringify(err.error, null, 2));
          
          // Mostra messaggi di errore più dettagliati
          if (err.error && err.error.message) {
            this.error = `Errore: ${err.error.message}`;
          } else if (err.error && err.error.errors) {
            // Raccoglie tutti gli errori di validazione in un unico messaggio
            const errorMessages = Object.values(err.error.errors).flat();
            this.error = `Errori di validazione: ${errorMessages.join(', ')}`;
            console.error('Validation errors:', err.error.errors);
          } else {
            this.error = 'Impossibile aggiornare il film. Riprova più tardi.';
          }
          
          this.loading = false;
          // Reset loading state in child component
          if (this.movieForm) {
            this.movieForm.loading = false;
          }
        }
      });
    } else {
      // Create new movie - check if formData is FormData or regular object
      console.log('Creating new movie with data:', formData);
      const apiCall = formData instanceof FormData 
        ? this.apiService.createCompleteMovie(formData)
        : this.apiService.createMovie(formData);
      
      apiCall.subscribe({
        next: (response) => {
          console.log('Movie created successfully:', response);
          // Only reset form after successful creation
          if (this.movieForm && this.movieForm.movieForm) {
            this.movieForm.movieForm.reset();
          }
          this.loading = false;
          this.router.navigate(['/dashboard/admin/movies']);
        },
        error: (err) => {
          console.error('Error creating movie:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.message);
          console.error('Error details:', err.error);
          
          // Mostra messaggi di errore più dettagliati
          if (err.error && err.error.message) {
            this.error = `Errore: ${err.error.message}`;
          } else if (err.error && err.error.errors) {
            // Raccoglie tutti gli errori di validazione in un unico messaggio
            const errorMessages = Object.values(err.error.errors).flat();
            this.error = `Errori di validazione: ${errorMessages.join(', ')}`;
            console.error('Validation errors:', err.error.errors);
          } else {
            this.error = 'Impossibile creare il film. Riprova più tardi.';
          }
          
          this.loading = false;
          // Reset loading state in child component
          if (this.movieForm) {
            this.movieForm.loading = false;
          }
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard/admin/movies']);
  }

  /**
   * View movie details in new tab
   */
  viewMovie(): void {
    if (this.movie && this.movie.movie_id) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/movie-details', this.movie.movie_id])
      );
      window.open(url, '_blank');
    } else {
      this.error = 'Impossibile visualizzare il film. ID non disponibile.';
    }
  }

  /**
   * Delete movie - open modal
   */
  deleteMovie(): void {
    if (!this.movie || !this.movie.movie_id) {
      this.error = 'Impossibile eliminare il film. ID non disponibile.';
      return;
    }

    // Open the delete confirmation modal
    this.modalRef = this.modalService.show(this.deleteModal, {
      class: 'modal-md modal-dialog-centered',
      backdrop: 'static',
      keyboard: false
    });
  }

  /**
   * Confirm movie deletion
   */
  confirmDelete(): void {
    if (this.movie) {
      this.loading = true;
      
      this.apiService.deleteMovie(this.movie.movie_id).subscribe({
        next: () => {
          this.modalRef?.hide();
          this.loading = false;
          this.router.navigate(['/dashboard/admin/movies']);
        },
        error: (err: any) => {
          console.error('Errore durante l\'eliminazione del film:', err);
          this.error = 'Impossibile eliminare il film. Riprova più tardi.';
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
}
