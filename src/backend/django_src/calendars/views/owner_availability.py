from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models.Calendar import Calendar
from ..models.TimeSlot import OwnerTimeSlot
from ..serializers import OwnerTimeSlotSerializer
from django.shortcuts import get_object_or_404

# Owner Availability
# - User should be able to ...
#       - view their availability
#       - edit their availability
#       - submit their availability

# EndPoint: /calendars/<int:calendar-id>/availability/
class OwnerAvailabilityView(APIView):
    def get(self, request, calendar_id):
        # Get the calendar
        calendar = get_object_or_404(Calendar, id=calendar_id)
        # Get the time slots
        time_slots = OwnerTimeSlot.objects.filter(calendar=calendar)
        serializer = OwnerTimeSlotSerializer(time_slots, many=True)
        return Response(serializer.data)
    
    def post(self, request, calendar_id):
        # Get the calendar
        calendar = get_object_or_404(Calendar, id=calendar_id)
        # Create the time slot
        data = request.data
        serializer = OwnerTimeSlotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(calendar=calendar)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, calendar_id):
        action = request.data.get('action')
        time_slot_time = request.data.get('start_time')
        # Get the calendar
        calendar = get_object_or_404(Calendar, id=calendar_id)
        time_slot = get_object_or_404(OwnerTimeSlot, calendar=calendar, start_time=time_slot_time)
        if action == 'edit':
            serializer = OwnerTimeSlotSerializer(time_slot, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif action == 'delete':
            time_slot.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

