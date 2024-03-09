from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view

@api_view(['POST'])
def send_remainder_email(request):
    user = request.user
    
    recipient_email = user.email
    recipient_name = user.name
    
    subject = 'Reminder: Please Share Your Availability on 1on1'
    message = "Hello "+ name +", \n\nJust a quick reminder to submit your availability. It’s important for our planning and scheduling efforts.\n\nBest\n1on1 Team"
    
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [recipient_email],
        fail_silently=False,
    )
    return JsonResponse({"name" : name})
    
# recipient_name, owner_name, recipient_email:
@api_view(['POST'])
def send_invitation_email(request):
    subject = 'Invitation to share Your Availability on 1on1'
    message = "Hello "+ recipient_name +", \n"+ owner_name +"has invited you to submit your availability for meeting with them."
    
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [recipient_email],
        fail_silently=False,
    )