from django.core.mail import send_mail
from .models.Calendar import Calendar, Schedule
from .models.Member import Member
from .models.Event import Event
from .models.TimeSlot import OwnerTimeSlot
from django.shortcuts import get_object_or_404
from rest_framework import status
from django.conf import settings
from datetime import timedelta
import base64


    
def send_confirmation_email(user, schedule_id):
    try:
        schedule = get_object_or_404(Schedule, pk=schedule_id)
        events = Event.objects.filter(suggested_schedule=schedule)
        owner_name = user.first_name

        for event in events:
            member = event.member
            time_slot = event.time_slot
            start_time = time_slot.start_time
            end_time = start_time + timedelta(minutes=time_slot.calendar.meeting_duration)
            
            message = f"Hi {member.name},\n\nYour meeting is scheduled for {start_time.date()} with {owner_name} from {start_time.time()} to {end_time.time()}.\n\nBest regards.\n1on1 Team"
            send_email_to_participant('Meeting confirmation from 1on1', member.email, message)

        return {'success': True, 'message': 'Emails sent successfully'}
        
    except Exception as e:
        return {'success': False, 'message': str(e)}
    
    
def send_email_to_participant(title, email, message):
    send_mail(
        title,
        message,
        settings.EMAIL_HOST_USER,  
        [email],
        fail_silently=False,
    )