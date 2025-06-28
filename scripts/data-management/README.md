# Data Management Scripts

Scripts for managing and manipulating data in the StreamFlow database.

## Scripts

- `add_test_songs.py`: Add sample songs to the database for testing
- `create_dummy_playlists.py`: Create dummy playlists for testing
- `create_test_cleanup_data.py`: Generate test data and cleanup data for integration tests
- `create_test_playlist.py`: Create a test playlist for a user
- `create_test_user_playlist.py`: Create a playlist for the test user
- `fix_song_metadata.py`: Fix or update song metadata in the database
- `upload_songs_for_test_user.py`: Upload songs for the test user

## Usage

```bash
# Add test data
python data-management/add_test_songs.py
python data-management/create_dummy_playlists.py

# Create specific test data
python data-management/create_test_playlist.py
python data-management/create_test_user_playlist.py
python data-management/upload_songs_for_test_user.py

# Fix data issues
python data-management/fix_song_metadata.py

# Cleanup and setup
python data-management/create_test_cleanup_data.py
```

## Requirements

- Database must be running and accessible
- Proper database credentials must be configured
- Some scripts may require specific user accounts to exist 