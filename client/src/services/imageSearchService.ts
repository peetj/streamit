// Real image search service using Unsplash API with Flickr backup and stock images fallback
import { API_CONFIG } from '../config/api';
import { searchStockImages, getRandomStockImages, StockImage } from '../config/stockImages';

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

  private async searchStockImages(query: string): Promise<StockImage[]> {
    try {
      console.log('Searching stock images for:', query);
      
      // First try to find images that match the query
      const matchingImages = searchStockImages(query);
      
      if (matchingImages.length > 0) {
        console.log('Found', matchingImages.length, 'matching stock images for:', query);
        return matchingImages;
      }
      
      // If no matches, return random images
      console.log('No matching stock images found, returning random selection');
      return getRandomStockImages(8);
    } catch (error) {
      console.error('Error searching stock images:', error);
      return getRandomStockImages(8);
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
      
      // Final fallback to stock images
      const stockImages = await this.searchStockImages(query);
      results = stockImages.map(img => ({
        id: img.id,
        url: img.url,
        thumbnail: img.thumbnail,
        alt: img.alt,
        width: 400,
        height: 400
      }));
      
      console.log('Found', results.length, 'stock images for query:', query);
      return results;
    } catch (error) {
      console.error('Error in searchImages:', error);
      // Ultimate fallback - return stock images even on error
      const stockImages = getRandomStockImages(8);
      return stockImages.map(img => ({
        id: img.id,
        url: img.url,
        thumbnail: img.thumbnail,
        alt: img.alt,
        width: 400,
        height: 400
      }));
    }
  }
}

export const imageSearchService = new ImageSearchService(); 