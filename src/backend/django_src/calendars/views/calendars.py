from rest_framework.permissions import IsAuthenticated
from ..permissions import IsCalendarOwner, is_calendar_finalized, is_calendar_finalized_manually
from ..models.Calendar import Calendar
from ..models.Member import Member
from ..serializers import CalendarListSerializer, CalendarPUTSerializer
from ..email_utils import send_email_to_participant
from rest_framework.response import Response
from rest_framework import status
from django.urls import reverse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.utils import timezone

# Calendars
# - User should be able to ...
#       - view all calendars (/calendars/list/ ; GET)
#       - create a new calendar (/calendars/list/ ; POST)
#       - go to a specific calendar page (/calendars/<int:calendar-id>/ ; GET)

# EndPoint: /calendars/list/
class CalendarList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """View all calendars of the user"""
        calendars = Calendar.objects.filter(owner=request.user)
        serializer = CalendarListSerializer(calendars, many=True)
        # Update the finalized field of each calendar
        for calendar in calendars:
            is_calendar_finalized(calendar)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new calendar"""
        data = request.data.copy()
        data['owner'] = request.user.id
        serializer = CalendarListSerializer(data=request.data)
        
        if serializer.is_valid():
            created_calendar = serializer.save(owner=request.user)
            is_calendar_finalized(created_calendar)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# EndPoint: /calendars/<int:calendar_id>/
class CalendarDetail(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]

    def get(self, request, calendar_id):
        """View a specific calendar's details"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)
        is_calendar_finalized(calendar)

        serializer = CalendarListSerializer(calendar)
        return Response(serializer.data)

    def put(self, request, calendar_id):
        """Edit a specific calendar's details"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Manually finalized calendar is not modifiable
        if is_calendar_finalized_manually(calendar):
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        # If automaitcally finalized, you can modify the deadline to later date and finalized status
        if is_calendar_finalized(calendar):
            if 'deadline' in request.data:
                calendar.deadline = request.data['deadline']
                if not (calendar.deadline):
                    calendar.deadline = None
                    calendar.finalized = False
                    calendar.save()
                elif timezone.now() > calendar.deadline:
                    calendar.finalized = False
                    calendar.save()
                else:
                    return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)
        serializer = CalendarPUTSerializer(calendar, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, calendar_id):
        """Delete a specific calendar"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        calendar.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
# EndPoint: /calendars/<int:calendar_id>/remindAll
class CalendarRemind(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]
    
    def post(self, request, calendar_id):
        """Remind all members of the calendar to submit their availability"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        if is_calendar_finalized(calendar):
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        members = Member.objects.filter(calendar=calendar)
        owner_name = request.user.first_name

        # If `pending_only` option is set, only remind those who haven't submitted!
        pending_only = request.data.get('pending_only')
        if pending_only:
            members = members.filter(submitted=False)
        
        for member in members:
            if not member.submitted:
                member.remind()
        return Response({'detail': 'Emails sent successfully'}, status=status.HTTP_200_OK)