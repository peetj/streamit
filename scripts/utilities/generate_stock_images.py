#!/usr/bin/env python3
"""
Generate placeholder stock images for playlist covers
This script creates simple colored rectangles as placeholders
"""

import os
from PIL import Image, ImageDraw, ImageFont
import random

# Stock image configurations
STOCK_IMAGES = [
    # Music-themed images
    {'id': 'music-headphones', 'name': 'Headphones', 'color': '#6366f1', 'category': 'music'},
    {'id': 'music-vinyl', 'name': 'Vinyl Record', 'color': '#1f2937', 'category': 'music'},
    {'id': 'music-guitar', 'name': 'Acoustic Guitar', 'color': '#8b5cf6', 'category': 'music'},
    {'id': 'music-piano', 'name': 'Piano Keys', 'color': '#f59e0b', 'category': 'music'},
    
    # Nature-themed images
    {'id': 'nature-forest', 'name': 'Forest', 'color': '#059669', 'category': 'nature'},
    {'id': 'nature-ocean', 'name': 'Ocean', 'color': '#0ea5e9', 'category': 'nature'},
    {'id': 'nature-mountains', 'name': 'Mountains', 'color': '#64748b', 'category': 'nature'},
    {'id': 'nature-flowers', 'name': 'Flowers', 'color': '#ec4899', 'category': 'nature'},
    
    # Abstract/Art images
    {'id': 'abstract-gradient', 'name': 'Gradient', 'color': '#f97316', 'category': 'abstract'},
    {'id': 'abstract-geometric', 'name': 'Geometric', 'color': '#06b6d4', 'category': 'abstract'},
    {'id': 'abstract-minimal', 'name': 'Minimal', 'color': '#6b7280', 'category': 'abstract'},
    {'id': 'abstract-texture', 'name': 'Texture', 'color': '#84cc16', 'category': 'abstract'},
    
    # Urban/City images
    {'id': 'urban-cityscape', 'name': 'Cityscape', 'color': '#374151', 'category': 'urban'},
    {'id': 'urban-street', 'name': 'Street', 'color': '#9ca3af', 'category': 'urban'},
    {'id': 'urban-architecture', 'name': 'Architecture', 'color': '#d1d5db', 'category': 'urban'},
    {'id': 'urban-bridge', 'name': 'Bridge', 'color': '#4b5563', 'category': 'urban'},
]

def create_placeholder_image(image_config, size=(400, 400)):
    """Create a placeholder image with text"""
    # Create base image
    img = Image.new('RGB', size, image_config['color'])
    draw = ImageDraw.Draw(img)
    
    # Add some visual elements
    # Create a gradient-like effect
    for i in range(size[0]):
        alpha = int(255 * (1 - i / size[0]) * 0.3)
        overlay = Image.new('RGBA', size, (255, 255, 255, alpha))
        img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
        draw = ImageDraw.Draw(img)
    
    # Add text
    try:
        # Try to use a system font
        font = ImageFont.truetype("arial.ttf", 32)
    except:
        try:
            # Fallback to default font
            font = ImageFont.load_default()
        except:
            font = None
    
    text = image_config['name']
    text_bbox = draw.textbbox((0, 0), text, font=font) if font else (0, 0, len(text) * 10, 20)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    # Center the text
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    # Add text shadow
    draw.text((x + 2, y + 2), text, fill='#000000', font=font)
    draw.text((x, y), text, fill='#ffffff', font=font)
    
    return img

def main():
    """Generate all stock images"""
    # Create output directory
    output_dir = 'client/public/stock-images'
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Generating stock images in {output_dir}...")
    
    for image_config in STOCK_IMAGES:
        # Create full-size image
        img = create_placeholder_image(image_config, (400, 400))
        full_path = os.path.join(output_dir, f"{image_config['id']}.jpg")
        img.save(full_path, 'JPEG', quality=85)
        
        # Create thumbnail
        thumb = img.resize((200, 200), Image.Resampling.LANCZOS)
        thumb_path = os.path.join(output_dir, f"{image_config['id']}-thumb.jpg")
        thumb.save(thumb_path, 'JPEG', quality=85)
        
        print(f"Created: {image_config['id']}.jpg and {image_config['id']}-thumb.jpg")
    
    print(f"\nGenerated {len(STOCK_IMAGES)} stock images successfully!")
    print("You can replace these placeholder images with real photos later.")

if __name__ == '__main__':
    main() 