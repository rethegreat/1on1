from rest_framework.permissions import IsAuthenticated
from ..models.Calendar import Calendar
from ..serializers import CalendarListSerializer, CalendarPUTSerializer
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
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all calendars that the user created(owner=user)
        calendars = Calendar.objects.filter(owner=request.user)
        serializer = CalendarListSerializer(calendars, many=True)
        return Response(serializer.data)
    
    def post(self, request):    
        serializer = CalendarListSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# EndPoint: /calendars/<int:calendar_id>/
class CalendarDetail(APIView):
    # permission_classes = [IsAuthenticated] # Only the owner can view, edit, and delete the calendar

    def get(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        serializer = CalendarListSerializer(calendar)
        return Response(serializer.data)

    def put(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        serializer = CalendarPUTSerializer(calendar, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        calendar.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
