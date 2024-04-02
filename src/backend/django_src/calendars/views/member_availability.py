from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models.Calendar import Calendar, Schedule
from ..models.Member import Member
from ..models.TimeSlot import OwnerTimeSlot, MemberTimeSlot
from ..serializers import MemberTimeSlotSerializer
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from ..permissions import is_calendar_finalized, IsCalendarOwner
from ..signals import creator_member_added_to_calendar, creator_all_member_added_to_calendar

# Member Availability
# - Member(not authenticated, but by a unique link) should be able to ...
#       - view their availability
#       - edit their availability
#       - submit their availability

# A unique link provided by the notification email will be used to access the member's availability
# The provided link will redirect to this page, where the member can view, edit, and submit their availability
# EndPoint: /calendars/<calendar_id>/availability/<str:hash>/
class MemberAvailabilityView(APIView):
    
    def get_member_by_hash(self, hash, calendar_id):
        # Attempt to retrieve the Member using the provided hash and calendar_id for extra validation
        return get_object_or_404(Member, member_hash=hash, calendar_id=calendar_id)

    # Get all of this member's availability(Get all the non-busy time slots this member submitted)
    def get(self, request, calendar_id, hash):        # Validate and retrieve the member based on the ID
        member = self.get_member_by_hash(hash, calendar_id)

        # Get all the non-busy time slots this member submitted
        previously_submitted = MemberTimeSlot.objects.filter(member=member)

        calendar = get_object_or_404(Calendar, id=calendar_id)
        # Get all the available time slots set by the owner
        possible_slots = OwnerTimeSlot.objects.filter(calendar=calendar)
        # Serialize the data
        # Manually serialize the data
        data = {
            'calendar': {
                'id': calendar.id,
                'name': calendar.name,
                'description': calendar.description,
                'owner': calendar.owner.first_name + ' ' + calendar.owner.last_name,
                'owner_email': calendar.owner.email,
                'meeting_duration': calendar.meeting_duration,
            },

            'member': {
                'id': member.id,
                'name': member.name
            },
            'previously_submitted': [
                {
                    'id': slot.id,
                    'start_time': slot.time_slot.start_time,
                    'preference': slot.preference
                }
                for slot in previously_submitted
            ],
            'possible_slots': [
                {
                    'id': slot.id,
                    'start_time': slot.start_time,
                    "owner's preference": slot.preference
                }
                for slot in possible_slots
            ]
        }

        return Response(data, status=status.HTTP_200_OK)
    
    def post(self, request, calendar_id, hash):
        # Extract member ID from the URL parameters or token in the request
        # Validate and retrieve the member based on the ID
        member = self.get_member_by_hash(hash, calendar_id)

        calendar = get_object_or_404(Calendar, id=calendar_id)

        # Check additional permission
        if is_calendar_finalized(calendar):
            # Handle permission denial
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        # 'possible_slots' is a list of owner-available time slots
        possible_slots = OwnerTimeSlot.objects.filter(calendar=calendar)

        # Let the member choose from the possible_slots, determined by start_time
        # Then create the member's time slot with time_slot=possible_slots[start_time]
        data = request.data

        # Validate the request data
        serializer = MemberTimeSlotSerializer(data=data)

        # Find the corresponding possible slot(OwnerTimeSlot with time_slot_id), if not found, return 400
        # If the member already submitted the member time slot with that time_slot_id, if found, return 400
        if serializer.is_valid():
            time_slot_time = serializer.validated_data.get('time_slot_time')
            chosen_slot = get_object_or_404(possible_slots, start_time=time_slot_time)
            if not chosen_slot:
                return Response({'error': 'Invalid time slot'}, status=status.HTTP_400_BAD_REQUEST)
            
            previously_submitted = MemberTimeSlot.objects.filter(member=member)
            # if chosen_slot is one of the previously_submitted's time_slot, return 400
            if chosen_slot in previously_submitted:
                return Response({'error': 'Time slot already submitted'}, status=status.HTTP_400_BAD_REQUEST)
            # Otherwise, create the member's time slot
            try:
                MemberTimeSlot.objects.create(member=member, time_slot=chosen_slot, preference=serializer.validated_data.get('preference'))
            except IntegrityError:
                return Response({'error': 'Time slot already submitted'}, status=status.HTTP_400_BAD_REQUEST)
            # Set member.submitted=True
            member.submitted = True
            member.save()

            # Send signal for notif
            creator_member_added_to_calendar(calendar=calendar, member=member)

            # check if all members have submitted for notif signal
            all_submitted = not Member.objects.filter(calendar=calendar, submitted=False).exists()
            if all_submitted:
                creator_all_member_added_to_calendar(calendar=calendar)

            # check if schedule exists if it does delete it so it can be regenerated
            schedule = Schedule.objects.filter(calendar_id=calendar_id)
            if schedule:
                schedule.delete()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    def patch(self, request, member_id, calendar_id):
        """Delete a specific member's non-busy time slot"""
        calendar = get_object_or_404(Calendar, id=calendar_id)

        # Check additional permission
        if is_calendar_finalized(calendar):
            # Handle permission denial
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        member_time_slot_id = request.data.get('member_time_slot_id', None)
        if member_time_slot_id is None:
            return Response({'error': 'Member time slot ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        # Validate and retrieve the member based on the ID
        member = self.get_member_by_hash(hash, calendar_id)
        # Delete the member's availability
        MemberTimeSlot.objects.filter(id=member_time_slot_id).delete()
        # If there is no timeslot submitted at all then set member.submitted=False
        if not MemberTimeSlot.objects.filter(member=member).exists():
            member.submitted = False
            member.save()

            # Send signal for notif
            creator_member_added_to_calendar(calendar=calendar, member=member)

        # check if schedule exists if it does delete it so it can be regenerated
        schedule = Schedule.objects.filter(calendar_id=calendar_id)
        if schedule:
            schedule.delete()
            
        return Response(status=status.HTTP_204_NO_CONTENT)
    

# A view for the owner to view the availability of a specific member
# ENDPOINT: calendars/<int:calendar_id>/members/<int:member_id>/availability/
class MemberAvailabilityByIDView(APIView):

    permission_classes = [IsAuthenticated, IsCalendarOwner]
    
    # Get all of this member's availability(Get all the non-busy time slots this member submitted)
    def get(self, request, calendar_id, member_id):        # Validate and retrieve the member based on the ID
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)
        is_calendar_finalized(calendar) # Update the calendar's finalized status
        
        try:
            member = Member.objects.get(id=member_id, calendar_id=calendar_id)
        except Member.DoesNotExist:
            return Response("Member not found in the calendar", status=status.HTTP_404_NOT_FOUND)

        # Get all the non-busy time slots this member submitted
        previously_submitted = MemberTimeSlot.objects.filter(member=member)

        # Serialize the data
        # Manually serialize the data
        data = {

            'calendar_status': calendar.finalized,

            'member': {
                'id': member.id,
                'name': member.name,
                'email': member.email,
            },
            'previously_submitted': [
                {
                    'id': slot.id,
                    'start_time': slot.time_slot.start_time,
                    'preference': slot.preference
                }
                for slot in previously_submitted
            ]
        }

        return Response(data, status=status.HTTP_200_OK)