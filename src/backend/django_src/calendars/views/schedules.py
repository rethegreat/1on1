from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..permissions import IsCalendarOwner
from ..models.Calendar import Calendar, Schedule
from ..models.Member import Member
from ..models.Event import Event
from ..models.TimeSlot import OwnerTimeSlot, MemberTimeSlot
from ..serializers import ScheduleSerializer, EventSerializer
from ..email_utils import send_confirmation_email
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from ..models.Event import Event
from datetime import datetime
from rest_framework.pagination import PageNumberPagination
from django.core.paginator import Paginator

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
        if mem not in members_mapping:
            members_mapping[mem] = {"HIGH": [], "NO_PREF": [], "LOW": []}
        # members_mapping[mem].setdefault("HIGH", [])
        # members_mapping[mem].setdefault("NO_PREF", [])
        # members_mapping[mem].setdefault("LOW", [])
        for slot in MemberTimeSlot.objects.filter(member=mem):
            members_mapping[mem][slot.preference].append(slot.time_slot.start_time)

            times_members.setdefault(slot.time_slot.start_time, []).append(mem)

    #owner's times as a list
    owner_times = owner_mapping['HIGH'] + owner_mapping['NO_PREF'] + owner_mapping['LOW']


    #member: list[starttime]
    members_times = {}
    for mem in members_mapping:
        members_times[mem] = members_mapping[mem]['HIGH'] + members_mapping[mem]['NO_PREF'] + members_mapping[mem]['LOW']
        if len(members_times[mem]) == 0:
            members_times.pop(mem)
        
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
        
    high_schedule = _create_another_schedule(base_schedule, owner_mapping['HIGH'], times_members, used)
    mid_schedule = _create_another_schedule(base_schedule, owner_mapping['NO_PREF'], times_members, used)
    
    return [base_schedule, high_schedule, mid_schedule]

def _create_another_schedule(base_schedule, owner_times, times_members, used):
    stack = owner_times[::-1]
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
            if cur in times_members:
                mem = times_members[cur][0]         
                
                new_schedule[mem_time[mem]] = -1
                visited.remove(mem_time[mem])

                new_schedule[cur] = mem
                mem_time[mem] = cur

    if new_schedule != base_schedule:
        return new_schedule
    return {}

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
    elif Event.objects.filter(time_slot__start_time=start_time, suggested_schedule=schedule):
        return None, 'This time is already taken'
    
    # else, create the event
    new_event = Event.objects.create(suggested_schedule=schedule, member=member, time_slot=new_time_slot)
    # save it
    new_event.save()
    return new_event, ""

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
    pagination_class.page_size = 1

    def get(self, request, calendar_id):
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check if a schedule already exists for the calendar
        schedule = Schedule.objects.filter(calendar_id=calendar_id).first()

        # If no schedule exists, create a new one
        if not schedule:

        # delete all schedules and events related to this calendar
        # Schedule.objects.filter(calendar_id=calendar_id).delete()
        # Event.objects.filter()


        #starttime: member
            mapping = _create_schedules(calendar)
            if not mapping:
                return Response({'error': "No possible mapping"}, status=status.HTTP_400_BAD_REQUEST)
            
            for each in mapping:
                if not each:
                    continue
                schedule = Schedule.objects.create(calendar=calendar)
                for time in each:
                    # Try creating a new event
                    if each[time] != -1:
                        new_event, err_msg = _add_event(schedule, time, each[time])
                        if not new_event:
                            return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)

            schedule.save()
        
        # Get all schedules in this calendar
        schedules = Schedule.objects.filter(calendar_id=calendar_id)
        # for each schedules, serialize id, schedule, events

        # Paginate the queryset
        # Paginate the queryset
        paginator = Paginator(schedules, self.pagination_class.page_size)
        page_number = request.query_params.get('page', 1)
        page_obj = paginator.get_page(page_number)

        # Serialize each schedule along with its events
        results = []
        for schedule in page_obj:
            data = {
                'id': schedule.id,
                'events': EventSerializer(Event.objects.filter(suggested_schedule=schedule), many=True).data
            }
            results.append(data)

        # Construct custom paginated response
        response_data = {
            'count': paginator.count,
            'next': page_obj.next_page_number() if page_obj.has_next() else None,
            'previous': page_obj.previous_page_number() if page_obj.has_previous() else None,
            'results': results  # Include paginated data
        }

        return Response(response_data)
        return Response(response_data, status=status.HTTP_200_OK)
        
    
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
        if calendar.finalized:
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

        if calendar.finalized:
            # Already finalized
            return Response({"detail": "Calendar is already finalized"}, status=status.HTTP_400_BAD_REQUEST)
        
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
        if calendar.finalized:
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