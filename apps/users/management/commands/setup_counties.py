# =============================================================================
# FILE: management/commands/setup_counties.py (Data setup command)
# =============================================================================
"""
CRITICAL: Create this management command to populate Kenya's 47 counties
"""

from django.core.management.base import BaseCommand
from apps.users.models import Location, County

class Command(BaseCommand):
    help = 'Set up Kenya\'s 47 counties with their locations'
    
    # Kenya's 47 counties with their codes
    COUNTIES_DATA = [
        ('Baringo', 'BNG'), ('Bomet', 'BMT'), ('Bungoma', 'BGM'),
        ('Busia', 'BSA'), ('Elgeyo-Marakwet', 'EMK'), ('Embu', 'EMB'),
        ('Garissa', 'GRS'), ('Homa Bay', 'HMB'), ('Isiolo', 'ISL'),
        ('Kajiado', 'KJD'), ('Kakamega', 'KKG'), ('Kericho', 'KRC'),
        ('Kiambu', 'KMB'), ('Kilifi', 'KLF'), ('Kirinyaga', 'KRG'),
        ('Kisii', 'KSI'), ('Kisumu', 'KSM'), ('Kitui', 'KTI'),
        ('Kwale', 'KWL'), ('Laikipia', 'LKP'), ('Lamu', 'LAM'),
        ('Machakos', 'MCK'), ('Makueni', 'MKN'), ('Mandera', 'MND'),
        ('Marsabit', 'MSB'), ('Meru', 'MRU'), ('Migori', 'MGR'),
        ('Mombasa', 'MSA'), ('Murang\'a', 'MRG'), ('Nairobi', 'NBI'),
        ('Nakuru', 'NKR'), ('Nandi', 'NND'), ('Narok', 'NRK'),
        ('Nyamira', 'NYM'), ('Nyandarua', 'NND'), ('Nyeri', 'NYR'),
        ('Samburu', 'SMB'), ('Siaya', 'SYA'), ('Taita-Taveta', 'TTT'),
        ('Tana River', 'TNR'), ('Tharaka-Nithi', 'TRK'), ('Trans Nzoia', 'TNZ'),
        ('Turkana', 'TRK'), ('Uasin Gishu', 'UGS'), ('Vihiga', 'VHG'),
        ('Wajir', 'WJR'), ('West Pokot', 'WPK')
    ]
    
    def handle(self, *args, **options):
        self.stdout.write('Setting up Kenya\'s 47 counties...')
        
        created_count = 0
        for name, code in self.COUNTIES_DATA:
            # Create county location
            location, location_created = Location.objects.get_or_create(
                name=name,
                type='county',
                defaults={
                    'level': 0,
                    'code': f"{code}_LOC",
                    'parent': None
                }
            )
            
            if location_created:
                created_count += 1
                self.stdout.write(f'Created location: {name}')
            
            # County tenant is auto-created by signal
            county = County.objects.filter(location=location).first()
            if county:
                self.stdout.write(f'✓ County tenant exists: {county.name} ({county.code})')
            else:
                self.stdout.write(f'✗ Failed to create county tenant for {name}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully set up {created_count} new counties. '
                f'Total counties in system: {County.objects.count()}'
            )
        )
