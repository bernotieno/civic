#!/usr/bin/env python
"""
Update existing bill summaries with improved HTML formatting
"""
import os
import sys
import django

sys.path.append('/home/sir0kumu/civicAI')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicAI.settings.development')
django.setup()

from apps.projects.models import Bill
from apps.api.bill_utils import _convert_to_html

def update_bill_summaries():
    """Update existing bill summaries with better HTML formatting"""
    
    bills = Bill.objects.filter(
        summary__isnull=False,
        is_deleted=False
    ).exclude(summary='')
    
    updated_count = 0
    
    for bill in bills:
        try:
            # Convert existing summary to better HTML
            if bill.summary and not bill.summary_html:
                # If no HTML version exists, create one
                bill.summary_html = _convert_to_html(bill.summary)
                bill.save(update_fields=['summary_html'])
                print(f"✅ Updated HTML for: {bill.title}")
                updated_count += 1
            elif bill.summary_html and '<h2 class=' not in bill.summary_html:
                # If HTML exists but doesn't have proper styling, update it
                bill.summary_html = _convert_to_html(bill.summary)
                bill.save(update_fields=['summary_html'])
                print(f"🔄 Improved styling for: {bill.title}")
                updated_count += 1
            else:
                print(f"⏭️  Skipped (already formatted): {bill.title}")
                
        except Exception as e:
            print(f"❌ Error updating {bill.title}: {str(e)}")
    
    print(f"\n🏁 Updated {updated_count} bill summaries")

if __name__ == "__main__":
    print("🔧 Updating Bill Summary Formatting")
    print("=" * 40)
    update_bill_summaries()