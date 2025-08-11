# Backend API Integration Guide - FanCoolTV Angular

## 📋 Overview

This document provides comprehensive integration guidelines for the FanCoolTV Angular application with the backend API. It includes authentication, file uploads, video streaming, and best practices for Angular development.

## 🔐 Authentication

### Login Endpoint
```
POST /api/login
```

### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "token": "1|abc123...",
  "role": "admin",
  "user_id": 1,
  "success": true
}
```

### Angular Auth Service Example
```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://api.dobridobrev.com/api';
  private token: string | null = null;

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('auth_token');
  }

  login(email: string, password: string) {
    return this.http.post(`${this.apiUrl}/login`, { email, password })
      .subscribe((response: any) => {
        this.token = response.token;
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_role', response.role);
        localStorage.setItem('user_id', response.user_id.toString());
      });
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }
}
```

## 📁 File Upload Endpoints

### Image Upload
```
POST /api/v1/upload/image
```
- **Formats**: jpg, jpeg, png, webp, gif
- **Max Size**: 10MB
- **Types**: poster, backdrop, still, persons

### Video Upload
```
POST /api/v1/upload/video
```
- **Formats**: mp4, webm, ogg, mov, avi, mkv
- **Max Size**: 500MB

### Angular File Upload Service
```typescript
// file-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = 'https://api.dobridobrev.com/api/v1';

  constructor(private http: HttpClient, private auth: AuthService) {}

  uploadImage(file: File, type: string, title?: string, description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    return this.http.post(`${this.apiUrl}/upload/image`, formData, {
      headers: this.auth.getAuthHeaders().delete('Content-Type'), // Remove Content-Type for FormData
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / event.total!);
          return { type: 'progress', progress };
        } else if (event.type === HttpEventType.Response) {
          return { type: 'complete', data: event.body };
        }
        return { type: 'other', event };
      })
    );
  }

  uploadVideo(file: File, title?: string): Observable<any> {
    const formData = new FormData();
    formData.append('video', file);
    if (title) formData.append('title', title);

    return this.http.post(`${this.apiUrl}/upload/video`, formData, {
      headers: this.auth.getAuthHeaders().delete('Content-Type'),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / event.total!);
          return { type: 'progress', progress };
        } else if (event.type === HttpEventType.Response) {
          return { type: 'complete', data: event.body };
        }
        return { type: 'other', event };
      })
    );
  }

  getSupportedFormats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/upload/formats`, {
      headers: this.auth.getAuthHeaders()
    });
  }
}
```

## 🎬 Movies API

### List Movies
```
GET /api/v1/movies
```

### Movie Details
```
GET /api/v1/movies/{id}
```

### Enhanced Data Structure
```json
{
  "data": [
    {
      "movie_id": 1,
      "title": "Example Movie",
      "year": 2024,
      "duration": 120,
      "imdb_rating": 8.5,
      "status": "published",
      "category": {
        "id": 1,
        "name": "Action"
      },
      "poster": {
        "url": "https://api.dobridobrev.com/storage/images/poster/abc123.jpg",
        "sizes": {
          "w92": "https://api.dobridobrev.com/storage/images/poster/abc123.jpg",
          "w154": "https://api.dobridobrev.com/storage/images/poster/abc123.jpg",
          "w185": "https://api.dobridobrev.com/storage/images/poster/abc123.jpg",
          "w342": "https://api.dobridobrev.com/storage/images/poster/abc123.jpg",
          "w500": "https://api.dobridobrev.com/storage/images/poster/abc123.jpg",
          "w780": "https://api.dobridobrev.com/storage/images/poster/abc123.jpg",
          "original": "https://api.dobridobrev.com/storage/images/poster/abc123.jpg"
        },
        "width": 500,
        "height": 750,
        "format": "jpg"
      }
    }
  ],
  "links": { "..." },
  "meta": { "..." }
}
```

### Movie Details Response
```json
{
  "description": "Movie description...",
  "backdrop": {
    "url": "https://api.dobridobrev.com/storage/images/backdrop/def456.jpg",
    "sizes": {
      "w300": "https://api.dobridobrev.com/storage/images/backdrop/def456.jpg",
      "w780": "https://api.dobridobrev.com/storage/images/backdrop/def456.jpg",
      "w1280": "https://api.dobridobrev.com/storage/images/backdrop/def456.jpg",
      "original": "https://api.dobridobrev.com/storage/images/backdrop/def456.jpg"
    },
    "width": 1920,
    "height": 1080,
    "format": "jpg"
  },
  "persons": ["..."],
  "trailers": ["..."],
  "video_files": [
    {
      "video_file_id": 1,
      "title": "Example Movie - Full Movie",
      "format": "mp4",
      "resolution": "720p",
      "stream_url": "https://api.dobridobrev.com/api/v1/stream-video/movie123.mp4",
      "public_stream_url": "https://api.dobridobrev.com/api/v1/public-video/movie123.mp4"
    }
  ]
}
```

### Angular Movies Service
```typescript
// movies.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Movie {
  movie_id: number;
  title: string;
  year: number;
  duration: number;
  imdb_rating: number;
  status: string;
  category: {
    id: number;
    name: string;
  };
  poster: {
    url: string;
    sizes: {
      w92: string;
      w154: string;
      w185: string;
      w342: string;
      w500: string;
      w780: string;
      original: string;
    };
    width: number;
    height: number;
    format: string;
  };
  description?: string;
  backdrop?: any;
  persons?: any[];
  trailers?: any[];
  video_files?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class MoviesService {
  private apiUrl = 'https://api.dobridobrev.com/api/v1';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getMovies(page: number = 1, filters?: any): Observable<any> {
    let params = `?page=${page}`;
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params += `&${key}=${encodeURIComponent(filters[key])}`;
        }
      });
    }

    return this.http.get(`${this.apiUrl}/movies${params}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${this.apiUrl}/movies/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  createMovie(movieData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/movies`, movieData, {
      headers: this.auth.getAuthHeaders().delete('Content-Type')
    });
  }
}
```

## 🎥 Video Streaming

### Protected Streaming
```
GET /api/v1/stream-video/{filename}
```
- Requires Bearer token authentication
- Supports HTTP Range requests for seeking

### Public Streaming
```
GET /api/v1/public-video/{filename}
```
- Public access without authentication
- Ideal for trailers and previews

### Angular Video Player Component
```typescript
// video-player.component.ts
import { Component, Input } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-video-player',
  template: `
    <video 
      #videoPlayer
      [src]="getVideoUrl()"
      controls
      preload="metadata"
      [poster]="posterUrl"
      class="w-full h-auto">
      Your browser does not support the video tag.
    </video>
  `
})
export class VideoPlayerComponent {
  @Input() videoFile: any;
  @Input() posterUrl: string = '';
  @Input() usePublicStream: boolean = false;

  constructor(private auth: AuthService) {}

  getVideoUrl(): string {
    if (!this.videoFile) return '';
    
    const baseUrl = this.usePublicStream 
      ? this.videoFile.public_stream_url 
      : this.videoFile.stream_url;
    
    // Add auth token for protected streams
    if (!this.usePublicStream && this.auth.token) {
      return `${baseUrl}?token=${this.auth.token}`;
    }
    
    return baseUrl;
  }
}
```

## ⚠️ Error Handling

### Common Error Codes
- **401 - Unauthorized**: Missing or expired token. Redirect to login.
- **403 - Forbidden**: Insufficient role. User doesn't have necessary permissions.
- **422 - Validation Error**: Validation errors. Check form fields.
- **500 - Server Error**: Internal server error. Try again later.

### Angular Error Interceptor
```typescript
// error.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Expired token, redirect to login
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          // Insufficient permissions
          console.error('Access denied');
        } else if (error.status === 422) {
          // Validation errors
          console.error('Validation errors:', error.error.errors);
        }
        
        return throwError(error);
      })
    );
  }
}
```

## ✅ Best Practices

### 1. Token Management
- Save token in localStorage or sessionStorage
- Always include token in authenticated requests
- Handle token expiration automatically

### 2. File Upload
- Use FormData for multipart uploads
- Implement progress bars for large files
- Validate file sizes and formats client-side
- Handle upload errors gracefully

### 3. Video Streaming
- Use public streaming for trailers
- Use protected streaming for premium content
- Implement lazy loading for videos
- Handle video loading errors

### 4. Responsive Images
- Use appropriate sizes for each context
- Implement lazy loading for images
- Use placeholders during loading
- Handle fallback for missing images

## 🔧 Integration with Current Refactored Services

### BaseMediaService Integration
The refactored `BaseMediaService` should be updated to use the new v1 endpoints:

```typescript
// Update API endpoints in services
protected getApiEndpoint(): string {
  return '/api/v1/movies'; // Instead of legacy endpoints
}

protected getDetailsApiEndpoint(id: number): string {
  return `/api/v1/movies/${id}`;
}
```

### ImageService Enhancement
Update `ImageService` to use the new responsive image structure:

```typescript
// Enhanced image URL generation
getImageUrl(imageObject: any, size: string = 'w500'): string {
  if (!imageObject || !imageObject.sizes) {
    return this.getDefaultImageUrl();
  }
  
  return imageObject.sizes[size] || imageObject.sizes.original || imageObject.url;
}
```

---

## 📝 Notes

This documentation should be updated as the backend API evolves. Always refer to the latest API documentation for the most current information.

**Last Updated**: January 2025
**API Version**: v1
**Angular Version**: Compatible with Angular 15+
