from django.db import models
from .Calendar import Calendar
from django.core.mail import send_mail

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

    def __str__(self):
        return "[Member of " + self.calendar.name + "] " + self.name
    
    def remind(self):
        """
        Sends a reminder email to the given member to submit their availability.
        """
        subject = 'Reminder: Submit Your Availability'
        message = (
            f"Dear {self.name},\n\n"
            f"This is a friendly reminder to submit your availability to the calendar {self.calendar.name}.\n\n"
            "Thank you.\n"
        )
        from_email = '1on1.utoronto@gmail.com'
        to_email = self.email
        send_mail(subject, message, from_email, [to_email])