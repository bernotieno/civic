#!/usr/bin/env python3
"""
Fix admin access by ensuring Django admin works at /admin/
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicAI.settings')
django.setup()

from apps.users.models import CustomUser

def main():
    print("🔧 Fixing Django Admin Access")
    print("=" * 30)
    
    # Ensure admin user has correct permissions
    admin_user = CustomUser.objects.get(email='admin@civicai.ke')
    admin_user.is_superuser = True
    admin_user.is_staff = True
    admin_user.is_active = True
    admin_user.save()
    
    print("✅ Django Admin is accessible at:")
    print("   URL: http://localhost:8000/admin/")
    print("   Username: 99999999")
    print("   Password: admin123")
    print("")
    print("📱 React Admin Dashboard is at:")
    print("   URL: http://localhost:3000/admin-dashboard")
    print("   (Requires React frontend login)")
    print("")
    print("🔍 Two Different Admin Systems:")
    print("   • Django Admin (/admin/) - Database management")
    print("   • React Admin (/admin-dashboard) - User interface")

if __name__ == '__main__':
    main()