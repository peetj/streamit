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
      const accessKey = API_CONFIG.UNSPLASH_ACCESS_KEY;
      if (!accessKey) return [];

      const searchParams = new URLSearchParams({
        query,
        page: page.toString(),
        per_page: perPage.toString(),
        orientation: 'squarish'
      });

      const response = await fetch(`${API_CONFIG.UNSPLASH_API_URL}/search/photos?${searchParams}`, {
        headers: { 'Authorization': `Client-ID ${accessKey}` }
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status} - ${response.statusText}`);
      }

      const data: UnsplashResponse = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      return [];
    }
  }

  private async searchFlickr(query: string, page: number = 1, perPage: number = 20): Promise<FlickrImage[]> {
    try {
      const apiKey = API_CONFIG.FLICKR_API_KEY;
      if (!apiKey) return [];

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

      const response = await fetch(`${API_CONFIG.FLICKR_API_URL}?${searchParams}`);

      if (!response.ok) {
        throw new Error(`Flickr API error: ${response.status} - ${response.statusText}`);
      }

      const data: FlickrResponse = await response.json();
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
      const matchingImages = searchStockImages(query);
      return matchingImages.length > 0 ? matchingImages : getRandomStockImages(8);
    } catch (error) {
      console.error('Error searching stock images:', error);
      return getRandomStockImages(8);
    }
  }

  async searchImages(query: string, page: number = 1): Promise<ImageSearchResult[]> {
    try {
      const unsplashImages = await this.searchUnsplash(query, page);
      if (unsplashImages.length > 0) {
        return unsplashImages.map(img => ({
          id: img.id,
          url: img.urls.regular,
          thumbnail: img.urls.thumb,
          alt: img.alt_description || img.description || query,
          width: img.width,
          height: img.height
        }));
      }

      const flickrImages = await this.searchFlickr(query, page);
      if (flickrImages.length > 0) {
        return flickrImages.map(img => {
          const baseUrl = `https://live.staticflickr.com/${img.server}/${img.id}_${img.secret}`;
          return {
            id: img.id,
            url: `${baseUrl}_b.jpg`,
            thumbnail: `${baseUrl}_m.jpg`,
            alt: img.title || query,
            width: 1024,
            height: 768
          };
        });
      }

      const stockImages = await this.searchStockImages(query);
      return stockImages.map(img => ({
        id: img.id,
        url: img.url,
        thumbnail: img.thumbnail,
        alt: img.alt,
        width: 400,
        height: 400
      }));
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
