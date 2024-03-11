from django.dispatch import receiver
from django.db.models.signals import pre_save
from django.utils import timezone
from .models.Calendar import Calendar, Schedule
from .views.schedules import ScheduleDetailView

@receiver(pre_save, sender=Calendar)
def check_deadline_and_finalize(sender, instance, **kwargs):
    """Check if the deadline has passed and finalize the schedule if it has."""
    if instance.deadline and instance.deadline <= timezone.now():
        # Retrieve the schedule related to this calendar
        try:
            schedule = Schedule.objects.filter(calendar=instance).first()
        except Schedule.DoesNotExist:
            # Create an empty schedule
            schedule = Schedule.objects.create(calendar=instance)
        if schedule:
            # Trigger the finalize method of the ScheduleDetailView
            view = ScheduleDetailView()
            view.finalize(request=None, calendar_id=instance.pk, schedule_id=schedule.id)
