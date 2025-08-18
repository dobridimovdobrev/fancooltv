import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { 
  AuthApiResponse, 
  LoginCredentials, 
  RegistrationData, 
  User 
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Base URL for API calls
  private readonly baseUrl = 'https://api.dobridobrev.com';
  
  // BehaviorSubject to store and share the current user state
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    // Initialize from localStorage if available
    const storedUser = localStorage.getItem('current_user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Get current user value without subscribing
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token && !!this.currentUserValue;
  }

  // Check if user is admin
  public isAdmin(): boolean {
    return this.isAuthenticated() && this.currentUserValue?.role === 'admin';
  }

  // Update current user data
  public updateCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  // Refresh user data from server (useful after admin changes)
  public refreshUserData(): Observable<User> {
    return this.getUserProfile();
  }

  // Get stored auth token
  public getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Initialize CSRF protection for Sanctum
  public initCsrf(): Observable<void> {
    // Rimuoviamo withCredentials: true per evitare problemi CORS
    return this.http.get(`${this.baseUrl}/sanctum/csrf-cookie`)
      .pipe(
        map(() => undefined),
        catchError(error => {
          console.error('CSRF initialization failed:', error);
          // In development environment, we continue with authentication anyway
          // In production, this should be handled properly
          console.warn('Continuing without CSRF token - this is not secure for production');
          return of(undefined); // Return a valid value instead of throwing an error
        })
      );
  }

  // Login method - versione completamente riscritta
  public login(credentials: LoginCredentials): Observable<User> {
    console.log('Login attempt with username:', credentials.username);
    
    // Create specific headers for this request
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    // Perform the login request directly
    return this.http.post<any>(
      `${this.baseUrl}/api/login`,
      credentials,
      { headers: headers }
    ).pipe(
      // Primo controllo: il nuovo formato API con token diretto
      map(response => {
        console.log('Risposta login:', response);
        
        // NUOVO FORMATO API: { token, role, user_id, success }
        if (response && response.token) {
          console.log('Formato API rilevato: nuovo formato con token diretto');
          
          // Salva il token
          localStorage.setItem('auth_token', response.token);
          
          // Salva il ruolo dell'utente
          const userRole = response.role || 'user';
          localStorage.setItem('userRole', userRole);
          
          // Crea oggetto utente
          const user: User = {
            id: response.user_id || 0,
            username: credentials.username,
            email: '',
            first_name: '',
            last_name: '',
            gender: '',
            birthday: '',
            role: userRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Salva e aggiorna stato
          localStorage.setItem('current_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }
        
        // VECCHIO FORMATO API: { status: 'success', message: { token } }
        else if (response && response.status === 'success' && response.message && response.message.token) {
          console.log('Formato API rilevato: vecchio formato con status e message.token');
          
          // Salva il token
          localStorage.setItem('auth_token', response.message.token);
          
          // Determina il ruolo (temporaneamente basato sul nome utente)
          const isAdmin = credentials.username.toLowerCase().includes('admin');
          const userRole = isAdmin ? 'admin' : 'user';
          localStorage.setItem('userRole', userRole);
          
          // Crea oggetto utente
          const user: User = {
            id: 0,
            username: credentials.username,
            email: '',
            first_name: '',
            last_name: '',
            gender: '',
            birthday: '',
            role: userRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Salva e aggiorna stato
          localStorage.setItem('current_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }
        
        // FORMATO ALTERNATIVO: { data: { token, user } }
        else if (response && response.data && response.data.token) {
          console.log('Formato API rilevato: formato alternativo con data.token');
          
          // Salva il token
          localStorage.setItem('auth_token', response.data.token);
          
          // Salva l'utente se presente
          if (response.data.user) {
            localStorage.setItem('current_user', JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
            return response.data.user;
          }
          
          // Altrimenti crea un utente base
          const user: User = {
            id: 0,
            username: credentials.username,
            email: '',
            first_name: '',
            last_name: '',
            gender: '',
            birthday: '',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Salva e aggiorna stato
          localStorage.setItem('current_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }
        
        // Se arriviamo qui, il formato non è valido
        console.error('Formato risposta login non valido:', response);
        throw new Error('Login fallito: formato risposta non valido');
      }),
      catchError(error => {
        console.error('Errore di login:', error);
        return throwError(() => new Error('Username o password non validi'));
      })
    );
  }

  // Registration method
  public register(data: RegistrationData): Observable<void> {
    console.log('Iniziando la registrazione con i dati:', JSON.stringify(data));
    
    // Tentiamo prima di ottenere il token CSRF, ma procediamo anche se fallisce
    return this.initCsrf().pipe(
      tap(() => console.log('CSRF initialized, proceeding with registration')),
      catchError(error => {
        console.warn('CSRF initialization failed, proceeding with registration anyway:', error);
        return of(undefined);
      }),
      switchMap(() => {
        console.log('Invio richiesta di registrazione a:', `${this.baseUrl}/api/register`);
        // After CSRF is initialized, proceed with registration
        return this.http.post<AuthApiResponse<any>>(
          `${this.baseUrl}/api/register`,
          data,
          { headers: this.getHeaders() }
        ).pipe(
          tap(response => console.log('Risposta dal server:', response)),
          map(response => {
            if (response.status === 'success') {
              console.log('Registrazione completata con successo');
              return;
            } else {
              console.error('Formato risposta non valido:', response);
              throw new Error('Registration failed: Invalid response format');
            }
          }),
          catchError(error => {
            console.error('Errore durante la registrazione:', error);
            console.error('Dettagli errore:', JSON.stringify(error));
            
            // Handle validation errors
            if (error.status === 422 && error.error?.errors) {
              console.log('Errori di validazione:', error.error.errors);
              return throwError(() => ({
                status: 422,
                errors: error.error.errors,
                message: 'Validation failed'
              }));
            }
            
            // If there is a specific error message, we use it
            if (error.error && error.error.message) {
              console.log('Error message from server:', error.error.message);
              return throwError(() => new Error(error.error.message));
            }
            
            // Altrimenti restituiamo un errore generico
            return throwError(() => new Error('Si è verificato un errore durante la registrazione. Riprova più tardi.'));
          })
        );
      }),
      catchError(error => {
        console.error('Processo di registrazione fallito:', error);
        return throwError(() => error);
      })
    );
  }

  // Logout method
  public logout(): void {
    // Call logout endpoint if needed
    this.http.post<any>(`${this.baseUrl}/api/logout`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Logout API error:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: () => this.clearAuthData(),
      error: () => this.clearAuthData() // Clear data even if API call fails
    });
  }

  // Get user profile
  public getUserProfile(): Observable<User> {
    return this.http.get<AuthApiResponse<User>>(
      `${this.baseUrl}/api/user`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          // Update stored user data
          localStorage.setItem('current_user', JSON.stringify(response.data));
          this.currentUserSubject.next(response.data);
          return response.data;
        } else {
          throw new Error('Failed to fetch user profile');
        }
      }),
      catchError(error => {
        console.error('Get user profile error:', error);
        if (error.status === 401) {
          // If unauthorized, clear auth data
          this.clearAuthData();
        }
        return throwError(() => new Error('Failed to fetch user profile'));
      })
    );
  }

  // Clear authentication data
  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  // Get headers for API requests
  private getHeaders(): HttpHeaders {
    // Add the X-Requested-With header which is essential for CSRF requests with Laravel Sanctum
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });

    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }
}
