from django.db import models
from .Calendar import Availability

# TimeSlot
# This model is used to store the time slot information
# (Note that this model is abstract and should not be used directly)
#
# Relationships:
# Availability - TimeSlot (One to Many)
class TimeSlot(models.Model):
    # 0) availability = the availability that the time slot belongs to; required
    availability = models.ForeignKey('Availability', related_name='time_slot', on_delete=models.CASCADE, null=False, blank=False)

# ========================================================
# OwnerTimeSlot
# This model is used to store the owner's time slot information
#
# Relationships:
# OwnerAvailability - OwnerTimeSlot (One to Many)
# OwnerTimeSlot - MemberTimeSlot (One to Many)
class OwnerTimeSlot(TimeSlot):
    # 0) The owner's time slot should belong to the owner's availability
    # availability = models.ForeignKey('OwnerAvailability', on_delete=models.CASCADE, null=False, blank=False)

    # 1) start_time = the start time of the time slot; required
    start_time = models.DateTimeField(null=False, blank=False)

    # 2) end_time = the end time of the time slot; default is `meeting_duration` minutes after `start_time`
    # end_time = models.DateTimeField(null=False, blank=False)

    # 3) preference = the preference of the time slot; default is NO_PREF
    PREF_CHOICES = [
        ('HIGH', 'High'),
        ('NO_PREF', 'No Preference'),
        ('LOW', 'Low')
    ]
    preference = models.CharField(max_length=7, choices=PREF_CHOICES, default='NO_PREF')

# ========================================================
# MemberTimeSlot
# This model is used to store the member's time slot information
#
# Relationships:
# MemberAvailability - MemberTimeSlot (One to Many)
# OwnerTimeSlot - MemberTimeSlot (One to Many)
class MemberTimeSlot(TimeSlot):
    # 0) The member's time slot should belong to the member's availability
    # availability = models.ForeignKey('MemberAvailability', on_delete=models.CASCADE, null=False, blank=False)

    # 1) time_slot = the time slot of the member; required
    time_slot = models.ForeignKey('OwnerTimeSlot', on_delete=models.CASCADE, null=False, blank=False)