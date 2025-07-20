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

  saveMovie(): void {
    if (!this.movieForm.isValid()) {
      return;
    }

    const formData = this.movieForm.getFormData();
    this.loading = true;

    if (this.isEditMode && this.movie) {
      // Update existing movie
      this.apiService.updateMovie(this.movie.movie_id, formData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/admin/movies']);
        },
        error: (err) => {
          this.error = 'Failed to update movie. Please try again.';
          console.error('Error updating movie:', err);
          this.loading = false;
        }
      });
    } else {
      // Create new movie
      this.apiService.createMovie(formData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/admin/movies']);
        },
        error: (err) => {
          this.error = 'Failed to create movie. Please try again.';
          console.error('Error creating movie:', err);
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard/admin/movies']);
  }
}
