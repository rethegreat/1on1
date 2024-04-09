from django.urls import path
from .views import UserNotificationsAPIView


urlpatterns = [
    path('list/', UserNotificationsAPIView.as_view(), name='notification-list'),
]