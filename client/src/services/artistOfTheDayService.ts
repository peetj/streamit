import { API_CONFIG } from '../config/api';

export interface ArtistOfTheDay {
  id: string;
  name: string;
  image: string;
  description: string;
  achievements: string[];
  genre: string;
  activeYears: string;
  country: string;
}

export interface ArtistCriteria {
  genre?: string;
  era?: string;
  country?: string;
  popularity?: 'high' | 'medium' | 'low';
}

class ArtistOfTheDayService {
  private cache: ArtistOfTheDay | null = null;
  private lastFetchDate: string | null = null;

  async getArtistOfTheDay(criteria?: ArtistCriteria): Promise<ArtistOfTheDay> {
    const today = new Date().toDateString();
    
    // Return cached artist if it's the same day
    if (this.cache && this.lastFetchDate === today) {
      return this.cache;
    }

    try {
      // For now, we'll use a mock API that returns random artists
      // In a real implementation, this would call your backend API
      const artist = await this.fetchRandomArtist(criteria);
      
      this.cache = artist;
      this.lastFetchDate = today;
      
      return artist;
    } catch (error) {
      console.error('Error fetching artist of the day:', error);
      // Return a fallback artist
      return this.getFallbackArtist();
    }
  }

  private async fetchRandomArtist(criteria?: ArtistCriteria): Promise<ArtistOfTheDay> {
    // Using free APIs:
    // 1. Last.fm API (3000 requests/month free) - https://www.last.fm/api
    // 2. MusicBrainz API (completely free, 1 req/sec) - https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2
    
    try {
      // Try Last.fm API first (better data quality)
      const lastfmApiKey = import.meta.env.VITE_LASTFM_API_KEY;
      if (lastfmApiKey) {
        return await this.fetchFromLastfm(criteria, lastfmApiKey);
      }
    } catch (error) {
      console.warn('Last.fm API failed, trying MusicBrainz:', error);
    }

    try {
      // Fallback to MusicBrainz (completely free, no API key needed)
      return await this.fetchFromMusicBrainz(criteria);
    } catch (error) {
      console.warn('MusicBrainz API failed, using fallback data:', error);
    }

    // Final fallback to mock data
    return this.getMockArtist(criteria);
  }

  private async fetchFromLastfm(criteria?: ArtistCriteria, apiKey: string): Promise<ArtistOfTheDay> {
    // Get top artists from Last.fm
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${apiKey}&format=json&limit=100`
    );
    
    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();
    const artists = data.artists.artist;
    
    // Filter by criteria if provided
    let filteredArtists = artists;
    if (criteria?.genre) {
      // For Last.fm, we'd need to fetch artist tags to filter by genre
      // This is a simplified version - in production you'd fetch artist details
      filteredArtists = artists; // For now, return all artists
    }

    const randomArtist = filteredArtists[Math.floor(Math.random() * filteredArtists.length)];
    
    // Fetch detailed artist info
    const artistResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(randomArtist.name)}&api_key=${apiKey}&format=json`
    );
    
    if (artistResponse.ok) {
      const artistData = await artistResponse.json();
      const artist = artistData.artist;
      
      return {
        id: artist.mbid || `lastfm-${randomArtist.name}`,
        name: artist.name,
        image: artist.image?.[2]?.['#text'] || this.getFallbackImage(),
        description: artist.bio?.summary?.replace(/<[^>]*>/g, '') || 'No description available.',
        achievements: [
          `${artist.stats?.listeners || 0} listeners on Last.fm`,
          `${artist.stats?.playcount || 0} total plays`,
          artist.tags?.tag?.slice(0, 3).map((tag: any) => tag.name).join(', ') || 'Popular artist'
        ],
        genre: artist.tags?.tag?.[0]?.name || 'Unknown',
        activeYears: artist.bio?.yearformed ? `${artist.bio.yearformed}-present` : 'Unknown',
        country: artist.tags?.tag?.find((tag: any) => tag.name.toLowerCase().includes('country'))?.name || 'Unknown'
      };
    }

    throw new Error('Failed to fetch artist details from Last.fm');
  }

  private async fetchFromMusicBrainz(criteria?: ArtistCriteria): Promise<ArtistOfTheDay> {
    // MusicBrainz has a very conservative rate limit (1 req/sec)
    // We'll use a simple search for popular artists
    const response = await fetch(
      `https://musicbrainz.org/ws/2/artist/?query=tag:rock&fmt=json&limit=100`
    );
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`);
    }

    const data = await response.json();
    const artists = data.artists;
    
    if (!artists || artists.length === 0) {
      throw new Error('No artists found in MusicBrainz');
    }

    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    
    return {
      id: randomArtist.id,
      name: randomArtist.name,
      image: this.getFallbackImage(),
      description: randomArtist.disambiguation || 'Artist information from MusicBrainz.',
      achievements: [
        `MBID: ${randomArtist.id}`,
        randomArtist.country ? `From ${randomArtist.country}` : 'International artist',
        randomArtist.type || 'Musical artist'
      ],
      genre: 'Various', // MusicBrainz doesn't provide genres directly
      activeYears: randomArtist['life-span']?.begin ? 
        `${randomArtist['life-span'].begin}-${randomArtist['life-span'].end || 'present'}` : 
        'Unknown',
      country: randomArtist.country || 'Unknown'
    };
  }

  private getFallbackImage(): string {
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=face';
  }

  private getMockArtist(criteria?: ArtistCriteria): ArtistOfTheDay {
    // Fallback mock data when APIs are unavailable
    const artists: ArtistOfTheDay[] = [
      {
        id: '1',
        name: 'Daft Punk',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=face',
        description: 'French electronic music duo who revolutionized dance music with their innovative blend of house, funk, and disco.',
        achievements: [
          'Grammy Award for Album of the Year (2014)',
          'Pioneered French house music movement',
          'Over 12 million albums sold worldwide',
          'Inducted into Rock and Roll Hall of Fame'
        ],
        genre: 'Electronic',
        activeYears: '1993-2021',
        country: 'France'
      },
      {
        id: '2',
        name: 'Queen',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=face',
        description: 'British rock band that became one of the most successful acts in music history with their theatrical performances.',
        achievements: [
          'Inducted into Rock and Roll Hall of Fame',
          'Over 300 million records sold worldwide',
          'Bohemian Rhapsody - one of the greatest songs ever',
          'Grammy Lifetime Achievement Award'
        ],
        genre: 'Rock',
        activeYears: '1970-1991',
        country: 'United Kingdom'
      },
      {
        id: '3',
        name: 'Nina Simone',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=face',
        description: 'American singer, songwriter, and civil rights activist known as the "High Priestess of Soul".',
        achievements: [
          'Grammy Hall of Fame inductee',
          'Rock and Roll Hall of Fame inductee',
          'Civil rights movement icon',
          'Over 40 albums released'
        ],
        genre: 'Jazz/Soul',
        activeYears: '1954-2003',
        country: 'United States'
      },
      {
        id: '4',
        name: 'Bob Marley',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=face',
        description: 'Jamaican singer-songwriter who popularized reggae music worldwide and became a global symbol of peace.',
        achievements: [
          'Grammy Lifetime Achievement Award',
          'Rock and Roll Hall of Fame inductee',
          'Order of Merit (Jamaica)',
          'Over 75 million records sold'
        ],
        genre: 'Reggae',
        activeYears: '1962-1981',
        country: 'Jamaica'
      },
      {
        id: '5',
        name: 'David Bowie',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=face',
        description: 'English singer-songwriter and actor who was a leading figure in popular music for over five decades.',
        achievements: [
          'Grammy Lifetime Achievement Award',
          'Rock and Roll Hall of Fame inductee',
          'Over 140 million records sold',
          'Innovator of glam rock and art rock'
        ],
        genre: 'Rock',
        activeYears: '1962-2016',
        country: 'United Kingdom'
      }
    ];

    // Filter artists based on criteria if provided
    let filteredArtists = artists;
    if (criteria) {
      filteredArtists = artists.filter(artist => {
        if (criteria.genre && artist.genre.toLowerCase() !== criteria.genre.toLowerCase()) {
          return false;
        }
        if (criteria.country && artist.country.toLowerCase() !== criteria.country.toLowerCase()) {
          return false;
        }
        return true;
      });
    }

    // If no artists match criteria, return all artists
    if (filteredArtists.length === 0) {
      filteredArtists = artists;
    }

    // Select random artist
    const randomIndex = Math.floor(Math.random() * filteredArtists.length);
    return filteredArtists[randomIndex];
  }

  private getFallbackArtist(): ArtistOfTheDay {
    return {
      id: 'fallback',
      name: 'Unknown Artist',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=face',
      description: 'Artist information temporarily unavailable.',
      achievements: ['Information loading...'],
      genre: 'Unknown',
      activeYears: 'Unknown',
      country: 'Unknown'
    };
  }

  // Method to clear cache and force refresh
  clearCache(): void {
    this.cache = null;
    this.lastFetchDate = null;
  }
}

export const artistOfTheDayService = new ArtistOfTheDayService(); 