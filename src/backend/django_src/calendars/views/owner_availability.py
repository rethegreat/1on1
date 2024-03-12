from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models.Calendar import Calendar, Schedule
from ..models.Member import Member
from ..models.TimeSlot import OwnerTimeSlot, MemberTimeSlot
from ..serializers import OwnerTimeSlotSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from ..permissions import IsCalendarOwner, is_calendar_finalized

# Owner Availability
# - User should be able to ...
#       - view their availability
#       - edit their availability
#       - submit their availability


def _update_member_submitted(time_slot):
    """Change member.submitted to False if this timeslot is the only one they submitted"""
    # Get all MemberTimeSlot with this time_slot=time_slot
    member_time_slots = MemberTimeSlot.objects.filter(time_slot=time_slot)
    for mts in member_time_slots:
        # If there is only one belongs to that member, set member.submitted=False
        if len(MemberTimeSlot.objects.filter(member=mts.member)) == 1:
            mts.member.submitted = False
            mts.member.save()

# EndPoint: /calendars/<int:calendar-id>/availability/
class OwnerAvailabilityView(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]

    def get(self, request, calendar_id):
        # Get the calendar
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)
        # Get the time slots
        time_slots = OwnerTimeSlot.objects.filter(calendar=calendar)
        serializer = OwnerTimeSlotSerializer(time_slots, many=True)
        return Response(serializer.data)
    
    def post(self, request, calendar_id):
        # Get the calendar
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        if is_calendar_finalized(calendar):
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        # Create the time slot
        serializer = OwnerTimeSlotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(calendar=calendar)

            #check if schedule exists if it does delete it so it can be regenerated
            schedule = Schedule.objects.filter(calendar_id=calendar_id)
            if schedule:
                schedule.delete()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, calendar_id):
        action = request.data.get('action')
        time_slot_time = request.data.get('start_time')
        # Get the calendar
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        if is_calendar_finalized(calendar):
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        # Get the time slot
        time_slot = get_object_or_404(OwnerTimeSlot, calendar=calendar, start_time=time_slot_time)
        if action == 'edit':
            # Try making new one, if valid, delete old one
            new_time = request.data.get('new_time')
            new_pref = request.data.get('new_preference')
            if not new_time:
                new_time = time_slot_time
            if not new_pref:
                new_pref = time_slot.preference
            data = {'start_time': new_time, 'preference': new_pref}
            serializer = OwnerTimeSlotSerializer(time_slot, data=data)
            if serializer.is_valid():
                _update_member_submitted(time_slot)
                time_slot.delete()
                serializer.save()

                #check if schedule exists if it does delete it so it can be regenerated
                schedule = Schedule.objects.filter(calendar_id=calendar_id)
                if schedule:
                    schedule.delete()

                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif action == 'delete':
            # Change member.submitted to False if this timeslot is the only one they submitted
            # Get all MemberTimeSlot with this time_slot=time_slot
            # If there is only one belongs to that member, set member.submitted=False
            _update_member_submitted(time_slot)
            time_slot.delete()
            #check if schedule exists if it does delete it so it can be regenerated
            schedule = Schedule.objects.filter(calendar_id=calendar_id)
            if schedule:
                schedule.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

