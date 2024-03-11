from rest_framework import permissions

class IsCalendarOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a calendar to access it.
    """

    def has_object_permission(self, request, view, calendar):
        # Check if the request user is the owner of the calendar
        return calendar.owner == request.user