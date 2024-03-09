from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models.Calendar import Calendar, Schedule
from ..serializers import ScheduleSerializer
from ..email_utils import send_confirmation_email
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action



# Suggested Schedules
# - User should be able to
#       - view suggested schedules (one at a time)
#       - edit a suggested schedule
#       - move to the next suggested schedule(id+1)
#       - finalize the calendar as a suggested schedule

class ScheduleListView(APIView):
    def get(self, request, calendar_id):
        # Get the list of schedules for the specified calendar
        schedules = Schedule.objects.filter(calendar_id=calendar_id)

        # Serialize the schedules along with their corresponding events
        serializer = ScheduleSerializer(schedules, many=True)

        return Response(serializer.data)
    
class ScheduleDetailView(APIView):
    def get(self, request, calendar_id, schedule_id):
        # Get the schedule
        schedule = get_object_or_404(Schedule, id=schedule_id, calendar_id=calendar_id)

        # Serialize the schedule along with its corresponding events
        serializer = ScheduleSerializer(schedule)

        return Response(serializer.data)

    # Users should be able to edit a suggested schedule
    def patch(self, request, calendar_id, schedule_id):
        # Get the schedule
        schedule = get_object_or_404(Schedule, id=schedule_id, calendar_id=calendar_id)

        # Update the schedule
        serializer = ScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)    
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def finalize(self, request, calendar_id, schedule_id):
        # Get the schedule
        schedule = get_object_or_404(Schedule, id=schedule_id, calendar_id=calendar_id)

        # Finalize the calendar
        calendar = get_object_or_404(Calendar, id=calendar_id)
        calendar.finalized = True
        calendar.finalized_schedule = schedule
        calendar.save()
        
        result = send_confirmation_email_helper(request.user, schedule_id)
        
        if result['success']:
            return Response({'detail': result['message']}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': result['message']}, status=status.HTTP_403_FORBIDDEN if result['message'] == 'Forbidden' else status.HTTP_400_BAD_REQUEST)
    

    def put(self, request, calendar_id, schedule_id):
        # Get the action from the request data
        action = request.data.get('action')
        event_id = request.data.get('event_id')

        # Check the action and perform the corresponding operation
        if action == 'move':
            time = request.data.get('time')
            return self.move_event(request, schedule_id)
        elif action == 'update':
            time = request.data.get('time')
            return self.update_schedule(request, schedule_id)
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    def move_event(self, request, schedule_id):
        # Extract the event ID and new time from the request data
        event_id = request.data.get('event_id')
        new_time = request.data.get('new_time')

        # Get the event object by its ID
        event = get_object_or_404(Event, id=event_id)

        # Update the event's time
        event.time_slot.start_time = new_time
        event.time_slot.save()

        return Response({'message': 'Event moved successfully'}, status=status.HTTP_200_OK)

    def update_schedule(self, request, schedule_id):
        # Get the schedule object by its ID
        schedule = get_object_or_404(Schedule, id=schedule_id)

        # Serialize the schedule with the updated data
        serializer = ScheduleDetailSerializer(schedule, data=request.data)

        # Validate and save the updated schedule
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)