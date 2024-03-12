from rest_framework import permissions

class IsCalendarOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a calendar to access it.
    """

    def has_object_permission(self, request, view, calendar):
        # Check if the request user is the owner of the calendar
        return calendar.owner == request.user

def is_calendar_finalized(calendar):
    """
    A helper function to check if the calendar's deadline has passed 
    and finalize the calendar if it has.
    Note this function does not automatically set the calendar's
    finalized_schedule as the user may not want to send out emails to
    the schedule that the system chooses.
    """
    from django.utils import timezone
    if calendar.finalized:
        return True
    if calendar.deadline and timezone.now() > calendar.deadline:
        calendar.finalized = True
        calendar.save()
        return True
    return False

def is_calendar_finalized_manually(calendar):
    """
    A helper function to check if the user finalized
    the calendar manually(i.e., by setting the finalized_schedule).
    """
    return calendar.finalized_schedule is not None