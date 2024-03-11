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
        data = request.data.copy()
        data['calendar'] = calendar_id
        data['submitted'] = False  # Set the submitted field
        serializer = MemberListSerializer(data=data)
        if serializer.is_valid():
            # Create member model
            serializer.save(calendar=calendar)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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