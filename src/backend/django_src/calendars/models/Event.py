from django.db import models
from .Calendar import Schedule
from .TimeSlot import OwnerTimeSlot

# ========================================================
# Event
# This model is used to store the information of the event, which are used
# in the suggested schedule.
# 
# Relationships:
# Schedule - Events (One to Many)
# OwnerTimeSlot - Events (One to Many)
class Event(models.Model):
    # 1) suggested_schedule: the suggested schedule that the event is part of; required
    suggested_schedule = models.ForeignKey('Schedule', on_delete=models.CASCADE, null=False, blank=False)

    # 2) time_slot: the time slot of the event; required
    time_slot = models.ForeignKey('OwnerTimeSlot', on_delete=models.CASCADE, null=False, blank=False)

    # 3) member: the member that the event is suggested for; required
    member = models.ForeignKey('Member', on_delete=models.CASCADE, null=False, blank=False)