from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.db.models.query import QuerySet


class ProfileUser(AbstractUser):
    profile_pic = models.ImageField(upload_to='profile_pics', null=True, blank=True)
    streak_count = models.IntegerField(default=0)
    analytics_data = models.JSONField(null=True, blank=True)

    # Override to make these fields required
    first_name = models.CharField(max_length=50, blank=False)
    last_name = models.CharField(max_length=50, blank=False)
    email = models.EmailField(max_length=50, blank=False)

    # Contact related methods
    def add_contact(self, new_contact: 'ProfileUser') -> bool:
        """
        Adds new_contact to contact list
        """
        if not Contact.objects.filter(owner=self, contact=new_contact).exists():
            Contact.objects.create(owner=self, contact=new_contact)
            return True
        return False

    def remove_contact(self, contact: 'ProfileUser') -> bool:
        """Removes contact from contact list. Returns False if not found."""
        if not Contact.objects.filter(owner=self, contact=contact).exists():
            return False
        Contact.objects.filter(owner=self, contact=contact).delete()
        return True

    def is_contact(self, contact: 'ProfileUser') -> bool:
        """Returns True if contact is in contact list"""
        return Contact.objects.filter(owner=self, contact=contact).exists()

    def get_contacts(self) -> QuerySet:
        """Returns all the user's contacts as a QuerySet"""
        return Contact.objects.filter(owner=self)


class Contact(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contact_owner')
    contact = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contact_user')

    class Meta:
        unique_together = ('owner', 'contact')
