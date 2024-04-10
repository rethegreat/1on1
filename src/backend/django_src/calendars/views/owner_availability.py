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
from ..signals import member_submit_reminder
from django.contrib.auth import get_user_model
from datetime import datetime

UserModel = get_user_model()

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
            member = mts.member
            calendar = member.calendar
            member.submitted = False
            # Remind member to submit

            member.remind()  # Trigger reminder if requested

            # notif
            try:
            # Send signal for notification app
                user = UserModel.objects.get(email=member.email)
                link = f"https://1on1-frontend.vercel.app/calendars/{member.calendar.id}/availability/{member.member_hash}/"
                member_submit_reminder.send(sender=calendar.__class__, calendar=calendar, member=user, link=link)
            except UserModel.DoesNotExist:
                pass

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

        # The user will give the list of timeslots list.
        # The list will contain the timeslots that the user is available.
        # Expecting data in the following format:
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

        # Get all the current timeslots
        data_copy = request.data.copy()
        old_timeslots = OwnerTimeSlot.objects.filter(calendar=calendar)
        # old_timeslots_parsed = [ {"start_time": slot.start_time, "preference": slot.preference} for slot in old_timeslots ]
        delete_list = []
        add_list = []

        # Now compare the old timeslots with the new timeslots
        # If the old timeslot is not in the new timeslots, add to delete list
        for old_timeslot in old_timeslots:
            found = False
            for new_timeslot in request.data:


                # the newtimeslot's start time is in this format: 2024-04-08T16:00:00.000Z
                # old start time is in this format:                2024-04-08T14:30:00Z
                # compare strings
                # return Response({"detail": [old_timeslot.start_time, new_timeslot['start_time']]}, status=status.HTTP_401_UNAUTHORIZED)
                # 2024-04-09T15:30:00Z, 2024-04-10T06:00:00.000Z
                parsed_new_start_time = datetime.fromisoformat(new_timeslot['start_time']).strftime("%Y-%m-%d %H:%M:%S%z")
                if old_timeslot.start_time == parsed_new_start_time:

                    # return Response({"detail": "debug"}, status=status.HTTP_401_UNAUTHORIZED)
                    if old_timeslot.preference != new_timeslot['preference']:
                        # If the preference is different, update the old timeslot
                        ots = OwnerTimeSlot.objects.filter(calendar=calendar, start_time=old_timeslot.start_time)
                        ots.update(preference=new_timeslot['preference'])
                        # save
                        ots[0].save()
                        # save it
                    else:
                        # If the preference is the same, do nothing
                        pass
                    found = True
                    debug = [data_copy.copy()]
                    # delete from the data_copy for the faster search in the next loop!
                    data_copy.remove(new_timeslot)
                    debug.append(data_copy)
                    return Response({"detail": debug}, status=status.HTTP_401_UNAUTHORIZED)
                    break
            if not found:
                # If the old timeslot is not in the new timeslots, add to delete list
                delete_list.append(old_timeslot.start_time)
        
        # for debugging
        # return Response({"detail": old_timeslot}, status=status.HTTP_401_UNAUTHORIZED)

        # If the new timeslot is not in the old timeslots, add to add list
        for new_timeslot in data_copy:
            found = False
            for old_timeslot in old_timeslots:
                parsed_new_start_time = datetime.fromisoformat(new_timeslot['start_time']).strftime("%Y-%m-%d %H:%M:%S%z")
                if old_timeslot.start_time == parsed_new_start_time:
                    found = True
                    break
            if not found:
                add_list.append(new_timeslot)

        # STEP 1> DELETE
        # Delete the timeslots in the delete list, and notify the member if they no longer have any timeslots submitted(also remind member to submit)
        for delete_timeslot in delete_list:
            time_slot = OwnerTimeSlot.objects.get(calendar=calendar, start_time=delete_timeslot)
            _update_member_submitted(time_slot)
            time_slot.delete()
        
        # STEP 2> ADD (only the difference!)

        #check if schedule exists if it does delete it so it can be regenerated
        schedule = Schedule.objects.filter(calendar_id=calendar_id)
        if schedule:
            schedule.delete()
        
        # list to store the error messages
        error_list = []
        start_time_added = []

        for timeslot in add_list:
            # Check if the start_time is already added
            if timeslot['start_time'] in start_time_added:
                error_list.append(f"Time slot {timeslot['start_time']} is already added")
                continue
            serializer = OwnerTimeSlotSerializer(data=timeslot)
            if serializer.is_valid():
                serializer.save(calendar=calendar)
                start_time_added.append(timeslot['start_time'])
        
        # Return all the new timeslots
        time_slots = OwnerTimeSlot.objects.filter(calendar=calendar)
        serializer = OwnerTimeSlotSerializer(time_slots, many=True)

        # If there was an error, add it to the response
        if error_list:
            result = []
            result.append({'errors': error_list})
            result.append(serializer.data)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
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

