from django.dispatch import receiver

from calendars.signals import member_added_to_calendar, creator_member_added_to_calendar, \
    creator_all_member_added_to_calendar, member_submit_reminder, member_cal_finalized
from .models import Notification


@receiver(member_added_to_calendar)
def handle_member_added_to_calendar(calendar, member, **kwargs):
    Notification.objects.create(
        recipient=member,
        message=f"You have been added to calendar: {calendar.name}",
        notification_type='added_to_calendar'
    )


@receiver(creator_member_added_to_calendar)
def handle_creator_member_added_to_calendar(calendar, member, **kwargs):
    Notification.objects.create(
        recipient=calendar.owner,
        message=f"{member.name} has updated their time in calendar: {calendar.name}",
        notification_type='time_updated'
    )


@receiver(creator_all_member_added_to_calendar)
def handle_creator_all_member_added_to_calendar(calendar, **kwargs):
    Notification.objects.create(
        recipient=calendar.owner,
        message=f"All members have reported their availability: {calendar.name}",
        notification_type='all_times_updated'
    )


@receiver(member_submit_reminder)
def handle_member_submit_reminder(calendar, member, **kwargs):
    Notification.objects.create(
        recipient=member,
        message=f"Reminder to submit your availability: {calendar.name}",
        notification_type='submit_reminder'
    )


@receiver(member_cal_finalized)
def handle_member_cal_finalized(calendar, **kwargs):
    for member in calendar.members.all():
        Notification.objects.create(
            recipient=member,
            message=f"{calendar.name} has been finalized",
            notification_type='calendar_finalized'
        )


