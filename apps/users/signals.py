# =============================================================================
# FILE: apps/users/signals.py
# =============================================================================
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from .models import Location, County, CustomUser


@receiver(pre_save, sender=CustomUser)
def validate_user_location_hierarchy(sender, instance, **kwargs):
    """Ensure user's location hierarchy is valid"""
    if instance.village and not instance.ward:
        raise ValidationError("Cannot assign village without ward")
    if instance.ward and not instance.sub_county:
        raise ValidationError("Cannot assign ward without sub-county")
    if instance.sub_county and not instance.county:
        raise ValidationError("Cannot assign sub-county without county")


@receiver(post_save, sender=CustomUser)
def auto_assign_accessible_counties(sender, instance, created, **kwargs):
    """Auto-assign accessible counties for government officials"""
    if instance.role == 'government_official' and instance.official_level == 'national':
        # National officials get access to all counties
        instance.accessible_counties.set(County.objects.all())
    elif instance.role == 'government_official' and instance.official_level == 'regional':
        # Regional officials get access to their home county by default
        if instance.home_county:
            instance.accessible_counties.add(instance.home_county)
