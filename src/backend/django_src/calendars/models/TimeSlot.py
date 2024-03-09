from django.db import models
from .Calendar import Calendar
from .Member import Member
from django.core.exceptions import ValidationError
from .validators import validate_datetime_format

# TimeSlot
# This model is used to store the time slot information
# (Note that this model is abstract and should not be used directly)
#
# Relationships:
# Availability - TimeSlot (One to Many)
# class TimeSlot(models.Model):
#     # 0) availability = the availability that the time slot belongs to; required
#     availability = models.ForeignKey('Availability', related_name='time_slot', on_delete=models.CASCADE, null=False, blank=False)

# ========================================================
# OwnerTimeSlot
# This model is used to store the owner's time slot information
#
# Relationships:
# OwnerAvailability - OwnerTimeSlot (One to Many)
# OwnerTimeSlot - MemberTimeSlot (One to Many)
class OwnerTimeSlot(models.Model):
    # 0) The owner's time slot should belong to the owner's availability
    # availability = models.ForeignKey('OwnerAvailability', on_delete=models.CASCADE, null=False, blank=False)
    calendar = models.ForeignKey('Calendar', on_delete=models.CASCADE, null=False, blank=False)

    # 1) start_time = the start time of the time slot; required
    start_time = models.DateTimeField(null=False, blank=False, validators=[validate_datetime_format])

    # 2) end_time = the end time of the time slot; default is `meeting_duration` minutes after `start_time`
    # end_time = models.DateTimeField(null=False, blank=False)

    # 3) preference = the preference of the time slot; default is NO_PREF
    PREF_CHOICES = [
        ('HIGH', 'High'),
        ('NO_PREF', 'No Preference'),
        ('LOW', 'Low')
    ]
    preference = models.CharField(max_length=7, choices=PREF_CHOICES, default='NO_PREF')
    class Meta:
            # Ensure that there is at most one OwnerTimeSlot with a specific start_time per OwnerAvailability
            unique_together = ['calendar', 'start_time']

    def clean(self):
        """
        Custom model clean method to ensure uniqueness of OwnerTimeSlot by start_time.
        """
        # Check if there is already an OwnerTimeSlot with the same start_time
        existing_slots = OwnerTimeSlot.objects.filter(availability=self.availability, start_time=self.start_time)
        if self.pk:  # If updating an existing instance, exclude itself from the query
            existing_slots = existing_slots.exclude(pk=self.pk)
        if existing_slots.exists():
            raise ValidationError(('An OwnerTimeSlot with the same start time already exists.'))

# ========================================================
# MemberTimeSlot
# This model is used to store the member's time slot information
#
# Relationships:
# MemberAvailability - MemberTimeSlot (One to Many)
# OwnerTimeSlot - MemberTimeSlot (One to Many)
class MemberTimeSlot(models.Model):
    # 0) The member's time slot should belong to the member's availability
    member = models.ForeignKey('Member', on_delete=models.CASCADE, null=False, blank=False)

    # 1) time_slot = the time slot of the member; required
    time_slot = models.ForeignKey('OwnerTimeSlot', on_delete=models.CASCADE, null=False, blank=False)