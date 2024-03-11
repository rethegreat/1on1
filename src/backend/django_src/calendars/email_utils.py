from django.core.mail import send_mail
from .models.Calendar import Calendar, Schedule
from .models.Member import Member
from .models.Event import Event
from .models.TimeSlot import OwnerTimeSlot
from django.shortcuts import get_object_or_404
from rest_framework import status
from django.conf import settings
import base64


    
def send_confirmation_email(user, schedule_id):
    try:
        schedule = get_object_or_404(Schedule, pk=schedule_id)
        events = Event.objects.filter(suggested_schedule=schedule)
        owner_name = user.first_name

        for event in events:
            member = get_object_or_404(Member, pk=event.memeber)
            time_slot = get_object_or_404(OwnerTimeSlot, pk=event.time_slot)
            
            message = f"Hi {member.name},\n\nYour meeting is scheduled for {time_slot.date} with {owner_name} from {time_slot.start_time} to {time_slot.end_time}.\n\nBest regards.\n1on1 Team"
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