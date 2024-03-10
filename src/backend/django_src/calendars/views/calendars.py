from rest_framework.permissions import IsAuthenticated
from ..permissions import IsCalendarOwner
from ..models.Calendar import Calendar
from ..models.Member import Member
from ..serializers import CalendarListSerializer, CalendarPUTSerializer
from ..email_utils import send_invitation_email, send_email_to_participant
from rest_framework.response import Response
from rest_framework import status
from django.urls import reverse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

# Calendars
# - User should be able to ...
#       - view all calendars (/calendars/list/ ; GET)
#       - create a new calendar (/calendars/list/ ; POST)
#       - go to a specific calendar page (/calendars/<int:calendar-id>/ ; GET)

# EndPoint: /calendars/list/
class CalendarList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all calendars that the user created(owner=user)
        calendars = Calendar.objects.filter(owner=request.user)
        serializer = CalendarListSerializer(calendars, many=True)
        return Response(serializer.data)
    
    def post(self, request):    
        serializer = CalendarListSerializer(data=request.data)
        
        if serializer.is_valid():
            created_calendar = serializer.save(owner=request.user)
            email_response, email_status = send_invitation_email(request.user, created_calendar.id)
            
            if email_status != status.HTTP_200_OK:
                return Response(email_response, status=email_status)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# EndPoint: /calendars/<int:calendar_id>/
class CalendarDetail(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]

    def get(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        serializer = CalendarListSerializer(calendar)
        return Response(serializer.data)

    def put(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        serializer = CalendarPUTSerializer(calendar, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        calendar.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
# EndPoint: /calendars/<int:calendar_id>/remindAll
class CalendarRemind(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]
    
    def post(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, pk=calendar_id)
        self.check_object_permissions(request, calendar)
        
        members = Member.objects.filter(calendar=calendar)
        owner_name = request.user.first_name
        
        for member in members:
            if not member.submitted:
                message = f"Hi {member.name},\n\nA reminder that you have been inivited by {owner_name} to set up a meeting with them. Please fill out your avalibility at your nearest convenience.\n\nBest regards.\n1on1 Team"
                send_email_to_participant('Meeting scheduling reminder from 1on1',member.email, message)

        return Response({'detail': 'Emails sent successfully'}, status=status.HTTP_200_OK)