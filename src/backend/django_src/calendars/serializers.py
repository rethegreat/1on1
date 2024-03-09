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

# Event

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
    

# Schedule

class ScheduleSerializer(serializers.ModelSerializer):
    events = EventSerializer(many=True, read_only=True)

    class Meta:
        model = Schedule
        fields = ['id', 'calendar', 'events']
