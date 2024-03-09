from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models.Calendar import Calendar
from ..models.Member import Member
from ..models.TimeSlot import OwnerTimeSlot, MemberTimeSlot
from ..serializers import MemberTimeSlotSerializer
from django.shortcuts import get_object_or_404

# Member Availability
# - Member(not authenticated, but by a unique link) should be able to ...
#       - view their availability
#       - edit their availability
#       - submit their availability

# A unique link provided by the notification email will be used to access the member's availability
# The provided link will redirect to this page, where the member can view, edit, and submit their availability
# EndPoint: /calendars/<calendar-id>/members/<member_id>/availability
class MemberAvailabilityView(APIView):

    # Get all of this member's availability(Get all the non-busy time slots this member submitted)
    def get(self, request, calendar_id, member_id):        # Validate and retrieve the member based on the ID
        member = get_object_or_404(Member, id=member_id)

        # Get all the non-busy time slots this member submitted
        previously_submitted = MemberTimeSlot.objects.filter(member=member)

        calendar = get_object_or_404(Calendar, id=calendar_id)
        # Get all the available time slots set by the owner
        possible_slots = OwnerTimeSlot.objects.filter(calendar=calendar)
        # Serialize the data
        # Manually serialize the data
        data = {
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
    
    def post(self, request, member_id, calendar_id):
        # Extract member ID from the URL parameters or token in the request
        # Validate and retrieve the member based on the ID
        member = get_object_or_404(Member, id=member_id)

        calendar = get_object_or_404(Calendar, id=calendar_id)
        # 'possible_slots' is a list of owner-available time slots
        possible_slots = OwnerTimeSlot.objects.filter(calendar=calendar)


        # Let the member choose from the possible_slots, determined by start_time
        # Then create the member's time slot with time_slot=possible_slots[start_time]
        data = request.data

        # Validate the request data
        serializer = MemberTimeSlotSerializer(data=data)
        if serializer.is_valid():
            # Assuming 'start_time' is provided in the request data
            time_slot_id = serializer.validated_data.get('time_slot_id')

            # Find the corresponding possible slot
            chosen_slot = None
            for slot in possible_slots:
                if slot.id == time_slot_id:
                    chosen_slot = slot
                    break

            if chosen_slot:
                # Create the member's time slot
                MemberTimeSlot.objects.create(member=member, time_slot=chosen_slot)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Invalid time slot'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)