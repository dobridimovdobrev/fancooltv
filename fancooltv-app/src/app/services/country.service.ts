import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Country {
  country_id: number;
  name: string;
  continent: string;
  iso_char2: string;
  iso_char3: string;
  phone_prefix: string;
}

export interface CountryResponse {
  data: Country[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateCountryRequest {
  name: string;
  continent: string;
  iso_char2: string;
  iso_char3: string;
  phone_prefix: string;
}

export interface UpdateCountryRequest {
  name?: string;
  continent?: string;
  iso_char2?: string;
  iso_char3?: string;
  phone_prefix?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private apiUrl = `${environment.apiUrl}/api/v1/countries`;
  
  // BehaviorSubject for reactive state management
  private countriesSubject = new BehaviorSubject<Country[]>([]);
  public countries$ = this.countriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all countries with pagination and filters
   */
  getCountries(page: number = 1, perPage: number = 30, filters?: {
    country_id?: string;
    name?: string;
    continent?: string;
    iso2?: string;
    iso3?: string;
    phone_prefix?: string;
  }): Observable<CountryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (filters) {
      if (filters.country_id && filters.country_id.trim()) {
        params = params.set('country_id', filters.country_id.trim());
      }
      if (filters.name && filters.name.trim()) {
        params = params.set('name', filters.name.trim());
      }
      if (filters.continent && filters.continent.trim()) {
        params = params.set('continent', filters.continent.trim());
      }
      if (filters.iso2 && filters.iso2.trim()) {
        params = params.set('iso2', filters.iso2.trim());
      }
      if (filters.iso3 && filters.iso3.trim()) {
        params = params.set('iso3', filters.iso3.trim());
      }
      if (filters.phone_prefix && filters.phone_prefix.trim()) {
        params = params.set('phone_prefix', filters.phone_prefix.trim());
      }
    }

    return this.http.get<CountryResponse>(this.apiUrl, { params });
  }

  /**
   * Get country by ID
   */
  getCountryById(id: number): Observable<{ data: Country }> {
    return this.http.get<{ data: Country }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get country by ID (alias for form compatibility)
   */
  getCountry(id: number): Observable<Country> {
    return this.getCountryById(id).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create new country
   */
  createCountry(countryData: CreateCountryRequest): Observable<{ data: Country }> {
    return this.http.post<{ data: Country }>(this.apiUrl, countryData);
  }

  /**
   * Update country
   */
  updateCountry(id: number, countryData: UpdateCountryRequest): Observable<{ data: Country }> {
    return this.http.put<{ data: Country }>(`${this.apiUrl}/${id}`, countryData);
  }

  /**
   * Delete country
   */
  deleteCountry(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update the countries subject with new data
   */
  updateCountriesSubject(countries: Country[]): void {
    this.countriesSubject.next(countries);
  }

  /**
   * Get current countries from subject
   */
  getCurrentCountries(): Country[] {
    return this.countriesSubject.value;
  }
}
