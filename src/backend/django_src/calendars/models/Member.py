from django.db import models
from .Calendar import Calendar
from django.core.mail import send_mail
from django.conf import settings
import hashlib
import uuid

# Member
# This model is used to store the member information
#
# Relationships:
# Calendar - Member (One to Many)
# Member - MemberAvailability (One to One)
class Member(models.Model):
    # 1) name: name of the member; required
    name = models.CharField(max_length=50, null=False, blank=False)

    # 2) email: email address of the member; required
    email = models.EmailField(max_length=50, null=False, blank=False)

    # 3) calendar: the calendar the member is invited to
    calendar = models.ForeignKey('Calendar', related_name='member', on_delete=models.CASCADE)

    # 4) submitted: whether the member submitted their availability or not
    submitted = models.BooleanField(default=False)
    
    member_hash = models.CharField(max_length=100, unique=True, blank=True)

    # No duplicate email within one calendar
    class Meta:
        unique_together = ('email', 'calendar')

    def __str__(self):
        return "[Member of " + self.calendar.name + "] " + self.name
    
    def save(self, *args, **kwargs):
        if not self.member_hash:
            # Generate a unique hash for the member
            raw_string = f"{self.name}{self.email}{uuid.uuid4()}"
            self.member_hash = hashlib.sha256(raw_string.encode()).hexdigest()
        super(Member, self).save(*args, **kwargs)
    
    def remind(self):
        """
        Sends a reminder email to the given member to submit their availability.
        """
        subject = 'Reminder: Submit Your Availability'
        unique_link = f"https://1on1-frontend.vercel.app/calendars/{self.calendar.id}/availability/{self.member_hash}/"
        message = (
            f"Dear {self.name},\n\n"
            f"This is a friendly reminder to submit your availability to the calendar {self.calendar.name}.\n\n"
            f"{unique_link}\n\n"
            "Thank you.\n"
        )
        from_email = settings.EMAIL_HOST_USER
        to_email = self.email
        send_mail(subject, message, from_email, [to_email])
        
    def remind_update(self):
        """
        Sends a reminder email to the given member to submit their availability.
        """
        subject = 'Reminder: Submit Your Availability'
        unique_link = f"https://1on1-frontend.vercel.app/calendars/{self.calendar.id}/availability/{self.member_hash}/"
        message = (
            f"Dear {self.name},\n\n"
            f"New possible time slots has been added.\n This is a friendly reminder to update your availability to the calendar {self.calendar.name}.\n\n"
            f"{unique_link}\n\n"
            "Thank you.\n"
        )
        from_email = settings.EMAIL_HOST_USER
        to_email = self.email
        send_mail(subject, message, from_email, [to_email])
        
    def invite(self):
        """
        Sends an invitation email to the given member to submit their availability.
        """
        subject = 'Invitation to calendar: Submit Your Availability'
        unique_link = f"https://1on1-frontend.vercel.app/calendars/{self.calendar.id}/availability/{self.member_hash}/"
        message = (
            f"Dear {self.name},\n\n"
            f"You haven been invited to submit your availability to the calendar {self.calendar.name}.\n\n"
            f"{unique_link}\n\n"
            "Thank you.\n"
        )
        from_email = settings.EMAIL_HOST_USER
        to_email = self.email
        send_mail(subject, message, from_email, [to_email])