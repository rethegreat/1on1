from django.urls import path
from .views import send_remainder_email, send_invitation_email

urlpatterns = [
    path('reminder/', send_remainder_email, name='reminder_email'),
    path('invitation/', send_invitation_email, name='invitation_email')
]