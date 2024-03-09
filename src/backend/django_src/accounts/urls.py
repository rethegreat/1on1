from django.urls import path
from accounts.views import LoginView, LogoutView, RegisterView, ProfileView
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
]