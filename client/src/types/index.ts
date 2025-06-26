export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string;
  albumArt?: string;
  genre?: string;
  year?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: Song[];
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  playlists: Playlist[];
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number; // 0-100
  volume: number; // 0-100
  queue: Song[];
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
}