#!/usr/bin/env python3
"""
Quick admin reset script for CivicAI
Run this if you forget admin credentials
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicAI.settings')
django.setup()

from apps.users.models import CustomUser, County, hash_national_id

def main():
    print("🇰🇪 CivicAI Admin Reset Tool")
    print("=" * 30)
    
    # Set known credentials
    national_id = '99999999'
    password = 'admin123'
    email = 'admin@civicai.ke'
    
    try:
        # Get or create admin user
        admin_user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                'name': 'CivicAI Admin',
                'is_superuser': True,
                'is_staff': True,
                'is_active': True,
                'tenant': County.objects.first(),
                'county': County.objects.first().location,
                'home_county': County.objects.first(),
            }
        )
        
        if not created:
            print("Found existing admin user")
        else:
            print("Created new admin user")
        
        # Update credentials
        admin_user.set_national_id(national_id)
        admin_user.set_password(password)
        admin_user.is_superuser = True
        admin_user.is_staff = True
        admin_user.is_active = True
        admin_user.save()
        
        print("\n✅ Admin credentials reset successfully!")
        print(f"URL: http://localhost:8000/admin/")
        print(f"Username: {national_id}")
        print(f"Password: {password}")
        print(f"User: {admin_user.name} ({admin_user.email})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()