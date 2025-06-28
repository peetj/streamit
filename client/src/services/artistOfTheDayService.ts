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
  private artistCache: ArtistOfTheDay[] = [];
  private lastFetchDate: string | null = null;

  async getArtistsOfTheWeek(criteria?: ArtistCriteria): Promise<ArtistOfTheDay[]> {
    const today = new Date().toDateString();
    
    // Return cached artists if it's the same day
    if (this.artistCache.length > 0 && this.lastFetchDate === today) {
      return this.artistCache;
    }

    try {
      // Generate 7 artists for the week
      const artists = await this.generateWeekArtists(criteria);
      
      this.artistCache = artists;
      this.lastFetchDate = today;
      
      return artists;
    } catch (error) {
      console.error('Error fetching artists of the week:', error);
      // Return fallback artists
      return this.getFallbackArtists();
    }
  }

  async getArtistOfTheDay(criteria?: ArtistCriteria): Promise<ArtistOfTheDay> {
    const artists = await this.getArtistsOfTheWeek(criteria);
    return artists[0]; // Return the most recent (today's) artist
  }

  private async generateWeekArtists(criteria?: ArtistCriteria): Promise<ArtistOfTheDay[]> {
    const artists: ArtistOfTheDay[] = [];
    
    // Generate 7 unique artists for the week
    for (let i = 0; i < 7; i++) {
      try {
        const artist = await this.fetchRandomArtist(criteria, i);
        
        // Ensure we don't have duplicates
        const isDuplicate = artists.some(existing => existing.id === artist.id);
        if (!isDuplicate) {
          artists.push(artist);
        } else {
          // If duplicate, try again (up to 3 attempts)
          let attempts = 0;
          while (attempts < 3) {
            const newArtist = await this.fetchRandomArtist(criteria, i);
            if (!artists.some(existing => existing.id === newArtist.id)) {
              artists.push(newArtist);
              break;
            }
            attempts++;
          }
          // If still duplicate after 3 attempts, use the original
          if (attempts >= 3) {
            artist.id = `${artist.id}-${i}`; // Make it unique
            artists.push(artist);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch artist ${i + 1}:`, error);
        // Add a fallback artist
        artists.push(this.getFallbackArtist(i));
      }
    }
    
    return artists;
  }

  private async fetchRandomArtist(criteria?: ArtistCriteria, index: number = 0): Promise<ArtistOfTheDay> {
    // Using free APIs:
    // 1. Last.fm API (3000 requests/month free) - https://www.last.fm/api
    // 2. MusicBrainz API (completely free, 1 req/sec) - https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2
    
    try {
      // Try Last.fm API first (better data quality)
      const lastfmApiKey = import.meta.env.VITE_LASTFM_API_KEY;
      if (lastfmApiKey) {
        return await this.fetchFromLastfm(criteria, lastfmApiKey, index);
      }
    } catch (error) {
      console.warn('Last.fm API failed, trying MusicBrainz:', error);
    }

    try {
      // Fallback to MusicBrainz (completely free, no API key needed)
      return await this.fetchFromMusicBrainz(criteria, index);
    } catch (error) {
      console.warn('MusicBrainz API failed, using fallback data:', error);
    }

    // Final fallback to mock data
    return this.getMockArtist(criteria, index);
  }

  private async fetchFromLastfm(criteria?: ArtistCriteria, apiKey: string, index: number = 0): Promise<ArtistOfTheDay> {
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
        image: this.getFallbackImage(index),
        description: artist.bio?.summary?.replace(/<[^>]*>/g, '') || 'No description available.',
        achievements: [
          `${artist.stats?.listeners || 0} listeners on Last.fm`,
          `${artist.stats?.playcount || 0} total plays`,
          artist.tags?.tag?.slice(0, 3).map((tag: any) => tag.name).join(', ') || 'Popular artist'
        ],
        genre: artist.tags?.tag?.[0]?.name || 'Various',
        activeYears: artist.bio?.yearformed ? `${artist.bio.yearformed}-present` : 'Active',
        country: artist.tags?.tag?.find((tag: any) => tag.name.toLowerCase().includes('country'))?.name || 'International'
      };
    }

    throw new Error('Failed to fetch artist details from Last.fm');
  }

  private async fetchFromMusicBrainz(criteria?: ArtistCriteria, index: number = 0): Promise<ArtistOfTheDay> {
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
      image: this.getFallbackImage(index),
      description: randomArtist.disambiguation || 'Artist information from MusicBrainz.',
      achievements: [
        `MBID: ${randomArtist.id}`,
        randomArtist.country ? `From ${randomArtist.country}` : 'International artist',
        randomArtist.type || 'Musical artist'
      ],
      genre: 'Various', // MusicBrainz doesn't provide genres directly
      activeYears: randomArtist['life-span']?.begin ? 
        `${randomArtist['life-span'].begin}-${randomArtist['life-span'].end || 'present'}` : 
        'Active',
      country: randomArtist.country || 'International'
    };
  }

  private getFallbackImage(index: number = 0): string {
    // Colorful SVG icons for different artists
    const colorfulIcons = [
      // Purple to pink gradient with music note
      'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#grad1)"/>
          <text x="100" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">♪</text>
        </svg>
      `))),
      
      // Blue to purple gradient with star
      'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#grad2)"/>
          <text x="100" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">★</text>
        </svg>
      `))),
      
      // Orange to red gradient with heart
      'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#F97316;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#EF4444;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#grad3)"/>
          <text x="100" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">♥</text>
        </svg>
      `))),
      
      // Green to blue gradient with diamond
      'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#grad4)"/>
          <text x="100" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">♦</text>
        </svg>
      `))),
      
      // Yellow to orange gradient with sun
      'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#F97316;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#grad5)"/>
          <text x="100" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">☀</text>
        </svg>
      `))),
      
      // Pink to magenta gradient with flower
      'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#EC4899;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#BE185D;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#grad6)"/>
          <text x="100" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">🌸</text>
        </svg>
      `))),
      
      // Teal to cyan gradient with wave
      'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#14B8A6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#grad7)"/>
          <text x="100" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">🌊</text>
        </svg>
      `)))
    ];
    
    return colorfulIcons[index % colorfulIcons.length];
  }

  private getMockArtist(criteria?: ArtistCriteria, index: number = 0): ArtistOfTheDay {
    // Fallback mock data when APIs are unavailable
    const artists: ArtistOfTheDay[] = [
      {
        id: '1',
        name: 'Daft Punk',
        image: this.getFallbackImage(index),
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
        image: this.getFallbackImage(index),
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
        image: this.getFallbackImage(index),
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
        image: this.getFallbackImage(index),
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
        image: this.getFallbackImage(index),
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

  private getFallbackArtist(index: number = 0): ArtistOfTheDay {
    const fallbackArtists = [
      {
        id: 'fallback-1',
        name: 'Featured Artist',
        image: this.getFallbackImage(index),
        description: 'Artist information temporarily unavailable.',
        achievements: ['Information loading...'],
        genre: 'Various',
        activeYears: 'Active',
        country: 'International'
      },
      {
        id: 'fallback-2',
        name: 'Loading Artist',
        image: this.getFallbackImage(index),
        description: 'Artist data is being loaded.',
        achievements: ['Please wait...'],
        genre: 'Loading',
        activeYears: 'Loading',
        country: 'Loading'
      }
    ];
    
    return fallbackArtists[index % fallbackArtists.length];
  }

  private getFallbackArtists(): ArtistOfTheDay[] {
    const artists: ArtistOfTheDay[] = [];
    for (let i = 0; i < 7; i++) {
      artists.push(this.getFallbackArtist(i));
    }
    return artists;
  }

  // Method to clear cache and force refresh
  clearCache(): void {
    this.artistCache = [];
    this.lastFetchDate = null;
  }
}

export const artistOfTheDayService = new ArtistOfTheDayService(); 