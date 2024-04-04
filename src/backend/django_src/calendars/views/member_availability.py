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
from ..permissions import is_calendar_finalized

# Member Availability
# - Member(not authenticated, but by a unique link) should be able to ...
#       - view their availability
#       - edit their availability
#       - submit their availability

# A unique link provided by the notification email will be used to access the member's availability
# The provided link will redirect to this page, where the member can view, edit, and submit their availability
# EndPoint: /calendars/<calendar-id>/members/<member_id>/availability
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
                    'start_time': slot.time_slot.start_time
                }
                for slot in previously_submitted
            ],
            'possible_slots': [
                {
                    'id': slot.id,
                    'start_time': slot.start_time
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

        # Delete the old member's availability
        MemberTimeSlot.objects.filter(member=member).delete()

        # Create new ones based on the request data
        # Note data should be in the following format:
        # [
        #     {
        #         "start_time": "2021-10-10T10:00:00Z",
        #         "preference": "HIGH"
        #     },
        #     {
        #         "start_time": "2021-10-10T11:00:00Z",
        #         "preference": "NO_PREF"
        #     }
        # ]

        # Assumptions:
        # 1) the data is in the correct format
        # 3) the time slots are from the possible_slots

        start_time_added = []
        # for each time slot in data, create and save a new MemberTimeSlot
        for slot in data:
            # Ignore duplicates
            if slot['start_time'] in start_time_added:
                continue
            # Find the corresponding OwnerTimeSlot
            owner_slot = possible_slots.get(start_time=slot['start_time'])
            # Create the MemberTimeSlot
            member_slot = MemberTimeSlot(member=member, time_slot=owner_slot, preference=slot['preference'])
            member_slot.save()
            start_time_added.append(slot['start_time'])

        # Set member.submitted=True
        member.submitted = True
        member.save()

        #check if schedule exists if it does delete it so it can be regenerated
        schedule = Schedule.objects.filter(calendar_id=calendar_id)
        if schedule:
            schedule.delete()

        # Return the newly created MemberTimeSlots
        return Response(MemberTimeSlotSerializer(MemberTimeSlot.objects.filter(member=member), many=True).data, status=status.HTTP_201_CREATED)

    


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

        #check if schedule exists if it does delete it so it can be regenerated
        schedule = Schedule.objects.filter(calendar_id=calendar_id)
        if schedule:
            schedule.delete()
            
        return Response(status=status.HTTP_204_NO_CONTENT)