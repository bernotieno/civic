# =============================================================================
# FINAL ADDITION 3: Kisumu Demo Data Population
# FILE: apps/users/management/commands/setup_kisumu_demo.py
# =============================================================================
from django.core.management.base import BaseCommand
from apps.users.models import Location, County

class Command(BaseCommand):
    help = 'Setup complete Kisumu county hierarchy for demo'
    
    def handle(self, *args, **options):
        self.stdout.write('🚀 Setting up Kisumu demo data...')
        
        try:
            # Get Kisumu county
            kisumu_county = County.objects.get(code='KSM')
            kisumu_location = kisumu_county.location
            
            # Kisumu Sub-Counties
            sub_counties = [
                'Kisumu East', 'Kisumu West', 'Kisumu Central', 
                'Seme', 'Nyando', 'Muhoroni', 'Nyakach'
            ]
            
            for i, sub_county_name in enumerate(sub_counties):
                sub_county, created = Location.objects.get_or_create(
                    name=sub_county_name,
                    type='sub_county',
                    parent=kisumu_location,
                    level=1,
                    defaults={'code': f"SC_KSM_{i+1:02d}"}
                )
                if created:
                    self.stdout.write(f"  ✓ Created: {sub_county_name}")
            
            # Focus on Kisumu East for detailed demo
            kisumu_east = Location.objects.get(name='Kisumu East', type='sub_county')
            
            # Kisumu East Wards
            wards_data = {
                'Kondele': ['Nyalenda A', 'Nyalenda B', 'Manyatta A', 'Manyatta B'],
                'Railways': ['Railway Estate', 'Migosi', 'Lolwe', 'Bandani'],
                'Kolwa East': ['Kolwa Central', 'Kolwa East', 'Shauri Moyo'],
                'Kolwa Central': ['Tom Mboya', 'Nyamasaria', 'Migosi'],
                'Market Milimani': ['Milimani', 'Market', 'Kibuye']
            }
            
            for ward_name, villages in wards_data.items():
                # Create ward
                ward, created = Location.objects.get_or_create(
                    name=ward_name,
                    type='ward',
                    parent=kisumu_east,
                    level=2,
                    defaults={'code': f"WD_{ward_name[:3].upper()}"}
                )
                if created:
                    self.stdout.write(f"    ✓ Ward: {ward_name}")
                
                # Create villages
                for village_name in villages:
                    village, created = Location.objects.get_or_create(
                        name=village_name,
                        type='village',
                        parent=ward,
                        level=3,
                        defaults={'code': f"VL_{village_name[:3].upper()}"}
                    )
                    if created:
                        self.stdout.write(f"      ✓ Village: {village_name}")
            
            # Summary
            total_locations = Location.objects.filter(
                parent__parent__parent=kisumu_location
            ).count() + Location.objects.filter(
                parent__parent=kisumu_location
            ).count() + Location.objects.filter(
                parent=kisumu_location
            ).count() + 1
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('🎉 Kisumu demo setup complete!'))
            self.stdout.write(f'📊 Total Kisumu locations: {total_locations}')
            self.stdout.write('🎯 Ready for hackathon demo!')
            
        except County.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Kisumu county not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
