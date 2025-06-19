import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { MovieService } from '../services/movie.service';
import { Movie, Category } from '../models/media.models';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})
export class MoviesComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  movies: Movie[] = [];
  categories: Category[] = [];
  years: number[] = [];
  loading = false;
  noResults = false;
  
  constructor(
    private movieService: MovieService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Verificare autenticazione
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Generare gli anni per il filtro
    this.years = this.movieService.getYears();
    
    // Sottoscriversi ai film
    this.movieService.movies$.subscribe(movies => {
      this.movies = movies;
      this.noResults = this.movies.length === 0;
    });
    
    // Sottoscriversi allo stato di caricamento
    this.movieService.loading$.subscribe(loading => {
      this.loading = loading;
    });
    
    // Caricare le categorie
    this.movieService.loadCategories().subscribe();
    
    // Sottoscriversi alle categorie
    this.movieService.categories$.subscribe(categories => {
      this.categories = categories;
    });
    
    // Caricare i film iniziali
    this.loadMovies();
  }
  
  ngAfterViewInit(): void {
    // Configurare la ricerca con debounce
    if (this.searchInput) {
      fromEvent(this.searchInput.nativeElement, 'input')
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          tap(() => {
            const query = this.searchInput.nativeElement.value;
            this.search(query);
          })
        )
        .subscribe();
    }
  }
  
  /**
   * Carica i film con reset opzionale
   */
  loadMovies(reset: boolean = false): void {
    this.movieService.loadMovies(reset).subscribe();
  }
  
  /**
   * Gestisce la ricerca dei film
   */
  search(query: string): void {
    this.movieService.search(query);
  }
  
  /**
   * Gestisce il click sul pulsante di ricerca
   */
  onSearchClick(): void {
    if (this.searchInput) {
      const query = this.searchInput.nativeElement.value;
      this.search(query);
    }
  }
  
  /**
   * Gestisce il cambio di categoria
   */
  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.movieService.filterByCategory(select.value);
  }
  
  /**
   * Gestisce il cambio di anno
   */
  onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.movieService.filterByYear(select.value);
  }
  
  /**
   * Carica più film (paginazione)
   */
  loadMore(): void {
    this.movieService.loadMore();
  }
  
  /**
   * Ottiene l'URL dell'immagine
   */
  getImageUrl(path: string, type: string = 'poster'): string {
    return this.movieService.getImageUrl(path, type as any);
  }
  
  /**
   * Naviga ai dettagli del film
   */
  goToDetails(movieId: number): void {
    this.router.navigate(['/movie-details', movieId]);
  }
  
  /**
   * Gestisce gli errori di caricamento delle immagini
   */
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.parentElement) {
      // Nascondi l'immagine che ha dato errore
      imgElement.style.display = 'none';
      
      // Mostra il placeholder
      const placeholder = imgElement.parentElement.querySelector('.no-image-placeholder');
      if (placeholder instanceof HTMLElement) {
        placeholder.classList.remove('d-none');
        placeholder.style.display = 'flex';
      }
    }
  }
}
