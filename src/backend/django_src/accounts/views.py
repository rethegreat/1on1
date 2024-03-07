from django.shortcuts import render

from django.contrib.auth import authenticate

# REST imports
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        try:
            user = authenticate(username=username, password=password)
        except:
            return Response({'error': 'Invalid credentials'}, status=401)

        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token})
        else:
            return Response({'error': 'Invalid credentials'}, status=401)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Logged out.'}, status=200)