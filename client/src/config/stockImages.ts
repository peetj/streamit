// Stock Images Configuration
// These images are used as fallback when no API keys are configured

export interface StockImage {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  category: string;
  tags: string[];
}

export const STOCK_IMAGES: StockImage[] = [
  // Music-themed images
  {
    id: 'music-1',
    url: '/stock-images/music-headphones.jpg',
    thumbnail: '/stock-images/music-headphones-thumb.jpg',
    alt: 'Headphones on wooden surface',
    category: 'music',
    tags: ['music', 'headphones', 'audio', 'listening', 'wooden']
  },
  {
    id: 'music-2',
    url: '/stock-images/music-vinyl.jpg',
    thumbnail: '/stock-images/music-vinyl-thumb.jpg',
    alt: 'Vinyl record on turntable',
    category: 'music',
    tags: ['music', 'vinyl', 'record', 'turntable', 'retro']
  },
  {
    id: 'music-3',
    url: '/stock-images/music-guitar.jpg',
    thumbnail: '/stock-images/music-guitar-thumb.jpg',
    alt: 'Acoustic guitar',
    category: 'music',
    tags: ['music', 'guitar', 'acoustic', 'instrument', 'strings']
  },
  {
    id: 'music-4',
    url: '/stock-images/music-piano.jpg',
    thumbnail: '/stock-images/music-piano-thumb.jpg',
    alt: 'Grand piano keys',
    category: 'music',
    tags: ['music', 'piano', 'keys', 'classical', 'elegant']
  },
  
  // Nature-themed images
  {
    id: 'nature-1',
    url: '/stock-images/nature-forest.jpg',
    thumbnail: '/stock-images/nature-forest-thumb.jpg',
    alt: 'Sunlight through forest trees',
    category: 'nature',
    tags: ['nature', 'forest', 'trees', 'sunlight', 'green']
  },
  {
    id: 'nature-2',
    url: '/stock-images/nature-ocean.jpg',
    thumbnail: '/stock-images/nature-ocean-thumb.jpg',
    alt: 'Ocean waves at sunset',
    category: 'nature',
    tags: ['nature', 'ocean', 'waves', 'sunset', 'blue']
  },
  {
    id: 'nature-3',
    url: '/stock-images/nature-mountains.jpg',
    thumbnail: '/stock-images/nature-mountains-thumb.jpg',
    alt: 'Snow-capped mountains',
    category: 'nature',
    tags: ['nature', 'mountains', 'snow', 'landscape', 'white']
  },
  {
    id: 'nature-4',
    url: '/stock-images/nature-flowers.jpg',
    thumbnail: '/stock-images/nature-flowers-thumb.jpg',
    alt: 'Colorful wildflowers',
    category: 'nature',
    tags: ['nature', 'flowers', 'colorful', 'wild', 'spring']
  },
  
  // Abstract/Art images
  {
    id: 'abstract-1',
    url: '/stock-images/abstract-gradient.jpg',
    thumbnail: '/stock-images/abstract-gradient-thumb.jpg',
    alt: 'Colorful gradient background',
    category: 'abstract',
    tags: ['abstract', 'gradient', 'colorful', 'modern', 'art']
  },
  {
    id: 'abstract-2',
    url: '/stock-images/abstract-geometric.jpg',
    thumbnail: '/stock-images/abstract-geometric-thumb.jpg',
    alt: 'Geometric shapes and patterns',
    category: 'abstract',
    tags: ['abstract', 'geometric', 'shapes', 'patterns', 'modern']
  },
  {
    id: 'abstract-3',
    url: '/stock-images/abstract-minimal.jpg',
    thumbnail: '/stock-images/abstract-minimal-thumb.jpg',
    alt: 'Minimalist design',
    category: 'abstract',
    tags: ['abstract', 'minimal', 'clean', 'simple', 'design']
  },
  {
    id: 'abstract-4',
    url: '/stock-images/abstract-texture.jpg',
    thumbnail: '/stock-images/abstract-texture-thumb.jpg',
    alt: 'Textured surface',
    category: 'abstract',
    tags: ['abstract', 'texture', 'surface', 'material', 'art']
  },
  
  // Urban/City images
  {
    id: 'urban-1',
    url: '/stock-images/urban-cityscape.jpg',
    thumbnail: '/stock-images/urban-cityscape-thumb.jpg',
    alt: 'City skyline at night',
    category: 'urban',
    tags: ['urban', 'city', 'skyline', 'night', 'buildings']
  },
  {
    id: 'urban-2',
    url: '/stock-images/urban-street.jpg',
    thumbnail: '/stock-images/urban-street-thumb.jpg',
    alt: 'Busy city street',
    category: 'urban',
    tags: ['urban', 'street', 'city', 'busy', 'life']
  },
  {
    id: 'urban-3',
    url: '/stock-images/urban-architecture.jpg',
    thumbnail: '/stock-images/urban-architecture-thumb.jpg',
    alt: 'Modern architecture',
    category: 'urban',
    tags: ['urban', 'architecture', 'modern', 'building', 'design']
  },
  {
    id: 'urban-4',
    url: '/stock-images/urban-bridge.jpg',
    thumbnail: '/stock-images/urban-bridge-thumb.jpg',
    alt: 'Bridge over water',
    category: 'urban',
    tags: ['urban', 'bridge', 'water', 'connection', 'structure']
  }
];

// Helper function to search stock images by query
export const searchStockImages = (query: string): StockImage[] => {
  const searchTerm = query.toLowerCase();
  
  return STOCK_IMAGES.filter(image => 
    image.tags.some(tag => tag.includes(searchTerm)) ||
    image.alt.toLowerCase().includes(searchTerm) ||
    image.category.includes(searchTerm)
  );
};

// Helper function to get random stock images
export const getRandomStockImages = (count: number = 8): StockImage[] => {
  const shuffled = [...STOCK_IMAGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to get stock images by category
export const getStockImagesByCategory = (category: string): StockImage[] => {
  return STOCK_IMAGES.filter(image => image.category === category);
}; 