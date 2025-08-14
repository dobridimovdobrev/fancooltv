import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Category {
  category_id: number;
  name: string;
  deleted_at?: string | null;
}

export interface CategoryResponse {
  data: Category[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api/v1/categories`;
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all categories with pagination and filters
   */
  getCategories(page: number = 1, perPage: number = 30, filters?: any): Observable<CategoryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key].trim()) {
          params = params.set(key, filters[key].trim());
        }
      });
    }

    return this.http.get<CategoryResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        // Filter out soft deleted categories (deleted_at != null)
        const filteredCategories = response.data.filter(category => !category.deleted_at);
        return {
          ...response,
          data: filteredCategories,
          meta: response.meta ? {
            ...response.meta,
            total: filteredCategories.length
          } : undefined
        };
      })
    );
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: number): Observable<{ data: Category }> {
    return this.http.get<{ data: Category }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new category
   */
  createCategory(categoryData: CreateCategoryRequest): Observable<{ message: string; data: Category }> {
    return this.http.post<{ message: string; data: Category }>(this.apiUrl, categoryData);
  }

  /**
   * Update category
   */
  updateCategory(id: number, categoryData: UpdateCategoryRequest): Observable<{ message: string; data: Category }> {
    return this.http.put<{ message: string; data: Category }>(`${this.apiUrl}/${id}`, categoryData);
  }

  /**
   * Delete category
   */
  deleteCategory(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update the categories subject with new data
   */
  updateCategoriesSubject(categories: Category[]): void {
    this.categoriesSubject.next(categories);
  }

  /**
   * Get current categories from subject
   */
  getCurrentCategories(): Category[] {
    return this.categoriesSubject.value;
  }
}
