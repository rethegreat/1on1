from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()
# ========================================================
# Calendar
# This model is used to store the calendar information
# 
# Relationships:
# User - Calendar (One to Many)
# Calendar - OwnerAvailability (One to One)
# Calendar - MemberAvailability (One to Many)
# Calendar - (Suggested) Schedule (One to Many)
# Calendar - (Finalized) Schedule (One to One)
class Calendar(models.Model):
    # 1) name = name of the calendar; required
    name = models.CharField(max_length=50, 
                            null=False, blank=False)

    # 2) color = colour of the calendar; default is blue
    color = models.CharField(max_length=7, default='#007bff')

    # 3) description = description of the calendar; optional
    description = models.CharField(max_length=200, blank=True, null=True)

    # 4) meeting_duration = duration of each meeting in minutes; default is 30 minutes
    meeting_duration = models.PositiveIntegerField(default=30)

    # 5) deadline = the date and time to submit responses; optional
    # A calendar is closed after the deadline
    deadline = models.DateTimeField(null=True, blank=True)

    #  ----- Attributes below are not fillable by the user -----

    # 6) owner = the user who created the calendar
    owner = models.ForeignKey(User, related_name='calendar', on_delete=models.CASCADE,
                               blank=False, null=False)

    # 7) owner_availability = the owner's availability
    # owner_availability = models.ForeignKey('OwnerAvailability', on_delete=models.CASCADE,
    #                                        blank=False, null=False)

    # 8) finalized = whether the calendar is finalized or not
    finalized = models.BooleanField(default=False,
                                    blank=False, null=False)

    # 9) finalized_schedule = the finalized schedule
    finalized_schedule = models.ForeignKey('Schedule', on_delete=models.SET_NULL, 
                                           blank=True, null=True, related_name='finalized_for_calendar')

# ========================================================
# Availability
# This model is used to store the availability of the owner and the members
#
# Relationships:
# Calendar - OwnerAvailability (One to One)
# Calendar - MemberAvailability (One to Many)
# Member - MemberAvailability (One to One)
#
# OwnerAvailability - OwnerTimeSlot (One to Many)
# MemberAvailability - MemberTimeSlot (One to Many)

# ========================================================
# Schedule
# This model is used to store the suggested schedule of the calendar
#
# Relationships:
# Calendar - Schedule (One to Many)
# Event - Schedule (Many to One)

class Schedule(models.Model):
    # 1) calendar: the calendar that the schedule is suggested for
    calendar = models.ForeignKey('Calendar', on_delete=models.CASCADE)

    # 2) display_id: the display id of the schedule, auto-generated upon creation
    # display_id = models.PositiveIntegerField() # Decided not to use this, but this may help efficiency