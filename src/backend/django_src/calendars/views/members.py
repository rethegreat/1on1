from rest_framework.permissions import IsAuthenticated
from ..permissions import IsCalendarOwner, is_calendar_finalized
from ..models.Calendar import Calendar
from ..models.Member import Member
from ..serializers import MemberListSerializer
from rest_framework.response import Response
from rest_framework import status
from django.urls import reverse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from accounts.models import Contact
from ..signals import member_added_to_calendar, member_removed_from_cal, member_submit_reminder
from django.contrib.auth import get_user_model

UserModel = get_user_model()

# Members
# - User should be able to ...
#       - view all members of a calendar
#       - add a new member to a calendar
#       - remove a member from a calendar
#       - remind a member to submit their availability

# EndPoint: /calendars/<int:calendar_id>/members/list/
class MemberListView(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]

    def get(self, request, calendar_id):
        """View all members of the calendar"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        members = Member.objects.filter(calendar=calendar)
        serializer = MemberListSerializer(members, many=True)
        # Additionally, add the following data to the response:
        data = serializer.data
        # 1) show how many members in total
        total_members = members.count()
        # 2) how many members have submitted their availability
        submitted_count = members.filter(submitted=True).count()
        # 3) how many members have not submitted their availability
        not_submitted_count = total_members - submitted_count
        # Put that in the front of the response
        data.insert(0, {
            'num_members': total_members,
            'num_submitted': submitted_count,
            'num_pending': not_submitted_count
        })
        return Response(data)

    def post(self, request, calendar_id):
        """Add(invite) a new member to the calendar"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        if is_calendar_finalized(calendar):
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['calendar'] = calendar  # Set the calendar field
        data['submitted'] = False  # Set the submitted field
        serializer = MemberListSerializer(data=data)
        if serializer.is_valid():
            new_member = serializer.save(calendar=calendar)
            new_member.invite()

            try:
                # Send signal for notification app
                user = UserModel.objects.get(email=new_member.email)
                member_added_to_calendar.send(sender=calendar.__class__, calendar=calendar, member=user)
            finally:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# EndPoint: /calendars/<int:calendar_id>/members/list/selection/
class MemberSelectionView(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]

    def get(self, request, calendar_id):
        """View all of owner's contacts that can be added to the calendar"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Get the owner's contacts
        contacts = Contact.objects.filter(owner=request.user)
        # Serialize the data
        data = [
            {
                'id': contact.id,
                'name': contact.contact.first_name + " " + contact.contact.last_name,
                'email': contact.contact.email,
                # Check if the contact is already in the calendar
                'in_calendar': Member.objects.filter(calendar=calendar, email=contact.contact.email).exists()
            }
            for contact in contacts
        ]
        return Response(data)
    
    def post(self, request, calendar_id):
        """Add a contact to the calendar"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        if is_calendar_finalized(calendar):
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        username = data.get('username', None)
        if username is None:
            return Response({'error': 'Please select at least one contact'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the username is in the owner's contacts
        found = False
        for contact in Contact.objects.filter(owner=request.user):
            if contact.contact.username == username:
                found = True
                break
        if not found:
            return Response({'error': 'Contact not found'}, status=status.HTTP_404_NOT_FOUND)
        
        adding_member = contact.contact
        # Check if the contact is already in the calendar
        if Member.objects.filter(calendar=calendar, email=adding_member.email).exists():
            return Response({'error': 'Contact already in the calendar'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Add the contact to the calendar
        data = {'calendar': calendar, 'email': adding_member.email, 'name': adding_member.first_name + " " + adding_member.last_name, 'submitted': False}
        serializer = MemberListSerializer(data=data)
        if serializer.is_valid():
            new_member = serializer.save(calendar=calendar)
            new_member.invite()

            try:
                # Send signal for notification app
                user = UserModel.objects.get(email=new_member.email)
                member_added_to_calendar.send(sender=calendar.__class__, calendar=calendar, member=user)
            finally:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# EndPoint: /calendars/<int:calendar_id>/members/<int:member_id>/
class MemberDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCalendarOwner]

    def get(self, request, calendar_id, member_id):
        """View a member's details"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        try:
            member = Member.objects.get(id=member_id, calendar_id=calendar_id)
        except Member.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = MemberListSerializer(member)
        return Response(serializer.data)

    def delete(self, request, calendar_id, member_id):
        """Remove a member from the calendar"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        if is_calendar_finalized(calendar):
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            member = Member.objects.get(id=member_id, calendar_id=calendar_id)
        except Member.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        member.delete()
        try:
            # Send signal for notification app
            user = UserModel.objects.get(email=member.email)
            member_removed_from_cal.send(sender=calendar.__class__, calendar=calendar, member=user)
        finally:
            return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, calendar_id, member_id):
        """Edit a member's details or remind them to submit their availability"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        if is_calendar_finalized(calendar):
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        # Get the member instance
        try:
            member = Member.objects.get(id=member_id, calendar_id=calendar_id)
        except Member.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        # Check if 'remind' or 'edit' is in the request data
        action = request.data.get('action', None)
        if action == 'remind':
            member.remind()  # Trigger reminder if requested

            # notif
            try:
            # Send signal for notification app
                user = UserModel.objects.get(email=member.email)
                link = f"https://1on1-frontend.vercel.app/calendars/{member.calendar.id}/availability/{member.member_hash}/"
                member_submit_reminder.send(sender=calendar.__class__, calendar=calendar, member=user, link=link)
            finally:
                return Response({'message': 'Reminder sent'}, status=status.HTTP_200_OK)
        
        elif action == 'edit':
            # Update member fields as before
            data = request.data.copy()
            data.pop('id', None)
            data.pop('submitted', None)
            serializer = MemberListSerializer(instance=member, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)