from rest_framework.permissions import IsAuthenticated
from ..permissions import IsCalendarOwner
from ..models.Calendar import Calendar
from ..models.Member import Member
from ..serializers import MemberListSerializer
from rest_framework.response import Response
from rest_framework import status
from django.urls import reverse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

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
        return Response(serializer.data)

    def post(self, request, calendar_id):
        """Add(invite) a new member to the calendar"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        if calendar.finalized:
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['calendar'] = calendar_id
        data['submitted'] = False  # Set the submitted field
        serializer = MemberListSerializer(data=data)
        if serializer.is_valid():
            # Create member model
            serializer.save(calendar=calendar)
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
        contacts = request.user.contacts.all()
        # Serialize the data
        data = [
            {
                'id': contact.id,
                'name': contact.name,
                'email': contact.email,
                # Check if the contact is already in the calendar
                'in_calendar': Member.objects.filter(calendar=calendar, email=contact.email).exists()
            }
            for contact in contacts
        ]
        return Response(data)
    
    def post(self, request, calendar_id):
        """Add a contact to the calendar"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        if calendar.finalized:
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        contact_id = data.get('id', None)
        if contact_id is None:
            return Response({'error': 'Please select at least one contact'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the email is in the owner's contacts
        contact = request.user.contacts.filter(id=contact_id).first()
        if contact is None:
            return Response({'error': 'Contact not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the contact is already in the calendar
        if Member.objects.filter(calendar=calendar, email=contact.email).exists():
            return Response({'error': 'Contact already in the calendar'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Add the contact to the calendar
        member = Member.objects.create(
            name=contact.name,
            email=contact.email,
            calendar=calendar,
            submitted=False
        )
        serializer = MemberListSerializer(member)
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
        if calendar.finalized:
            return Response({"detail": "Calendar is finalized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            member = Member.objects.get(id=member_id, calendar_id=calendar_id)
        except Member.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, calendar_id, member_id):
        """Edit a member's details or remind them to submit their availability"""
        calendar = get_object_or_404(Calendar, id=calendar_id)
        self.check_object_permissions(request, calendar)

        # Check additional permission
        if calendar.finalized:
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