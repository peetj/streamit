# StreamFlow Backend Tests

This directory contains test utilities and setup scripts for the StreamFlow backend.

## Files

### `conftest.py`
Test configuration and common utilities:

- **TestDataManager**: Manages test data creation and cleanup
- **Pytest fixtures**: Reusable test setup (database sessions, test users, etc.)
- **Utility functions**: Common test operations

**Key features:**
- Automatic cleanup after each test
- Database session management
- Test user creation and management
- File system cleanup
- Reusable test data utilities

### `test_data_setup.py`
A utility script to set up test data for development and testing:

- Creates a test user in the database
- Downloads sample audio files to the proper uploads structure
- Extracts metadata and creates song records
- Cleans up existing test data before creating fresh data

**Usage:**
```bash
python tests/test_data_setup.py
```

**What it does:**
1. Deletes any existing test user and associated data
2. Creates a fresh test user (email: `test@streamflow.com`, password: `testpass123`)
3. Downloads sample audio files to `uploads/audio/{user_id}/`
4. Extracts metadata and album art
5. Creates song records in the database

**Test credentials:**
- Email: `test@streamflow.com`
- Password: `testpass123`

## Test Utilities

### Using TestDataManager
```python
from tests.conftest import test_data_manager

# Create a test user
user = test_data_manager.create_test_user()

# Create user directories
audio_dir, artwork_dir = test_data_manager.create_user_directories(user.id)

# Create a test song
song = test_data_manager.create_test_song(
    user_id=user.id,
    file_path="/path/to/song.mp3",
    title="My Song",
    artist="My Artist"
)

# Clean up everything
test_data_manager.cleanup_all()
```

### Using Pytest Fixtures
```python
def test_something(test_user, test_user_dirs, sample_audio_file):
    # test_user: User object
    # test_user_dirs: (audio_dir, artwork_dir) tuple
    # sample_audio_file: Path to a dummy audio file
    pass
```

## Benefits

This test structure provides:
- **Consistency**: All tests use the same setup/cleanup patterns
- **Reusability**: Common utilities can be shared across tests
- **Reliability**: Automatic cleanup prevents test interference
- **Maintainability**: Centralized test configuration
- **Scalability**: Easy to add new test utilities and fixtures

This script is useful for:
- Setting up a clean test environment
- Testing the complete upload → storage → streaming pipeline
- Manual testing via FastAPI `/docs` interface
- Automated testing with pytest 