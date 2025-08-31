import { Component, OnInit, TemplateRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
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
  @ViewChild('uploadProgressModal') uploadProgressModal!: TemplateRef<any>;
  modalRef?: BsModalRef;
  uploadModalRef?: BsModalRef;
  
  // Upload progress tracking
  uploadProgress: number = 0;
  isUploading: boolean = false;
  uploadCompleted: boolean = false;
  uploadSuccessMessage: string = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone
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
    console.log('saveMovie called with:', formData);
    this.error = '';
    this.success = '';
    this.loading = true;
    
    // Reset upload state and show progress modal
    this.resetUploadState();
    this.showUploadProgressModal();

    if (this.isEditMode && this.movie) {
      // Update existing movie - check if formData is FormData or regular object
      console.log('Updating existing movie:', this.movie.movie_id);
      const apiCall = formData instanceof FormData 
        ? this.apiService.updateCompleteMovie(this.movie.movie_id, formData)
        : this.apiService.updateMovie(this.movie.movie_id, formData);
      
      apiCall.subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            console.log(`Upload progress: ${progress}% (${event.loaded}/${event.total})`);
            
            // Aggiorna la barra di progresso direttamente nel page component
            this.updateUploadProgress(progress);
            
            // Aggiornamenti più frequenti per valori critici
            if (progress === 25 || progress === 50 || progress === 75 || progress >= 90) {
              console.log(`Punto critico raggiunto: ${progress}%`);
            }
          } else if (event.type === HttpEventType.Response) {
            // Upload completed
            console.log('Upload completed, setting progress to 100%');
            
            // Aggiorna la barra al 100% e mostra messaggio di successo
            this.updateUploadProgress(100);
            this.setUploadSuccessMessage('Film aggiornato con successo!');
            
            const response = event as HttpResponse<ApiResponse<Movie>>;
            console.log('Update response:', response.body);
            
            // Attendiamo che il modal si chiuda prima di aggiornare i dati
            setTimeout(() => {
              // Aggiorniamo i dati del film solo dopo che il modal è chiuso
              if (response && response.body && response.body.data) {
                console.log('Using response data after modal close:', response.body.data);
                this.movie = response.body.data;
                
                if (this.movie?.category && (this.movie.category as any)?.id && !this.movie.category_id) {
                  this.movie.category_id = (this.movie.category as any).id;
                }
              }
              
              // IMPORTANTE: Ripristina loading = false per mostrare il form aggiornato
              this.loading = false;
            }, 2500);
          }
        },
        error: (error) => {
          console.error('Error saving movie:', error);
          this.error = 'Error saving movie: ' + (error.error?.message || error.message);
          this.loading = false;
          this.resetUploadState();
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
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            console.log(`Create progress: ${progress}% (${event.loaded}/${event.total})`);
            
            // Aggiorna la barra di progresso direttamente nel page component
            this.updateUploadProgress(progress);
            
            // Aggiornamenti più frequenti per valori critici
            if (progress === 25 || progress === 50 || progress === 75 || progress >= 90) {
              console.log(`Punto critico raggiunto: ${progress}%`);
            }
          } else if (event.type === HttpEventType.Response) {
            console.log('Create completed, setting progress to 100%');
            
            // Aggiorna la barra al 100% e mostra messaggio di successo
            this.updateUploadProgress(100);
            this.setUploadSuccessMessage('Film creato con successo!');
            
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

  // Upload progress methods
  public updateUploadProgress(progress: number): void {
    console.log('🚀 PAGE COMPONENT - updateUploadProgress called with:', progress);
    this.ngZone.run(() => {
      this.uploadProgress = progress;
      this.isUploading = progress > 0 && progress < 100;
      
      if (progress >= 100) {
        this.uploadCompleted = true;
        this.isUploading = false;
      }
      
      console.log('🚀 PAGE COMPONENT - Progress updated:', {
        uploadProgress: this.uploadProgress,
        isUploading: this.isUploading,
        uploadCompleted: this.uploadCompleted
      });
      
      this.changeDetectorRef.detectChanges();
      this.changeDetectorRef.markForCheck();
    });
  }

  public setUploadSuccessMessage(message: string): void {
    console.log('🚀 PAGE COMPONENT - setUploadSuccessMessage called with:', message);
    this.ngZone.run(() => {
      this.uploadSuccessMessage = message;
      this.uploadCompleted = true;
      this.isUploading = false;
      
      console.log('🚀 PAGE COMPONENT - Success message set:', this.uploadSuccessMessage);
      
      this.changeDetectorRef.detectChanges();
      
      // Show upload progress modal
      if (!this.uploadModalRef) {
        this.showUploadProgressModal();
      }
      
      // Auto close modal after 2 seconds and restore loading state
      setTimeout(() => {
        this.closeUploadProgressModal();
        // Ripristina loading = false per mostrare il form
        this.loading = false;
      }, 2000);
    });
  }

  public resetUploadState(): void {
    console.log('🚀 PAGE COMPONENT - resetUploadState called');
    this.ngZone.run(() => {
      this.uploadProgress = 0;
      this.isUploading = false;
      this.uploadCompleted = false;
      this.uploadSuccessMessage = '';
      
      console.log('🚀 PAGE COMPONENT - Upload state reset');
      
      this.changeDetectorRef.detectChanges();
    });
  }

  public showUploadProgressModal(): void {
    if (!this.uploadModalRef) {
      this.uploadModalRef = this.modalService.show(this.uploadProgressModal, {
        backdrop: 'static',
        keyboard: false,
        class: 'modal-dialog-centered'
      });
    }
  }

  public closeUploadProgressModal(): void {
    if (this.uploadModalRef) {
      this.uploadModalRef.hide();
      this.uploadModalRef = undefined;
    }
  }
}
