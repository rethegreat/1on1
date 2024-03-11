from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404, HttpResponseRedirect
from django.urls import reverse
import base64

class RedirectFromHashView(APIView):
    def get(self, request, *args, **kwargs):
        hash = kwargs.get('hash')
        try:
            decoded_path = base64.urlsafe_b64decode(hash.encode()).decode()

            return redirect(decoded_path)

        except Exception as e:
            return Response({'error': 'Invalid or expired link'}, status=status.HTTP_400_BAD_REQUEST)