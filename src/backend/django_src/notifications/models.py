from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

UserModel = get_user_model()


# Create your models here.
class Notification(models.Model):
    """
    Notifications:
        - for member when they are added to a calendar
        - for calendar creator when a member submits/updates their time
        - for calendar creator when all members have submitted their times
        - for member when they haven't submitted their time
        - for member when the calendar has been finalized
    """
    TYPES = [
        ('added_to_calendar', 'for member when they are added to a calendar'),
        ('time_updated', 'for calendar creator when a member submits/updates their time'),
        ('all_times_updated', 'for calendar creator when all members have submitted their times'),
        ('submit_reminder', "for member when they haven't submitted their time"),
        ('calendar_finalized', 'for member when the calendar has been finalized')
    ]
    recipient = models.ForeignKey(UserModel, on_delete=models.CASCADE)
    message = models.TextField()
    read_status = models.BooleanField(default=False)  # True for read, False for unread
    notification_type = models.CharField(max_length=20, choices=TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)