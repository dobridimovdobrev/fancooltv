# 📁 FanCoolTV - Mappa Struttura del Progetto

## 🎯 Guida per Sviluppatori Principianti

Questa documentazione ti aiuta a capire **dove trovare ogni file** e **a cosa serve**. Ogni sezione è spiegata in modo semplice e chiaro.

---

## 📂 Struttura Generale del Progetto

```
fancooltv-app/
├── 📁 src/app/                    ← CODICE PRINCIPALE DELL'APPLICAZIONE
├── 📁 docs/                       ← DOCUMENTAZIONE (questa cartella)
├── 📁 node_modules/               ← DIPENDENZE (non toccare)
├── 📄 package.json                ← CONFIGURAZIONE DIPENDENZE
├── 📄 angular.json                ← CONFIGURAZIONE ANGULAR
└── 📄 tsconfig.json               ← CONFIGURAZIONE TYPESCRIPT
```

---

## 🏗️ Struttura Dettagliata src/app/

### 🔧 **File di Configurazione Principali**
```
src/app/
├── 📄 app.module.ts               ← MODULO PRINCIPALE (dichiara tutti i componenti)
├── 📄 app-routing.module.ts       ← CONFIGURAZIONE ROTTE (dove vanno le pagine)
└── 📄 app.component.ts            ← COMPONENTE ROOT (punto di partenza app)
```

**🎯 Quando li usi:**
- `app.module.ts` → Quando aggiungi nuovi componenti
- `app-routing.module.ts` → Quando aggiungi nuove pagine/rotte
- `app.component.ts` → Raramente, è il contenitore principale

---

### 🛡️ **Sicurezza e Autenticazione**
```
src/app/
├── 📁 auth/                       ← PAGINE DI LOGIN E REGISTRAZIONE
│   ├── 📁 login/                  ← Componente pagina login
│   └── 📁 register/               ← Componente pagina registrazione
├── 📁 guards/                     ← PROTEZIONE ROTTE (chi può accedere)
└── 📁 interceptors/               ← GESTIONE TOKEN AUTOMATICA
```

**🎯 Cosa cercare qui:**
- **Problemi di login** → `auth/login/`
- **Problemi di registrazione** → `auth/register/`
- **Protezione pagine** → `guards/`
- **Token non funziona** → `interceptors/`

---

### 🎬 **Componenti Principali (Pagine)**
```
src/app/
├── 📁 home/                       ← PAGINA HOME
├── 📁 movies/                     ← PAGINA LISTA FILM
│   └── 📁 movies-list-wrapper/    ← NUOVO: Test componente unificato film
├── 📁 movie-details/              ← PAGINA DETTAGLI SINGOLO FILM
├── 📁 tvseries/                   ← PAGINA LISTA SERIE TV
│   └── 📁 tvseries-list-wrapper/  ← NUOVO: Test componente unificato serie
└── 📁 tvseries-details/           ← PAGINA DETTAGLI SINGOLA SERIE
```

**🎯 Cosa cercare qui:**
- **Problemi homepage** → `home/`
- **Lista film non carica** → `movies/`
- **Dettagli film** → `movie-details/`
- **Lista serie TV** → `tvseries/`
- **Dettagli serie** → `tvseries-details/`
- **Test nuovi componenti** → `*-wrapper/`

---

### 🔧 **Servizi (Logica Business)**
```
src/app/
├── 📁 services/                   ← SERVIZI ORIGINALI
│   ├── 📄 auth.service.ts         ← Gestione login/logout
│   ├── 📄 api.service.ts          ← Chiamate API generiche
│   ├── 📄 movie.service.ts        ← Gestione dati film (LEGACY)
│   └── 📄 tvseries.service.ts     ← Gestione dati serie TV (LEGACY)
└── 📁 shared/services/            ← SERVIZI REFACTORIZZATI (NUOVI)
    ├── 📄 base-media.service.ts   ← Servizio base unificato
    ├── 📄 movie.service.refactored.ts    ← Nuovo servizio film
    ├── 📄 tvseries.service.refactored.ts ← Nuovo servizio serie TV
    ├── 📄 image.service.ts        ← Gestione immagini
    └── 📄 validation.service.ts   ← Validazioni form
```

**🎯 Cosa cercare qui:**
- **Login non funziona** → `services/auth.service.ts`
- **API non risponde** → `services/api.service.ts`
- **Film non caricano** → `services/movie.service.ts` (legacy) o `shared/services/movie.service.refactored.ts` (nuovo)
- **Serie TV non caricano** → `services/tvseries.service.ts` (legacy) o `shared/services/tvseries.service.refactored.ts` (nuovo)
- **Immagini non caricano** → `shared/services/image.service.ts`

---

### 📊 **Modelli Dati (Interfacce TypeScript)**
```
src/app/
└── 📁 models/                     ← DEFINIZIONI STRUTTURE DATI
    ├── 📄 auth.models.ts          ← User, LoginCredentials, etc.
    ├── 📄 media.models.ts         ← Movie, Person, Trailer, Category
    ├── 📄 tvseries.models.ts      ← TVSeries, Season, Episode
    └── 📄 api.models.ts           ← ApiResponse, PaginationParams
```

**🎯 Cosa cercare qui:**
- **Errori TypeScript** → Controlla se le interfacce corrispondono ai dati API
- **Nuovi campi dati** → Aggiungi qui le definizioni
- **Struttura dati API** → `api.models.ts`

---

### 🎨 **Componenti Condivisi (Riutilizzabili)**
```
src/app/
└── 📁 shared/                     ← COMPONENTI RIUTILIZZABILI
    ├── 📁 components/             ← COMPONENTI SHARED
    │   ├── 📁 media-list/         ← NUOVO: Componente unificato film/serie
    │   ├── 📁 media-card/         ← NUOVO: Card riutilizzabile
    │   ├── 📁 search-filter/      ← NUOVO: Filtri di ricerca
    │   ├── 📁 loading-spinner/    ← NUOVO: Spinner caricamento
    │   ├── 📁 error-message/      ← NUOVO: Messaggi errore
    │   ├── 📁 navbar/             ← Barra navigazione
    │   └── 📁 footer/             ← Footer sito
    ├── 📄 shared.module.ts        ← MODULO SHARED (esporta componenti)
    └── 📄 ngx-bootstrap.module.ts ← CONFIGURAZIONE UI BOOTSTRAP
```

**🎯 Cosa cercare qui:**
- **Navbar problemi** → `shared/navbar/`
- **Footer problemi** → `shared/footer/`
- **Componenti riutilizzabili** → `shared/components/`
- **Nuovi componenti shared** → Aggiungi in `shared/components/` e dichiara in `shared.module.ts`

---

### 🏢 **Dashboard (Lazy Loading)**
```
src/app/
└── 📁 dashboard/                  ← SEZIONE AMMINISTRATIVA
    ├── 📄 dashboard.module.ts     ← Modulo lazy-loaded
    ├── 📁 admin/                  ← Sezione admin
    ├── 📁 user/                   ← Sezione utente
    └── 📁 admin-sidebar/          ← Sidebar amministrazione
```

**🎯 Cosa cercare qui:**
- **Problemi dashboard admin** → `dashboard/admin/`
- **Problemi area utente** → `dashboard/user/`
- **Sidebar non funziona** → `dashboard/admin-sidebar/`

---

## 🚀 **Componenti Refactorizzati (NUOVI)**

### ✨ **MediaListComponent - Il Cuore del Refactoring**
```
📁 shared/components/media-list/
├── 📄 media-list.component.ts     ← LOGICA: Gestisce sia film che serie TV
├── 📄 media-list.component.html   ← TEMPLATE: Layout unificato
└── 📄 media-list.component.scss   ← STILI: Design responsive
```

**🎯 Caratteristiche:**
- **Unifica** film e serie TV in un solo componente
- **Filtri** per categoria, anno, ricerca
- **Paginazione** automatica
- **Gestione errori** centralizzata
- **Loading states** con spinner

**🔧 Come usarlo:**
```html
<app-media-list 
  [mediaType]="'movie'" 
  [mediaService]="movieService"
  title="Movies">
</app-media-list>
```

### 🧩 **Wrapper Components (Test Graduale)**
```
📁 movies/movies-list-wrapper/      ← Test per film
📁 tvseries/tvseries-list-wrapper/  ← Test per serie TV
```

**🎯 Scopo:**
- **Test sicuro** del nuovo MediaListComponent
- **Rotte di test**: `/movies-test` e `/tvseries-test`
- **Backup** dei componenti originali

---

## 🛣️ **Rotte dell'Applicazione**

### 📍 **Rotte Principali**
```
/                    → HomeComponent
/login               → LoginComponent
/register            → RegisterComponent
/movies              → MoviesComponent (LEGACY)
/movies/:id          → MovieDetailsComponent
/tvseries            → TvseriesComponent (LEGACY)
/tvseries/:id        → TvseriesDetailsComponent
/dashboard           → DashboardModule (lazy-loaded)
```

### 🧪 **Rotte di Test (NUOVE)**
```
/movies-test         → MoviesListWrapperComponent (USA MediaListComponent)
/tvseries-test       → TvseriesListWrapperComponent (USA MediaListComponent)
```

**🎯 Come testare:**
1. Vai su `/movies-test` per testare il nuovo componente film
2. Vai su `/tvseries-test` per testare il nuovo componente serie TV
3. Confronta con `/movies` e `/tvseries` (versioni legacy)

---

## 🔍 **Come Trovare Quello Che Cerchi**

### 🐛 **Debugging per Tipo di Problema**

| **Problema** | **Dove Guardare** | **File Specifico** |
|--------------|-------------------|-------------------|
| Login non funziona | `auth/` + `services/` | `auth.service.ts` |
| Film non caricano | `movies/` + `services/` | `movie.service.ts` |
| Serie TV non caricano | `tvseries/` + `services/` | `tvseries.service.ts` |
| Immagini rotte | `shared/services/` | `image.service.ts` |
| Errori API | `services/` | `api.service.ts` |
| Routing problemi | `app-routing.module.ts` | Route configuration |
| Componenti non dichiarati | `app.module.ts` | Declarations array |
| Stili rotti | `*.scss` files | Component styles |

### 🆕 **Nuove Funzionalità (Post-Refactoring)**

| **Funzionalità** | **Dove Trovarla** | **Come Usarla** |
|------------------|-------------------|-----------------|
| Componente unificato | `shared/components/media-list/` | Sostituisce Movies e TVSeries |
| Servizi base | `shared/services/base-media.service.ts` | Logica comune film/serie |
| Componenti riutilizzabili | `shared/components/` | Card, filtri, spinner, errori |
| Test graduale | `*-wrapper/` components | Rotte `/movies-test`, `/tvseries-test` |

---

## 📚 **Prossimi Passi per Sviluppatori**

### 🔄 **Migrazione Legacy → Refactored**
1. **Testa** le rotte `/movies-test` e `/tvseries-test`
2. **Verifica** che tutto funzioni correttamente
3. **Sostituisci** gradualmente i componenti legacy
4. **Rimuovi** i file legacy quando tutto è stabile

### 🚀 **Estensioni Future**
- **Upload file**: Usa la documentazione in `backend-api-integration.md`
- **Video streaming**: Implementa VideoPlayerComponent
- **Immagini responsive**: Estendi ImageService
- **Error handling**: Migliora ErrorInterceptor

---

## ⚠️ **Note Importanti**

### 🚨 **Non Toccare**
- `node_modules/` → Dipendenze gestite automaticamente
- File legacy durante la migrazione → Mantieni come backup
- `*.spec.ts` → Test files (importante per CI/CD)

### ✅ **Sicuro da Modificare**
- Componenti in `shared/components/`
- Servizi refactorizzati in `shared/services/`
- Stili `.scss` (ma chiedi prima per design)
- Documentazione in `docs/`

---

**📅 Ultimo Aggiornamento**: Gennaio 2025  
**🔧 Versione Angular**: 15+  
**👥 Target**: Sviluppatori principianti e intermedi
