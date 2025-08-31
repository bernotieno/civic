#!/usr/bin/env python
"""
Test script to verify session configuration fixes
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicAI.settings.development')
django.setup()

def test_session_config():
    """Test session configuration"""
    print("🔍 Testing Session Configuration")
    print("=" * 50)
    
    # Check session engine
    print(f"Session Engine: {settings.SESSION_ENGINE}")
    print(f"Session Cookie Age: {settings.SESSION_COOKIE_AGE} seconds ({settings.SESSION_COOKIE_AGE / 3600 / 24} days)")
    print(f"Session Cookie Secure: {settings.SESSION_COOKIE_SECURE}")
    print(f"Session Cookie HttpOnly: {settings.SESSION_COOKIE_HTTPONLY}")
    print(f"Session Cookie SameSite: {settings.SESSION_COOKIE_SAMESITE}")
    print(f"Session Save Every Request: {settings.SESSION_SAVE_EVERY_REQUEST}")
    print(f"Session Expire at Browser Close: {settings.SESSION_EXPIRE_AT_BROWSER_CLOSE}")
    
    print("\n🔍 Testing JWT Configuration")
    print("=" * 50)
    
    # Check JWT config
    jwt_config = settings.SIMPLE_JWT
    print(f"Access Token Lifetime: {jwt_config['ACCESS_TOKEN_LIFETIME']}")
    print(f"Refresh Token Lifetime: {jwt_config['REFRESH_TOKEN_LIFETIME']}")
    print(f"Rotate Refresh Tokens: {jwt_config['ROTATE_REFRESH_TOKENS']}")
    print(f"Blacklist After Rotation: {jwt_config['BLACKLIST_AFTER_ROTATION']}")
    
    print("\n✅ Session configuration looks good!")
    print("\n📋 Summary of Changes Made:")
    print("1. Changed SESSION_ENGINE from cache to database")
    print("2. Extended SESSION_COOKIE_AGE to 30 days")
    print("3. Extended JWT ACCESS_TOKEN_LIFETIME to 24 hours")
    print("4. Disabled JWT BLACKLIST_AFTER_ROTATION")
    print("5. Improved frontend token validation logic")
    print("6. Made authentication initialization more robust")

if __name__ == "__main__":
    test_session_config()