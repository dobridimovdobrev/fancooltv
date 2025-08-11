import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  /**
   * Convert YouTube URL to embed format
   */
  getYouTubeEmbedUrl(url: string, options?: {
    autoplay?: boolean;
    controls?: boolean;
    modestbranding?: boolean;
    rel?: boolean;
    enablejsapi?: boolean;
  }): string {
    if (!url) return '';
    
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
    }

    if (!videoId) return '';
    
    // Build embed URL with parameters
    const params = new URLSearchParams();
    
    // Default options
    const defaultOptions = {
      autoplay: false,
      controls: true,
      modestbranding: true,
      rel: false,
      enablejsapi: true,
      ...options
    };
    
    if (defaultOptions.autoplay) params.set('autoplay', '1');
    if (!defaultOptions.controls) params.set('controls', '0');
    if (defaultOptions.modestbranding) params.set('modestbranding', '1');
    if (!defaultOptions.rel) params.set('rel', '0');
    if (defaultOptions.enablejsapi) params.set('enablejsapi', '1');
    
    const paramString = params.toString();
    return `https://www.youtube.com/embed/${videoId}${paramString ? '?' + paramString : ''}`;
  }

  /**
   * Extract video ID from YouTube URL
   */
  getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Get YouTube thumbnail URL
   */
  getYouTubeThumbnail(url: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
    const videoId = this.getYouTubeVideoId(url);
    if (!videoId) return '';
    
    const qualityMap = {
      'default': 'default',
      'medium': 'mqdefault',
      'high': 'hqdefault',
      'standard': 'sddefault',
      'maxres': 'maxresdefault'
    };
    
    const qualityString = qualityMap[quality];
    return `https://img.youtube.com/vi/${videoId}/${qualityString}.jpg`;
  }

  /**
   * Validate YouTube URL
   */
  isValidYouTubeUrl(url: string): boolean {
    if (!url) return false;
    
    const youtubePatterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    
    return youtubePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Build query string from object
   */
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? '?' + queryString : '';
  }

  /**
   * Parse query string to object
   */
  parseQueryString(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }

  /**
   * Generate slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Get base URL from full URL
   */
  getBaseUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return '';
    }
  }

  /**
   * Check if URL is external
   */
  isExternalUrl(url: string, currentHost: string = window.location.host): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.host !== currentHost;
    } catch {
      return false;
    }
  }

  /**
   * Add protocol to URL if missing
   */
  addProtocol(url: string, protocol: 'http' | 'https' = 'https'): string {
    if (!url) return '';
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    return `${protocol}://${url}`;
  }

  /**
   * Sanitize URL for safe usage
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    
    // Remove potentially dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase();
    
    if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
      return '';
    }
    
    return url;
  }

  /**
   * Get file extension from URL
   */
  getFileExtension(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      
      if (lastDot === -1) return '';
      
      return pathname.slice(lastDot + 1).toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * Check if URL points to an image
   */
  isImageUrl(url: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const extension = this.getFileExtension(url);
    
    return imageExtensions.includes(extension);
  }

  /**
   * Check if URL points to a video
   */
  isVideoUrl(url: string): boolean {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
    const extension = this.getFileExtension(url);
    
    return videoExtensions.includes(extension);
  }

  /**
   * Encode URL component safely
   */
  safeEncodeURIComponent(str: string): string {
    try {
      return encodeURIComponent(str);
    } catch {
      return str;
    }
  }

  /**
   * Decode URL component safely
   */
  safeDecodeURIComponent(str: string): string {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }

  /**
   * Join URL paths safely
   */
  joinPaths(...paths: string[]): string {
    return paths
      .map((path, index) => {
        if (index === 0) {
          return path.replace(/\/+$/, ''); // Remove trailing slashes from first path
        }
        return path.replace(/^\/+/, '').replace(/\/+$/, ''); // Remove leading and trailing slashes
      })
      .filter(path => path.length > 0)
      .join('/');
  }
}
