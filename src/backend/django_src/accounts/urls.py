from django.urls import path
from accounts.views import LoginView, LogoutView, RegisterView, ProfileView

urlpatterns = [
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/profile/', ProfileView.as_view(), name='profile')
]