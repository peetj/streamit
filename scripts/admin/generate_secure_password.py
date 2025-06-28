#!/usr/bin/env python3
"""
Generate a secure password that won't trigger data breach warnings.
"""

import random
import string

def generate_secure_password(length=16):
    """Generate a secure password with mixed characters"""
    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    # Ensure at least one character from each set
    password = [
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(digits),
        random.choice(symbols)
    ]
    
    # Fill the rest with random characters from all sets
    all_chars = lowercase + uppercase + digits + symbols
    for _ in range(length - 4):
        password.append(random.choice(all_chars))
    
    # Shuffle the password
    random.shuffle(password)
    return ''.join(password)

if __name__ == "__main__":
    print("🔐 Generating secure passwords...")
    print()
    
    for i in range(3):
        password = generate_secure_password()
        print(f"Option {i+1}: {password}")
    
    print()
    print("💡 To use one of these passwords:")
    print("   python update_test_user_password.py 'YourChosenPassword'")
    print()
    print("⚠️  Remember to update the frontend code as well!") 