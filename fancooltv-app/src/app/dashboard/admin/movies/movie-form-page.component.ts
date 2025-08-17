import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie } from 'src/app/models/media.models';
import { ApiService } from 'src/app/services/api.service';
import { MovieFormComponent } from './movie-form.component';

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

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
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
      // Update existing movie
      console.log('Updating existing movie:', this.movie.movie_id);
      this.apiService.updateMovie(this.movie.movie_id, formData).subscribe({
        next: (response) => {
          console.log('Movie updated successfully:', response);
          this.loading = false;
          this.router.navigate(['/dashboard/admin/movies']);
        },
        error: (err) => {
          this.error = 'Failed to update movie. Please try again.';
          console.error('Error updating movie:', err);
          this.loading = false;
          // Reset loading state in child component
          if (this.movieForm) {
            this.movieForm.loading = false;
          }
        }
      });
    } else {
      // Create new movie
      console.log('Creating new movie with data:', formData);
      this.apiService.createMovie(formData).subscribe({
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
          this.error = 'Failed to create movie. Please try again.';
          console.error('Error creating movie:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.message);
          console.error('Error details:', err.error);
          if (err.error && err.error.errors) {
            console.error('Validation errors:', err.error.errors);
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
}
