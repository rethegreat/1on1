from django.contrib.auth import authenticate, logout, get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ProfileUserSerializer

user_model = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ProfileUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({"message": "User created successfully", "token": token.key}, status=201)
        return Response(serializer.errors, status=400)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            # login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"message": "Login successful", "user": username, "token": token.key}, status=200)
        else:
            return Response({"message": "Invalid credentials"}, status=401)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        logout(request)
        return Response({"message": "Logged out."}, status=200)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileUserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = ProfileUserSerializer(request.user, data=request.data, partial=True)  # partial=True allows for partial updates
        if serializer.is_valid():
            serializer.save()  # Save the updated user info
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        contacts = user.get_contacts()
        user_all_contacts = [{"username": contact_instance.contact.username,
                              "email": contact_instance.contact.email,
                              "first_name": contact_instance.contact.first_name,
                              "last_name": contact_instance.contact.last_name
                              } for contact_instance in contacts]

        if user_all_contacts:
            return Response(user_all_contacts)
        else:
            return Response()


class AddContactView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        username = request.data.get("username")
        if not username:
            return Response({"error": "Username of new contact required."}, status=400)

        new_contact = get_object_or_404(user_model, username=username)
        added = user.add_contact(new_contact)
        if added:
            return Response({"message": f"{username} was added as a contact."}, status=201)
        else:
            return Response({"error": "Could not add the contact."}, status=400)


class RemoveContactView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        username = request.data.get("username")
        if not username:
            return Response({"error": "Username of to-be-removed contact required."}, status=400)

        rem_contact = get_object_or_404(user_model, username=username)
        removed = user.remove_contact(rem_contact)
        if removed:
            return Response({"message": f"{username} was removed as a contact."}, status=201)
        else:
            return Response({"error": "Could not remove the contact."}, status=400)
