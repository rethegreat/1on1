# serializers.py
from rest_framework import serializers
from .models.Calendar import Calendar, Schedule
from .models.Member import Member
from .models.Event import Event
from .models.TimeSlot import OwnerTimeSlot, MemberTimeSlot
from django.db import IntegrityError
from rest_framework.exceptions import ValidationError
from .models.validators import validate_datetime_format

# Calendar
class CalendarListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = ['id',
                  'name', 
                  'color', 
                  'description',
                  'meeting_duration',
                  'deadline',
                  'frequency',
                  'finalized',]
        read_only_fields = ['id', 'finalized']
        extra_kwargs = {
            'name': {'required': True, 'allow_null': False},
            'color': {'required': False},
            'description': {'required': False},
            'meeting_duration': {'required': False},
            'deadline': {'required': False, 'allow_null': True},
            'frequency': {'required': False}
        }

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except IntegrityError as e:
            error_message = str(e)
            raise ValidationError(error_message)

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
        fields = ['id', 'name', 'email', 'submitted', 'calendar', 'member_hash']
        read_only_fields = ['id', 'submitted', 'calendar', 'member_hash']
        extra_kwargs = {
            'name': {'required': True, 'allow_null': False},
            'email': {'required': True, 'allow_null': False},
            'submitted': {'required': False},
            'calendar': {'required': False}
        }

    def create(self, validated_data):
        # add calendar to the validated data
        try:
            return super().create(validated_data)
        except IntegrityError as e:
            error_message = str(e)
            raise ValidationError("Member already exists in the calendar.")


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
    
    def create(self, validated_data):
        # Time Slot should have a unique start time for each calendar
        # Check if the time slot already exists with this time
        try:
            return super().create(validated_data)
        except IntegrityError:
            # If there's a conflict, raise a validation error with the same message
            raise ValidationError("Time slot conflicts with existing slot.")


class MemberTimeSlotSerializer(serializers.Serializer):
    time_slot_time = serializers.DateTimeField(required=True, validators=[validate_datetime_format])
    preference = serializers.ChoiceField(choices=MemberTimeSlot.PREF_CHOICES)

# Event
# Show event.id as event_id, time_slot as when, and member as who
class EventSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(source='id')
    start_time = serializers.DateTimeField(source='time_slot.start_time')
    member_id = serializers.IntegerField(source='member.id')
    member_name = serializers.CharField(source='member.name')
    member_email = serializers.CharField(source='member.email')

    class Meta:
        model = Event
        fields = ['event_id', 'start_time', 'member_id', 'member_name', 'member_email']