# 🧩 FanCoolTV - Analisi Dettagliata dei Componenti

## 🎯 Guida Completa per Sviluppatori

Questa documentazione analizza **ogni componente** del progetto, spiegando **cosa fa**, **come funziona** e **quando usarlo**.

---

## 📱 **Componenti Principali (Pagine)**

### 🏠 **HomeComponent**
```
📁 src/app/home/
├── 📄 home.component.ts           ← Logica componente home
├── 📄 home.component.html         ← Template homepage
└── 📄 home.component.scss         ← Stili homepage
```

**🎯 Cosa fa:**
- Mostra la **homepage** dell'applicazione
- Componente semplice senza logica complessa
- Punto di ingresso per gli utenti

**🔧 Proprietà principali:**
- Nessuna proprietà complessa
- Componente principalmente statico

**🚀 Quando modificarlo:**
- Cambiare contenuto homepage
- Aggiungere sezioni promozionali
- Modificare layout di benvenuto

---

### 🎬 **MoviesComponent (LEGACY)**
```
📁 src/app/movies/
├── 📄 movies.component.ts         ← Logica lista film
├── 📄 movies.component.html       ← Template lista film
└── 📄 movies.component.scss       ← Stili lista film
```

**🎯 Cosa fa:**
- Mostra **lista dei film** con paginazione
- Gestisce **filtri** per categoria, anno, ricerca
- Gestisce **stati di caricamento** e errori
- **LEGACY**: Sarà sostituito da MediaListComponent

**🔧 Proprietà principali:**
```typescript
export class MoviesComponent {
  movies: Movie[] = [];              // Lista film caricati
  categories: Category[] = [];       // Categorie disponibili
  loading = false;                   // Stato caricamento
  error = false;                     // Stato errore
  searchQuery = '';                  // Query di ricerca
  selectedCategory = '';             // Categoria selezionata
  selectedYear = '';                 // Anno selezionato
  currentPage = 1;                   // Pagina corrente
}
```

**📝 Metodi principali:**
- `loadMovies()` → Carica lista film
- `onSearch()` → Gestisce ricerca
- `onCategoryFilter()` → Filtra per categoria
- `onYearFilter()` → Filtra per anno
- `loadMore()` → Carica più film (paginazione)

**🚀 Stato attuale:**
- ✅ **Funzionante** ma legacy
- 🔄 **In sostituzione** con MediaListComponent
- ⚠️ **Non modificare** durante migrazione

---

### 📺 **TvseriesComponent (LEGACY)**
```
📁 src/app/tvseries/
├── 📄 tvseries.component.ts       ← Logica lista serie TV
├── 📄 tvseries.component.html     ← Template lista serie TV
└── 📄 tvseries.component.scss     ← Stili lista serie TV
```

**🎯 Cosa fa:**
- Mostra **lista delle serie TV** con paginazione
- Gestisce **filtri** per categoria, anno, ricerca, status
- Gestisce **stati di caricamento** e errori
- **LEGACY**: Sarà sostituito da MediaListComponent

**🔧 Proprietà principali:**
```typescript
export class TvseriesComponent {
  series: TVSeries[] = [];           // Lista serie TV caricate
  categories: Category[] = [];       // Categorie disponibili
  loading = false;                   // Stato caricamento
  error = false;                     // Stato errore
  searchQuery = '';                  // Query di ricerca
  selectedCategory = '';             // Categoria selezionata
  selectedYear = '';                 // Anno selezionato
  selectedStatus = '';               // Status selezionato
  currentPage = 1;                   // Pagina corrente
}
```

**📝 Metodi principali:**
- `loadSeries()` → Carica lista serie TV
- `onSearch()` → Gestisce ricerca
- `onCategoryFilter()` → Filtra per categoria
- `onYearFilter()` → Filtra per anno
- `onStatusFilter()` → Filtra per status
- `loadMore()` → Carica più serie (paginazione)

**🚀 Stato attuale:**
- ✅ **Funzionante** ma legacy
- 🔄 **In sostituzione** con MediaListComponent
- ⚠️ **Non modificare** durante migrazione

---

### 🎬 **MovieDetailsComponent**
```
📁 src/app/movie-details/
├── 📄 movie-details.component.ts  ← Logica dettagli film
├── 📄 movie-details.component.html ← Template dettagli film
└── 📄 movie-details.component.scss ← Stili dettagli film
```

**🎯 Cosa fa:**
- Mostra **dettagli completi** di un singolo film
- Gestisce **trailer video** e **cast**
- Mostra **immagini** (poster, backdrop)
- Gestisce **navigazione** e **autenticazione**

**🔧 Proprietà principali:**
```typescript
export class MovieDetailsComponent {
  movie: Movie | null = null;        // Dati film corrente
  loading = false;                   // Stato caricamento
  error = false;                     // Stato errore
  movieId: number;                   // ID film da URL
  isAuthenticated = false;           // Stato autenticazione
}
```

**📝 Metodi principali:**
- `loadMovieDetails()` → Carica dettagli film
- `getYouTubeEmbedUrl()` → Genera URL embed YouTube
- `getImageUrl()` → Genera URL immagini
- `goBack()` → Torna alla lista
- `checkAuthentication()` → Verifica login

**🚀 Quando modificarlo:**
- Aggiungere nuovi campi dettaglio
- Modificare layout dettagli
- Aggiungere funzionalità video player

---

### 📺 **TvseriesDetailsComponent**
```
📁 src/app/tvseries-details/
├── 📄 tvseries-details.component.ts ← Logica dettagli serie TV
├── 📄 tvseries-details.component.html ← Template dettagli serie
└── 📄 tvseries-details.component.scss ← Stili dettagli serie
```

**🎯 Cosa fa:**
- Mostra **dettagli completi** di una singola serie TV
- Gestisce **stagioni ed episodi**
- Mostra **trailer** e **cast**
- Gestisce **durata** e **status** serie

**🔧 Proprietà principali:**
```typescript
export class TvseriesDetailsComponent {
  series: TVSeries | null = null;   // Dati serie corrente
  loading = false;                  // Stato caricamento
  error = false;                    // Stato errore
  seriesId: number;                 // ID serie da URL
  isAuthenticated = false;          // Stato autenticazione
}
```

**📝 Metodi principali:**
- `loadSeriesDetails()` → Carica dettagli serie
- `getFormattedDuration()` → Formatta durata episodi
- `getFormattedSeasons()` → Formatta numero stagioni
- `getStatusBadgeColor()` → Colore badge status
- `getYouTubeEmbedUrl()` → URL embed trailer

**🚀 Quando modificarlo:**
- Aggiungere gestione episodi
- Modificare visualizzazione stagioni
- Aggiungere player video

---

## 🔐 **Componenti Autenticazione**

### 🔑 **LoginComponent**
```
📁 src/app/auth/login/
├── 📄 login.component.ts          ← Logica login
├── 📄 login.component.html        ← Form login
└── 📄 login.component.scss        ← Stili login
```

**🎯 Cosa fa:**
- Gestisce **form di login** utente
- Valida **email e password**
- Gestisce **errori di autenticazione**
- **Reindirizza** dopo login riuscito

**🔧 Proprietà principali:**
```typescript
export class LoginComponent {
  loginForm: FormGroup;              // Form reattivo
  loading = false;                   // Stato caricamento
  error = '';                        // Messaggio errore
  showPassword = false;              // Mostra/nascondi password
}
```

**📝 Metodi principali:**
- `onSubmit()` → Invia form login
- `togglePasswordVisibility()` → Mostra/nascondi password
- `validateForm()` → Valida campi form

**🚀 Quando modificarlo:**
- Aggiungere nuovi campi
- Modificare validazioni
- Cambiare design form

---

### 📝 **RegisterComponent**
```
📁 src/app/auth/register/
├── 📄 register.component.ts       ← Logica registrazione
├── 📄 register.component.html     ← Form registrazione
└── 📄 register.component.scss     ← Stili registrazione
```

**🎯 Cosa fa:**
- Gestisce **form di registrazione** nuovo utente
- Valida **tutti i campi** richiesti
- Gestisce **conferma password**
- **Reindirizza** dopo registrazione

**🔧 Proprietà principali:**
```typescript
export class RegisterComponent {
  registerForm: FormGroup;          // Form reattivo
  loading = false;                  // Stato caricamento
  error = '';                       // Messaggio errore
  showPassword = false;             // Mostra/nascondi password
  showConfirmPassword = false;      // Mostra/nascondi conferma
}
```

**📝 Metodi principali:**
- `onSubmit()` → Invia form registrazione
- `passwordMatchValidator()` → Valida corrispondenza password
- `togglePasswordVisibility()` → Gestisce visibilità password

---

## 🎨 **Componenti Shared (Riutilizzabili)**

### 🧭 **NavbarComponent**
```
📁 src/app/shared/navbar/
├── 📄 navbar.component.ts         ← Logica navbar
├── 📄 navbar.component.html       ← Template navbar
└── 📄 navbar.component.scss       ← Stili navbar
```

**🎯 Cosa fa:**
- Mostra **barra di navigazione** principale
- Gestisce **menu di navigazione**
- Mostra **stato autenticazione** utente
- Gestisce **logout**

**🔧 Proprietà principali:**
```typescript
export class NavbarComponent {
  isAuthenticated = false;          // Stato login utente
  user: User | null = null;         // Dati utente loggato
  isMenuOpen = false;               // Stato menu mobile
}
```

**📝 Metodi principali:**
- `logout()` → Effettua logout
- `toggleMenu()` → Apre/chiude menu mobile
- `checkAuthStatus()` → Verifica stato autenticazione

**🚀 Quando modificarlo:**
- Aggiungere nuove voci menu
- Modificare design navbar
- Aggiungere dropdown utente

---

### 🦶 **FooterComponent**
```
📁 src/app/shared/footer/
├── 📄 footer.component.ts         ← Logica footer
├── 📄 footer.component.html       ← Template footer
└── 📄 footer.component.scss       ← Stili footer
```

**🎯 Cosa fa:**
- Mostra **footer** del sito
- Contiene **link utili** e **informazioni**
- Componente principalmente **statico**

**🚀 Quando modificarlo:**
- Aggiungere nuovi link
- Modificare informazioni contatto
- Cambiare design footer

---

## 🚀 **Componenti Refactorizzati (NUOVI)**

### ⭐ **MediaListComponent - Componente Unificato**
```
📁 src/app/shared/components/media-list/
├── 📄 media-list.component.ts     ← LOGICA UNIFICATA film/serie
├── 📄 media-list.component.html   ← TEMPLATE UNIFICATO
└── 📄 media-list.component.scss   ← STILI RESPONSIVE
```

**🎯 Cosa fa:**
- **UNIFICA** la gestione di film e serie TV
- **Sostituisce** MoviesComponent e TvseriesComponent
- Gestisce **filtri avanzati** e **paginazione**
- **Riutilizzabile** per qualsiasi tipo di media

**🔧 Proprietà principali:**
```typescript
export class MediaListComponent {
  @Input() mediaType: MediaType = 'movie';     // Tipo media (movie/tvseries)
  @Input() title: string = '';                 // Titolo pagina
  @Input() searchPlaceholder: string = '';     // Placeholder ricerca
  @Input() mediaService!: BaseMediaService<any>; // Servizio dati

  items: BaseMediaItem[] = [];                 // Lista items caricati
  categories: Category[] = [];                 // Categorie disponibili
  years: number[] = [];                        // Anni disponibili
  loading = false;                             // Stato caricamento
  error = false;                               // Stato errore
  errorMessage = '';                           // Messaggio errore
  noResults = false;                           // Nessun risultato

  // Filtri e paginazione
  searchQuery = '';                            // Query ricerca
  selectedCategory = '';                       // Categoria selezionata
  selectedYear = '';                           // Anno selezionato
  currentPage = 1;                             // Pagina corrente
  itemsPerPage = 20;                           // Items per pagina
}
```

**📝 Metodi principali:**
```typescript
// Gestione dati
loadInitialData()                    // Carica dati iniziali
loadItems(reset: boolean)            // Carica items con paginazione
trackByFn(index, item)              // Ottimizzazione performance

// Gestione filtri
onSearch(query: string)             // Gestisce ricerca
onCategoryChange(category: string)  // Filtra per categoria
onYearChange(year: string)          // Filtra per anno
clearFilters()                      // Pulisce tutti i filtri

// Gestione eventi
onItemClick(item: any)              // Click su item
onLoadMore()                        // Carica più items
onRetry()                           // Riprova caricamento

// Navigazione
navigateToDetails(item: any)        // Vai ai dettagli
checkAuthentication()               // Verifica autenticazione
```

**🎯 Input del componente:**
```html
<app-media-list 
  [mediaType]="'movie'"              <!-- Tipo: 'movie' o 'tvseries' -->
  [title]="'Movies'"                 <!-- Titolo pagina -->
  [searchPlaceholder]="'Search movies...'" <!-- Placeholder -->
  [mediaService]="movieService">     <!-- Servizio dati -->
</app-media-list>
```

**✨ Vantaggi:**
- **Codice unificato** (no duplicazione)
- **Manutenibilità** migliorata
- **Performance** ottimizzate
- **UI consistente** tra film e serie
- **Facilmente estendibile** per nuovi tipi media

---

### 🃏 **MediaCardComponent**
```
📁 src/app/shared/components/media-card/
├── 📄 media-card.component.ts     ← Logica card media
├── 📄 media-card.component.html   ← Template card
└── 📄 media-card.component.scss   ← Stili card responsive
```

**🎯 Cosa fa:**
- Mostra **card riutilizzabile** per film/serie
- Gestisce **immagini responsive**
- Mostra **informazioni base** (titolo, anno, rating)
- Gestisce **click** e **hover effects**

**🔧 Proprietà principali:**
```typescript
export class MediaCardComponent {
  @Input() item!: BaseMediaItem;     // Dati media item
  @Input() mediaType: MediaType = 'movie'; // Tipo media
  @Output() itemClick = new EventEmitter<BaseMediaItem>(); // Evento click
}
```

**📝 Metodi principali:**
- `onClick()` → Emette evento click
- `getImageUrl()` → Genera URL immagine
- `getFormattedDuration()` → Formatta durata
- `getFormattedRating()` → Formatta rating

---

### 🔍 **SearchFilterComponent**
```
📁 src/app/shared/components/search-filter/
├── 📄 search-filter.component.ts  ← Logica filtri
├── 📄 search-filter.component.html ← Template filtri
└── 📄 search-filter.component.scss ← Stili filtri
```

**🎯 Cosa fa:**
- Fornisce **filtri di ricerca** riutilizzabili
- Gestisce **search box**, **dropdown categorie**, **selector anni**
- Emette **eventi** per ogni filtro
- **Responsive** e **accessibile**

**🔧 Proprietà principali:**
```typescript
export class SearchFilterComponent {
  @Input() categories: Category[] = [];       // Categorie disponibili
  @Input() years: number[] = [];              // Anni disponibili
  @Input() searchPlaceholder = 'Search...';   // Placeholder ricerca
  
  @Output() searchChange = new EventEmitter<string>();    // Evento ricerca
  @Output() categoryChange = new EventEmitter<string>();  // Evento categoria
  @Output() yearChange = new EventEmitter<string>();      // Evento anno
  @Output() clearFilters = new EventEmitter<void>();      // Evento clear
}
```

---

### ⏳ **LoadingSpinnerComponent**
```
📁 src/app/shared/components/loading-spinner/
├── 📄 loading-spinner.component.ts ← Logica spinner
├── 📄 loading-spinner.component.html ← Template spinner
└── 📄 loading-spinner.component.scss ← Animazioni CSS
```

**🎯 Cosa fa:**
- Mostra **spinner di caricamento** riutilizzabile
- **Animazioni CSS** fluide
- **Dimensioni personalizzabili**
- **Messaggi opzionali**

**🔧 Proprietà principali:**
```typescript
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium'; // Dimensione
  @Input() message: string = '';                           // Messaggio opzionale
  @Input() color: string = '#007bff';                      // Colore spinner
}
```

---

### ❌ **ErrorMessageComponent**
```
📁 src/app/shared/components/error-message/
├── 📄 error-message.component.ts  ← Logica errori
├── 📄 error-message.component.html ← Template errori
└── 📄 error-message.component.scss ← Stili errori
```

**🎯 Cosa fa:**
- Mostra **messaggi di errore** consistenti
- **Tipi diversi** di errore (warning, error, info)
- **Pulsante retry** opzionale
- **Icone** e **colori** appropriati

**🔧 Proprietà principali:**
```typescript
export class ErrorMessageComponent {
  @Input() message: string = '';                    // Messaggio errore
  @Input() type: 'error' | 'warning' | 'info' = 'error'; // Tipo errore
  @Input() showRetry: boolean = false;              // Mostra pulsante retry
  @Output() retry = new EventEmitter<void>();       // Evento retry
}
```

---

## 🧪 **Wrapper Components (Test Graduale)**

### 🎬 **MoviesListWrapperComponent**
```
📁 src/app/movies/movies-list-wrapper/
├── 📄 movies-list-wrapper.component.ts   ← Wrapper per test film
├── 📄 movies-list-wrapper.component.html ← Template wrapper
└── 📄 movies-list-wrapper.component.scss ← Stili wrapper
```

**🎯 Cosa fa:**
- **Testa** MediaListComponent con dati film
- **Configura** servizio e parametri per film
- **Rotta di test**: `/movies-test`
- **Backup sicuro** durante migrazione

**🔧 Configurazione:**
```typescript
export class MoviesListWrapperComponent {
  mediaType: MediaType = 'movie';
  title = 'Movies (Test)';
  searchPlaceholder = 'Search movies...';
  
  constructor(public movieService: MovieServiceRefactored) {}
}
```

---

### 📺 **TvseriesListWrapperComponent**
```
📁 src/app/tvseries/tvseries-list-wrapper/
├── 📄 tvseries-list-wrapper.component.ts ← Wrapper per test serie
├── 📄 tvseries-list-wrapper.component.html ← Template wrapper
└── 📄 tvseries-list-wrapper.component.scss ← Stili wrapper
```

**🎯 Cosa fa:**
- **Testa** MediaListComponent con dati serie TV
- **Configura** servizio e parametri per serie
- **Rotta di test**: `/tvseries-test`
- **Backup sicuro** durante migrazione

**🔧 Configurazione:**
```typescript
export class TvseriesListWrapperComponent {
  mediaType: MediaType = 'tvseries';
  title = 'TV Series (Test)';
  searchPlaceholder = 'Search TV series...';
  
  constructor(public tvseriesService: TVSeriesServiceRefactored) {}
}
```

---

## 🏢 **Dashboard Components**

### 📊 **DashboardModule**
```
📁 src/app/dashboard/
├── 📄 dashboard.module.ts         ← Modulo lazy-loaded
├── 📁 admin/                      ← Componenti admin
├── 📁 user/                       ← Componenti utente
└── 📁 admin-sidebar/              ← Sidebar amministrazione
```

**🎯 Cosa fa:**
- **Modulo separato** caricato on-demand
- **Sezione amministrativa** dell'app
- **Gestione utenti** e **contenuti**
- **Performance** migliorata con lazy loading

---

## 🔧 **Come Usare Questa Documentazione**

### 🎯 **Per Sviluppatori Principianti**
1. **Inizia** dalla struttura generale
2. **Identifica** il componente che ti interessa
3. **Leggi** cosa fa e le proprietà principali
4. **Guarda** i metodi disponibili
5. **Modifica** con attenzione

### 🚀 **Per Sviluppatori Esperti**
- **Usa** i componenti refactorizzati per nuove feature
- **Estendi** MediaListComponent per nuovi tipi media
- **Riutilizza** i componenti shared
- **Contribuisci** al miglioramento dell'architettura

### 🧪 **Per Testing**
- **Testa** le rotte `/movies-test` e `/tvseries-test`
- **Confronta** con le versioni legacy
- **Valida** performance e UX
- **Segnala** eventuali problemi

---

**📅 Ultimo Aggiornamento**: Gennaio 2025  
**🎯 Stato**: Post-Refactoring Completato  
**👥 Target**: Tutti i livelli di sviluppatori
