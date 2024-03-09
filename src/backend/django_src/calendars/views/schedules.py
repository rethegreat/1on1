from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models.Calendar import Calendar, Schedule
from ..models.Member import Member
from ..models.Event import Event
from ..models.TimeSlot import OwnerTimeSlot, MemberTimeSlot
from ..serializers import ScheduleSerializer
from ..email_utils import send_confirmation_email
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from ..models.Event import Event
from datetime import datetime

# Helper function to add an event to a schedule
def _add_event(schedule: Schedule, start_time: datetime, member: Member) -> Event:
    # Get the OwnerTimeSlot object for the specified start time

    # Case 1 ::
    # if start_time is not one of OwnerTimeSlot.start_time, 
    # then return error message that this time is marked not available!
    try:
        new_time_slot = OwnerTimeSlot.objects.get(start_time=start_time)
    except OwnerTimeSlot.DoesNotExist:
        return None, 'This time is not available'
    # Case 2 :: 
    # elif start_time is not one of OwnerTimeSlot.start_time that the member chosen said he/she is available(i.e., MemberTimeSlot.time_slot is not there),
    #  then return error message that this time is not available by {member.name}!
    if not MemberTimeSlot.objects.filter(time_slot__start_time=start_time, member=member):
        return None, 'This time is not available by the member'
    
    # elif start_time is already taken by another event, then return error message that this time is already taken!
    elif Event.objects.filter(time_slot__start_time=start_time, schedule=schedule):
        return None, 'This time is already taken'
    
    # else, create the event
    new_event = Event.objects.create(schedule=schedule, member=member, time_slot=new_time_slot)
    # save it
    new_event.save()
    return new_event

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
        old_event_id = request.data.get('event_id')
        old_event = get_object_or_404(Event, id=old_event_id)
        new_time = request.data.get('new_time')
        schedule = get_object_or_404(Schedule, id=schedule_id)
        member = old_event.member
        
        # Try creating a new event
        new_event, err_msg = _add_event(schedule, new_time, member)
        if not new_event:
            return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)
        # Delete the old event
        old_event.delete()
        return Response({'message': 'Event moved successfully'}, status=status.HTTP_200_OK)

    def add_event(self, request, schedule_id):
        # Extract the event data from the request
        new_start_time = request.data.get('new_start_time')
        member_id = request.data.get('member_id')
        schedule = get_object_or_404(Schedule, id=schedule_id)
        member = get_object_or_404(Member, id=member_id)
        new_event, err_msg = _add_event(schedule, new_start_time, member)
        if not new_event:
            return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Event added successfully'}, status=status.HTTP_201_CREATED)