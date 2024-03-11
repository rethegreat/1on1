from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..permissions import IsCalendarOwner, IsCalendarNotFinalized
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
from rest_framework.pagination import PageNumberPagination

# helper function to create a schedule given a calendar
def _create_schedules(calendar: Calendar): 
    # PREF_CHOICES: starttime
    owner_mapping = {"HIGH": [], "NO_PREF": [], "LOW": []}
    for slot in OwnerTimeSlot.objects.filter(calendar=calendar):
        owner_mapping[slot.preference].append(slot.start_time)

    
    # starttime: member
    times_members = {}

    # member: PREF_CHOICES: starttime
    members_mapping = {}
    for mem in Member.objects.filter(calendar=calendar):
        for slot in MemberTimeSlot.objects.filter(member=mem):
            members_mapping[mem].setdefault("HIGH", [])
            members_mapping[mem].setdefault("NO_PREF", [])
            members_mapping[mem].setdefault("LOW", [])
            members_mapping[mem][slot.preference].append(slot.time_slot.start_time)

            times_members.setdefault(slot.time_slot.start_time, []).append(mem)

    #owner's times as a list
    owner_times = owner_mapping['HIGH'] + owner_mapping['NO_PREF'] + owner_mapping['LOW']


    #member: list[starttime]
    members_times = {}
    for mem in members_mapping:
        members_times[mem] = members_mapping[mem]['HIGH'] + members_mapping[mem]['NO_PREF'] + members_mapping[mem]['LOW']

        

    #starttime: member
    base_schedule = {}
    for time in owner_times:
        base_schedule[time] = -1


    stack = sorted(list(members_times.keys()), key=lambda mem: len(members_times[mem]))
    used = set()

    while stack:
        mem = stack.pop()
        assigned = False

        # attempt to assing
        for time in members_times[mem]:
            if time not in used:
                used.add(time)
                base_schedule[time] = mem
                assigned = True
                break
        
        # look to assign another member to another slot 
        if not assigned:
            for time in members_times[mem]:
                for new_time in members_times[base_schedule[time]]:
                    if new_time not in used:
                        used.add(new_time)
                        used.add(time)
                        base_schedule[new_time] = base_schedule[time]
                        base_schedule[time] = mem
                        assigned = True
                        break

                if assigned:
                    break
                    
        # no possible assignment arrangement
        if not assigned:
            return None
        
    # high_schedule = _create_another_schedule(base_schedule, owner_mapping['HIGH'])
    # mid_schedule = _create_another_schedule(base_schedule, owner_mapping['NO_PREF'])
    
    return [base_schedule] #, high_schedule, mid_schedule]

def _create_another_schedule(base_schedule, owner_times, times_members, used):
    stack = owner_times[:]
    new_schedule = base_schedule.copy()
    visited = used.copy()
    
    #member: starttime in schedule
    mem_time = {}
    for time in new_schedule:
        if new_schedule[time] != -1:
            mem_time[new_schedule[time]] = time


    while stack:
        cur = stack.pop()
        if cur not in visited:
            visited.add(cur)
            mem = times_members[cur][0]         
            
            new_schedule[mem_time[mem]] = -1
            visited.remove(mem_time[mem])

            new_schedule[cur] = mem
            mem_time[mem] = cur


    return new_schedule

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

# EndPoint: /calendars/<int:calendar_id>/schedules/
# e.g. /calendars/<int:calendar_id>/schedules/?page=1
# e.g. /calendars/<int:calendar_id>/schedules/?page=2
class ScheduleListView(APIView):
    pagination_class = PageNumberPagination
    permission_classes = [IsAuthenticated, IsCalendarOwner]

    def get(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Get the list of schedules for the specified calendar
        schedules = Schedule.objects.filter(calendar_id=calendar_id)

        # Paginate the queryset
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(schedules, request)

        # Serialize the schedules along with their corresponding events
        serializer = ScheduleSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        data = request.data.copy()
        data['calendar'] = calendar_id
        serializer = ScheduleSerializer(data=data)

        if not serializer.is_valid():
            return Response(serializer.errors)
        
        schedule = serializer.save(calendar=calendar)

        #starttime: member
        mapping = _create_schedules(Calendar)
        for each in mapping:
            for time in each:
                # Try creating a new event
                new_event, err_msg = _add_event(schedule, time, mapping[time])
                if not new_event:
                    return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
# EndPoint: /calendars/<int:calendar_id>/schedules/<int:schedule_id>/
class ScheduleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]

    def get(self, request, calendar_id, schedule_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Get the schedule
        schedule = get_object_or_404(Schedule, id=schedule_id, calendar_id=calendar_id)

        # Serialize the schedule along with its corresponding events
        serializer = ScheduleSerializer(schedule)

        return Response(serializer.data)

    # Users should be able to edit a suggested schedule
    def patch(self, request, calendar_id, schedule_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        permission_checker = IsCalendarNotFinalized()
        if not permission_checker.has_permission(request, self):
            # Handle permission denial
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

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
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        permission_checker = IsCalendarNotFinalized()
        if not permission_checker.has_permission(request, self):
            # Handle permission denial
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get the schedule
        schedule = get_object_or_404(Schedule, id=schedule_id, calendar_id=calendar_id)

        # Finalize the calendar
        calendar.finalized = True
        calendar.finalized_schedule = schedule
        # Delete all other schedules in the calendar
        Schedule.objects.filter(calendar=calendar).exclude(id=schedule_id).delete()
        calendar.save()
        
        result = send_confirmation_email(request.user, schedule_id)
        
        if result['success']:
            return Response({'detail': result['message']}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': result['message']}, status=status.HTTP_403_FORBIDDEN if result['message'] == 'Forbidden' else status.HTTP_400_BAD_REQUEST)
    

    def put(self, request, calendar_id, schedule_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        permission_checker = IsCalendarNotFinalized()
        if not permission_checker.has_permission(request, self):
            # Handle permission denial
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

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