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
    
    # Kenya's 47 counties with unique codes
    COUNTIES_DATA = [
        ('Baringo', 'BAR'), ('Bomet', 'BOM'), ('Bungoma', 'BUN'),
        ('Busia', 'BUS'), ('Elgeyo-Marakwet', 'ELG'), ('Embu', 'EMB'),
        ('Garissa', 'GAR'), ('Homa Bay', 'HOM'), ('Isiolo', 'ISI'),
        ('Kajiado', 'KAJ'), ('Kakamega', 'KAK'), ('Kericho', 'KER'),
        ('Kiambu', 'KIA'), ('Kilifi', 'KIL'), ('Kirinyaga', 'KIR'),
        ('Kisii', 'KIS'), ('Kisumu', 'KI1'), ('Kitui', 'KIT'),
        ('Kwale', 'KWA'), ('Laikipia', 'LAI'), ('Lamu', 'LAM'),
        ('Machakos', 'MAC'), ('Makueni', 'MAK'), ('Mandera', 'MAN'),
        ('Marsabit', 'MAR'), ('Meru', 'MER'), ('Migori', 'MIG'),
        ('Mombasa', 'MOM'), ('Murang\'a', 'MUR'), ('Nairobi', 'NAI'),
        ('Nakuru', 'NAK'), ('Nandi', 'NAN'), ('Narok', 'NAR'),
        ('Nyamira', 'NYA'), ('Nyandarua', 'NYN'), ('Nyeri', 'NYE'),
        ('Samburu', 'SAM'), ('Siaya', 'SIA'), ('Taita-Taveta', 'TAI'),
        ('Tana River', 'TAN'), ('Tharaka-Nithi', 'THA'), ('Trans Nzoia', 'TRA'),
        ('Turkana', 'TUR'), ('Uasin Gishu', 'UAS'), ('Vihiga', 'VIH'),
        ('Wajir', 'WAJ'), ('West Pokot', 'WES')
    ]
    
    def handle(self, *args, **options):
        self.stdout.write('Setting up Kenya\'s 47 counties...')
        
        created_count = 0
        for name, code in self.COUNTIES_DATA:
            try:
                # Check if location already exists by name
                location = Location.objects.filter(name=name, type='county').first()
                
                if not location:
                    # Create new location
                    location = Location.objects.create(
                        name=name,
                        type='county',
                        level=0,
                        code=f"{code}_LOC",
                        parent=None
                    )
                    created_count += 1
                    self.stdout.write(f'Created location: {name}')
                
                # County tenant is auto-created by signal
                county = County.objects.filter(location=location).first()
                if county:
                    self.stdout.write(f'✓ County tenant exists: {county.name} ({county.code})')
                else:
                    self.stdout.write(f'✗ Failed to create county tenant for {name}')
                    
            except Exception as e:
                self.stdout.write(f'Error processing {name}: {str(e)}')
                continue
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully set up {created_count} new counties. '
                f'Total counties in system: {County.objects.count()}'
            )
        )
