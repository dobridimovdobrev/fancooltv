import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly baseImageUrl = environment.apiUrl;

  /**
   * Get image URL with proper formatting and fallbacks
   */
  getImageUrl(path: string, type: 'cast' | 'poster' | 'backdrop' | 'still' = 'poster'): string {
    if (!path) return this.getPlaceholderUrl(type);
    
    // If path is already a complete URL, return it with size parameters
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return this.addSizeParameters(path, type);
    }

    // Remove any leading slashes
    let cleanPath = path.replace(/^\/+/, '');

    // Add storage/ before image paths if needed
    if (!cleanPath.startsWith('storage/')) {
      const pathParts = cleanPath.split('/');
      if (pathParts[0] === 'images') {
        pathParts.unshift('storage');
        cleanPath = pathParts.join('/');
      }
    }

    // Build full URL
    const fullUrl = `${this.baseImageUrl}/${cleanPath}`;
    return this.addSizeParameters(fullUrl, type);
  }

  /**
   * Add size parameters based on image type
   */
  private addSizeParameters(url: string, type: string): string {
    if (type === 'cast' && !url.includes('w=') && !url.includes('h=')) {
      return `${url}${url.includes('?') ? '&' : '?'}w=300&h=300&fit=crop`;
    }
    return url;
  }

  /**
   * Get placeholder URL for different image types
   */
  getPlaceholderUrl(type: 'cast' | 'poster' | 'backdrop' | 'still' = 'poster'): string {
    // Return empty string to trigger CSS placeholder display
    // This allows templates to show their own CSS-based placeholders
    return '';
  }

  /**
   * Check if image URL is valid
   */
  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = imageExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );
    
    // Check if it's a valid URL format
    const isValidUrl = url.startsWith('http') || url.startsWith('/');
    
    return hasValidExtension && isValidUrl;
  }

  /**
   * Preload image to check if it exists
   */
  preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  /**
   * Get optimized image URL for different screen sizes
   */
  getResponsiveImageUrl(path: string, screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop'): string {
    const baseUrl = this.getImageUrl(path);
    
    const sizeParams = {
      mobile: 'w=400&h=600',
      tablet: 'w=600&h=900', 
      desktop: 'w=800&h=1200'
    };
    
    const params = sizeParams[screenSize];
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params}&fit=crop&q=80`;
  }
}
