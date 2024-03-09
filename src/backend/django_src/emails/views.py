from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
def send_remainder_email(request, calendar_id):
    schedule = get_object_or_404(Schedule, pk=schedule_id)
    if schedule.owner != request.user:
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    members = Member.objects.filter(calendar=schedule.calendar)
    owner_name = request.user.first_name
    
    for member in members:
        if not member.submitted:
            message = f"Hi {memeber.name},\n\nA reminder that you have been inivited by {owner_name} to set up a meeting with them. Please fill out your avalibility at your nearest convenience.\n\nBest regards.\n1on1 Team"
            send_email_to_participant('Meeting scheduling reminder from 1on1',member.email, message)

    return Response({'detail': 'Emails sent successfully'}, status=status.HTTP_200_OK)
    

@api_view(['POST'])
def send_invitation_email(request, calendar_id):
    
    schedule = get_object_or_404(Schedule, pk=schedule_id)
    if schedule.owner != request.user:
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    members = Member.objects.filter(calendar=schedule.calendar)
    owner_name = request.user.first_name
    
    for member in members:
        message = f"Hi {memeber.name},\n\nYou have been inivited by {owner_name} to set up a meeting with them. Please fill out your avalibility at your nearest convenience.\n\nBest regards.\n1on1 Team"
        send_email_to_participant('Meeting scheduling invitation from 1on1', member.email, message)

    return Response({'detail': 'Emails sent successfully'}, status=status.HTTP_200_OK)
    
    
    
@api_view(['POST'])
def send_confirmation_email(request, schedule_id):
    schedule = get_object_or_404(Schedule, pk=schedule_id)
    if schedule.owner != request.user:
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    
    events = Event.objects.filter(suggested_schedule=schedule_id)
    owner_name = request.user.first_name

    for event in events:
        member = get_object_or_404(Member, pk=event.memeber)
        time_slot = get_object_or_404(OwnerTimeSlot, pk=event.time_slot)
        
        message = f"Hi {memeber.name},\n\nYour meeting is scheduled for {time_slot.date} with {owner_name} from {time_slot.start_time} to {time_slot.end_time}.\n\nBest regards.\n1on1 Team"
        send_email_to_participant('Meeting confirmation from 1on1', member.email, message)

    return Response({'detail': 'Emails sent successfully'}, status=status.HTTP_200_OK)

def send_email_to_participant(title, email, message):
    send_mail(
        title,
        message,
        settings.EMAIL_HOST_USER,  
        [email],
        fail_silently=False,
    )