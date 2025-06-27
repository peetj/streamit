// Real image search service using Unsplash API with Flickr backup
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

export interface FlickrImage {
  id: string;
  secret: string;
  server: string;
  farm: number;
  title: string;
  owner: string;
}

export interface FlickrResponse {
  photos: {
    photo: FlickrImage[];
    pages: number;
    total: string;
  };
  stat: string;
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
        console.warn('No Unsplash API key configured, trying Flickr...');
        return [];
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
      return [];
    }
  }

  private async searchFlickr(query: string, page: number = 1, perPage: number = 20): Promise<FlickrImage[]> {
    try {
      console.log('Searching Flickr for:', query);
      
      const apiKey = API_CONFIG.FLICKR_API_KEY;
      
      if (!apiKey) {
        console.warn('No Flickr API key configured, falling back to public search');
        return [];
      }
      
      const searchParams = new URLSearchParams({
        method: 'flickr.photos.search',
        api_key: apiKey,
        text: query,
        format: 'json',
        nojsoncallback: '1',
        page: page.toString(),
        per_page: perPage.toString(),
        sort: 'relevance',
        content_type: '1', // photos only
        safe_search: '1',
        extras: 'url_s,url_m,url_l'
      });

      const url = `${API_CONFIG.FLICKR_API_URL}?${searchParams}`;
      console.log('Flickr URL:', url);

      const response = await fetch(url);
      
      console.log('Flickr response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Flickr API error: ${response.status} - ${response.statusText}`);
      }

      const data: FlickrResponse = await response.json();
      console.log('Flickr response data:', data);
      
      if (data.stat !== 'ok') {
        throw new Error(`Flickr API error: ${data.stat}`);
      }
      
      return data.photos.photo || [];
    } catch (error) {
      console.error('Error searching Flickr:', error);
      return [];
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
      
      // Try Unsplash first
      let results: ImageSearchResult[] = [];
      
      const unsplashImages = await this.searchUnsplash(query, page);
      if (unsplashImages.length > 0) {
        results = unsplashImages.map(img => ({
          id: img.id,
          url: img.urls.regular,
          thumbnail: img.urls.thumb,
          alt: img.alt_description || img.description || query,
          width: img.width,
          height: img.height
        }));
        console.log('Found', results.length, 'Unsplash images for query:', query);
        return results;
      }
      
      // Try Flickr as backup
      const flickrImages = await this.searchFlickr(query, page);
      if (flickrImages.length > 0) {
        results = flickrImages.map(img => {
          // Construct Flickr image URLs
          const baseUrl = `https://live.staticflickr.com/${img.server}/${img.id}_${img.secret}`;
          return {
            id: img.id,
            url: `${baseUrl}_b.jpg`, // large size
            thumbnail: `${baseUrl}_m.jpg`, // medium size
            alt: img.title || query,
            width: 1024,
            height: 768
          };
        });
        console.log('Found', results.length, 'Flickr images for query:', query);
        return results;
      }
      
      // Fallback to public image search
      const publicImages = await this.searchPublicImages(query);
      results = publicImages.map(img => ({
        id: img.id,
        url: img.urls.regular,
        thumbnail: img.urls.thumb,
        alt: img.alt_description || img.description || query,
        width: img.width,
        height: img.height
      }));
      
      console.log('Found', results.length, 'public images for query:', query);
      return results;
    } catch (error) {
      console.error('Error in searchImages:', error);
      return [];
    }
  }
}

export const imageSearchService = new ImageSearchService(); 