# serializers.py
from rest_framework import serializers
from .models.Calendar import Calendar, Availability, OwnerAvailability, MemberAvailability, Schedule
from .models.Member import Member
from .models.Event import Event

# Calendar
class CalendarSerializer(serializers.ModelSerializer):
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

class CalendarDetailSerializer(CalendarSerializer):
    class Meta(CalendarSerializer.Meta):
        extra_kwargs = {
            'name': {'required': False}
        }


# Member
class MemberSerializer(serializers.Serializer):
    class Meta:
        model = Member
        fields = ['name', 
                  'email']


# Availability
class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['day', 'start_hour', 'start_minute']
        # Note
        # 1) the end_time field is not included here, as it is a calculated field
        # 2) the calendar field is not included here, as it set by the URL
    
    def is_valid(self, raise_exception=False):
        # The availability is invalid if:
        # 1) the calendar is already finalized
        # 2) within the owner's availability, but enforced in the view
        if self.calendar.finalized:
            return False
        return True

class OwnerAvailabilitySerializer(AvailabilitySerializer):
    class Meta(AvailabilitySerializer.Meta):
        model = OwnerAvailability
        fields = AvailabilitySerializer.Meta.fields + ['preference']
    
class MemberAvailabilitySerializer(AvailabilitySerializer):
    class Meta(AvailabilitySerializer.Meta):
        model = MemberAvailability
        fields = AvailabilitySerializer.Meta.fields
        # Note
        # 1) the member field is not included here, as it is set by the URL
        # If a person clicks a unique link provided by the notification email, that person is validated as the member
        # We will then use the member to set the member field


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
    