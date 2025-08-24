import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie } from '../../../models/media.models';
import { ApiService } from '../../../services/api.service';
import { MovieFormComponent } from './movie-form.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ApiResponse } from '../../../models/api.models';

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
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            // Calculate and update upload progress
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            if (this.movieForm) {
              this.movieForm.updateUploadProgress(progress);
            }
          } else if (event.type === HttpEventType.Response) {
            // Upload completed
            if (this.movieForm) {
              this.movieForm.updateUploadProgress(100);
            }
            
            const response = event as HttpResponse<ApiResponse<Movie>>;
            console.log('Update response:', response.body);
            
            if (formData instanceof FormData || !response?.body?.data?.video_files) {
              console.log('Reloading movie data (FormData update or missing video_files)');
              if (this.movie && this.movie.movie_id) {
                this.loadMovie(this.movie.movie_id);
              }
            } else {
              if (response && response.body && response.body.data) {
                console.log('Using response data directly:', response.body.data);
                this.movie = response.body.data;
                
                if (this.movie?.category && (this.movie.category as any)?.id && !this.movie.category_id) {
                  this.movie.category_id = (this.movie.category as any).id;
                }
              }
            }
            
            this.loading = false;
            
            // Set success message in modal instead of page alert
            if (this.movieForm) {
              this.movieForm.setUploadSuccessMessage('Film aggiornato con successo!');
            }
          }
        },
        error: (err: any) => {
          console.error('Error updating movie:', err);
          if (this.movieForm) {
            this.movieForm.resetUploadState();
          }
          
          if (err.error && err.error.message) {
            this.error = `Errore: ${err.error.message}`;
          } else if (err.error && err.error.errors) {
            const errorMessages = Object.values(err.error.errors).flat();
            this.error = `Errori di validazione: ${errorMessages.join(', ')}`;
          } else {
            this.error = 'Impossibile aggiornare il film. Riprova più tardi.';
          }
          
          this.loading = false;
        }
      });
    } else {
      // Create new movie
      console.log('Creating new movie with data:', formData);
      const apiCall = formData instanceof FormData 
        ? this.apiService.createCompleteMovie(formData)
        : this.apiService.createMovie(formData);
      
      apiCall.subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            if (this.movieForm) {
              this.movieForm.updateUploadProgress(progress);
            }
          } else if (event.type === HttpEventType.Response) {
            if (this.movieForm) {
              this.movieForm.updateUploadProgress(100);
            }
            
            setTimeout(() => {
              if (this.movieForm && this.movieForm.movieForm) {
                this.movieForm.movieForm.reset();
              }
              this.loading = false;
              this.router.navigate(['/dashboard/admin/movies']);
            }, 2000);
          }
        },
        error: (err: any) => {
          console.error('Error creating movie:', err);
          if (this.movieForm) {
            this.movieForm.resetUploadState();
          }
          
          if (err.error && err.error.message) {
            this.error = `Errore: ${err.error.message}`;
          } else if (err.error && err.error.errors) {
            const errorMessages = Object.values(err.error.errors).flat();
            this.error = `Errori di validazione: ${errorMessages.join(', ')}`;
          } else {
            this.error = 'Impossibile creare il film. Riprova più tardi.';
          }
          
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard/admin/movies']);
  }

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

  deleteMovie(): void {
    if (!this.movie || !this.movie.movie_id) {
      this.error = 'Impossibile eliminare il film. ID non disponibile.';
      return;
    }
    
    this.modalRef = this.modalService.show(this.deleteModal, {
      class: 'modal-sm modal-dialog-centered',
      backdrop: 'static',
      keyboard: false
    });
  }

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
          console.error('Error deleting movie:', err);
          this.error = 'Impossibile eliminare il film. Riprova più tardi.';
          this.loading = false;
          this.modalRef?.hide();
        }
      });
    }
  }

  cancelDelete(): void {
    this.modalRef?.hide();
  }
}
