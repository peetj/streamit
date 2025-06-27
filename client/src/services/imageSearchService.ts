// Real image search service using Unsplash API
import { API_CONFIG } from '../config/api';

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  width: number;
  height: number;
  user: {
    name: string;
  };
}

export interface UnsplashResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

export interface ImageSearchResult {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  width: number;
  height: number;
}

class ImageSearchService {
  private async searchUnsplash(query: string, page: number = 1, perPage: number = 20): Promise<UnsplashImage[]> {
    try {
      console.log('Searching Unsplash for:', query);
      
      // Use the configured API key
      const accessKey = API_CONFIG.UNSPLASH_ACCESS_KEY;
      
      if (!accessKey) {
        console.warn('No Unsplash API key configured, falling back to public search');
        return this.searchPublicImages(query);
      }
      
      const searchParams = new URLSearchParams({
        query: query,
        page: page.toString(),
        per_page: perPage.toString(),
        orientation: 'squarish'
      });

      const url = `${API_CONFIG.UNSPLASH_API_URL}/search/photos?${searchParams}`;
      console.log('Unsplash URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      });
      
      console.log('Unsplash response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status} - ${response.statusText}`);
      }

      const data: UnsplashResponse = await response.json();
      console.log('Unsplash response data:', data);
      
      return data.results || [];
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      // Fallback to public image search
      return this.searchPublicImages(query);
    }
  }

  private async searchPublicImages(query: string): Promise<UnsplashImage[]> {
    try {
      console.log('Trying public image search for:', query);
      
      // Use Unsplash's public endpoint as fallback
      const searchVariations = [
        query,
        `${query} aesthetic`,
        `${query} beautiful`,
        `${query} art`,
        `${query} nature`,
        `${query} modern`,
        `${query} minimalist`,
        `${query} colorful`
      ];
      
      const mockResults: UnsplashImage[] = [];
      
      for (let i = 0; i < 8; i++) {
        const variation = searchVariations[i % searchVariations.length];
        const imageUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(variation)}&sig=${i}`;
        
        mockResults.push({
          id: `search-${i}-${Date.now()}`,
          urls: {
            raw: imageUrl,
            full: imageUrl,
            regular: imageUrl,
            small: imageUrl,
            thumb: imageUrl
          },
          alt_description: `${query} image ${i + 1}`,
          description: `Beautiful ${query} image`,
          width: 400,
          height: 400,
          user: {
            name: 'Unsplash'
          }
        });
      }
      
      return mockResults;
    } catch (error) {
      console.error('Error in public image search:', error);
      return [];
    }
  }

  async searchImages(query: string, page: number = 1): Promise<ImageSearchResult[]> {
    try {
      console.log('Searching for images:', query);
      
      // Try real Unsplash API first
      const unsplashImages = await this.searchUnsplash(query, page);
      
      if (unsplashImages.length > 0) {
        const results = unsplashImages.map(img => ({
          id: img.id,
          url: img.urls.regular,
          thumbnail: img.urls.thumb,
          alt: img.alt_description || img.description || query,
          width: img.width,
          height: img.height
        }));
        
        console.log('Found', results.length, 'real images for query:', query);
        return results;
      } else {
        // Fallback to public image search
        const publicImages = await this.searchPublicImages(query);
        const results = publicImages.map(img => ({
          id: img.id,
          url: img.urls.regular,
          thumbnail: img.urls.thumb,
          alt: img.alt_description || img.description || query,
          width: img.width,
          height: img.height
        }));
        
        console.log('Found', results.length, 'public images for query:', query);
        return results;
      }
    } catch (error) {
      console.error('Error in searchImages:', error);
      return [];
    }
  }
}

export const imageSearchService = new ImageSearchService(); 