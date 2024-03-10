from django.db import models
from .Calendar import Calendar
from .Member import Member
from django.core.exceptions import ValidationError
from .validators import validate_datetime_format
from django.db.models import Value
from django.db import IntegrityError
import datetime

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

    # 2) end_time = the end time of the time slot which should be autoset as `self.calendar.meeting_duration`mins + `self.start_time`
    # end_time = models.DateTimeField(null=False, blank=False, validators=[validate_datetime_format])

    # 3) preference = the preference of the time slot; default is NO_PREF
    PREF_CHOICES = [
        ('HIGH', 'High'),
        ('NO_PREF', 'No Preference'),
        ('LOW', 'Low')
    ]
    preference = models.CharField(max_length=7, choices=PREF_CHOICES, default='NO_PREF')

    class Meta:
        unique_together = ('calendar', 'start_time')

    def save(self, *args, **kwargs):
        
        # Validate that the time slot doesn't conflict with existing slots
        existing_slots = OwnerTimeSlot.objects.filter(
            calendar=self.calendar
        ).exclude(pk=self.pk if self.pk else Value(None))

        for slot in existing_slots:
            slot_end_time = slot.start_time + datetime.timedelta(minutes=self.calendar.meeting_duration)
            self_end_time = self.start_time + datetime.timedelta(minutes=self.calendar.meeting_duration)
            if (slot.start_time < self_end_time < slot_end_time) or (slot.start_time < self_end_time < slot_end_time):
                raise IntegrityError("Time slot conflicts with existing slot.")

        # Call the parent save method to actually save the object
        super().save(*args, **kwargs)


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