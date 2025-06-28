# Utility Scripts

General utility scripts for maintenance and system operations in StreamFlow.

## Scripts

- `clear_cache.py`: Clear application cache and temporary files
- `clear_chrome_cache.py`: Clear Chrome browser cache with specific instructions
- `generate_stock_images.py`: Generate stock images for playlist covers

## Usage

```bash
# Clear application cache
python utilities/clear_cache.py

# Clear Chrome cache (with instructions)
python utilities/clear_chrome_cache.py

# Generate stock images
python utilities/generate_stock_images.py
```

## Notes

- Cache clearing scripts help resolve development issues
- Stock images are used as fallbacks when external image APIs are unavailable
- Some utilities may require specific browser installations or configurations 