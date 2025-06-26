import os
import io
from typing import Dict, Optional
from PIL import Image

try:
    from mutagen import File
    from mutagen.id3 import ID3, TIT2, TPE1, TALB, TDRC, APIC
    MUTAGEN_AVAILABLE = True
except ImportError:
    MUTAGEN_AVAILABLE = False

class MetadataService:
    @staticmethod
    def extract_metadata(file_path: str) -> Dict:
        """Extract metadata from audio file"""
        metadata = {
            'title': '',
            'artist': '',
            'album': '',
            'year': None,
            'genre': '',
            'duration': 0,
            'bitrate': 0,
            'sample_rate': 0
        }
        
        if not MUTAGEN_AVAILABLE:
            return metadata
        
        try:
            audio_file = File(file_path)
            
            if audio_file:
                # Extract basic info
                if hasattr(audio_file, 'info'):
                    metadata['duration'] = getattr(audio_file.info, 'length', 0)
                    metadata['bitrate'] = getattr(audio_file.info, 'bitrate', 0)
                    metadata['sample_rate'] = getattr(audio_file.info, 'sample_rate', 0)
                
                # Extract tags
                if hasattr(audio_file, 'tags') and audio_file.tags:
                    tags = audio_file.tags
                    
                    # Try different tag formats
                    metadata['title'] = (
                        str(tags.get('TIT2', [''])[0]) or  # ID3v2
                        str(tags.get('TITLE', [''])[0]) or  # Vorbis
                        str(tags.get('\xa9nam', [''])[0]) or  # MP4
                        ''
                    )
                    
                    metadata['artist'] = (
                        str(tags.get('TPE1', [''])[0]) or  # ID3v2
                        str(tags.get('ARTIST', [''])[0]) or  # Vorbis
                        str(tags.get('\xa9ART', [''])[0]) or  # MP4
                        ''
                    )
                    
                    metadata['album'] = (
                        str(tags.get('TALB', [''])[0]) or  # ID3v2
                        str(tags.get('ALBUM', [''])[0]) or  # Vorbis
                        str(tags.get('\xa9alb', [''])[0]) or  # MP4
                        ''
                    )
                    
                    # Year handling
                    year_tag = (
                        tags.get('TDRC') or  # ID3v2.4
                        tags.get('TYER') or  # ID3v2.3
                        tags.get('DATE') or  # Vorbis
                        tags.get('\xa9day')  # MP4
                    )
                    
                    if year_tag:
                        try:
                            year_str = str(year_tag[0])
                            metadata['year'] = int(year_str[:4])  # Extract first 4 digits
                        except (ValueError, IndexError):
                            pass
                    
                    metadata['genre'] = (
                        str(tags.get('TCON', [''])[0]) or  # ID3v2
                        str(tags.get('GENRE', [''])[0]) or  # Vorbis
                        str(tags.get('\xa9gen', [''])[0]) or  # MP4
                        ''
                    )
        
        except Exception as e:
            print(f"Error extracting metadata: {e}")
        
        return metadata
    
    @staticmethod
    def extract_album_art(file_path: str, output_dir: str) -> Optional[str]:
        """Extract album art from audio file"""
        if not MUTAGEN_AVAILABLE:
            return None
        
        try:
            audio_file = File(file_path)
            
            if not audio_file or not hasattr(audio_file, 'tags') or not audio_file.tags:
                return None
            
            artwork_data = None
            
            # Try different artwork tag formats
            tags = audio_file.tags
            
            # ID3v2 (MP3)
            if 'APIC:' in tags:
                artwork_data = tags['APIC:'].data
            elif 'APIC:Cover (front)' in tags:
                artwork_data = tags['APIC:Cover (front)'].data
            # Vorbis (OGG, FLAC)
            elif 'METADATA_BLOCK_PICTURE' in tags:
                import base64
                picture_data = tags['METADATA_BLOCK_PICTURE'][0]
                artwork_data = base64.b64decode(picture_data)
            # MP4
            elif 'covr' in tags:
                artwork_data = tags['covr'][0]
            
            if artwork_data:
                # Create output directory
                os.makedirs(output_dir, exist_ok=True)
                
                # Generate filename
                filename = f"{os.path.basename(file_path)}_artwork.jpg"
                output_path = os.path.join(output_dir, filename)
                
                # Save artwork
                try:
                    image = Image.open(io.BytesIO(artwork_data))
                    # Convert to RGB if necessary
                    if image.mode in ('RGBA', 'LA', 'P'):
                        image = image.convert('RGB')
                    # Resize if too large
                    if image.width > 500 or image.height > 500:
                        image.thumbnail((500, 500), Image.Resampling.LANCZOS)
                    image.save(output_path, 'JPEG', quality=85)
                    return output_path
                except Exception as e:
                    print(f"Error processing album art: {e}")
                    # Try saving raw data
                    with open(output_path, 'wb') as f:
                        f.write(artwork_data)
                    return output_path
        
        except Exception as e:
            print(f"Error extracting album art: {e}")
        
        return None