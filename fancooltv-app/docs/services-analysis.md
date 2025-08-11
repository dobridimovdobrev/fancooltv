# 🔧 FanCoolTV - Analisi Dettagliata dei Servizi

## 🎯 Guida Completa per Sviluppatori

Questa documentazione analizza **tutti i servizi** del progetto, spiegando **cosa fanno**, **come usarli** e **quando modificarli**.

---

## 🏗️ **Architettura dei Servizi**

```
src/app/
├── 📁 services/                   ← SERVIZI ORIGINALI (Legacy)
│   ├── 📄 auth.service.ts         ← Autenticazione
│   ├── 📄 api.service.ts          ← API generiche
│   ├── 📄 movie.service.ts        ← Film (LEGACY)
│   └── 📄 tvseries.service.ts     ← Serie TV (LEGACY)
└── 📁 shared/services/            ← SERVIZI REFACTORIZZATI (Nuovi)
    ├── 📄 base-media.service.ts   ← Servizio base unificato
    ├── 📄 movie.service.refactored.ts    ← Film (NUOVO)
    ├── 📄 tvseries.service.refactored.ts ← Serie TV (NUOVO)
    ├── 📄 image.service.ts        ← Gestione immagini
    ├── 📄 validation.service.ts   ← Validazioni
    └── 📄 url.service.ts          ← Gestione URL
```

---

## 🔐 **Servizi di Autenticazione**

### 🔑 **AuthService**
```
📄 src/app/services/auth.service.ts
```

**🎯 Cosa fa:**
- Gestisce **login e logout** utenti
- Mantiene **stato autenticazione** con BehaviorSubject
- Gestisce **token JWT** e localStorage
- Fornisce **metodi di validazione**

**🔧 Proprietà principali:**
```typescript
export class AuthService {
  private apiUrl = 'https://api.dobridobrev.com/api';
  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  
  public user$ = this.userSubject.asObservable();      // Observable utente
  public token$ = this.tokenSubject.asObservable();    // Observable token
  public isAuthenticated$ = this.user$.pipe(           // Observable auth status
    map(user => !!user)
  );
}
```

**📝 Metodi principali:**
```typescript
// Autenticazione
login(credentials: LoginCredentials): Observable<any>
logout(): void
register(userData: RegistrationData): Observable<any>

// Gestione stato
getCurrentUser(): User | null
getToken(): string | null
isAuthenticated(): boolean
updateUserProfile(userData: any): Observable<any>

// Validazioni
validateEmail(email: string): boolean
validatePassword(password: string): boolean
checkPasswordStrength(password: string): PasswordStrength

// Utility
refreshToken(): Observable<any>
clearAuthData(): void
```

**🚀 Come usarlo:**
```typescript
// Injection
constructor(private authService: AuthService) {}

// Login
this.authService.login({ email, password }).subscribe({
  next: (response) => {
    // Login riuscito
    this.router.navigate(['/dashboard']);
  },
  error: (error) => {
    // Gestisci errore
    this.errorMessage = error.message;
  }
});

// Controllo autenticazione
this.authService.isAuthenticated$.subscribe(isAuth => {
  if (!isAuth) {
    this.router.navigate(['/login']);
  }
});

// Logout
this.authService.logout();
```

**🔧 Quando modificarlo:**
- Aggiungere nuovi metodi autenticazione (OAuth, 2FA)
- Modificare gestione token
- Aggiungere validazioni custom
- Integrare con nuovi endpoint backend

---

## 🌐 **Servizi API**

### 🔗 **ApiService**
```
📄 src/app/services/api.service.ts
```

**🎯 Cosa fa:**
- Fornisce **metodi generici** per chiamate API
- Gestisce **headers** e **autenticazione**
- Centralizza **configurazione** endpoint
- Gestisce **errori** HTTP

**🔧 Proprietà principali:**
```typescript
export class ApiService {
  private apiUrl = 'https://api.dobridobrev.com/api';
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });
}
```

**📝 Metodi principali:**
```typescript
// Movies
getMovies(params?: any): Observable<ApiResponse<Movie[]>>
getMovieDetails(id: number): Observable<ApiResponse<Movie>>
createMovie(movieData: any): Observable<ApiResponse<Movie>>
updateMovie(id: number, movieData: any): Observable<ApiResponse<Movie>>
deleteMovie(id: number): Observable<any>

// TV Series
getTVSeries(params?: any): Observable<ApiResponse<TVSeries[]>>
getTVSeriesDetails(id: number): Observable<ApiResponse<TVSeries>>
createTVSeries(seriesData: any): Observable<ApiResponse<TVSeries>>
updateTVSeries(id: number, seriesData: any): Observable<ApiResponse<TVSeries>>
deleteTVSeries(id: number): Observable<any>

// Categories
getCategories(): Observable<ApiResponse<Category[]>>

// Persons
getPersons(params?: any): Observable<ApiResponse<Person[]>>
getPersonDetails(id: number): Observable<ApiResponse<Person>>

// Dashboard Stats
getDashboardStats(): Observable<ApiResponse<any>>

// Images
getImageUrl(imagePath: string, size?: string): string
```

**🚀 Come usarlo:**
```typescript
// Injection
constructor(private apiService: ApiService) {}

// Chiamata API
this.apiService.getMovies({ page: 1, category: 'action' }).subscribe({
  next: (response) => {
    this.movies = response.data;
    this.pagination = response.meta;
  },
  error: (error) => {
    console.error('API Error:', error);
  }
});
```

**🔧 Quando modificarlo:**
- Aggiungere nuovi endpoint
- Modificare gestione errori
- Aggiungere interceptor custom
- Aggiornare URL base API

---

## 🎬 **Servizi Media (Legacy)**

### 🎭 **MovieService (LEGACY)**
```
📄 src/app/services/movie.service.ts
```

**🎯 Cosa fa:**
- Gestisce **dati film** con BehaviorSubject
- Fornisce **metodi di ricerca** e **filtri**
- Gestisce **paginazione** e **stato caricamento**
- **LEGACY**: Sarà sostituito da MovieServiceRefactored

**🔧 Proprietà principali:**
```typescript
export class MovieService {
  private moviesSubject = new BehaviorSubject<Movie[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public movies$ = this.moviesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  
  private currentPage = 1;
  private hasMorePages = true;
  private currentFilters: any = {};
}
```

**📝 Metodi principali:**
```typescript
// Caricamento dati
loadMovies(reset?: boolean): Observable<Movie[]>
loadMovieDetails(id: number): Observable<Movie>
loadMoreMovies(): void

// Filtri e ricerca
searchMovies(query: string): void
filterByCategory(categoryId: number): void
filterByYear(year: string): void
clearFilters(): void

// Gestione stato
getCurrentMovies(): Movie[]
getLoadingState(): boolean
getErrorState(): string | null
hasMore(): boolean

// Utility
getYouTubeEmbedUrl(url: string): string
getFormattedDuration(minutes: number): string
```

**⚠️ Stato attuale:**
- ✅ **Funzionante** ma legacy
- 🔄 **In sostituzione** con MovieServiceRefactored
- ⚠️ **Non modificare** durante migrazione

---

### 📺 **TVSeriesService (LEGACY)**
```
📄 src/app/services/tvseries.service.ts
```

**🎯 Cosa fa:**
- Gestisce **dati serie TV** con BehaviorSubject
- Fornisce **metodi specifici** per serie TV
- Gestisce **stagioni ed episodi**
- **LEGACY**: Sarà sostituito da TVSeriesServiceRefactored

**🔧 Proprietà principali:**
```typescript
export class TVSeriesService {
  private seriesSubject = new BehaviorSubject<TVSeries[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public series$ = this.seriesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
}
```

**📝 Metodi principali:**
```typescript
// Caricamento dati
loadTVSeries(reset?: boolean): Observable<TVSeries[]>
loadTVSeriesDetails(id: number): Observable<TVSeries>

// Filtri specifici serie TV
filterByStatus(status: string): void
filterBySeasons(minSeasons: number, maxSeasons?: number): void

// Utility specifiche
getFormattedSeasons(totalSeasons: number): string
getFormattedDuration(duration: number): string
getStatusBadgeColor(status: string): string
```

**⚠️ Stato attuale:**
- ✅ **Funzionante** ma legacy
- 🔄 **In sostituzione** con TVSeriesServiceRefactored
- ⚠️ **Non modificare** durante migrazione

---

## 🚀 **Servizi Refactorizzati (NUOVI)**

### ⭐ **BaseMediaService - Servizio Base Unificato**
```
📄 src/app/shared/services/base-media.service.ts
```

**🎯 Cosa fa:**
- **Classe astratta** base per tutti i servizi media
- Fornisce **logica comune** per film e serie TV
- Gestisce **stato reattivo** con BehaviorSubject
- Implementa **pattern Template Method**

**🔧 Proprietà principali:**
```typescript
export abstract class BaseMediaService<T extends BaseMediaItem> {
  // State management
  protected itemsSubject = new BehaviorSubject<T[]>([]);
  protected loadingSubject = new BehaviorSubject<boolean>(false);
  protected errorSubject = new BehaviorSubject<string | null>(null);
  protected categoriesSubject = new BehaviorSubject<Category[]>([]);
  
  // Pagination and filtering state
  protected currentPage = 1;
  protected itemsPerPage = 20;
  protected hasMorePages = true;
  protected currentSearch = '';
  protected currentCategory = '';
  protected currentYear = '';
  protected isLoading = false;

  // Public observables
  public items$ = this.itemsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
}
```

**📝 Metodi astratti (da implementare nelle classi figlie):**
```typescript
// Metodi che devono essere implementati
protected abstract getApiEndpoint(): string;
protected abstract getDetailsApiEndpoint(id: number): string;
protected abstract mapApiResponse(response: any): T[];
protected abstract mapDetailsResponse(response: any): T;
protected abstract loadItems(reset?: boolean): Observable<T[]>;
protected abstract loadItemDetails(id: number): Observable<T>;
```

**📝 Metodi concreti (già implementati):**
```typescript
// Gestione categorie
loadCategories(): Observable<ApiResponse<Category[]>>
getCurrentCategories(): Category[]

// Filtri e ricerca
search(query: string): void
filterByCategory(categoryId: string): void
filterByYear(year: string): void
resetFilters(): void

// Paginazione
loadMore(): void
resetPagination(): void
getHasMorePages(): boolean

// Gestione stato
getCurrentItems(): T[]
getIsLoading(): boolean
getCurrentFilters(): any

// Utility
protected buildApiParams(params?: any): any
protected updatePaginationInfo(response: any): void
protected handleError(error: any): Observable<never>
```

**✨ Vantaggi:**
- **Elimina duplicazione** di codice
- **Comportamento consistente** tra servizi
- **Facilmente estendibile** per nuovi tipi media
- **Manutenibilità** migliorata

---

### 🎬 **MovieServiceRefactored**
```
📄 src/app/shared/services/movie.service.refactored.ts
```

**🎯 Cosa fa:**
- **Estende** BaseMediaService per film
- Implementa **metodi specifici** per film
- **Sostituisce** MovieService legacy
- **Compatibilità** con API backend v1

**🔧 Interfaccia MovieItem:**
```typescript
interface MovieItem extends Omit<Movie, 'category'>, BaseMediaItem {
  id: number;                    // Maps to movie_id
  category: string;              // Override category as string for BaseMediaItem compatibility
}
```

**📝 Metodi implementati:**
```typescript
// Metodi astratti implementati
protected getApiEndpoint(): string {
  return '/api/v1/movies';
}

protected getDetailsApiEndpoint(id: number): string {
  return `/api/v1/movies/${id}`;
}

protected mapApiResponse(response: ApiResponse<Movie[]>): MovieItem[] {
  return response.data?.map(movie => ({
    ...movie,
    id: movie.movie_id,
    category: typeof movie.category === 'string' ? movie.category : movie.category?.name || 'Unknown'
  })) || [];
}

loadItems(resetPagination: boolean = false): Observable<MovieItem[]>
loadItemDetails(id: number): Observable<MovieItem>
```

**📝 Metodi specifici per film:**
```typescript
// Backward compatibility
loadMovies(reset: boolean = false): Observable<MovieItem[]>
getMovieDetails(id: number): Observable<MovieItem>
loadMovieDetails(movieId: number): Observable<MovieItem>

// Utility specifiche
getYouTubeEmbedUrl(url: string): string
getFormattedDuration(minutes: number): string
isRecentlyReleased(movie: MovieItem): boolean
getStatusBadgeColor(status: string): string

// Filtri avanzati
filterByRating(minRating: number, maxRating: number = 10): void
getMoviesByCategory(categoryId: number): Observable<MovieItem[]>
advancedSearch(filters: {
  query?: string;
  category?: string;
  year?: string;
  minRating?: number;
  maxRating?: number;
}): void
```

**🚀 Come usarlo:**
```typescript
// Injection
constructor(private movieService: MovieServiceRefactored) {}

// Caricamento film
this.movieService.loadItems(true).subscribe({
  next: (movies) => {
    console.log('Movies loaded:', movies);
  }
});

// Osservare cambiamenti
this.movieService.items$.subscribe(movies => {
  this.movies = movies;
});

// Filtri
this.movieService.search('action');
this.movieService.filterByCategory('1');
this.movieService.filterByYear('2024');
```

---

### 📺 **TVSeriesServiceRefactored**
```
📄 src/app/shared/services/tvseries.service.refactored.ts
```

**🎯 Cosa fa:**
- **Estende** BaseMediaService per serie TV
- Implementa **metodi specifici** per serie TV
- **Sostituisce** TVSeriesService legacy
- **Compatibilità** con API backend v1

**🔧 Interfaccia TVSeriesItem:**
```typescript
interface TVSeriesItem extends Omit<TVSeries, 'category'>, BaseMediaItem {
  id: number;                    // Maps to tv_series_id
  category: string;              // Override category as string
}
```

**📝 Metodi implementati:**
```typescript
// Metodi astratti implementati
protected getApiEndpoint(): string {
  return '/api/v1/tvseries';
}

protected getDetailsApiEndpoint(id: number): string {
  return `/api/v1/tvseries/${id}`;
}

loadItems(resetPagination: boolean = false): Observable<TVSeriesItem[]>
loadItemDetails(id: number): Observable<TVSeriesItem>
```

**📝 Metodi specifici per serie TV:**
```typescript
// Backward compatibility
loadTVSeries(params: any = { page: 1 }): Observable<TVSeriesItem[]>
loadTVSeriesDetails(seriesId: number): Observable<TVSeriesItem>

// Utility specifiche serie TV
getYouTubeEmbedUrl(url: string): string
getFormattedSeasons(totalSeasons: number): string
getFormattedDuration(duration: number): string
getStatusBadgeColor(status: string): string

// Filtri specifici
filterByStatus(status: string): void
filterBySeasons(minSeasons: number, maxSeasons?: number): void
advancedSearch(filters: {
  query?: string;
  category?: string;
  year?: string;
  status?: string;
  minRating?: number;
  maxRating?: number;
}): void
```

---

## 🖼️ **Servizi Utility**

### 🎨 **ImageService**
```
📄 src/app/shared/services/image.service.ts
```

**🎯 Cosa fa:**
- Gestisce **URL immagini** responsive
- Fornisce **fallback** per immagini mancanti
- Ottimizza **caricamento** immagini
- Supporta **diverse dimensioni**

**📝 Metodi principali:**
```typescript
// Generazione URL
getImageUrl(imagePath: string, size?: string): string
getPosterUrl(posterPath: string, size?: string): string
getBackdropUrl(backdropPath: string, size?: string): string
getPersonImageUrl(personPath: string, size?: string): string

// Fallback e placeholder
getDefaultImageUrl(type: 'poster' | 'backdrop' | 'person'): string
getPlaceholderUrl(width: number, height: number): string

// Utility
preloadImage(url: string): Promise<void>
getImageDimensions(url: string): Promise<{width: number, height: number}>
isImageValid(url: string): Promise<boolean>

// Responsive images
getResponsiveImageSizes(): string[]
getBestImageSize(containerWidth: number, type: string): string
```

**🚀 Come usarlo:**
```typescript
// Injection
constructor(private imageService: ImageService) {}

// URL immagine
const posterUrl = this.imageService.getPosterUrl(movie.poster, 'w500');

// Fallback
const imageUrl = this.imageService.getImageUrl(movie.poster) || 
                 this.imageService.getDefaultImageUrl('poster');

// Preload
await this.imageService.preloadImage(imageUrl);
```

---

### ✅ **ValidationService**
```
📄 src/app/shared/services/validation.service.ts
```

**🎯 Cosa fa:**
- Fornisce **validatori custom** per form
- Centralizza **logica di validazione**
- Supporta **validazioni asincrone**
- **Messaggi di errore** localizzati

**📝 Metodi principali:**
```typescript
// Validatori email
validateEmail(email: string): boolean
emailValidator(): ValidatorFn
uniqueEmailValidator(): AsyncValidatorFn

// Validatori password
validatePassword(password: string): PasswordValidationResult
passwordStrengthValidator(minStrength: number): ValidatorFn
confirmPasswordValidator(passwordField: string): ValidatorFn

// Validatori generici
requiredValidator(fieldName: string): ValidatorFn
minLengthValidator(minLength: number, fieldName: string): ValidatorFn
maxLengthValidator(maxLength: number, fieldName: string): ValidatorFn
patternValidator(pattern: RegExp, errorMessage: string): ValidatorFn

// Validatori custom
urlValidator(): ValidatorFn
phoneValidator(): ValidatorFn
dateValidator(): ValidatorFn
numberRangeValidator(min: number, max: number): ValidatorFn

// Messaggi di errore
getErrorMessage(error: any, fieldName: string): string
getValidationErrors(form: FormGroup): string[]
```

**🚀 Come usarlo:**
```typescript
// Injection
constructor(private validationService: ValidationService) {}

// Form con validatori
this.loginForm = this.fb.group({
  email: ['', [
    Validators.required,
    this.validationService.emailValidator()
  ]],
  password: ['', [
    Validators.required,
    this.validationService.passwordStrengthValidator(2)
  ]]
});

// Messaggi di errore
getEmailError(): string {
  const emailControl = this.loginForm.get('email');
  if (emailControl?.errors) {
    return this.validationService.getErrorMessage(emailControl.errors, 'email');
  }
  return '';
}
```

---

### 🔗 **UrlService**
```
📄 src/app/shared/services/url.service.ts
```

**🎯 Cosa fa:**
- Gestisce **URL YouTube** e embed
- Genera **URL API** dinamici
- Gestisce **parametri query**
- **Utility** per routing

**📝 Metodi principali:**
```typescript
// YouTube
getYouTubeEmbedUrl(url: string): string
getYouTubeVideoId(url: string): string | null
isValidYouTubeUrl(url: string): boolean

// API URLs
buildApiUrl(endpoint: string, params?: any): string
buildImageUrl(imagePath: string, size?: string): string
buildStreamUrl(filename: string, isPublic?: boolean): string

// Query parameters
buildQueryString(params: any): string
parseQueryString(queryString: string): any
addQueryParam(url: string, key: string, value: string): string
removeQueryParam(url: string, key: string): string

// Utility
isValidUrl(url: string): boolean
getBaseUrl(): string
getCurrentUrl(): string
navigateWithParams(route: string[], params: any): void
```

---

## 🔧 **Come Usare Questa Documentazione**

### 🎯 **Per Sviluppatori Principianti**
1. **Inizia** con AuthService per capire l'autenticazione
2. **Studia** BaseMediaService per capire l'architettura
3. **Usa** i servizi refactorizzati per nuove feature
4. **Evita** i servizi legacy durante lo sviluppo

### 🚀 **Per Sviluppatori Esperti**
- **Estendi** BaseMediaService per nuovi tipi media
- **Contribuisci** ai servizi utility
- **Ottimizza** performance e caching
- **Implementa** nuovi pattern architetturali

### 🧪 **Per Testing**
- **Testa** i servizi refactorizzati vs legacy
- **Valida** performance e memory usage
- **Verifica** compatibilità API
- **Documenta** eventuali breaking changes

### 🔄 **Migrazione Legacy → Refactored**
1. **Identifica** utilizzi dei servizi legacy
2. **Sostituisci** gradualmente con servizi refactorizzati
3. **Testa** funzionalità dopo ogni sostituzione
4. **Rimuovi** servizi legacy quando sicuro

---

## 📊 **Confronto Legacy vs Refactored**

| **Aspetto** | **Legacy** | **Refactored** |
|-------------|------------|----------------|
| **Duplicazione codice** | ❌ Alta | ✅ Eliminata |
| **Manutenibilità** | ❌ Difficile | ✅ Facile |
| **Estendibilità** | ❌ Limitata | ✅ Ottima |
| **Performance** | ⚠️ Accettabile | ✅ Ottimizzata |
| **Testing** | ❌ Complesso | ✅ Semplificato |
| **Consistency** | ❌ Inconsistente | ✅ Uniforme |

---

**📅 Ultimo Aggiornamento**: Gennaio 2025  
**🎯 Stato**: Refactoring Completato  
**👥 Target**: Tutti i livelli di sviluppatori
