from django.core.management.base import BaseCommand
from apps.projects.models import Bill

class Command(BaseCommand):
    help = 'Clean up duplicate bill numbers'
    
    def handle(self, *args, **options):
        # Find duplicate bill numbers
        from django.db.models import Count
        
        duplicates = Bill.objects.values('bill_number').annotate(
            count=Count('bill_number')
        ).filter(count__gt=1, is_deleted=False)
        
        self.stdout.write(f"Found {len(duplicates)} duplicate bill numbers:")
        
        for duplicate in duplicates:
            bill_number = duplicate['bill_number']
            count = duplicate['count']
            
            self.stdout.write(f"  - {bill_number}: {count} bills")
            
            # Get all bills with this number
            bills = Bill.objects.filter(
                bill_number=bill_number, 
                is_deleted=False
            ).order_by('created_at')
            
            # Keep the first one, rename others
            for i, bill in enumerate(bills):
                if i == 0:
                    self.stdout.write(f"    Keeping: {bill.title} (ID: {bill.id})")
                else:
                    new_number = f"{bill_number}-{i}"
                    bill.bill_number = new_number
                    bill.save()
                    self.stdout.write(f"    Renamed: {bill.title} -> {new_number}")
        
        self.stdout.write(
            self.style.SUCCESS('Successfully cleaned up duplicate bill numbers')
        )