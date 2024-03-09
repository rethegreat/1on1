# serializers.py
from rest_framework import serializers
from .models.Calendar import Calendar, Schedule
from .models.Member import Member
from .models.Event import Event
from .models.TimeSlot import OwnerTimeSlot, MemberTimeSlot

# Calendar
class CalendarListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = ['id',
                  'name', 
                  'color', 
                  'description',
                  'meeting_duration',
                  'deadline']
        read_only_fields = ['id']
        extra_kwargs = {
            'name': {'required': True, 'allow_null': False},
            'color': {'required': False},
            'description': {'required': False},
            'meeting_duration': {'required': False},
            'deadline': {'required': False, 'allow_null': True}
        }

# For the PUT request, we need to allow users to give only the fields they want to update
class CalendarPUTSerializer(CalendarListSerializer):
    class Meta(CalendarListSerializer.Meta):
        extra_kwargs = {
            'name': {'required': False}
        }


# Member
class MemberListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'name', 'email', 'submitted']
        read_only_fields = ['id']
        extra_kwargs = {
            'name': {'required': True, 'allow_null': False},
            'email': {'required': True, 'allow_null': False},
            'submitted': {'required': False}
        }

    def create(self, validated_data):
        calendar_id = self.context['view'].kwargs.get('calendar_id')
        validated_data['calendar_id'] = calendar_id
        return super().create(validated_data)


# Availability
# Availability is a list of all the time slots submitted by the calendar or each member

class OwnerTimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerTimeSlot
        fields = ['start_time', 'preference']
        extra_kwargs = {
            'start_time': {'required': True, 'allow_null': False},
            'preference': {'required': True}
        }


class MemberTimeSlotSerializer(serializers.Serializer):
    time_slot_id = serializers.IntegerField(required=True)

# Schedule
class ScheduleSerializer(serializers.Serializer):
    class Meta:
        model = Schedule
    
    def is_valid(self, raise_exception=False):
        # The schedule is valid if all events are valid, i.e.,
        # 1) Check if the event is within the owner's availability
        # 2) Check if the event is within the member's availability
        # 3) Check if the event does not conflict with other events

        # We can check the validity of the newly created event only,
        # assuming all the existing events are already valid
        
        # Get all events associated with this schedule
        all_events = Event.objects.filter(schedule=self)
        for event in all_events:
            if not event.is_valid():
                return False
        return True
    