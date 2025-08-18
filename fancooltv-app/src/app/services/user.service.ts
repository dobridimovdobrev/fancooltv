import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: 'male' | 'female';
  birthday: string;
  country_id?: number;
  user_status: 'active' | 'inactive';
  role_id: number;
  ip_address?: string;
  last_activity?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface UserResponse {
  data: User[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  birthday: string;
  country_id?: number;
  role_id?: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  first_name?: string;
  last_name?: string;
  gender?: 'male' | 'female';
  birthday?: string;
  country_id?: number;
  role_id?: number;
  user_status?: 'active' | 'inactive';
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  first_name?: string;
  last_name?: string;
  gender?: 'male' | 'female';
  birthday?: string;
  country_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/v1/users`;
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all users with pagination and filters
   */
  getUsers(page: number = 1, perPage: number = 15, search?: string): Observable<UserResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<UserResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        // Filter out soft deleted users (deleted_at != null)
        const filteredUsers = response.data.filter(user => !user.deleted_at);
        return {
          ...response,
          data: filteredUsers,
          meta: response.meta ? {
            ...response.meta,
            total: filteredUsers.length
          } : undefined
        };
      })
    );
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<{ data: User }> {
    return this.http.get<{ data: User }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new user
   */
  createUser(userData: CreateUserRequest): Observable<{ message: string; data: User }> {
    return this.http.post<{ message: string; data: User }>(this.apiUrl, userData);
  }

  /**
   * Update user
   */
  updateUser(id: number, userData: UpdateUserRequest): Observable<{ message: string; data: User }> {
    return this.http.put<{ message: string; data: User }>(`${this.apiUrl}/${id}`, userData);
  }

  /**
   * Delete user
   */
  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update the users subject with new data
   */
  updateUsersSubject(users: User[]): void {
    this.usersSubject.next(users);
  }

  /**
   * Update user profile (for current user)
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<{ message: string; data: User }> {
    return this.http.put<{ message: string; data: User }>(`${environment.apiUrl}/api/v1/update-profile`, profileData);
  }

  /**
   * Get current users from subject
   */
  getCurrentUsers(): User[] {
    return this.usersSubject.value;
  }
}
